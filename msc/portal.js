/* ========================================
   MSC Portal - Modern UI Library
   ======================================== */

const AUTH_KEY = "msc_portal_auth";
const TOAST_TIMEOUT = 4000;
const LIVE_RECONNECT_DELAY_MS = 2000;
const LIVE_REFRESH_DEBOUNCE_MS = 700;
const LIVE_POLL_INTERVAL_MS = 15000;
const TIMEZONE_STORAGE_KEY = "msc_portal_timezone";
const COMMAND_PALETTE_HINT = "⌘/Ctrl + K";
let liveSocket = null;
let liveRefreshTimer = null;
let livePollTimer = null;
let liveReconnectTimer = null;
let liveSyncListenersBound = false;
let currentPermissionSet = new Set();
let currentPageReadOnly = false;
const DOMAIN_WORKSPACE_PAGES = [
    "msc-admin.html",
    "loc-dashboard.html",
    "team-portal.html",
    "athlete-app.html",
    "public-site.html"
];

const PAGE_PERMISSION_RULES = {
    "dashboard.html": { readAny: ["dashboard.read"], writeAny: [] },
    "users.html": { readAny: ["users.read", "roles.read", "users.write", "roles.write"], writeAny: ["users.write", "roles.write"] },
    "teams.html": { readAny: ["teams.read", "teams.write"], writeAny: ["teams.write"] },
    "events.html": { readAny: ["events.read", "events.write"], writeAny: ["events.write"] },
    "points.html": { readAny: ["point_rules.read", "point_rules.write"], writeAny: ["point_rules.write"] },
    "transfers.html": { readAny: ["transfers.read", "transfers.write"], writeAny: ["transfers.write"] },
    "reporting.html": { readAny: ["audit.read", "publications.read", "public_api.read", "event_scores.read", "publications.write"], writeAny: ["publications.write"] },
    "operations.html": {
        readAny: [
            "dashboard.read", "workflows.execute",
            "msc_admin.read", "msc_admin.write",
            "loc.read", "loc.write",
            "team_portal.read", "team_portal.write",
            "athlete_app.read", "athlete_app.write",
            "public_site.read", "public_site.write"
        ],
        writeAny: [
            "workflows.execute",
            "msc_admin.write", "loc.write", "team_portal.write", "athlete_app.write", "public_site.write"
        ]
    },
    "msc-admin.html": { readAny: ["dashboard.read", "msc_admin.read", "msc_admin.write"], writeAny: ["msc_admin.write"] },
    "loc-dashboard.html": { readAny: ["dashboard.read", "loc.read", "loc.write"], writeAny: ["loc.write"] },
    "team-portal.html": { readAny: ["dashboard.read", "team_portal.read", "team_portal.write"], writeAny: ["team_portal.write"] },
    "athlete-app.html": { readAny: ["dashboard.read", "athlete_app.read", "athlete_app.write"], writeAny: ["athlete_app.write"] },
    "public-site.html": { readAny: ["dashboard.read", "public_site.read", "public_site.write"], writeAny: ["public_site.write"] },
    "settings.html": { readAny: ["settings.read", "settings.write"], writeAny: ["settings.write"] }
};

const PAGE_WRITE_FORM_SELECTORS = {
    "users.html": ["#create-user-form", "#role-form"],
    "teams.html": ["#create-team-form"],
    "events.html": ["#create-event-form"],
    "points.html": ["#points-rules-form"],
    "transfers.html": ["#transfer-window-form", "#create-transfer-form"],
    "reporting.html": ["#create-publication-form"],
    "operations.html": ["#module-record-form", "#workflow-execution-form", "#domain-record-form"],
    "msc-admin.html": ["#ws-record-form", "#ws-workflow-form"],
    "loc-dashboard.html": ["#ws-record-form", "#ws-workflow-form"],
    "team-portal.html": ["#ws-record-form", "#ws-workflow-form"],
    "athlete-app.html": ["#ws-record-form", "#ws-workflow-form"],
    "public-site.html": ["#ws-record-form", "#ws-workflow-form"],
    "settings.html": ["#system-config-form", "#security-config-form", "#email-config-form"]
};

const PAGE_READONLY_ACTION_SELECTORS = {
    "users.html": ["[data-edit-user]", "[data-delete-user]", "[data-edit-role]", "[data-delete-role]"],
    "teams.html": ["button[onclick*='editTeamModal']", "button[onclick*='deleteTeam']"],
    "events.html": ["[data-delete-event]", "button[onclick*='editEventModal']"],
    "points.html": ["#save-rule-button", "#reset-rule-button", "#add-points-row", "#add-bonus-profile", "#generate-scale", "#normalize-scale", "#clear-scale"],
    "transfers.html": ["#transfers-list .btn", "#contracts-list .btn"],
    "reporting.html": ["#audit-log-tbody + .form-actions .btn", "#publications-list .btn"],
    "operations.html": ["#module-records-body .btn", "#workflow-logs-body .btn", "#domain-records-body .btn"],
    "msc-admin.html": ["[data-edit-record]", "[data-delete-record]", "[data-restore-record]", "[data-mark-live]", "[data-mark-blocked]", "[data-run-workflow]", "[data-run-playbook]", "[data-quick-action]"],
    "loc-dashboard.html": ["[data-edit-record]", "[data-delete-record]", "[data-restore-record]", "[data-mark-live]", "[data-mark-blocked]", "[data-run-workflow]", "[data-run-playbook]", "[data-quick-action]"],
    "team-portal.html": ["[data-edit-record]", "[data-delete-record]", "[data-restore-record]", "[data-mark-live]", "[data-mark-blocked]", "[data-run-workflow]", "[data-run-playbook]", "[data-quick-action]"],
    "athlete-app.html": ["[data-edit-record]", "[data-delete-record]", "[data-restore-record]", "[data-mark-live]", "[data-mark-blocked]", "[data-run-workflow]", "[data-run-playbook]", "[data-quick-action]"],
    "public-site.html": ["[data-edit-record]", "[data-delete-record]", "[data-restore-record]", "[data-mark-live]", "[data-mark-blocked]", "[data-run-workflow]", "[data-run-playbook]", "[data-quick-action]"],
};

// ============ HELPERS ============

function pageName() {
    return (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
}

function isLoginPage() {
    return pageName() === "login.html";
}

function detectBrowserTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
    } catch (_error) {
        return "Europe/Berlin";
    }
}

function isValidTimeZone(value) {
    const zone = String(value || "").trim();
    if (!zone) return false;
    try {
        new Intl.DateTimeFormat("de-DE", { timeZone: zone }).format(new Date());
        return true;
    } catch (_error) {
        return false;
    }
}

let currentTimeZone = (() => {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (isValidTimeZone(stored)) return stored;
    return detectBrowserTimeZone();
})();

function getPreferredTimeZone() {
    return currentTimeZone;
}

function setPreferredTimeZone(timeZone, { persist = true, broadcast = true } = {}) {
    const next = isValidTimeZone(timeZone) ? String(timeZone).trim() : detectBrowserTimeZone();
    if (next === currentTimeZone) return currentTimeZone;
    currentTimeZone = next;
    if (persist) {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, next);
    }
    if (broadcast) {
        window.dispatchEvent(new CustomEvent("msc:timezone-changed", { detail: { timeZone: next } }));
    }
    return currentTimeZone;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: currentTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);
}

function formatTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: currentTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(date);
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("de-DE", {
        timeZone: currentTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(date);
}

// ============ STORAGE ============

function loadAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch (error) {
        return null;
    }
}

function saveAuth(payload) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
}

function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
    if (liveSocket) {
        liveSocket.close();
        liveSocket = null;
    }
}

// ============ TOASTS (Modern Notifications) ============

function showToast(message, type = "success", duration = TOAST_TIMEOUT) {
    const toastContainer = document.getElementById("toast-container") || createToastContainer();
    
    const toast = document.createElement("div");
    toast.className = `alert alert-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        max-width: 420px;
        z-index: 9999;
        animation: slideInUp 0.3s ease;
    `;

    toast.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
            <span>${message}</span>
            <button class="alert-close" style="border: none; background: none; cursor: pointer; font-size: 1.2em;">×</button>
        </div>
    `;
    
    toast.querySelector(".alert-close").addEventListener("click", () => {
        toast.remove();
    });
    
    toastContainer.appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => toast.remove(), duration);
    }
}

function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
    return container;
}

// ============ MODALS ============

function showModal(title, content, actions = []) {
    const modalContainer = document.getElementById("modal-container") || createModalContainer();
    
    const modal = document.createElement("div");
    modal.className = "modal active";
    
    let actionsHtml = "";
    if (actions.length === 0) {
        actionsHtml = `<button class="btn btn-primary" onclick="this.closest('.modal').remove();">OK</button>`;
    } else {
        actionsHtml = actions.map(a => {
            if (typeof a === "function") return "";
            return `<button class="btn ${a.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${a.id}">${a.label}</button>`;
        }).join("");
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">${title}</div>
            <div>${content}</div>
            <div class="modal-footer">${actionsHtml}</div>
        </div>
    `;
    
    // Wire up action handlers
    actions.forEach((action) => {
        const button = modal.querySelector(`[data-action="${action.id}"]`);
        if (!button) return;
        button.addEventListener("click", async () => {
            if (typeof action.handler !== "function") {
                modal.remove();
                return;
            }
            button.disabled = true;
            try {
                const result = await action.handler();
                if (result !== false) {
                    modal.remove();
                }
            } catch (_error) {
                // Handler already surfaces UX errors (toast/message); keep modal open.
            } finally {
                button.disabled = false;
            }
        });
    });
    
    // Close on outside click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });
    
    modalContainer.appendChild(modal);
    return modal;
}

