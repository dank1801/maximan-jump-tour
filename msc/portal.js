/* ========================================
   MSC Portal - Modern UI Library
   ======================================== */

const AUTH_KEY = "msc_portal_auth";
const TOAST_TIMEOUT = 4000;
const LIVE_RECONNECT_DELAY_MS = 2000;
const LIVE_REFRESH_DEBOUNCE_MS = 700;
let liveSocket = null;
let liveRefreshTimer = null;

// ============ HELPERS ============

function pageName() {
    return (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
}

function isLoginPage() {
    return pageName() === "login.html";
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
    actions.forEach(action => {
        if (typeof action.handler === "function") {
            modal.querySelector(`[data-action="${action.id}"]`)?.addEventListener("click", () => {
                action.handler();
                modal.remove();
            });
        }
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
        try {
            if (page === "dashboard.html") {
                await loadDashboard();
            } else if (page === "users.html") {
                await loadUsers();
            } else if (page === "teams.html") {
                await loadTeams();
            } else if (page === "events.html") {
                await loadEvents();
            } else if (page === "points.html") {
                await loadPointsRules();
            } else if (page === "transfers.html") {
                await loadTransfers();
            } else if (page === "reporting.html") {
                await loadAuditLog();
            }
        } catch (error) {
            // Keep UI stable even if one refresh request fails.
        }
    }, LIVE_REFRESH_DEBOUNCE_MS);
}

function connectLiveSync() {
    const auth = loadAuth();
    if (!auth?.token || liveSocket) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}/ws?token=${encodeURIComponent(auth.token)}`;
    const socket = new WebSocket(url);
    liveSocket = socket;

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

    socket.addEventListener("close", () => {
        if (liveSocket === socket) {
            liveSocket = null;
            setTimeout(connectLiveSync, LIVE_RECONNECT_DELAY_MS);
        }
    });

    socket.addEventListener("error", () => {
        if (liveSocket === socket) {
            liveSocket = null;
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
    return true;
}

function statusBadge(status) {
    const colors = {
        active: "success",
        inactive: "danger",
        pending: "warning",
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
        e.event_date ? new Date(e.event_date).toLocaleDateString("de-DE") : "—",
        statusBadge(e.status)
    ])).join("");
    setTableRows(["events-table", "events-tbody"], eventsHtml, 4, "Keine kommenden Events");

    const auditHtml = data.recentAudit.slice(0, 10).map(a => tableRow([
        a.created_at ? new Date(a.created_at).toLocaleTimeString("de-DE") : "—",
        a.actor_username || "—",
        a.action || "—",
        a.entity_type || "—"
    ])).join("");
    setTableRows(["audit-table", "audit-tbody"], auditHtml, 4, "Noch keine Systemaktivitäten");
}

// ============ USERS ============

async function loadUsers() {
    const users = await api("/users");
    const container = findByIds(["users-list", "users-list-tbody"]);
    if (!container) return;
    
    const html = users.map(u => `
        <tr>
            <td><strong>${u.name}</strong></td>
            <td><code>${u.username}</code></td>
            <td><span class="badge badge-info">${u.role}</span></td>
            <td>${statusBadge(u.status)}</td>
            <td>${u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("de-DE") : "—"}</td>
            <td>
                <button class="btn btn-small btn-secondary" data-edit-user="${u.id}">Bearbeiten</button>
                <button class="btn btn-small btn-danger" data-delete-user="${u.id}">Löschen</button>
            </td>
        </tr>
    `).join("");
    
    container.innerHTML = html || `<tr><td colspan='6' class="table-empty">Keine Benutzer vorhanden</td></tr>`;
    
    // Wire up edit handlers
    document.querySelectorAll("[data-edit-user]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const userId = btn.dataset.editUser;
            const user = users.find(u => u.id == userId);
            showEditUserModal(user);
        });
    });
    
    // Wire up delete handlers
    document.querySelectorAll("[data-delete-user]").forEach(btn => {
        btn.addEventListener("click", () => {
            const userId = btn.dataset.deleteUser;
            const user = users.find(u => u.id == userId);
            confirmDelete(user.name, async () => {
                try {
                    await api(`/users/${userId}`, { method: "DELETE" });
                    showToast(`${user.name} wurde gelöscht`, "success");
                    loadUsers();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
    });
}

async function showEditUserModal(user) {
    const content = `
        <form id="edit-user-form">
            <div class="form-group">
                <label>Benutzerkennung</label>
                <input type="text" value="${user.username}" disabled />
            </div>
            <div class="form-group">
                <label>Name</label>
                <input type="text" name="name" value="${user.name}" required />
            </div>
            <div class="form-group">
                <label>E-Mail</label>
                <input type="email" name="email" value="${user.email}" required />
            </div>
            <div class="form-group">
                <label>Rolle</label>
                <select name="role" required>
                    <option value="MSC Admin" ${user.role === "MSC Admin" ? "selected" : ""}>MSC Admin</option>
                    <option value="Teammanager" ${user.role === "Teammanager" ? "selected" : ""}>Teammanager</option>
                    <option value="Jury" ${user.role === "Jury" ? "selected" : ""}>Jury / Wettkampfleitung</option>
                    <option value="Lizenzstelle" ${user.role === "Lizenzstelle" ? "selected" : ""}>Lizenzstelle</option>
                    <option value="Reporter" ${user.role === "Reporter" ? "selected" : ""}>Reporter / Media</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" required>
                    <option value="active" ${user.status === "active" ? "selected" : ""}>Aktiv</option>
                    <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>Inaktiv</option>
                </select>
            </div>
        </form>
    `;
    
    showModal(`Benutzer bearbeiten: ${user.name}`, content, [
        { id: "cancel", label: "Abbrechen", primary: false, handler: () => {} },
        { id: "save", label: "Speichern", primary: true, handler: async () => {
            const form = document.getElementById("edit-user-form");
            const data = getFormData(form);
            try {
                await api(`/users/${user.id}`, {
                    method: "PUT",
                    body: JSON.stringify(data)
                });
                showToast(`${user.name} wurde aktualisiert`, "success");
                loadUsers();
            } catch (error) {
                showToast(error.message, "error");
            }
        }}
    ]);
}

// ============ TEAMS PAGE ============

async function loadTeams() {
    try {
        const teams = await api("/teams");
        const html = teams.map(t => `
            <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.category || "—"}</td>
                <td>${t.nation || "—"}</td>
                <td>${t.manager_username || "—"}</td>
                <td>${statusBadge(t.status || "pending")}</td>
                <td>
                    <button class="btn-small btn-secondary" onclick="editTeamModal(${t.id})">Bearbeiten</button>
                    <button class="btn-small btn-danger" onclick="confirmDelete('Team ${t.name}', () => deleteTeam(${t.id}))">Löschen</button>
                </td>
            </tr>
        `).join("");
        setTableRows(["teams-list-tbody", "teams-list"], html, 6, "Keine Teams vorhanden");
    } catch (error) {
        showToast("Teams konnten nicht geladen werden.", "error");
    }
}

async function deleteTeam(id) {
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
        const events = await api("/events");
        const html = events.map(e => `
            <tr>
                <td><strong>${e.name}</strong></td>
                <td>${e.event_type || "—"}</td>
                <td>${e.location || "—"}</td>
                <td>${e.event_date ? new Date(e.event_date).toLocaleDateString("de-DE") : "—"}</td>
                <td>${statusBadge(e.status || "pending")}</td>
                <td>
                    <button class="btn-small btn-secondary" onclick="editEventModal(${e.id})">Bearbeiten</button>
                    <button class="btn-small btn-danger" onclick="confirmDelete('Event ${e.name}', () => deleteEvent(${e.id}))">Löschen</button>
                </td>
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
        const transfers = await api("/transfers");
        const html = transfers.map(t => `
            <tr>
                <td><strong>${t.athlete_name || "—"}</strong></td>
                <td>${t.from_team_name || "—"}</td>
                <td>${t.to_team_name || "—"}</td>
                <td>${t.is_emergency ? "Notfall" : "Normal"}</td>
                <td>${statusBadge(t.status || "requested")}</td>
                <td>${t.lock_until ? new Date(t.lock_until).toLocaleDateString("de-DE") : "—"}</td>
                <td>
                    <button class="btn-small btn-secondary" onclick="editTransferModal(${t.id})">Details</button>
                </td>
            </tr>
        `).join("");
        setTableRows(["transfers-list-tbody", "transfers-list"], html, 7, "Noch keine Transfers vorhanden");
    } catch (error) {
        showToast("Transfers konnten nicht geladen werden.", "error");
    }
}

