const AUTH_KEY = "msc_portal_auth";

function pageName() {
    return (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
}

function isLoginPage() {
    return pageName() === "login.html";
}

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

function showMessage(message, type = "info") {
    const node = document.getElementById("page-message") || document.getElementById("login-message");
    if (!node) return;
    node.classList.remove("hidden");
    node.textContent = message;
    node.style.color = type === "error" ? "#ff7a7a" : "#b9c4ec";
}

function clearMessage() {
    const node = document.getElementById("page-message") || document.getElementById("login-message");
    if (!node) return;
    node.classList.add("hidden");
    node.textContent = "";
}

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
        window.location.href = "login.html";
    });
}

function tableRow(cells) {
    return `<tr>${cells.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`;
}

function button(label, attrs = "") {
    return `<button class="btn-small btn-danger" ${attrs}>${label}</button>`;
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

async function initLoginPage() {
    const existing = loadAuth();
    if (existing?.token) {
        try {
            await api("/auth/me");
            window.location.href = "dashboard.html";
            return;
        } catch (error) {
            clearAuth();
        }
    }

    const bootstrapStatus = await api("/auth/bootstrap-status");
    const bootstrapSection = document.getElementById("bootstrap-section");
    if (bootstrapStatus.requiresBootstrap && bootstrapSection) {
        bootstrapSection.classList.remove("hidden");
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
            window.location.href = "dashboard.html";
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
            window.location.href = "dashboard.html";
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

function bindDeleteHandler(selector, callback) {
    document.querySelectorAll(selector).forEach((node) => {
        node.addEventListener("click", callback);
    });
}

async function loadDashboard() {
    const data = await api("/dashboard");
    document.getElementById("kpi-users").textContent = data.stats.users;
    document.getElementById("kpi-teams").textContent = data.stats.teams;
    document.getElementById("kpi-events").textContent = data.stats.events;
    document.getElementById("kpi-transfers").textContent = data.stats.transfers;

    const eventsTable = document.getElementById("dashboard-events-table");
    eventsTable.innerHTML = data.nextEvents.length
        ? data.nextEvents.map((row) => tableRow([row.name, row.location || "—", row.event_date || "—", row.status || "—"])).join("")
        : tableRow(['<span class="empty-state">Keine Events</span>', "", "", ""]);

    const licensesTable = document.getElementById("dashboard-licenses-table");
    licensesTable.innerHTML = data.pendingLicenses.length
        ? data.pendingLicenses.map((row) => tableRow([row.name, row.team_name || "—", row.license_type || "—", row.license_status || "—"])).join("")
        : tableRow(['<span class="empty-state">Keine Lizenzfälle</span>', "", "", ""]);

    const auditTable = document.getElementById("dashboard-audit-table");
    auditTable.innerHTML = data.recentAudit.length
        ? data.recentAudit.map((row) => tableRow([row.created_at, row.actor_username, row.action, `${row.entity_type} ${row.entity_id || ""}`])).join("")
        : tableRow(['<span class="empty-state">Keine Audit-Einträge</span>', "", "", ""]);
}

async function loadUsers() {
    const rows = await api("/users");
    const table = document.getElementById("users-table");
    table.innerHTML = rows.length
        ? rows.map((row) => tableRow([
            row.id,
            row.username,
            row.name,
            row.email,
            row.role,
            row.status,
            row.last_login_at || "—",
            row.status === "active" ? button("Deaktivieren", `data-delete-user="${row.id}"`) : "—"
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Benutzer vorhanden</span>', "", "", "", "", "", "", ""]);

    bindDeleteHandler("[data-delete-user]", async (event) => {
        const id = event.currentTarget.getAttribute("data-delete-user");
        await api(`/users/${id}`, { method: "DELETE" });
        await loadUsers();
    });
}

async function initUsersPage() {
    await loadUsers();
    const form = document.getElementById("user-form");
    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();
        try {
            await api("/users", {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
            });
            form.reset();
            await loadUsers();
            showMessage("Benutzer gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function loadTeams() {
    const [teams, members] = await Promise.all([
        api("/teams"),
        api("/teams").then(async (teamRows) => {
            const allMembers = [];
            for (const team of teamRows) {
                const entries = await api(`/teams/${team.id}/members`);
                allMembers.push(...entries);
            }
            return allMembers;
        })
    ]);

    const teamsTable = document.getElementById("teams-table");
    teamsTable.innerHTML = teams.length
        ? teams.map((row) => tableRow([
            row.id,
            row.name,
            row.nation || "—",
            row.category || "—",
            row.manager_username || "—",
            row.status,
            row.status === "active" ? button("Deaktivieren", `data-delete-team="${row.id}"`) : "—"
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Teams vorhanden</span>', "", "", "", "", "", ""]);

    const membersTable = document.getElementById("team-members-table");
    membersTable.innerHTML = members.length
        ? members.map((row) => tableRow([
            row.id,
            row.team_id,
            row.name,
            row.member_role,
            row.license_type || "—",
            row.license_valid_until || "—",
            row.license_status || "—",
            button("Löschen", `data-delete-member="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Mitglieder vorhanden</span>', "", "", "", "", "", "", ""]);

    bindDeleteHandler("[data-delete-team]", async (event) => {
        await api(`/teams/${event.currentTarget.getAttribute("data-delete-team")}`, { method: "DELETE" });
        await loadTeams();
    });
    bindDeleteHandler("[data-delete-member]", async (event) => {
        await api(`/team-members/${event.currentTarget.getAttribute("data-delete-member")}`, { method: "DELETE" });
        await loadTeams();
    });
}

async function initTeamsPage() {
    await loadTeams();
    const teamForm = document.getElementById("team-form");
    const memberForm = document.getElementById("team-member-form");

    teamForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();
        const payload = Object.fromEntries(new FormData(teamForm).entries());
        if (!payload.managerUserId) delete payload.managerUserId;
        try {
            await api("/teams", { method: "POST", body: JSON.stringify(payload) });
            teamForm.reset();
            await loadTeams();
            showMessage("Team gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    memberForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();
        const payload = Object.fromEntries(new FormData(memberForm).entries());
        const teamId = payload.teamId;
        delete payload.teamId;
        try {
            await api(`/teams/${teamId}/members`, { method: "POST", body: JSON.stringify(payload) });
            memberForm.reset();
            await loadTeams();
            showMessage("Mitglied gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function loadEvents() {
    const [seasons, events, jury] = await Promise.all([api("/seasons"), api("/events"), api("/jury-decisions")]);
    const seasonsTable = document.getElementById("seasons-table");
    const eventsTable = document.getElementById("events-table");
    const juryTable = document.getElementById("jury-table");

    seasonsTable.innerHTML = seasons.length
        ? seasons.map((row) => tableRow([
            row.id, row.name, row.start_date || "—", row.end_date || "—", row.status || "—",
            button("Löschen", `data-delete-season="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Saisons</span>', "", "", "", "", ""]);

    eventsTable.innerHTML = events.length
        ? events.map((row) => tableRow([
            row.id, row.name, row.location || "—", row.event_date || "—", row.season_name || "—", row.status || "—",
            button("Löschen", `data-delete-event="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Events</span>', "", "", "", "", "", ""]);

    juryTable.innerHTML = jury.length
        ? jury.map((row) => tableRow([
            row.id, row.event_name || "—", row.decision_type, row.notes, row.created_at,
            button("Löschen", `data-delete-jury="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Jury-Einträge</span>', "", "", "", "", ""]);

    bindDeleteHandler("[data-delete-season]", async (event) => {
        await api(`/seasons/${event.currentTarget.getAttribute("data-delete-season")}`, { method: "DELETE" });
        await loadEvents();
    });
    bindDeleteHandler("[data-delete-event]", async (event) => {
        await api(`/events/${event.currentTarget.getAttribute("data-delete-event")}`, { method: "DELETE" });
        await loadEvents();
    });
    bindDeleteHandler("[data-delete-jury]", async (event) => {
        await api(`/jury-decisions/${event.currentTarget.getAttribute("data-delete-jury")}`, { method: "DELETE" });
        await loadEvents();
    });
}

async function initEventsPage() {
    await loadEvents();
    const seasonForm = document.getElementById("season-form");
    const eventForm = document.getElementById("event-form");
    const juryForm = document.getElementById("jury-form");

    seasonForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await api("/seasons", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(seasonForm).entries())) });
            seasonForm.reset();
            await loadEvents();
            showMessage("Saison gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    eventForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const payload = Object.fromEntries(new FormData(eventForm).entries());
            if (!payload.seasonId) delete payload.seasonId;
            await api("/events", { method: "POST", body: JSON.stringify(payload) });
            eventForm.reset();
            await loadEvents();
            showMessage("Event gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    juryForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const payload = Object.fromEntries(new FormData(juryForm).entries());
            if (!payload.eventId) delete payload.eventId;
            await api("/jury-decisions", { method: "POST", body: JSON.stringify(payload) });
            juryForm.reset();
            await loadEvents();
            showMessage("Jury-Entscheidung gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function loadPoints() {
    const [rules, scores] = await Promise.all([api("/point-rules"), api("/event-scores")]);
    const rulesTable = document.getElementById("point-rules-table");
    const scoresTable = document.getElementById("event-scores-table");

    rulesTable.innerHTML = rules.length
        ? rules.map((row) => tableRow([
            row.id, row.name, row.rule_type, row.active ? "Ja" : "Nein", row.config_json,
            button("Löschen", `data-delete-rule="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Punktregeln</span>', "", "", "", "", ""]);

    scoresTable.innerHTML = scores.length
        ? scores.map((row) => tableRow([
            row.id, row.event_name || row.event_id || "—", row.entry_name, row.rank_position || "—",
            row.points, row.bonus_points, row.notes || "—",
            button("Löschen", `data-delete-score="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Eventwertungen</span>', "", "", "", "", "", "", ""]);

    bindDeleteHandler("[data-delete-rule]", async (event) => {
        await api(`/point-rules/${event.currentTarget.getAttribute("data-delete-rule")}`, { method: "DELETE" });
        await loadPoints();
    });
    bindDeleteHandler("[data-delete-score]", async (event) => {
        await api(`/event-scores/${event.currentTarget.getAttribute("data-delete-score")}`, { method: "DELETE" });
        await loadPoints();
    });
}

async function initPointsPage() {
    await loadPoints();
    const ruleForm = document.getElementById("point-rule-form");
    const scoreForm = document.getElementById("event-score-form");

    ruleForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(ruleForm).entries());
        let parsedConfig = {};
        try {
            parsedConfig = JSON.parse(payload.configJson || "{}");
        } catch (error) {
            showMessage("Konfiguration muss valides JSON sein.", "error");
            return;
        }
        payload.config = parsedConfig;
        payload.active = payload.active === "1";
        delete payload.configJson;
        try {
            await api("/point-rules", { method: "POST", body: JSON.stringify(payload) });
            ruleForm.reset();
            await loadPoints();
            showMessage("Punktregel gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    scoreForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(scoreForm).entries());
        if (!payload.eventId) delete payload.eventId;
        try {
            await api("/event-scores", { method: "POST", body: JSON.stringify(payload) });
            scoreForm.reset();
            await loadPoints();
            showMessage("Eventwertung gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function loadTransfers() {
    const [transfers, contracts] = await Promise.all([api("/transfers"), api("/contracts")]);
    const transferTable = document.getElementById("transfers-table");
    const contractsTable = document.getElementById("contracts-table");

    transferTable.innerHTML = transfers.length
        ? transfers.map((row) => tableRow([
            row.id, row.athlete_name, row.from_team_name || "—", row.to_team_name || "—", row.status,
            row.lock_until || "—", row.is_emergency ? "Ja" : "Nein",
            button("Löschen", `data-delete-transfer="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Transfers</span>', "", "", "", "", "", "", ""]);

    contractsTable.innerHTML = contracts.length
        ? contracts.map((row) => tableRow([
            row.id, row.file_name, `${row.entity_type} ${row.entity_id || ""}`, row.status, row.expires_at || "—",
            button("Löschen", `data-delete-contract="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Dokumente</span>', "", "", "", "", ""]);

    bindDeleteHandler("[data-delete-transfer]", async (event) => {
        await api(`/transfers/${event.currentTarget.getAttribute("data-delete-transfer")}`, { method: "DELETE" });
        await loadTransfers();
    });
    bindDeleteHandler("[data-delete-contract]", async (event) => {
        await api(`/contracts/${event.currentTarget.getAttribute("data-delete-contract")}`, { method: "DELETE" });
        await loadTransfers();
    });
}

async function initTransfersPage() {
    await loadTransfers();
    const transferForm = document.getElementById("transfer-form");
    const contractForm = document.getElementById("contract-form");

    transferForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(transferForm).entries());
        payload.isEmergency = payload.isEmergency === "1";
        if (!payload.fromTeamId) delete payload.fromTeamId;
        if (!payload.toTeamId) delete payload.toTeamId;
        try {
            await api("/transfers", { method: "POST", body: JSON.stringify(payload) });
            transferForm.reset();
            await loadTransfers();
            showMessage("Transfer gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    contractForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(contractForm).entries());
        if (!payload.entityId) delete payload.entityId;
        try {
            await api("/contracts", { method: "POST", body: JSON.stringify(payload) });
            contractForm.reset();
            await loadTransfers();
            showMessage("Dokument gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function loadReporting() {
    const [scores, publications, audit] = await Promise.all([
        api("/event-scores"),
        api("/publications"),
        api("/audit-logs?limit=50")
    ]);
    const liveTable = document.getElementById("reporting-live-table");
    const publicationsTable = document.getElementById("publications-table");
    const auditTable = document.getElementById("reporting-audit-table");

    liveTable.innerHTML = scores.length
        ? scores.map((row) => tableRow([row.id, row.event_name || row.event_id || "—", row.entry_name, row.rank_position || "—", row.points, row.bonus_points])).join("")
        : tableRow(['<span class="empty-state">Keine Live-Ergebnisse</span>', "", "", "", "", ""]);

    publicationsTable.innerHTML = publications.length
        ? publications.map((row) => tableRow([
            row.id, row.title, row.format, row.status, row.published_at || "—",
            button("Löschen", `data-delete-publication="${row.id}"`)
        ])).join("")
        : tableRow(['<span class="empty-state">Keine Veröffentlichungen</span>', "", "", "", "", ""]);

    auditTable.innerHTML = audit.length
        ? audit.map((row) => tableRow([row.created_at, row.actor_username, row.action, `${row.entity_type} ${row.entity_id || ""}`, row.details || "—"])).join("")
        : tableRow(['<span class="empty-state">Keine Audit-Logs</span>', "", "", "", ""]);

    bindDeleteHandler("[data-delete-publication]", async (event) => {
        await api(`/publications/${event.currentTarget.getAttribute("data-delete-publication")}`, { method: "DELETE" });
        await loadReporting();
    });
}

async function initReportingPage() {
    await loadReporting();
    const publicationForm = document.getElementById("publication-form");
    publicationForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(publicationForm).entries());
        try {
            await api("/publications", { method: "POST", body: JSON.stringify(payload) });
            publicationForm.reset();
            await loadReporting();
            showMessage("Veröffentlichung gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function loadSettings() {
    const rows = await api("/settings");
    const map = Object.fromEntries(rows.map((entry) => [entry.key, entry.value]));
    const settingsForm = document.getElementById("settings-form");
    const licensesTable = document.getElementById("license-categories-table");
    const config = map.systemConfig || {};
    const security = map.securityConfig || {};
    const categories = Array.isArray(map.licenseCategories) ? map.licenseCategories : [];

    if (settingsForm) {
        settingsForm.timezone.value = config.timezone || "";
        settingsForm.language.value = config.language || "";
        settingsForm.defaultSeason.value = config.defaultSeason || "";
        settingsForm.defaultPointsSchema.value = config.defaultPointsSchema || "";
        settingsForm.passwordMinLength.value = security.passwordMinLength || "";
        settingsForm.sessionTimeoutMinutes.value = security.sessionTimeoutMinutes || "";
        settingsForm.twoFactorMode.value = security.twoFactorMode || "";
    }

    licensesTable.innerHTML = categories.length
        ? categories.map((row) => tableRow([row.code, row.description, row.requirements])).join("")
        : tableRow(['<span class="empty-state">Keine Lizenzkategorien</span>', "", ""]);
}

async function initSettingsPage() {
    await loadSettings();
    const settingsForm = document.getElementById("settings-form");
    const categoryForm = document.getElementById("license-category-form");

    settingsForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(settingsForm).entries());
        const systemConfig = {
            timezone: payload.timezone || "",
            language: payload.language || "",
            defaultSeason: payload.defaultSeason || "",
            defaultPointsSchema: payload.defaultPointsSchema || ""
        };
        const securityConfig = {
            passwordMinLength: payload.passwordMinLength ? Number(payload.passwordMinLength) : null,
            sessionTimeoutMinutes: payload.sessionTimeoutMinutes ? Number(payload.sessionTimeoutMinutes) : null,
            twoFactorMode: payload.twoFactorMode || ""
        };
        try {
            await api("/settings/systemConfig", { method: "PUT", body: JSON.stringify({ value: systemConfig }) });
            await api("/settings/securityConfig", { method: "PUT", body: JSON.stringify({ value: securityConfig }) });
            await loadSettings();
            showMessage("Settings gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    categoryForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const existing = await api("/settings");
            const map = Object.fromEntries(existing.map((entry) => [entry.key, entry.value]));
            const current = Array.isArray(map.licenseCategories) ? map.licenseCategories : [];
            const payload = Object.fromEntries(new FormData(categoryForm).entries());
            const next = [...current, payload];
            await api("/settings/licenseCategories", { method: "PUT", body: JSON.stringify({ value: next }) });
            categoryForm.reset();
            await loadSettings();
            showMessage("Lizenzkategorie gespeichert.");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

async function initProtectedPage() {
    const user = await requireAuth();
    if (!user) return;
    activateNav();
    wireLogout();
    const current = pageName();
    if (current === "dashboard.html") await loadDashboard();
    if (current === "users.html") await initUsersPage();
    if (current === "teams.html") await initTeamsPage();
    if (current === "events.html") await initEventsPage();
    if (current === "points.html") await initPointsPage();
    if (current === "transfers.html") await initTransfersPage();
    if (current === "reporting.html") await initReportingPage();
    if (current === "settings.html") await initSettingsPage();
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (isLoginPage()) {
            await initLoginPage();
            return;
        }
        await initProtectedPage();
    } catch (error) {
        showMessage(error.message, "error");
    }
});