function createModalContainer() {
    const container = document.createElement("div");
    container.id = "modal-container";
    document.body.appendChild(container);
    return container;
}

function confirmDelete(entityName, callback) {
    showModal(`Bestätigung`, 
        `<p>Möchtest du <strong>${entityName}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>`,
        [
            { id: "cancel", label: "Abbrechen", primary: false, handler: () => {} },
            { id: "confirm", label: "Ja, löschen", primary: true, handler: callback }
        ]
    );
}

// ============ MESSAGE HANDLING ============

function showMessage(message, type = "info") {
    const node = document.getElementById("page-message") || document.getElementById("login-message");
    if (!node) {
        showToast(message, type === "error" ? "error" : "info");
        return;
    }
    node.classList.remove("hidden");
    node.textContent = message;
    node.className = `alert alert-${type === "error" ? "danger" : "success"}`;
}

function clearMessage() {
    const node = document.getElementById("page-message") || document.getElementById("login-message");
    if (!node) return;
    node.classList.add("hidden");
    node.textContent = "";
}

// ============ TABS ============

function activateTab(button) {
    const tabId = button?.dataset?.tab;
    if (!tabId) return;
    const root = button.closest("form, .card-body, .card, .portal-content") || document;
    const target = root.querySelector(`#${tabId}`) || document.getElementById(tabId);
    if (!target) return;

    root.querySelectorAll(".tab-button").forEach((node) => node.classList.remove("active"));
    root.querySelectorAll(".tab-content").forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    target.classList.add("active");
}

function wireTabs() {
    document.addEventListener("click", (event) => {
        const button = event.target.closest(".tab-button[data-tab]");
        if (!button) return;
        event.preventDefault();
        activateTab(button);
    });
}

function scheduleLiveRefresh() {
    if (liveRefreshTimer) return;
    liveRefreshTimer = setTimeout(async () => {
        liveRefreshTimer = null;
        const page = pageName();
        const state = getPagePermissionState();
        if (!state.canRead) return;
        try {
            if (page === "dashboard.html") {
                await loadDashboard();
            } else if (page === "users.html") {
                await Promise.all([loadUsers(), loadRolesAndPermissions()]);
            } else if (page === "teams.html") {
                await loadTeams();
            } else if (page === "events.html") {
                if (typeof window.refreshEventsPage === "function") {
                    await window.refreshEventsPage();
                } else {
                    await loadEvents();
                }
            } else if (page === "points.html") {
                await loadPointsRules();
            } else if (page === "transfers.html") {
                await loadTransfers();
            } else if (page === "reporting.html") {
                await loadAuditLog();
            } else if (page === "operations.html") {
                if (typeof window.refreshOperationsPage === "function") {
                    await window.refreshOperationsPage();
                }
            } else if (isDomainWorkspacePage(page)) {
                if (typeof window.refreshDomainWorkspacePage === "function") {
                    await window.refreshDomainWorkspacePage();
                }
            }
        } catch (error) {
            // Keep UI stable even if one refresh request fails.
        }
    }, LIVE_REFRESH_DEBOUNCE_MS);
}

function startLivePollingFallback() {
    if (livePollTimer) return;
    livePollTimer = setInterval(() => {
        scheduleLiveRefresh();
    }, LIVE_POLL_INTERVAL_MS);
}

function stopLivePollingFallback() {
    if (!livePollTimer) return;
    clearInterval(livePollTimer);
    livePollTimer = null;
}

function scheduleLiveReconnect(delayMs = LIVE_RECONNECT_DELAY_MS) {
    if (liveReconnectTimer) return;
    liveReconnectTimer = setTimeout(() => {
        liveReconnectTimer = null;
        connectLiveSync();
    }, delayMs);
}

function bindLiveSyncRecoveryListeners() {
    if (liveSyncListenersBound) return;
    liveSyncListenersBound = true;
    window.addEventListener("online", () => {
        scheduleLiveRefresh();
        connectLiveSync();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            scheduleLiveRefresh();
            connectLiveSync();
        }
    });
}

function connectLiveSync() {
    const auth = loadAuth();
    if (!auth?.token || liveSocket) return;
    bindLiveSyncRecoveryListeners();
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}/ws?token=${encodeURIComponent(auth.token)}`;
    const socket = new WebSocket(url);
    liveSocket = socket;

    socket.addEventListener("open", () => {
        stopLivePollingFallback();
    });

    socket.addEventListener("message", (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data?.type === "audit") {
                scheduleLiveRefresh();
            }
        } catch (error) {
            // Ignore malformed messages.
        }
    });

    socket.addEventListener("close", (event) => {
        if (liveSocket === socket) {
            liveSocket = null;
            startLivePollingFallback();
            const suspensionClose = String(event?.reason || "").toLowerCase().includes("suspension");
            const nextDelay = suspensionClose ? 15000 : LIVE_RECONNECT_DELAY_MS;
            if (document.visibilityState === "visible") {
                scheduleLiveReconnect(nextDelay);
            }
        }
    });

    socket.addEventListener("error", () => {
        if (liveSocket === socket) {
            liveSocket = null;
            startLivePollingFallback();
        }
    });
}

// ============ API CALLS ============

async function api(path, options = {}) {
    const auth = loadAuth();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (auth?.token) {
        headers.Authorization = `Bearer ${auth.token}`;
    }
    const response = await fetch(`/api${path}`, { ...options, headers });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.error || `Request failed (${response.status})`);
    }
    return data;
}

// ============ AUTH ============

function setIdentity(user) {
    document.querySelectorAll("[data-session-user]").forEach((node) => {
        node.textContent = user?.name || user?.username || "—";
    });
    document.querySelectorAll("[data-session-role]").forEach((node) => {
        node.textContent = user?.role || "—";
    });
}

function activateNav() {
    const current = pageName();
    document.querySelectorAll(".portal-nav a").forEach((link) => {
        link.classList.toggle("active", (link.getAttribute("href") || "").toLowerCase() === current);
    });
}

function setPermissionContext(user) {
    const list = Array.isArray(user?.permissions) ? user.permissions : [];
    currentPermissionSet = new Set(list.map((entry) => String(entry || "").trim()).filter(Boolean));
}

function hasPermission(permission) {
    return currentPermissionSet.has(String(permission || "").trim());
}

function hasAnyPermission(permissions = []) {
    return (Array.isArray(permissions) ? permissions : []).some((permission) => hasPermission(permission));
}

function isDomainWorkspacePage(page = pageName()) {
    return DOMAIN_WORKSPACE_PAGES.includes(String(page || "").toLowerCase());
}

function getPagePermissionState() {
    const page = pageName();
    const rule = PAGE_PERMISSION_RULES[page] || { readAny: [], writeAny: [] };
    const canRead = rule.readAny.length === 0 || hasAnyPermission(rule.readAny);
    const canWrite = rule.writeAny.length > 0 && hasAnyPermission(rule.writeAny);
    return { page, canRead, canWrite };
}

function applyNavPermissionVisibility() {
    const navRules = {
        "dashboard.html": ["dashboard.read"],
        "users.html": ["users.read", "roles.read", "users.write", "roles.write"],
        "teams.html": ["teams.read", "teams.write"],
        "events.html": ["events.read", "events.write"],
        "points.html": ["point_rules.read", "point_rules.write"],
        "transfers.html": ["transfers.read", "transfers.write"],
        "reporting.html": ["audit.read", "publications.read", "public_api.read", "event_scores.read", "publications.write"],
        "operations.html": ["dashboard.read", "workflows.execute"],
        "msc-admin.html": ["dashboard.read", "msc_admin.read", "msc_admin.write"],
        "loc-dashboard.html": ["dashboard.read", "loc.read", "loc.write"],
        "team-portal.html": ["dashboard.read", "team_portal.read", "team_portal.write"],
        "athlete-app.html": ["dashboard.read", "athlete_app.read", "athlete_app.write"],
        "public-site.html": ["dashboard.read", "public_site.read", "public_site.write"],
        "settings.html": ["settings.read", "settings.write"]
    };
    document.querySelectorAll(".portal-nav a").forEach((link) => {
        const href = (link.getAttribute("href") || "").toLowerCase();
        const perms = navRules[href];
        if (!perms || perms.length === 0) return;
        const visible = hasAnyPermission(perms);
        const listItem = link.closest("li");
        if (listItem) {
            listItem.classList.toggle("hidden", !visible);
        } else {
            link.classList.toggle("hidden", !visible);
        }
    });
}

function ensureDomainNavLinks() {
    const nav = document.querySelector(".portal-nav");
    if (!nav) return;
    const domainLinks = [
        { href: "msc-admin.html", label: "MSC Admin" },
        { href: "loc-dashboard.html", label: "LOC Dashboard" },
        { href: "team-portal.html", label: "Team Portal" },
        { href: "athlete-app.html", label: "Athlete App" },
        { href: "public-site.html", label: "Public Site" }
    ];
    const operationsItem = Array.from(nav.querySelectorAll("a"))
        .find((link) => (link.getAttribute("href") || "").toLowerCase() === "operations.html")
        ?.closest("li");
    const insertionParent = operationsItem?.parentElement || nav;
    let insertAfter = operationsItem;
    domainLinks.forEach((entry) => {
        const exists = nav.querySelector(`a[href="${entry.href}"]`);
        if (exists) {
            insertAfter = exists.closest("li");
            return;
        }
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = entry.href;
        link.textContent = entry.label;
        li.appendChild(link);
        if (insertAfter && insertAfter.parentElement === insertionParent) {
            insertAfter.insertAdjacentElement("afterend", li);
        } else {
            insertionParent.appendChild(li);
        }
        insertAfter = li;
    });
}

function setupCommandPalette() {
    if (isLoginPage()) return;
    if (document.getElementById("command-palette-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "command-palette-overlay";
    overlay.className = "command-palette-overlay hidden";
    overlay.innerHTML = `
        <div class="command-palette">
            <div class="command-palette-head">
                <input id="command-palette-input" type="search" placeholder="Bereich oder Aktion suchen..." />
                <span class="command-palette-hint">${COMMAND_PALETTE_HINT}</span>
            </div>
            <div class="command-palette-list" id="command-palette-list"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById("command-palette-input");
    const listNode = document.getElementById("command-palette-list");

    const staticActions = [
        {
            id: "refresh-page",
            label: "Aktuelle Seite neu laden",
            keywords: ["refresh", "reload", "neu laden"],
            run: () => window.location.reload()
        },
        {
            id: "refresh-live-data",
            label: "Live-Daten aktualisieren",
            keywords: ["live", "sync", "daten"],
            run: async () => {
                await rerenderCurrentPageForTimezone();
                showToast("Aktuelle Seite aktualisiert.", "info");
            }
        },
        {
            id: "logout",
            label: "Abmelden",
            keywords: ["logout", "abmelden"],
            run: () => {
                clearAuth();
                window.location.href = "login.html";
            }
        }
    ];

    function visibleNavItems() {
        return Array.from(document.querySelectorAll(".portal-nav a"))
            .filter((link) => !link.closest("li")?.classList.contains("hidden"))
            .map((link) => ({
                id: `nav:${(link.getAttribute("href") || "").toLowerCase()}`,
                label: link.textContent?.trim() || link.getAttribute("href"),
                subtitle: link.getAttribute("href") || "",
                run: () => { window.location.href = link.getAttribute("href") || "dashboard.html"; },
                keywords: [link.textContent || "", link.getAttribute("href") || ""]
            }));
    }

    function renderItems(filterText = "") {
        if (!listNode) return;
        const normalized = String(filterText || "").trim().toLowerCase();
        const items = [...visibleNavItems(), ...staticActions]
            .filter((item) => {
                if (!normalized) return true;
                const source = [item.label, item.subtitle || "", ...(item.keywords || [])]
                    .map((entry) => String(entry || "").toLowerCase())
                    .join(" ");
                return source.includes(normalized);
            })
            .slice(0, 12);
        listNode.innerHTML = items.map((item, index) => `
            <button type="button" class="command-item ${index === 0 ? "active" : ""}" data-cmd-id="${escapeHtml(item.id)}">
                <span>${escapeHtml(item.label || "Aktion")}</span>
                <small>${escapeHtml(item.subtitle || "Aktion")}</small>
            </button>
        `).join("") || "<div class='command-empty'>Keine Treffer</div>";
        listNode.querySelectorAll("[data-cmd-id]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = button.getAttribute("data-cmd-id");
                const found = items.find((entry) => entry.id === id);
                if (!found) return;
                closePalette();
                await found.run();
            });
        });
    }

    function openPalette() {
        overlay.classList.remove("hidden");
        renderItems(input?.value || "");
        input?.focus();
        input?.select();
    }

    function closePalette() {
        overlay.classList.add("hidden");
    }

    function moveSelection(direction) {
        const nodes = Array.from(listNode?.querySelectorAll(".command-item") || []);
        if (nodes.length === 0) return;
        let activeIndex = nodes.findIndex((node) => node.classList.contains("active"));
        if (activeIndex < 0) activeIndex = 0;
        nodes[activeIndex]?.classList.remove("active");
        activeIndex = (activeIndex + direction + nodes.length) % nodes.length;
        nodes[activeIndex]?.classList.add("active");
        nodes[activeIndex]?.scrollIntoView({ block: "nearest" });
    }

    document.addEventListener("keydown", async (event) => {
        const key = String(event.key || "").toLowerCase();
        if ((event.ctrlKey || event.metaKey) && key === "k") {
            event.preventDefault();
            if (overlay.classList.contains("hidden")) openPalette();
            else closePalette();
            return;
        }
        if (overlay.classList.contains("hidden")) return;
        if (key === "escape") {
            event.preventDefault();
            closePalette();
            return;
        }
        if (key === "arrowdown") {
            event.preventDefault();
            moveSelection(1);
            return;
        }
        if (key === "arrowup") {
            event.preventDefault();
            moveSelection(-1);
            return;
        }
        if (key === "enter") {
            event.preventDefault();
            const active = listNode?.querySelector(".command-item.active");
            if (active instanceof HTMLButtonElement) active.click();
        }
    });

    input?.addEventListener("input", () => renderItems(input.value));
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closePalette();
    });
}

