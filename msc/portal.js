/* ========================================
   MSC Portal - Modern UI Library
   ======================================== */

const AUTH_KEY = "msc_portal_auth";
const TOAST_TIMEOUT = 4000;

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
        min-width: 300px;
        z-index: 9999;
        animation: slideInUp 0.3s ease;
    `;
    
    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️"
    };
    
    toast.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center;">
            <span>${icons[type]}</span>
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

function statusBadge(status) {
    const colors = {
        active: "success",
        inactive: "danger",
        pending: "warning",
        in_prüfung: "info",
        gültig: "success",
        abgelaufen: "danger"
    };
    const icons = {
        active: "✅",
        inactive: "🔒",
        pending: "⏳",
        in_prüfung: "🔄",
        gültig: "✅",
        abgelaufen: "❌"
    };
    const color = colors[status?.toLowerCase()] || "info";
    const icon = icons[status?.toLowerCase()] || "•";
    return `<span class="badge badge-${color}">${icon} ${status}</span>`;
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
            showToast("Willkommen! 🎉", "success", 1500);
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
            showToast("Admin erstellt! Willkommen 🎉", "success", 1500);
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
    document.getElementById("kpi-users").textContent = data.stats.users;
    document.getElementById("kpi-teams").textContent = data.stats.teams;
    document.getElementById("kpi-events").textContent = data.stats.events;
    document.getElementById("kpi-licenses").textContent = data.stats.pending_licenses;

    const licensesHtml = data.licenses.map(l => tableRow([
        `<strong>${l.person}</strong>`,
        l.team || "—",
        l.type || "—",
        statusBadge(l.status)
    ])).join("");
    document.getElementById("licenses-table").innerHTML = licensesHtml || "<tr><td colspan='4' style='text-align: center; color: #999;'>Keine offenen Lizenzanträge</td></tr>";

    const eventsHtml = data.events.map(e => tableRow([
        `<strong>${e.name}</strong>`,
        e.location || "—",
        e.date ? new Date(e.date).toLocaleDateString("de-DE") : "—",
        statusBadge(e.status)
    ])).join("");
    document.getElementById("events-table").innerHTML = eventsHtml || "<tr><td colspan='4' style='text-align: center; color: #999;'>Keine kommenden Events</td></tr>";

    const auditHtml = data.audit.slice(0, 10).map(a => tableRow([
        a.created_at ? new Date(a.created_at).toLocaleTimeString("de-DE") : "—",
        a.actor_username || "—",
        a.action || "—",
        a.details || "—"
    ])).join("");
    document.getElementById("audit-table").innerHTML = auditHtml || "<tr><td colspan='4' style='text-align: center; color: #999;'>Kein Audit-Log vorhanden</td></tr>";
}

// ============ USERS ============

async function loadUsers() {
    const users = await api("/users");
    const container = document.getElementById("users-list");
    
    const html = users.map(u => `
        <tr>
            <td><strong>${u.name}</strong></td>
            <td><code>${u.username}</code></td>
            <td><span class="badge badge-primary">${u.role}</span></td>
            <td>${statusBadge(u.status)}</td>
            <td>${u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("de-DE") : "—"}</td>
            <td>
                <button class="btn btn-small btn-secondary" data-edit-user="${u.id}">✏️</button>
                <button class="btn btn-small btn-danger" data-delete-user="${u.id}">🗑️</button>
            </td>
        </tr>
    `).join("");
    
    container.innerHTML = html || `<tr><td colspan='6' style='text-align: center; color: #999;'>Keine Benutzer vorhanden</td></tr>`;
    
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
                <td>${t.athlete_count || 0}</td>
                <td><span class="badge" style="background: ${t.status === "active" ? "#27ae60" : "#95a5a6"};">${t.status || "pending"}</span></td>
                <td>
                    <button class="btn-small btn-secondary" onclick="editTeamModal(${t.id})">✏️ Bearbeiten</button>
                    <button class="btn-small btn-danger" onclick="confirmDelete('Team ${t.name}', () => deleteTeam(${t.id}))">🗑️ Löschen</button>
                </td>
            </tr>
        `).join("");
        document.getElementById("teams-list-tbody").innerHTML = html || "<tr><td colspan='5' style='text-align: center; color: #999;'>Keine Teams vorhanden</td></tr>";
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function deleteTeam(id) {
    try {
        await api(`/teams/${id}`, { method: "DELETE" });
        showToast("Team gelöscht ✅", "success");
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
                <td>${new Date(e.date).toLocaleDateString("de-DE")}</td>
                <td><span class="badge" style="background: ${e.status === "confirmed" ? "#3498db" : "#f39c12"};">${e.status || "pending"}</span></td>
                <td>
                    <button class="btn-small btn-secondary" onclick="editEventModal(${e.id})">✏️ Bearbeiten</button>
                    <button class="btn-small btn-danger" onclick="confirmDelete('Event ${e.name}', () => deleteEvent(${e.id}))">🗑️ Löschen</button>
                </td>
            </tr>
        `).join("");
        document.getElementById("events-list-tbody").innerHTML = html || "<tr><td colspan='6' style='text-align: center; color: #999;'>Keine Events vorhanden</td></tr>";
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function deleteEvent(id) {
    try {
        await api(`/events/${id}`, { method: "DELETE" });
        showToast("Event gelöscht ✅", "success");
        await loadEvents();
    } catch (error) {
        showToast(error.message, "error");
    }
}

// ============ POINTS PAGE ============

async function loadPointsRules() {
    try {
        const rules = await api("/points-rules");
        if (rules) {
            document.getElementById("world-cup-schema").value = rules.world_cup_schema || "top_30";
            document.getElementById("team-calc-method").value = rules.team_calc_method || "sum";
            document.querySelector("input[name='bonus_record']").checked = rules.bonus_record;
            document.querySelector("input[name='bonus_series']").checked = rules.bonus_series;
        }
    } catch (error) {
        console.error("Fehler beim Laden der Punkte-Regeln:", error);
    }
}

// ============ TRANSFERS PAGE ============

async function loadTransfers() {
    try {
        const transfers = await api("/transfers");
        const html = transfers.map(t => `
            <tr>
                <td><strong>${t.athlete_name || "—"}</strong></td>
                <td>${t.from_team || "—"} ➜ ${t.to_team || "—"}</td>
                <td><span class="badge" style="background: ${t.status === "approved" ? "#27ae60" : "#f39c12"};">${t.status || "pending"}</span></td>
                <td>${new Date(t.transfer_date).toLocaleDateString("de-DE")}</td>
                <td>
                    <button class="btn-small btn-secondary" onclick="editTransferModal(${t.id})">✏️ Details</button>
                </td>
            </tr>
        `).join("");
        document.getElementById("transfers-list-tbody").innerHTML = html || "<tr><td colspan='5' style='text-align: center; color: #999;'>Keine Transfers vorhanden</td></tr>";
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
                <td>${l.created_at ? new Date(l.created_at).toLocaleString("de-DE") : "—"}</td>
                <td><strong>${l.actor_username || "—"}</strong></td>
                <td><span class="badge" style="background: #3498db;">${l.action || "—"}</span></td>
                <td>${l.entity_type || "—"}</td>
                <td style="font-size: 12px; color: #999;">${l.details ? l.details.substring(0, 50) + "..." : "—"}</td>
            </tr>
        `).join("");
        const tbody = document.getElementById("audit-log-tbody");
        if (tbody) {
            tbody.innerHTML = html || "<tr><td colspan='5' style='text-align: center; color: #999;'>Keine Einträge vorhanden</td></tr>";
        }
    } catch (error) {
        console.error("Fehler beim Laden des Audit-Logs:", error);
    }
}

// ============ INIT ============

document.addEventListener("DOMContentLoaded", async () => {
    if (isLoginPage()) {
        await setupLoginPage();
    } else {
        const user = await requireAuth();
        if (user) {
            wireLogout();
            activateNav();
            
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