// ============ REPORTING PAGE ============

async function loadAuditLog() {
    try {
        const logs = await api("/audit-logs?limit=100");
        const html = logs.map(l => `
            <tr>
                <td>${l.created_at ? new Date(l.created_at).toLocaleString("de-DE") : "—"}</td>
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

function editTeamModal() {
    showToast("Bearbeiten ist in Kürze verfügbar.", "info");
}

function editEventModal() {
    showToast("Bearbeiten ist in Kürze verfügbar.", "info");
}

function editTransferModal() {
    showToast("Detailansicht ist in Kürze verfügbar.", "info");
}

// ============ INIT ============

document.addEventListener("DOMContentLoaded", async () => {
    wireTabs();
    if (isLoginPage()) {
        await setupLoginPage();
    } else {
        const user = await requireAuth();
        if (user) {
            wireLogout();
            activateNav();
            connectLiveSync();
            
            const page = pageName();
            if (page === "dashboard.html") {
                await loadDashboard();
            } else if (page === "users.html") {
                await loadUsers();
            } else if (page === "teams.html") {
                await loadTeams();
            } else if (page === "events.html") {
                await loadEvents();
            } else if (page === "points.html") {
                await loadPointsRules();
            } else if (page === "transfers.html") {
                await loadTransfers();
            } else if (page === "reporting.html") {
                await loadAuditLog();
            }
        }
    }
});