function renderNoAccessPage() {
    const content = document.querySelector(".portal-content");
    if (!content) return;
    content.innerHTML = `
        <div class="card permission-empty-state">
            <div class="card-header">
                <h2>Zugriff nicht verfügbar</h2>
            </div>
            <div class="card-body">
                <p>Für diesen Bereich fehlen die Leseberechtigungen. Bitte Rolle oder Berechtigungen im Benutzer- und Rollenmodul anpassen.</p>
            </div>
        </div>
    `;
}

function applyReadOnlyUi(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form || form.dataset.readonlyApplied === "1") return;
    form.dataset.readonlyApplied = "1";
    form.classList.add("readonly-surface");
    const banner = document.createElement("div");
    banner.className = "readonly-banner";
    banner.textContent = "Leseansicht: Für diese Rolle sind Änderungen in diesem Bereich deaktiviert.";
    form.prepend(banner);
    form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = true;
    });
    form.querySelectorAll("button").forEach((button) => {
        if (button.classList.contains("tab-button")) return;
        button.disabled = true;
    });
}

function applyReadOnlyActionButtons(root = document) {
    if (!currentPageReadOnly) return;
    const selectors = PAGE_READONLY_ACTION_SELECTORS[pageName()] || [];
    selectors.forEach((selector) => {
        root.querySelectorAll(selector).forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            node.classList.add("readonly-action");
            if ("disabled" in node) {
                node.disabled = true;
            }
            node.setAttribute("aria-disabled", "true");
        });
    });
}

function applyPageReadOnlyExperience() {
    const { page, canWrite } = getPagePermissionState();
    currentPageReadOnly = !canWrite;
    if (canWrite) return;
    const selectors = PAGE_WRITE_FORM_SELECTORS[page] || [];
    selectors.forEach((selector) => applyReadOnlyUi(selector));
    applyReadOnlyActionButtons(document);
}

function activateFirstVisibleTab() {
    const firstVisible = Array.from(document.querySelectorAll(".tab-button[data-tab]"))
        .find((buttonNode) => !buttonNode.classList.contains("hidden"));
    if (!firstVisible) return;
    activateTab(firstVisible);
}

function wireLogout() {
    const button = document.getElementById("logout-button");
    if (!button) return;
    button.addEventListener("click", () => {
        clearAuth();
        showToast("Abgemeldet", "info", 2000);
        setTimeout(() => {
            window.location.href = "login.html";
        }, 500);
    });
}

async function requireAuth() {
    const auth = loadAuth();
    if (!auth?.token) {
        window.location.href = "login.html";
        return null;
    }
    try {
        const { user } = await api("/auth/me");
        saveAuth({ token: auth.token, user });
        setPermissionContext(user);
        setIdentity(user);
        return user;
    } catch (error) {
        clearAuth();
        window.location.href = "login.html";
        return null;
    }
}

// ============ FORM HELPERS ============

function createDropdown(name, options, placeholder = "-- Bitte auswählen --") {
    const select = document.createElement("select");
    select.name = name;
    
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = placeholder;
    emptyOption.disabled = true;
    emptyOption.selected = true;
    select.appendChild(emptyOption);
    
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = typeof opt === "string" ? opt : opt.value;
        option.textContent = typeof opt === "string" ? opt : opt.label;
        select.appendChild(option);
    });
    
    return select;
}

function createCheckboxGroup(name, options, selectedValues = []) {
    const group = document.createElement("div");
    group.className = "checkbox-group";
    
    options.forEach(opt => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const checked = selectedValues.includes(value);
        
        const wrapper = document.createElement("div");
        wrapper.className = "checkbox-item";
        wrapper.innerHTML = `
            <input type="checkbox" name="${name}" value="${value}" ${checked ? "checked" : ""} />
            <label>${label}</label>
        `;
        group.appendChild(wrapper);
    });
    
    return group;
}

function createRadioGroup(name, options, selectedValue = null) {
    const group = document.createElement("div");
    group.className = "radio-group";
    
    options.forEach(opt => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const checked = value === selectedValue;
        
        const wrapper = document.createElement("div");
        wrapper.className = "radio-item";
        wrapper.innerHTML = `
            <input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""} />
            <label>${label}</label>
        `;
        group.appendChild(wrapper);
    });
    
    return group;
}

function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

// ============ TABLE HELPERS ============

function tableRow(cells) {
    return `<tr>${cells.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function findByIds(ids) {
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) return element;
    }
    return null;
}

function setTableRows(ids, html, colspan, emptyText) {
    const target = findByIds(ids);
    if (!target) return false;
    target.innerHTML = html || `<tr><td colspan="${colspan}" class="table-empty">${emptyText}</td></tr>`;
    applyReadOnlyActionButtons(target.closest(".card") || target);
    return true;
}

function statusBadge(status) {
    const colors = {
        active: "success",
        inactive: "danger",
        pending: "warning",
        planned: "info",
        in_progress: "warning",
        live: "success",
        blocked: "danger",
        completed: "success",
        in_pruefung: "info",
        gueltig: "success",
        abgelaufen: "danger",
        approved: "success",
        requested: "warning"
    };
    const normalized = String(status || "").toLowerCase().replace(/ü/g, "ue");
    const color = colors[normalized] || "info";
    return `<span class="badge badge-${color}">${status || "—"}</span>`;
}

function button(label, attrs = "") {
    return `<button class="btn btn-small btn-danger" ${attrs}>${label}</button>`;
}

// ============ LOGIN PAGE ============

async function setupLoginPage() {
    if (!isLoginPage()) return;

    const bootstrapStatus = await api("/auth/bootstrap-status");
    const bootstrapSection = document.getElementById("bootstrap-section");
    if (bootstrapStatus.requiresBootstrap && bootstrapSection) {
        bootstrapSection.classList.remove("hidden");
    } else if (bootstrapSection) {
        bootstrapSection.classList.add("hidden");
    }

    const loginForm = document.getElementById("login-form");
    loginForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();
        const formData = new FormData(loginForm);
        try {
            const payload = Object.fromEntries(formData.entries());
            const result = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            saveAuth({ token: result.token, user: result.user });
            showToast("Willkommen", "success", 1500);
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    const bootstrapForm = document.getElementById("bootstrap-form");
    bootstrapForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();
        const payload = Object.fromEntries(new FormData(bootstrapForm).entries());
        try {
            const result = await api("/auth/bootstrap", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            saveAuth({ token: result.token, user: result.user });
            showToast("Admin erstellt. Willkommen.", "success", 1500);
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

// ============ DASHBOARD ============

async function loadDashboard() {
    const data = await api("/dashboard");
    const kpiUsers = document.getElementById("kpi-users");
    const kpiTeams = document.getElementById("kpi-teams");
    const kpiEvents = document.getElementById("kpi-events");
    const kpiLicenses = document.getElementById("kpi-licenses");
    if (kpiUsers) kpiUsers.textContent = data.stats.users;
    if (kpiTeams) kpiTeams.textContent = data.stats.teams;
    if (kpiEvents) kpiEvents.textContent = data.stats.events;
    if (kpiLicenses) kpiLicenses.textContent = data.stats.licensesPending;

    const licensesHtml = data.pendingLicenses.map(l => tableRow([
        `<strong>${l.name || "—"}</strong>`,
        l.team_name || "—",
        l.license_type || "—",
        statusBadge(l.license_status),
        "—"
    ])).join("");
    setTableRows(["licenses-table", "licenses-tbody"], licensesHtml, 5, "Keine offenen Lizenzanträge");

    const eventsHtml = data.nextEvents.map(e => tableRow([
        `<strong>${e.name}</strong>`,
        e.location || "—",
        formatDate(e.event_date),
        statusBadge(e.status)
    ])).join("");
    setTableRows(["events-table", "events-tbody"], eventsHtml, 4, "Keine kommenden Events");

    const auditHtml = data.recentAudit.slice(0, 10).map(a => tableRow([
        formatTime(a.created_at),
        a.actor_username || "—",
        a.action || "—",
        a.entity_type || "—"
    ])).join("");
    setTableRows(["audit-table", "audit-tbody"], auditHtml, 4, "Noch keine Systemaktivitäten");
}

// ============ USERS ============

const PERMISSION_LABELS = {
    "dashboard.read": "Dashboard lesen",
    "users.read": "Benutzer lesen",
    "users.write": "Benutzer verwalten",
    "roles.read": "Rollen lesen",
    "roles.write": "Rollen verwalten",
    "teams.read": "Teams lesen",
    "teams.write": "Teams verwalten",
    "team_members.read": "Teammitglieder lesen",
    "team_members.write": "Teammitglieder verwalten",
    "events.read": "Events lesen",
    "events.write": "Events verwalten",
    "jury_decisions.read": "Jury-Entscheide lesen",
    "jury_decisions.write": "Jury-Entscheide verwalten",
    "point_rules.read": "Punkteregeln lesen",
    "point_rules.write": "Punkteregeln verwalten",
    "event_scores.read": "Event-Punkte lesen",
    "event_scores.write": "Event-Punkte verwalten",
    "transfers.read": "Transfers lesen",
    "transfers.write": "Transfers verwalten",
    "contracts.read": "Verträge lesen",
    "contracts.write": "Verträge verwalten",
    "publications.read": "Publikationen lesen",
    "publications.write": "Publikationen verwalten",
    "audit.read": "Audit-Logs lesen",
    "settings.read": "Einstellungen lesen",
    "settings.write": "Einstellungen verwalten",
    "venues.read": "Schanzen lesen",
    "venues.write": "Schanzen verwalten",
    "competition_engine.read": "Wettkampf-Engine lesen",
    "competition_engine.write": "Wettkampf-Engine verwalten",
    "medical.read": "Medical lesen",
    "medical.write": "Medical verwalten",
    "material.read": "Materialkontrolle lesen",
    "material.write": "Materialkontrolle verwalten",
    "discipline.read": "Disziplinarfälle lesen",
    "discipline.write": "Disziplinarfälle verwalten",
    "finance.read": "Finanzen lesen",
    "finance.write": "Finanzen verwalten",
    "accreditation.read": "Akkreditierungen lesen",
    "accreditation.write": "Akkreditierungen verwalten",
    "public_api.read": "Public API lesen",
    "workflows.execute": "Workflows ausführen",
    "msc_admin.read": "MSC Admin lesen",
    "msc_admin.write": "MSC Admin verwalten",
    "loc.read": "LOC Dashboard lesen",
    "loc.write": "LOC Dashboard verwalten",
    "team_portal.read": "Team Portal lesen",
    "team_portal.write": "Team Portal verwalten",
    "athlete_app.read": "Athlete App lesen",
    "athlete_app.write": "Athlete App verwalten",
    "public_site.read": "Public Site lesen",
    "public_site.write": "Public Site verwalten"
};

const usersPageState = {
    users: [],
    roles: [],
    permissions: [],
    teams: [],
    events: [],
    editingRoleId: null
};

const teamsPageState = {
    teams: [],
    editingTeamId: null
};

function permissionLabel(permission) {
    return PERMISSION_LABELS[permission] || permission;
}

function renderRoleSelectOptions(selectedRole = "") {
    const options = usersPageState.roles
        .filter((role) => role.status === "active")
        .map((role) => `<option value="${escapeHtml(role.name)}" ${role.name === selectedRole ? "selected" : ""}>${escapeHtml(role.name)}</option>`)
        .join("");
    return `<option value="" disabled ${selectedRole ? "" : "selected"}>Rolle auswählen</option>${options}`;
}

function renderCreateUserRoleSelect() {
    const select = document.getElementById("create-user-role");
    if (!select) return;
    select.innerHTML = renderRoleSelectOptions();
}

function isTeamManagerRole(roleName) {
    return String(roleName || "").trim().toLowerCase() === "teammanager";
}

const ASSIGNMENT_REQUIREMENTS = [
    { key: "team", label: "Team-Zuordnung" },
    { key: "venue", label: "Schanzen-Zuordnung" },
    { key: "event", label: "Wettbewerb-Zuordnung" },
    { key: "other", label: "Sonstige Zuordnung" }
];

function normalizeRequiredAssignments(requiredAssignments) {
    const valid = new Set(ASSIGNMENT_REQUIREMENTS.map((entry) => entry.key));
    if (!Array.isArray(requiredAssignments)) return [];
    return [...new Set(requiredAssignments.map((entry) => String(entry || "").trim().toLowerCase()).filter((entry) => valid.has(entry)))];
}

function findRoleByName(roleName) {
    const normalized = String(roleName || "").trim().toLowerCase();
    return usersPageState.roles.find((role) => String(role.name || "").trim().toLowerCase() === normalized) || null;
}

function renderTeamSelectOptions(selectedId = "") {
    const normalizedSelected = String(selectedId || "").trim();
    const options = usersPageState.teams
        .filter((team) => team.status !== "inactive")
        .map((team) => {
            const value = String(team.id);
            const selected = normalizedSelected && value === normalizedSelected ? "selected" : "";
            return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(team.name)}</option>`;
        })
        .join("");
    return `<option value="" ${normalizedSelected ? "" : "selected"}>Kein Team ausgewählt</option>${options}`;
}

function renderEventSelectOptions(selectedId = "") {
    const normalizedSelected = String(selectedId || "").trim();
    const options = usersPageState.events
        .filter((event) => event.status !== "cancelled")
        .map((event) => {
            const value = String(event.id);
            const selected = normalizedSelected && value === normalizedSelected ? "selected" : "";
            return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(event.name)}</option>`;
        })
        .join("");
    return `<option value="" ${normalizedSelected ? "" : "selected"}>Kein Wettbewerb ausgewählt</option>${options}`;
}

function assignmentSummary(user) {
    const parts = [];
    if (user.assignment_team_name || user.managed_team_name) parts.push(`Team: ${user.assignment_team_name || user.managed_team_name}`);
    if (user.assignment_event_name) parts.push(`Wettkampf: ${user.assignment_event_name}`);
    if (user.assignment_venue_code) parts.push(`Schanze: ${user.assignment_venue_code}`);
    if (user.assignment_other_scope) parts.push(`Weitere: ${user.assignment_other_scope}`);
    return parts.length ? parts.join(" · ") : "—";
}

function updateAssignmentFieldState(roleValue, fields = {}) {
    const role = findRoleByName(roleValue);
    const required = new Set(normalizeRequiredAssignments(role?.required_assignments || []));
    const teamRequired = required.has("team") || isTeamManagerRole(roleValue);
    if (fields.teamSelect) fields.teamSelect.required = teamRequired;
    if (fields.eventSelect) fields.eventSelect.required = required.has("event");
    if (fields.venueInput) fields.venueInput.required = required.has("venue");
    if (fields.otherInput) fields.otherInput.required = required.has("other");
}

function renderCreateUserTeamSelect(selectedId = "") {
    const select = document.getElementById("create-user-team");
    if (!select) return;
    select.innerHTML = renderTeamSelectOptions(selectedId);
}

function renderCreateUserEventSelect(selectedId = "") {
    const select = document.getElementById("create-user-event");
    if (!select) return;
    select.innerHTML = renderEventSelectOptions(selectedId);
}

function permissionGroupName(permission) {
    return permission.split(".")[0] || "allgemein";
}

function groupedPermissions(permissions) {
    return permissions.reduce((groups, permission) => {
        const group = permissionGroupName(permission);
        if (!groups[group]) groups[group] = [];
        groups[group].push(permission);
        return groups;
    }, {});
}

function renderPermissionMatrix(selected = []) {
    const container = document.getElementById("permission-matrix");
    if (!container) return;
    const groups = groupedPermissions(usersPageState.permissions);
    const selectedSet = new Set(selected);
    const sections = Object.entries(groups).map(([group, permissions]) => {
        const rows = permissions.map((permission) => `
            <label class="permission-item">
                <input type="checkbox" name="permissions" value="${escapeHtml(permission)}" ${selectedSet.has(permission) ? "checked" : ""} />
                <span>${escapeHtml(permissionLabel(permission))}</span>
            </label>
        `).join("");
        return `
            <div class="permission-group">
                <h4>${escapeHtml(group.replaceAll("_", " "))}</h4>
                <div class="permission-list">${rows}</div>
            </div>
        `;
    }).join("");
    container.innerHTML = sections || `<p class="table-empty">Keine Berechtigungen verfügbar.</p>`;
}

function renderAssignmentRequirementMatrix(selected = []) {
    const container = document.getElementById("assignment-requirement-matrix");
    if (!container) return;
    const selectedSet = new Set(normalizeRequiredAssignments(selected));
    const rows = ASSIGNMENT_REQUIREMENTS.map((entry) => `
        <label class="permission-item">
            <input type="checkbox" name="requiredAssignments" value="${escapeHtml(entry.key)}" ${selectedSet.has(entry.key) ? "checked" : ""} />
            <span>${escapeHtml(entry.label)}</span>
        </label>
    `).join("");
    container.innerHTML = `<div class="permission-list">${rows}</div>`;
}

function readRoleFormPayload() {
    const form = document.getElementById("role-form");
    const formData = new FormData(form);
    const permissions = formData.getAll("permissions");
    const requiredAssignments = normalizeRequiredAssignments(formData.getAll("requiredAssignments"));
    return {
        name: String(formData.get("name") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        status: formData.get("status") === "inactive" ? "inactive" : "active",
        permissions,
        requiredAssignments
    };
}

function resetRoleForm() {
    const form = document.getElementById("role-form");
    if (!form) return;
    form.reset();
    const status = form.querySelector("select[name='status']");
    if (status) status.value = "active";
    const nameInput = form.querySelector("input[name='name']");
    if (nameInput) nameInput.disabled = false;
    usersPageState.editingRoleId = null;
    const submit = document.getElementById("role-submit-button");
    if (submit) submit.textContent = "Rolle erstellen";
    const cancel = document.getElementById("role-cancel-edit");
    if (cancel) cancel.classList.add("hidden");
    renderPermissionMatrix([]);
    renderAssignmentRequirementMatrix([]);
}

function fillRoleForm(role) {
    const form = document.getElementById("role-form");
    if (!form || !role) return;
    form.elements.name.value = role.name || "";
    form.elements.name.disabled = role.is_system === true;
    form.elements.description.value = role.description || "";
    form.elements.status.value = role.status === "inactive" ? "inactive" : "active";
    renderPermissionMatrix(Array.isArray(role.permissions) ? role.permissions : []);
    renderAssignmentRequirementMatrix(Array.isArray(role.required_assignments) ? role.required_assignments : []);
    usersPageState.editingRoleId = role.id;
    const submit = document.getElementById("role-submit-button");
    if (submit) submit.textContent = "Rolle speichern";
    const cancel = document.getElementById("role-cancel-edit");
    if (cancel) cancel.classList.remove("hidden");
}

async function loadRolesAndPermissions() {
    const [roles, permissionPayload, teamsResult, eventsResult] = await Promise.all([
        api("/roles"),
        api("/permissions"),
        api("/teams").catch(() => []),
        api("/events").catch(() => [])
    ]);
    usersPageState.roles = Array.isArray(roles) ? roles : [];
    usersPageState.permissions = Array.isArray(permissionPayload?.permissions) ? permissionPayload.permissions : [];
    usersPageState.teams = Array.isArray(teamsResult) ? teamsResult : [];
    usersPageState.events = Array.isArray(eventsResult) ? eventsResult : [];
    renderCreateUserRoleSelect();
    renderCreateUserTeamSelect();
    renderCreateUserEventSelect();
    renderPermissionMatrix([]);
    renderAssignmentRequirementMatrix([]);
    renderRolesTable();
}

function renderRolesTable() {
    const tbody = document.getElementById("roles-list-tbody");
    if (!tbody) return;
    const canManageRoles = hasPermission("roles.write");
    const html = usersPageState.roles.map((role) => {
        const preview = (role.permissions || []).slice(0, 4).map((p) => `<span class="permission-pill">${escapeHtml(permissionLabel(p))}</span>`).join("");
        const extra = (role.permissions || []).length > 4 ? `<span class="permission-pill">+${(role.permissions || []).length - 4} weitere</span>` : "";
        const assignmentPreview = normalizeRequiredAssignments(role.required_assignments || [])
            .map((entry) => ASSIGNMENT_REQUIREMENTS.find((item) => item.key === entry)?.label || entry)
            .map((label) => `<span class="permission-pill">${escapeHtml(label)}</span>`)
            .join("");
        return `
            <tr>
                <td><strong>${escapeHtml(role.name)}</strong></td>
                <td>${escapeHtml(role.description || "—")}</td>
                <td>${statusBadge(role.status)}</td>
                <td>
                    <div class="permission-pill-list">${preview}${extra}</div>
                    <div class="permission-pill-list" style="margin-top: 8px;">${assignmentPreview || '<span class="permission-pill">Keine Pflicht-Zuweisung</span>'}</div>
                </td>
                <td>${role.user_count || 0}</td>
                <td>${canManageRoles
                    ? `
                        <button class="btn btn-small btn-secondary" data-edit-role="${role.id}">Bearbeiten</button>
                        <button class="btn btn-small btn-danger" data-delete-role="${role.id}" ${role.is_system ? "disabled" : ""}>Löschen</button>
                    `
                    : `<span class="badge badge-info">Leseansicht</span>`}
                </td>
            </tr>
        `;
    }).join("");
    tbody.innerHTML = html || `<tr><td colspan="6" class="table-empty">Keine Rollen vorhanden</td></tr>`;

    if (!canManageRoles) return;
    document.querySelectorAll("[data-edit-role]").forEach((buttonNode) => {
        buttonNode.addEventListener("click", () => {
            const roleId = Number(buttonNode.getAttribute("data-edit-role"));
            const role = usersPageState.roles.find((entry) => entry.id === roleId);
            fillRoleForm(role);
            const tabButton = document.querySelector(".tab-button[data-tab='tab-roles-editor']");
            if (tabButton) activateTab(tabButton);
        });
    });

    document.querySelectorAll("[data-delete-role]").forEach((buttonNode) => {
        buttonNode.addEventListener("click", () => {
            const roleId = Number(buttonNode.getAttribute("data-delete-role"));
            const role = usersPageState.roles.find((entry) => entry.id === roleId);
            if (!role) return;
            confirmDelete(`Rolle ${role.name}`, async () => {
                try {
                    await api(`/roles/${role.id}`, { method: "DELETE" });
                    showToast(`Rolle ${role.name} wurde gelöscht`, "success");
                    await loadRolesAndPermissions();
                    await loadUsers();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
    });
}

async function loadUsers() {
    const users = await api("/users");
    usersPageState.users = Array.isArray(users) ? users : [];
    const container = findByIds(["users-list", "users-list-tbody"]);
    if (!container) return;
    const canManageUsers = hasPermission("users.write");

    const html = usersPageState.users.map((user) => `
        <tr>
            <td><strong>${escapeHtml(user.name)}</strong></td>
            <td><code>${escapeHtml(user.username)}</code></td>
            <td>${escapeHtml(user.email || "—")}</td>
            <td><span class="badge badge-info">${escapeHtml(user.role || "—")}</span></td>
            <td>${escapeHtml(assignmentSummary(user))}</td>
            <td>${statusBadge(user.status)}</td>
            <td>${formatDate(user.last_login_at)}</td>
            <td>${canManageUsers
                ? `
                    <button class="btn btn-small btn-secondary" data-edit-user="${user.id}">Bearbeiten</button>
                    <button class="btn btn-small btn-danger" data-delete-user="${user.id}">Löschen</button>
                `
                : `<span class="badge badge-info">Leseansicht</span>`}
            </td>
        </tr>
    `).join("");

    container.innerHTML = html || `<tr><td colspan="8" class="table-empty">Keine Benutzer vorhanden</td></tr>`;

    if (!canManageUsers) return;
    document.querySelectorAll("[data-edit-user]").forEach((buttonNode) => {
        buttonNode.addEventListener("click", () => {
            const userId = Number(buttonNode.getAttribute("data-edit-user"));
            const user = usersPageState.users.find((entry) => entry.id === userId);
            showEditUserModal(user);
        });
    });

    document.querySelectorAll("[data-delete-user]").forEach((buttonNode) => {
        buttonNode.addEventListener("click", () => {
            const userId = Number(buttonNode.getAttribute("data-delete-user"));
            const user = usersPageState.users.find((entry) => entry.id === userId);
            if (!user) return;
            confirmDelete(user.name, async () => {
                try {
                    await api(`/users/${userId}`, { method: "DELETE" });
                    showToast(`${user.name} wurde gelöscht`, "success");
                    await loadUsers();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
    });
}

async function showEditUserModal(user) {
    if (!user) return;
    if (!hasPermission("users.write")) {
        showToast("Für das Bearbeiten von Benutzern fehlt die Berechtigung.", "warning");
        return;
    }
    if (usersPageState.roles.length === 0) {
        await loadRolesAndPermissions();
    }
    const roleOptions = renderRoleSelectOptions(user.role);
    const managedTeamOptions = renderTeamSelectOptions(user.assignment_team_id || user.managed_team_id || "");
    const eventOptions = renderEventSelectOptions(user.assignment_event_id || "");
    const content = `
        <form id="edit-user-form">
            <div class="form-group">
                <label>Benutzerkennung</label>
                <input type="text" value="${escapeHtml(user.username)}" disabled />
            </div>
            <div class="form-group">
                <label>Name</label>
                <input type="text" name="name" value="${escapeHtml(user.name)}" required />
            </div>
            <div class="form-group">
                <label>E-Mail</label>
                <input type="email" name="email" value="${escapeHtml(user.email || "")}" required />
            </div>
            <div class="form-group">
                <label>Rolle</label>
                <select name="role" required>${roleOptions}</select>
            </div>
            <div class="form-group">
                <label>Verknüpftes Team (für Teammanager)</label>
                <select name="managedTeamId">${managedTeamOptions}</select>
            </div>
            <div class="form-group">
                <label>Zugewiesener Wettbewerb</label>
                <select name="assignmentEventId">${eventOptions}</select>
            </div>
            <div class="form-group">
                <label>Zugewiesene Schanze (Code)</label>
                <input type="text" name="assignmentVenueCode" value="${escapeHtml(user.assignment_venue_code || "")}" />
            </div>
            <div class="form-group">
                <label>Weitere Zuordnung</label>
                <input type="text" name="assignmentOtherScope" value="${escapeHtml(user.assignment_other_scope || "")}" />
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" required>
                    <option value="active" ${user.status === "active" ? "selected" : ""}>Aktiv</option>
                    <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>Inaktiv</option>
                </select>
            </div>
            <div class="form-group">
                <label>Neues Passwort (optional)</label>
                <input type="password" name="password" placeholder="Nur bei Passwortwechsel ausfüllen" />
            </div>
        </form>
    `;

    showModal(`Benutzer bearbeiten: ${escapeHtml(user.name)}`, content, [
        { id: "cancel", label: "Abbrechen", primary: false, handler: () => {} },
        {
            id: "save",
            label: "Speichern",
            primary: true,
            handler: async () => {
                const form = document.getElementById("edit-user-form");
                const data = getFormData(form);
                const role = findRoleByName(data.role);
                const required = new Set(normalizeRequiredAssignments(role?.required_assignments || []));
                if ((required.has("team") || isTeamManagerRole(data.role)) && !data.managedTeamId) {
                    showToast("Für diese Rolle ist ein Team verpflichtend.", "error");
                    return false;
                }
                if (required.has("event") && !data.assignmentEventId) {
                    showToast("Für diese Rolle ist ein Wettbewerb verpflichtend.", "error");
                    return false;
                }
                if (required.has("venue") && !String(data.assignmentVenueCode || "").trim()) {
                    showToast("Für diese Rolle ist eine Schanze verpflichtend.", "error");
                    return false;
                }
                if (required.has("other") && !String(data.assignmentOtherScope || "").trim()) {
                    showToast("Für diese Rolle ist eine zusätzliche Zuordnung verpflichtend.", "error");
                    return false;
                }
                data.assignments = {
                    teamId: data.managedTeamId || null,
                    eventId: data.assignmentEventId || null,
                    venueCode: String(data.assignmentVenueCode || "").trim(),
                    otherScope: String(data.assignmentOtherScope || "").trim()
                };
                delete data.assignmentEventId;
                delete data.assignmentVenueCode;
                delete data.assignmentOtherScope;
                if (!data.password) delete data.password;
                try {
                    await api(`/users/${user.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(data)
                    });
                    showToast(`${user.name} wurde aktualisiert`, "success");
                    await loadUsers();
                    return true;
                } catch (error) {
                    showToast(error.message, "error");
                    return false;
                }
            }
        }
    ]);
    const editForm = document.getElementById("edit-user-form");
    const roleField = editForm?.querySelector("select[name='role']");
    const teamField = editForm?.querySelector("select[name='managedTeamId']");
    const eventField = editForm?.querySelector("select[name='assignmentEventId']");
    const venueField = editForm?.querySelector("input[name='assignmentVenueCode']");
    const otherField = editForm?.querySelector("input[name='assignmentOtherScope']");
    updateAssignmentFieldState(roleField?.value, {
        teamSelect: teamField,
        eventSelect: eventField,
        venueInput: venueField,
        otherInput: otherField
    });
    roleField?.addEventListener("change", () => {
        updateAssignmentFieldState(roleField.value, {
            teamSelect: teamField,
            eventSelect: eventField,
            venueInput: venueField,
            otherInput: otherField
        });
    });
}

async function setupUsersPage() {
    const canReadUsers = hasAnyPermission(["users.read", "users.write"]);
    const canReadRoles = hasAnyPermission(["roles.read", "roles.write"]);
    const canWriteUsers = hasPermission("users.write");
    const canWriteRoles = hasPermission("roles.write");

    const userTabButton = document.querySelector(".tab-button[data-tab='tab-users-admin']");
    const rolesOverviewButton = document.querySelector(".tab-button[data-tab='tab-roles-admin']");
    const rolesEditorButton = document.querySelector(".tab-button[data-tab='tab-roles-editor']");
    const userTabContent = document.getElementById("tab-users-admin");
    const rolesOverviewContent = document.getElementById("tab-roles-admin");
    const rolesEditorContent = document.getElementById("tab-roles-editor");

    if (!canReadUsers) {
        userTabButton?.classList.add("hidden");
        userTabContent?.classList.add("hidden");
    }
    if (!canReadRoles) {
        rolesOverviewButton?.classList.add("hidden");
        rolesEditorButton?.classList.add("hidden");
        rolesOverviewContent?.classList.add("hidden");
        rolesEditorContent?.classList.add("hidden");
    }
    if (!canReadUsers && !canReadRoles) {
        renderNoAccessPage();
        return;
    }
    activateFirstVisibleTab();

    const createUserForm = document.getElementById("create-user-form");
    if (createUserForm && canReadUsers) {
        const roleSelect = document.getElementById("create-user-role");
        const teamSelect = document.getElementById("create-user-team");
        const eventSelect = document.getElementById("create-user-event");
        const venueInput = createUserForm.querySelector("input[name='assignmentVenueCode']");
        const otherInput = createUserForm.querySelector("input[name='assignmentOtherScope']");
        const sendInvitationCheckbox = document.getElementById("create-user-send-invitation");
        const passwordFieldGroup = document.getElementById("password-field-group");
        const passwordInput = document.getElementById("create-user-password");

        // Toggle password field visibility based on send-invitation checkbox
        function updatePasswordFieldVisibility() {
            const sendInvitation = sendInvitationCheckbox.checked;
            if (sendInvitation) {
                passwordFieldGroup.style.display = "none";
                passwordInput.removeAttribute("required");
            } else {
                passwordFieldGroup.style.display = "block";
                passwordInput.setAttribute("required", "");
            }
        }

        sendInvitationCheckbox?.addEventListener("change", updatePasswordFieldVisibility);
        
        roleSelect?.addEventListener("change", () => {
            updateAssignmentFieldState(roleSelect.value, {
                teamSelect,
                eventSelect,
                venueInput,
                otherInput
            });
        });
        updateAssignmentFieldState(roleSelect?.value, {
            teamSelect,
            eventSelect,
            venueInput,
            otherInput
        });
        updatePasswordFieldVisibility();

        createUserForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!canWriteUsers) {
                showToast("Für das Anlegen von Benutzern fehlt die Berechtigung.", "warning");
                return;
            }
            const data = getFormData(createUserForm);
            const role = findRoleByName(data.role);
            const required = new Set(normalizeRequiredAssignments(role?.required_assignments || []));
            if ((required.has("team") || isTeamManagerRole(data.role)) && !data.managedTeamId) {
                showToast("Für diese Rolle ist ein Team verpflichtend.", "error");
                return;
            }
            if (required.has("event") && !data.assignmentEventId) {
                showToast("Für diese Rolle ist ein Wettbewerb verpflichtend.", "error");
                return;
            }
            if (required.has("venue") && !String(data.assignmentVenueCode || "").trim()) {
                showToast("Für diese Rolle ist eine Schanze verpflichtend.", "error");
                return;
            }
            if (required.has("other") && !String(data.assignmentOtherScope || "").trim()) {
                showToast("Für diese Rolle ist eine zusätzliche Zuordnung verpflichtend.", "error");
                return;
            }
            data.assignments = {
                teamId: data.managedTeamId || null,
                eventId: data.assignmentEventId || null,
                venueCode: String(data.assignmentVenueCode || "").trim(),
                otherScope: String(data.assignmentOtherScope || "").trim()
            };
            delete data.assignmentEventId;
            delete data.assignmentVenueCode;
            delete data.assignmentOtherScope;
            delete data.sendInvitation;  // Handle separately

            // Add sendInvitation flag if checkbox is checked
            if (sendInvitationCheckbox.checked) {
                data.sendInvitation = true;
            }

            try {
                const response = await api("/users", { method: "POST", body: JSON.stringify(data) });
                createUserForm.reset();
                renderCreateUserRoleSelect();
                renderCreateUserTeamSelect();
                renderCreateUserEventSelect();
                updateAssignmentFieldState(roleSelect?.value, {
                    teamSelect,
                    eventSelect,
                    venueInput,
                    otherInput
                });
                updatePasswordFieldVisibility();
                
                if (response.invitation_sent) {
                    showToast("Benutzer erstellt. Einladungs-E-Mail versendet.", "success");
                } else if (response.sendInvitation) {
                    showToast("Benutzer erstellt. (Hinweis: Email konnte nicht versendet werden)", "warning");
                } else {
                    showToast("Benutzer erstellt", "success");
                }
                await loadUsers();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
        if (!canWriteUsers) {
            applyReadOnlyUi("#create-user-form");
        }
    }

    const roleForm = document.getElementById("role-form");
    if (roleForm && canReadRoles) {
        roleForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!canWriteRoles) {
                showToast("Für das Bearbeiten von Rollen fehlt die Berechtigung.", "warning");
                return;
            }
            const payload = readRoleFormPayload();
            if (!payload.name) {
                showToast("Bitte einen Rollennamen eingeben.", "error");
                return;
            }
            try {
                if (usersPageState.editingRoleId) {
                    await api(`/roles/${usersPageState.editingRoleId}`, {
                        method: "PATCH",
                        body: JSON.stringify(payload)
                    });
                    showToast("Rolle aktualisiert", "success");
                } else {
                    await api("/roles", {
                        method: "POST",
                        body: JSON.stringify(payload)
                    });
                    showToast("Rolle erstellt", "success");
                }
                resetRoleForm();
                await loadRolesAndPermissions();
                await loadUsers();
            } catch (error) {
                showToast(error.message, "error");
            }
        });
        if (!canWriteRoles) {
            applyReadOnlyUi("#role-form");
        }
    }

    document.getElementById("role-cancel-edit")?.addEventListener("click", () => {
        resetRoleForm();
    });

    const loaders = [];
    if (canReadUsers) loaders.push(loadUsers());
    if (canReadRoles) loaders.push(loadRolesAndPermissions());
    if (loaders.length > 0) {
        await Promise.all(loaders);
    }
}

// ============ TEAMS PAGE ============

async function loadTeams() {
    try {
        const canManageTeams = hasPermission("teams.write");
        const teams = await api("/teams");
        teamsPageState.teams = Array.isArray(teams) ? teams : [];
        const html = teams.map(t => `
            <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.category || "—"}</td>
                <td>${t.nation || "—"}</td>
                <td>${t.manager_username || "—"}</td>
                <td>${statusBadge(t.status || "pending")}</td>
                <td>${canManageTeams
                    ? `
                        <button class="btn-small btn-secondary" onclick="editTeamModal(${t.id})">Bearbeiten</button>
                        <button class="btn-small btn-danger" onclick="confirmDelete('Team ${t.name}', () => deleteTeam(${t.id}))">Löschen</button>
                    `
                    : `<span class="badge badge-info">Leseansicht</span>`}
                </td>
            </tr>
        `).join("");
        setTableRows(["teams-list-tbody", "teams-list"], html, 6, "Keine Teams vorhanden");
    } catch (error) {
        showToast("Teams konnten nicht geladen werden.", "error");
    }
}

async function loadTeamManagerOptions(selectedId = "", currentTeamId = null) {
    const select = document.getElementById("create-team-manager");
    if (!select) return;
    const normalizedSelected = String(selectedId || "").trim();
    try {
        const [users, teams] = await Promise.all([api("/users"), api("/teams")]);
        const assigned = new Set(
            (Array.isArray(teams) ? teams : [])
                .filter((team) => !currentTeamId || Number(team.id) !== Number(currentTeamId))
                .map((team) => String(team.manager_username || "").trim())
                .filter(Boolean)
        );
        const managerOptions = (Array.isArray(users) ? users : [])
            .filter((user) => String(user.role || "").trim().toLowerCase() === "teammanager")
            .filter((user) => String(user.status || "").trim().toLowerCase() === "active")
            .filter((user) => !assigned.has(String(user.username || "").trim()))
            .map((user) => {
                const value = String(user.id);
                const selected = normalizedSelected && normalizedSelected === value ? "selected" : "";
                return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(user.name)} (${escapeHtml(user.username)})</option>`;
            })
            .join("");
        select.innerHTML = `<option value="">-- Kein Teammanager zuweisen --</option>${managerOptions}`;
    } catch (error) {
        select.innerHTML = "<option value=''>Teammanager konnten nicht geladen werden</option>";
    }
}

async function loadTeamLicenses() {
    const tbody = document.getElementById("licenses-list");
    if (!tbody) return;
    try {
        const dashboard = await api("/dashboard");
        const filter = String(document.getElementById("license-filter")?.value || "").trim();
        const licenses = Array.isArray(dashboard?.pendingLicenses) ? dashboard.pendingLicenses : [];
        const filtered = filter
            ? licenses.filter((entry) => String(entry.license_status || "").toLowerCase() === filter.toLowerCase())
            : licenses;
        const html = filtered.map((entry) => `
            <tr>
                <td><strong>${escapeHtml(entry.name || "—")}</strong></td>
                <td>${escapeHtml(entry.team_name || "—")}</td>
                <td>${escapeHtml(entry.license_type || "—")}</td>
                <td>—</td>
                <td>${statusBadge(entry.license_status || "pending")}</td>
                <td>
                    <button class="btn-small btn-secondary">Details</button>
                </td>
            </tr>
        `).join("");
        setTableRows(["licenses-list"], html, 6, "Keine Lizenzen vorhanden");
    } catch (error) {
        setTableRows(["licenses-list"], "", 6, "Lizenzen konnten nicht geladen werden");
    }
}

async function setupTeamsPage() {
    const canReadTeams = hasAnyPermission(["teams.read", "teams.write"]);
    const canWriteTeams = hasPermission("teams.write");
    if (!canReadTeams) {
        renderNoAccessPage();
        return;
    }
    const form = document.getElementById("create-team-form");
    const cancelEditButton = document.getElementById("team-cancel-edit");
    const submitButton = form?.querySelector("button[type='submit']");
    if (form && !form.dataset.boundSubmit) {
        form.dataset.boundSubmit = "1";
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!canWriteTeams) {
                showToast("Für das Anlegen von Teams fehlt die Berechtigung.", "warning");
                return;
            }
            const data = getFormData(form);
            try {
                if (teamsPageState.editingTeamId) {
                    await api(`/teams/${teamsPageState.editingTeamId}`, {
                        method: "PATCH",
                        body: JSON.stringify(data)
                    });
                    showToast(`Team ${data.name} wurde aktualisiert.`, "success");
                } else {
                    await api("/teams", {
                        method: "POST",
                        body: JSON.stringify(data)
                    });
                    showToast(`Team ${data.name} wurde erstellt.`, "success");
                }
                form.reset();
                teamsPageState.editingTeamId = null;
                if (submitButton) submitButton.textContent = "Team erstellen";
                cancelEditButton?.classList.add("hidden");
                await Promise.all([loadTeamManagerOptions(), loadTeams(), loadTeamLicenses()]);
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }
    if (cancelEditButton && cancelEditButton.dataset.boundClick !== "1") {
        cancelEditButton.dataset.boundClick = "1";
        cancelEditButton.addEventListener("click", async () => {
            teamsPageState.editingTeamId = null;
            form?.reset();
            if (submitButton) submitButton.textContent = "Team erstellen";
            cancelEditButton.classList.add("hidden");
            await loadTeamManagerOptions();
        });
    }
    if (!canWriteTeams) {
        applyReadOnlyUi("#create-team-form");
    }
    document.getElementById("license-filter")?.addEventListener("change", () => {
        loadTeamLicenses();
    });
    await Promise.all([loadTeamManagerOptions(), loadTeams(), loadTeamLicenses()]);
}

async function deleteTeam(id) {
    if (!hasPermission("teams.write")) {
        showToast("Für das Löschen von Teams fehlt die Berechtigung.", "warning");
        return;
    }
    try {
        await api(`/teams/${id}`, { method: "DELETE" });
        showToast("Team gelöscht.", "success");
        await loadTeams();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// ============ EVENTS PAGE ============

async function loadEvents() {
    try {
        const canManageEvents = hasPermission("events.write");
        const events = await api("/events");
        const html = events.map(e => `
            <tr>
                <td><strong>${e.name}</strong></td>
                <td>${e.event_type || "—"}</td>
                <td>${e.location || "—"}</td>
                <td>${formatDate(e.event_date)}</td>
                <td>${statusBadge(e.status || "pending")}</td>
                <td>${canManageEvents
                    ? `
                        <button class="btn-small btn-secondary" onclick="editEventModal(${e.id})">Bearbeiten</button>
                        <button class="btn-small btn-danger" onclick="confirmDelete('Event ${e.name}', () => deleteEvent(${e.id}))">Löschen</button>
                    `
                    : `<span class="badge badge-info">Leseansicht</span>`}</td>
            </tr>
        `).join("");
        setTableRows(["events-list-tbody", "events-list"], html, 6, "Keine Events vorhanden");
    } catch (error) {
        showToast("Events konnten nicht geladen werden.", "error");
    }
}

async function deleteEvent(id) {
    try {
        await api(`/events/${id}`, { method: "DELETE" });
        showToast("Event gelöscht.", "success");
        await loadEvents();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// ============ POINTS PAGE ============

async function loadPointsRules() {
    try {
        const rules = await api("/point-rules");
        if (typeof window.refreshPointsPage === "function") {
            await window.refreshPointsPage(rules);
            return;
        }
        const latestRule = Array.isArray(rules) ? rules[0] : null;
        if (latestRule) {
            const schema = document.querySelector("select[name='worldcup_schema']");
            if (schema) schema.value = latestRule.rule_type || "top_30";
        }
    } catch (error) {
        // Optional data; no user-facing error needed for empty rule set.
    }
}

// ============ TRANSFERS PAGE ============

async function loadTransfers() {
    try {
        const canManageTransfers = hasPermission("transfers.write");
        const transfers = await api("/transfers");
        const html = transfers.map(t => `
            <tr>
                <td><strong>${t.athlete_name || "—"}</strong></td>
                <td>${t.from_team_name || "—"}</td>
                <td>${t.to_team_name || "—"}</td>
                <td>${t.is_emergency ? "Notfall" : "Normal"}</td>
                <td>${statusBadge(t.status || "requested")}</td>
                <td>${formatDate(t.lock_until)}</td>
                <td>${canManageTransfers
                    ? `
                        <button class="btn-small btn-secondary" onclick="editTransferModal(${t.id})">Bearbeiten</button>
                        <button class="btn-small btn-danger" onclick="confirmDelete('Transfer ${escapeHtml(t.athlete_name || "Unbekannt")}', () => deleteTransfer(${t.id}))">Löschen</button>
                    `
                    : `<span class="badge badge-info">Leseansicht</span>`}</td>
            </tr>
        `).join("");
        setTableRows(["transfers-list-tbody", "transfers-list"], html, 7, "Noch keine Transfers vorhanden");
    } catch (error) {
        showToast("Transfers konnten nicht geladen werden.", "error");
    }
}

async function deleteTransfer(id) {
    if (!hasPermission("transfers.write")) {
        showToast("Für das Löschen von Transfers fehlt die Berechtigung.", "warning");
        return;
    }
    try {
        await api(`/transfers/${id}`, { method: "DELETE" });
        showToast("Transfer gelöscht.", "success");
        await loadTransfers();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// ============ REPORTING PAGE ============

async function loadAuditLog() {
    try {
        const logs = await api("/audit-logs?limit=100");
        const html = logs.map(l => `
            <tr>
                <td>${formatDateTime(l.created_at)}</td>
                <td><strong>${l.actor_username || "—"}</strong></td>
                <td><span class="badge badge-info">${l.action || "—"}</span></td>
                <td>${l.entity_type || "—"}</td>
                <td>${l.details ? l.details.substring(0, 50) + "..." : "—"}</td>
            </tr>
        `).join("");
        setTableRows(["audit-log-tbody"], html, 5, "Noch keine Einträge vorhanden");
    } catch (error) {
        showToast("Audit-Log konnte nicht geladen werden.", "error");
    }
}

async function editTeamModal(id) {
    if (!hasPermission("teams.write")) {
        showToast("Für das Bearbeiten von Teams fehlt die Berechtigung.", "warning");
        return;
    }
    const form = document.getElementById("create-team-form");
    if (!form) return;
    let team = teamsPageState.teams.find((entry) => Number(entry.id) === Number(id));
    if (!team) {
        const teams = await api("/teams");
        teamsPageState.teams = Array.isArray(teams) ? teams : [];
        team = teamsPageState.teams.find((entry) => Number(entry.id) === Number(id));
    }
    if (!team) {
        showToast("Team nicht gefunden.", "error");
        return;
    }
    teamsPageState.editingTeamId = team.id;
    form.elements.name.value = team.name || "";
    form.elements.category.value = team.category || "";
    form.elements.nation.value = team.nation || "";
    await loadTeamManagerOptions(team.manager_user_id ? String(team.manager_user_id) : "", team.id);
    form.elements.managerUserId.value = team.manager_user_id ? String(team.manager_user_id) : "";
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) submitButton.textContent = "Team aktualisieren";
    document.getElementById("team-cancel-edit")?.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function editEventModal(id) {
    if (!hasPermission("events.write")) {
        showToast("Für das Bearbeiten von Events fehlt die Berechtigung.", "warning");
        return;
    }
    const form = document.getElementById("create-event-form");
    if (!form) return;
    const events = await api("/events");
    const eventEntry = (Array.isArray(events) ? events : []).find((entry) => Number(entry.id) === Number(id));
    if (!eventEntry) {
        showToast("Event nicht gefunden.", "error");
        return;
    }
    const hiddenField = form.elements.namedItem("event_id");
    if (hiddenField) hiddenField.value = String(eventEntry.id);
    form.elements.name.value = eventEntry.name || "";
    form.elements.location.value = eventEntry.location || "";
    form.elements.date.value = eventEntry.event_date ? String(eventEntry.event_date).slice(0, 10) : "";
    form.elements.season_id.value = eventEntry.season_id ? String(eventEntry.season_id) : "";
    const formatNode = form.querySelector(`input[name="format"][value="${eventEntry.event_type || ""}"]`);
    if (formatNode) formatNode.checked = true;
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) submitButton.textContent = "Event aktualisieren";
    document.getElementById("event-cancel-edit")?.classList.remove("hidden");
    if (typeof window.renderEventPreview === "function") window.renderEventPreview();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function editTransferModal(id) {
    if (!hasPermission("transfers.write")) {
        showToast("Für das Bearbeiten von Transfers fehlt die Berechtigung.", "warning");
        return;
    }
    const form = document.getElementById("create-transfer-form");
    if (!form) return;
    const transfers = await api("/transfers");
    const transfer = (Array.isArray(transfers) ? transfers : []).find((entry) => Number(entry.id) === Number(id));
    if (!transfer) {
        showToast("Transfer nicht gefunden.", "error");
        return;
    }
    const hiddenField = form.elements.namedItem("transfer_id");
    if (hiddenField) hiddenField.value = String(transfer.id);
    const athleteField = form.elements.namedItem("athlete_name");
    if (athleteField) athleteField.value = transfer.athlete_name || "";
    form.elements.from_team_id.value = transfer.from_team_id ? String(transfer.from_team_id) : "";
    form.elements.to_team_id.value = transfer.to_team_id ? String(transfer.to_team_id) : "";
    const typeField = form.elements.namedItem("transfer_type");
    if (typeField) typeField.value = transfer.is_emergency ? "emergency" : "regular";
    const statusField = form.elements.namedItem("status");
    if (statusField) statusField.value = transfer.status || "requested";
    const lockUntilField = form.elements.namedItem("lock_until");
    if (lockUntilField) lockUntilField.value = transfer.lock_until ? String(transfer.lock_until).slice(0, 10) : "";
    form.elements.notes.value = transfer.notes || "";
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) submitButton.textContent = "Transfer aktualisieren";
    document.getElementById("transfer-cancel-edit")?.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function rerenderCurrentPageForTimezone() {
    if (isLoginPage()) return;
    const permissionState = getPagePermissionState();
    if (!permissionState.canRead) return;
    const page = pageName();
    if (page === "dashboard.html") {
        await loadDashboard();
    } else if (page === "users.html") {
        await setupUsersPage();
    } else if (page === "teams.html") {
        await setupTeamsPage();
    } else if (page === "events.html") {
        if (typeof window.refreshEventsPage === "function") {
            await window.refreshEventsPage();
        } else {
            await loadEvents();
        }
    } else if (page === "points.html") {
        if (typeof window.refreshPointsPage === "function") {
            await window.refreshPointsPage();
        } else {
            await loadPointsRules();
        }
    } else if (page === "transfers.html") {
        await loadTransfers();
    } else if (page === "reporting.html") {
        await loadAuditLog();
    } else if (page === "operations.html") {
        if (typeof window.refreshOperationsPage === "function") {
            await window.refreshOperationsPage();
        }
    } else if (isDomainWorkspacePage(page)) {
        if (typeof window.refreshDomainWorkspacePage === "function") {
            await window.refreshDomainWorkspacePage();
        }
    }
}

window.addEventListener("msc:timezone-changed", () => {
    rerenderCurrentPageForTimezone().catch(() => {});
});

// ============ INIT ============

document.addEventListener("DOMContentLoaded", async () => {
    wireTabs();
    if (isLoginPage()) {
        await setupLoginPage();
    } else {
        const user = await requireAuth();
        if (user) {
            wireLogout();
            ensureDomainNavLinks();
            applyNavPermissionVisibility();
            activateNav();
            setupCommandPalette();
            const permissionState = getPagePermissionState();
            if (!permissionState.canRead) {
                renderNoAccessPage();
                return;
            }
            applyPageReadOnlyExperience();
            connectLiveSync();
            
            const page = pageName();
            if (page === "dashboard.html") {
                await loadDashboard();
            } else if (page === "users.html") {
                await setupUsersPage();
            } else if (page === "teams.html") {
                await setupTeamsPage();
            } else if (page === "events.html") {
                if (typeof window.refreshEventsPage === "function") {
                    await window.refreshEventsPage();
                } else {
                    await loadEvents();
                }
            } else if (page === "points.html") {
                await loadPointsRules();
            } else if (page === "transfers.html") {
                await loadTransfers();
            } else if (page === "reporting.html") {
                await loadAuditLog();
            } else if (page === "operations.html") {
                if (typeof window.refreshOperationsPage === "function") {
                    await window.refreshOperationsPage();
                }
            } else if (isDomainWorkspacePage(page)) {
                if (typeof window.refreshDomainWorkspacePage === "function") {
                    await window.refreshDomainWorkspacePage();
                }
            }
        }
    }
});
