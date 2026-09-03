/* ========================================
   MSC Portal - Dedicated Domain Workspaces
   ======================================== */

const DOMAIN_EXPERIENCE_PRESETS = {
    msc_admin: {
        subtitle: "Governance-Cockpit für Regelwerk, Jury, Disziplinar und Finanzen.",
        quickActions: [
            { label: "Regelupdate starten", capabilityKey: "rule_versioning", status: "planned", severity: "medium", dueHours: 48, title: "Regelversion anpassen" },
            { label: "Jury-Clearance anlegen", capabilityKey: "jury_management", status: "in_progress", severity: "high", dueHours: 12, title: "Jury Intervention vorbereiten" },
            { label: "Disziplinarfall eröffnen", capabilityKey: "discipline_cases", status: "in_progress", severity: "high", dueHours: 24, title: "Disziplinarprüfung" }
        ],
        playbooks: [
            { label: "Saison-Freigabe Playbook", capabilityKey: "season_planning", title: "Saisonplan Freigabe", status: "in_progress", severity: "high", workflowKey: "event_setup", dueHours: 24, note: "Freigabezyklus MSC/LOC/Jury starten" },
            { label: "Jury Incident Playbook", capabilityKey: "jury_management", title: "Jury Incident", status: "blocked", severity: "critical", workflowKey: "jury_intervention", dueHours: 3, note: "Eskalationskette mit Audit aktivieren" }
        ],
        relatedLinks: [
            { href: "points.html", label: "Punkte & Wertungen" },
            { href: "events.html", label: "Wettkämpfe" },
            { href: "reporting.html", label: "Reporting & Audit" }
        ],
        intelligence: [
            { title: "Freigaben in Bearbeitung", kind: "status_count", status: "in_progress", tone: "warning" },
            { title: "Kritische Risiken", kind: "severity_count", severity: "critical", tone: "danger" },
            { title: "Überfällige Governance-Tasks", kind: "overdue_count", tone: "danger" }
        ]
    },
    loc: {
        subtitle: "Live Operations für Schanze, Wind, Gate und Notfallprotokolle.",
        quickActions: [
            { label: "Schanze auf Live", capabilityKey: "hill_clearance", status: "live", severity: "medium", dueHours: 2, title: "Schanzenfreigabe aktivieren" },
            { label: "Windwarnung erfassen", capabilityKey: "wind_monitoring", status: "blocked", severity: "critical", dueHours: 1, title: "Wind-Alarm" },
            { label: "Notfallmodus vorbereiten", capabilityKey: "emergency_protocols", status: "in_progress", severity: "critical", dueHours: 1, title: "Emergency Readiness" }
        ],
        playbooks: [
            { label: "Emergency Activation", capabilityKey: "emergency_protocols", title: "LOC Emergency Activation", status: "blocked", severity: "critical", workflowKey: "loc_emergency_activation", dueHours: 1, note: "Gate freeze + Alarmkette" },
            { label: "Gate Recalibration", capabilityKey: "gate_panel", title: "Gate Recalibration", status: "in_progress", severity: "high", workflowKey: "jury_intervention", dueHours: 2, note: "Neuparametrisierung mit Jury-Sync" }
        ],
        relatedLinks: [
            { href: "operations.html", label: "Operations Hub" },
            { href: "events.html", label: "Eventsteuerung" },
            { href: "dashboard.html", label: "Mission Control" }
        ],
        intelligence: [
            { title: "Live-Module", kind: "status_count", status: "live", tone: "success" },
            { title: "Wind/Gate Blocker", kind: "blocked_capabilities", capabilityKeys: ["wind_monitoring", "gate_panel"], tone: "danger" },
            { title: "Sicherheitskritisch", kind: "severity_count", severity: "critical", tone: "danger" }
        ]
    },
    team_portal: {
        subtitle: "Team Operations Suite für Registrierung, Material, Transfers und Medical.",
        quickActions: [
            { label: "Registrierungscheck", capabilityKey: "registration", status: "in_progress", severity: "medium", dueHours: 24, title: "Team Registrierung prüfen" },
            { label: "Materialcheck starten", capabilityKey: "material_checks", status: "planned", severity: "medium", dueHours: 18, title: "Materialprüfung vorbereiten" },
            { label: "Medical Upload review", capabilityKey: "medical_uploads", status: "in_progress", severity: "high", dueHours: 8, title: "Medical Upload verifizieren" }
        ],
        playbooks: [
            { label: "Registration Review", capabilityKey: "registration", title: "Registrierung komplett prüfen", status: "in_progress", severity: "high", workflowKey: "team_registration_review", dueHours: 12, note: "Regeln/Lizenzen/Material/Medical prüfen" },
            { label: "Medical Fast-Track", capabilityKey: "medical_uploads", title: "Medical Fast-Track", status: "in_progress", severity: "high", workflowKey: "medical_flow", dueHours: 4, note: "Schnelle Freigabe für Eventstart" }
        ],
        relatedLinks: [
            { href: "teams.html", label: "Teams & Lizenzen" },
            { href: "transfers.html", label: "Transfers & Verträge" },
            { href: "events.html", label: "Events" }
        ],
        intelligence: [
            { title: "Offene Registrierungen", kind: "status_count", status: "planned", tone: "info" },
            { title: "Medical Risiken", kind: "capability_severity", capabilityKey: "medical_uploads", severity: "high", tone: "warning" },
            { title: "Transfer-Kritisch", kind: "capability_severity", capabilityKey: "transfer_control", severity: "critical", tone: "danger" }
        ]
    },
    athlete_app: {
        subtitle: "Readiness Hub für Profile, Medical-Clearance, Startlisten und Notifications.",
        quickActions: [
            { label: "Profil Audit", capabilityKey: "profiles", status: "in_progress", severity: "medium", dueHours: 36, title: "Athlete Profile Audit" },
            { label: "Medical Clearance", capabilityKey: "medical_clearance", status: "live", severity: "high", dueHours: 6, title: "Medical Clearance Update" },
            { label: "Push vorbereiten", capabilityKey: "notifications", status: "planned", severity: "low", dueHours: 12, title: "Athlete Notification" }
        ],
        playbooks: [
            { label: "Athlete Clearance Gate", capabilityKey: "medical_clearance", title: "Clearance Gate", status: "in_progress", severity: "high", workflowKey: "athlete_clearance_gate", dueHours: 2, note: "Startrecht vor Event validieren" },
            { label: "Result Push Cycle", capabilityKey: "results", title: "Result Distribution", status: "in_progress", severity: "medium", workflowKey: "result_flow", dueHours: 2, note: "Resultat- und Notification-Lauf" }
        ],
        relatedLinks: [
            { href: "events.html", label: "Startlisten & Events" },
            { href: "reporting.html", label: "Resultat-Reporting" },
            { href: "operations.html", label: "Operations Hub" }
        ],
        intelligence: [
            { title: "Clearance Live", kind: "capability_status", capabilityKey: "medical_clearance", status: "live", tone: "success" },
            { title: "Profile unvollständig", kind: "status_count", status: "planned", tone: "warning" },
            { title: "Überfällige Athlete Tasks", kind: "overdue_count", tone: "danger" }
        ]
    },
    public_site: {
        subtitle: "Media Engine für Live-Ticker, Standings und Embargo-gesteuerte Releases.",
        quickActions: [
            { label: "Ticker live", capabilityKey: "live_ticker", status: "live", severity: "medium", dueHours: 1, title: "Live Ticker Update" },
            { label: "Standings Freeze", capabilityKey: "standings", status: "in_progress", severity: "high", dueHours: 2, title: "Standings Freeze auslösen" },
            { label: "Embargo Clip Queue", capabilityKey: "embargo_clips", status: "planned", severity: "high", dueHours: 6, title: "Embargo Clip vorbereiten" }
        ],
        playbooks: [
            { label: "Embargo Release", capabilityKey: "embargo_clips", title: "Embargo Release", status: "in_progress", severity: "high", workflowKey: "public_embargo_release", dueHours: 2, note: "Freigabefenster und Public Push" },
            { label: "Final Result Publish", capabilityKey: "standings", title: "Final Standing Publish", status: "live", severity: "high", workflowKey: "result_flow", dueHours: 1, note: "Finales Ranking auf Public ausrollen" }
        ],
        relatedLinks: [
            { href: "reporting.html", label: "Publikationen" },
            { href: "points.html", label: "Wertungen" },
            { href: "operations.html", label: "Live Operations" }
        ],
        intelligence: [
            { title: "Live Ticker Slots", kind: "capability_status", capabilityKey: "live_ticker", status: "live", tone: "success" },
            { title: "Embargo Blocker", kind: "capability_status", capabilityKey: "embargo_clips", status: "blocked", tone: "danger" },
            { title: "Publish Risiken", kind: "severity_count", severity: "critical", tone: "danger" }
        ]
    }
};

const WORKSPACE_STATUS_ORDER = ["planned", "in_progress", "live", "blocked", "completed"];
const WORKSPACE_STATUS_LABELS = {
    planned: "Geplant",
    in_progress: "In Bearbeitung",
    live: "Live",
    blocked: "Blockiert",
    completed: "Abgeschlossen"
};
const WORKSPACE_SEVERITIES = ["low", "medium", "high", "critical"];
const WORKSPACE_SEVERITY_LABELS = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical"
};

function initDomainWorkspace(config) {
    if (!config || !config.domainKey) return;
    const domainKey = String(config.domainKey).trim();
    const preset = DOMAIN_EXPERIENCE_PRESETS[domainKey] || {};
    const workflowKeys = Array.isArray(config.workflowKeys) ? config.workflowKeys : [];

    const state = {
        scopeDomain: null,
        workflows: [],
        records: [],
        workflowLogs: [],
        savedViews: [],
        notifications: [],
        models: [],
        users: [],
        organizations: [],
        seasons: [],
        teams: [],
        errorReport: null,
        canWrite: false
    };
    const draftKey = `msc_portal_domain_draft:${domainKey}`;

    function experience() {
        return {
            subtitle: config.subtitle || preset.subtitle || "Domänensteuerung",
            quickActions: Array.isArray(config.quickActions) ? config.quickActions : (preset.quickActions || []),
            playbooks: Array.isArray(config.playbooks) ? config.playbooks : (preset.playbooks || []),
            relatedLinks: Array.isArray(config.relatedLinks) ? config.relatedLinks : (preset.relatedLinks || []),
            intelligence: Array.isArray(config.intelligence) ? config.intelligence : (preset.intelligence || [])
        };
    }

    function domainName() {
        return state.scopeDomain?.name || config.title || domainKey;
    }

    function capabilityLabel(capabilityKey) {
        const capabilities = Array.isArray(state.scopeDomain?.capabilities) ? state.scopeDomain.capabilities : [];
        return capabilities.find((entry) => entry.key === capabilityKey)?.name || capabilityKey || "—";
    }

    function normalizedStatus(value) {
        const key = String(value || "").trim().toLowerCase();
        return WORKSPACE_STATUS_ORDER.includes(key) ? key : "planned";
    }

    function normalizedSeverity(value) {
        const key = String(value || "").trim().toLowerCase();
        return WORKSPACE_SEVERITIES.includes(key) ? key : "medium";
    }

    function severityBadge(level) {
        const normalized = normalizedSeverity(level);
        const tone = normalized === "critical" ? "danger" : (normalized === "high" ? "warning" : (normalized === "medium" ? "info" : "success"));
        return `<span class="badge badge-${tone}">${WORKSPACE_SEVERITY_LABELS[normalized]}</span>`;
    }

    function parseTags(value) {
        if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
        return String(value || "")
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
    }

    function toLocalDateTimeInput(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function toIsoFromLocalInput(value) {
        const raw = String(value || "").trim();
        if (!raw) return null;
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString();
    }

    function saveDraft(form) {
        if (!form) return;
        const data = getFormData(form);
        const payload = {
            capabilityKey: data.capabilityKey || "",
            title: data.title || "",
            status: data.status || "planned",
            ownerRole: data.ownerRole || "",
            eventId: data.eventId || "",
            notes: data.notes || "",
            severity: data.severity || "medium",
            dueAt: data.dueAt || "",
            escalation: data.escalation || "none",
            tags: data.tags || "",
            externalRef: data.externalRef || ""
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
    }

    function loadDraft() {
        try {
            return JSON.parse(localStorage.getItem(draftKey) || "null");
        } catch (_error) {
            return null;
        }
    }

    function clearDraft() {
        localStorage.removeItem(draftKey);
    }

    function applyDraftToForm(form, draft) {
        if (!form || !draft || form.elements.recordId.value) return;
        form.elements.capabilityKey.value = draft.capabilityKey || "";
        form.elements.title.value = draft.title || "";
        form.elements.status.value = draft.status || "planned";
        form.elements.ownerRole.value = draft.ownerRole || "";
        form.elements.eventId.value = draft.eventId || "";
        form.elements.notes.value = draft.notes || "";
        form.elements.severity.value = draft.severity || "medium";
        form.elements.dueAt.value = draft.dueAt || "";
        form.elements.escalation.value = draft.escalation || "none";
        form.elements.tags.value = draft.tags || "";
        form.elements.externalRef.value = draft.externalRef || "";
    }

    function dueState(dueAt) {
        if (!dueAt) return { label: "Kein SLA", tone: "info", overdue: false, dueSoon: false };
        const date = new Date(dueAt);
        if (Number.isNaN(date.getTime())) return { label: "Ungültig", tone: "warning", overdue: false, dueSoon: false };
        const diffMs = date.getTime() - Date.now();
        if (diffMs < 0) return { label: "Überfällig", tone: "danger", overdue: true, dueSoon: false };
        if (diffMs <= 6 * 60 * 60 * 1000) return { label: "Bald fällig", tone: "warning", overdue: false, dueSoon: true };
        return { label: "Im Zeitfenster", tone: "success", overdue: false, dueSoon: false };
    }

    function extractMeta(record) {
        const payload = record?.payload && typeof record.payload === "object" ? record.payload : {};
        return {
            notes: String(payload.notes || ""),
            severity: normalizedSeverity(payload.severity || "medium"),
            dueAt: payload.dueAt ? String(payload.dueAt) : "",
            escalation: String(payload.escalation || "none"),
            tags: parseTags(payload.tags),
            externalRef: String(payload.externalRef || "")
        };
    }

    function ensureEnhancedSections() {
        const content = document.querySelector(".portal-content");
        if (!content) return;

        if (!document.getElementById("ws-guidance-card")) {
            const guidanceCard = document.createElement("div");
            guidanceCard.className = "card workspace-guidance-card";
            guidanceCard.id = "ws-guidance-card";
            const steps = domainKey === "team_portal"
                ? [
                    "1. Organisation auswählen oder neu anlegen",
                    "2. Teamtyp und Saison setzen",
                    "3. Springer und Lizenzen prüfen, dann bestätigen"
                ]
                : [
                    "1. Primäre Aufgabe öffnen",
                    "2. Quick Action oder Formular nutzen",
                    "3. Details nur bei Bedarf einblenden"
                ];
            guidanceCard.innerHTML = `
                <div class="card-header"><h2>Schnellstart</h2></div>
                <div class="card-body">
                    <p class="workspace-muted">${escapeHtml(experience().subtitle)}</p>
                    <div class="workspace-mini-pill-list">
                        <span>${escapeHtml(steps[0])}</span>
                        <span>${escapeHtml(steps[1])}</span>
                        <span>${escapeHtml(steps[2])}</span>
                    </div>
                </div>
            `;
            content.prepend(guidanceCard);
        }

        if (!document.getElementById("ws-command-deck-card")) {
            const commandCard = document.createElement("div");
            commandCard.className = "card workspace-secondary-card";
            commandCard.id = "ws-command-deck-card";
            commandCard.innerHTML = `
                <div class="card-header"><h2>Command Deck</h2></div>
                <div class="card-body">
                    <div class="workspace-command-filter-row">
                        <input type="search" id="ws-command-filter" placeholder="Aktionen, Playbooks, Workflows oder Links filtern..." />
                        <button type="button" class="btn btn-secondary btn-small" id="ws-command-filter-clear">Filter leeren</button>
                    </div>
                    <div class="workspace-actions-wrap">
                        <div class="workspace-action-box">
                            <h3>Quick Actions <span class="workspace-count-pill" id="ws-count-quick">0</span></h3>
                            <p class="workspace-action-help">Befüllt das Formular direkt mit einem sinnvollen Startwert.</p>
                            <div class="workspace-chip-list" id="ws-quick-actions"></div>
                        </div>
                        <div class="workspace-action-box">
                            <h3>Playbooks <span class="workspace-count-pill" id="ws-count-playbooks">0</span></h3>
                            <p class="workspace-action-help">Erstellt einen Eintrag und startet optional den zugeordneten Workflow.</p>
                            <div class="workspace-chip-list" id="ws-playbook-actions"></div>
                        </div>
                        <div class="workspace-action-box">
                            <h3>One-Click Workflows <span class="workspace-count-pill" id="ws-count-workflows">0</span></h3>
                            <p class="workspace-action-help">Startet Workflows sofort mit Domain-Kontext.</p>
                            <div class="workspace-chip-list" id="ws-workflow-shortcuts"></div>
                        </div>
                        <div class="workspace-action-box">
                            <h3>Verknüpfte Bereiche <span class="workspace-count-pill" id="ws-count-links">0</span></h3>
                            <p class="workspace-action-help">Direkte Navigation in benachbarte Fachbereiche.</p>
                            <div class="workspace-chip-list" id="ws-related-links"></div>
                        </div>
                    </div>
                </div>
            `;
            const secondCard = content.querySelectorAll(".card")[1];
            if (secondCard) secondCard.insertAdjacentElement("afterend", commandCard);
            else content.prepend(commandCard);
        }

        if (!document.getElementById("ws-problem-scanner-card")) {
            const scannerCard = document.createElement("div");
            scannerCard.className = "card workspace-essential-card";
            scannerCard.id = "ws-problem-scanner-card";
            scannerCard.innerHTML = `
                <div class="card-header"><h2>Problem-Scanner</h2></div>
                <div class="card-body" id="ws-problem-scanner"></div>
            `;
            document.getElementById("ws-command-deck-card")?.insertAdjacentElement("afterend", scannerCard);
        }

        if (!document.getElementById("ws-intelligence-card")) {
            const intelCard = document.createElement("div");
            intelCard.className = "card workspace-secondary-card";
            intelCard.id = "ws-intelligence-card";
            intelCard.innerHTML = `
                <div class="card-header"><h2>Domain Intelligence</h2></div>
                <div class="card-body">
                    <div class="workspace-intelligence-grid" id="ws-intelligence-grid"></div>
                </div>
            `;
            document.getElementById("ws-command-deck-card")?.insertAdjacentElement("afterend", intelCard);
        }

        if (!document.getElementById("ws-model-card")) {
            const modelCard = document.createElement("div");
            modelCard.className = "card workspace-secondary-card";
            modelCard.id = "ws-model-card";
            modelCard.innerHTML = `
                <div class="card-header"><h2>Domain Datenmodell</h2></div>
                <div class="card-body">
                    <div id="ws-model-list" class="workspace-model-list"></div>
                </div>
            `;
            document.getElementById("ws-intelligence-card")?.insertAdjacentElement("afterend", modelCard);
        }

        if (!document.getElementById("ws-status-board-card")) {
            const boardCard = document.createElement("div");
            boardCard.className = "card workspace-secondary-card";
            boardCard.id = "ws-status-board-card";
            boardCard.innerHTML = `
                <div class="card-header"><h2>Operations Board</h2></div>
                <div class="card-body">
                    <div class="workspace-lane-grid" id="ws-status-board"></div>
                </div>
            `;
            document.getElementById("ws-model-card")?.insertAdjacentElement("afterend", boardCard);
        }

        if (!document.getElementById("ws-sla-card")) {
            const slaCard = document.createElement("div");
            slaCard.className = "card workspace-secondary-card";
            slaCard.id = "ws-sla-card";
            slaCard.innerHTML = `
                <div class="card-header"><h2>SLA & Risiko Monitor</h2></div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Eintrag</th>
                                <th>Funktion</th>
                                <th>Severity</th>
                                <th>Fällig</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="ws-sla-body"></tbody>
                    </table>
                </div>
            `;
            document.getElementById("ws-status-board-card")?.insertAdjacentElement("afterend", slaCard);
        }

        if (!document.getElementById("ws-inbox-card")) {
            const inboxCard = document.createElement("div");
            inboxCard.className = "card workspace-secondary-card";
            inboxCard.id = "ws-inbox-card";
            inboxCard.innerHTML = `
                <div class="card-header"><h2>Benachrichtigungscenter</h2></div>
                <div class="card-body">
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary btn-small" id="ws-notification-read-all">Alle als gelesen markieren</button>
                    </div>
                    <div id="ws-notifications-list" class="workspace-notification-list"></div>
                </div>
            `;
            document.getElementById("ws-sla-card")?.insertAdjacentElement("afterend", inboxCard);
        }

        if (domainKey === "team_portal" && !document.getElementById("ws-team-management-card")) {
            const teamCard = document.createElement("div");
            teamCard.className = "card";
            teamCard.id = "ws-team-management-card";
            teamCard.innerHTML = `
                <div class="card-header"><h2>Organisationen & Teams</h2></div>
                <div class="card-body">
                    <div class="grid-2">
                        <form id="ws-organization-form" class="workspace-inline-form">
                            <h3>Organisation anlegen</h3>
                            <div class="grid-2">
                                <div class="form-group"><label>Name *</label><input type="text" name="name" required /></div>
                                <div class="form-group"><label>Kurzname</label><input type="text" name="shortName" /></div>
                                <div class="form-group">
                                    <label>Vorsitzenden suchen</label>
                                    <input type="search" name="chairUserLookup" list="ws-chair-user-options" placeholder="Username, Name oder E-Mail" />
                                    <datalist id="ws-chair-user-options"></datalist>
                                </div>
                                <details class="workspace-inline-details workspace-advanced-block">
                                    <summary>Neuen Vorsitzenden anlegen</summary>
                                    <div class="grid-2" style="margin-top: 10px;">
                                        <div class="form-group"><label>Benutzername</label><input type="text" name="newChairUsername" placeholder="benutzername" /></div>
                                        <div class="form-group"><label>Name</label><input type="text" name="newChairName" placeholder="Vorname Nachname" /></div>
                                        <div class="form-group"><label>E-Mail</label><input type="email" name="newChairEmail" placeholder="name@example.com" /></div>
                                        <div class="form-group"><label>Passwort optional</label><input type="password" name="newChairPassword" placeholder="leer lassen für Einladung" /></div>
                                        <div class="form-group">
                                            <label><input type="checkbox" name="newChairSendInvitation" checked /> Einladung per E-Mail senden</label>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            <div class="form-actions"><button type="submit" class="btn btn-primary btn-small">Organisation speichern</button></div>
                        </form>
                        <form id="ws-team-admin-form" class="workspace-inline-form">
                            <h3>Team melden</h3>
                            <div class="workspace-template-row">
                                <button type="button" class="btn btn-secondary btn-small" data-team-template="A">A-Team Vorlage</button>
                                <button type="button" class="btn btn-secondary btn-small" data-team-template="B">B-Team Vorlage</button>
                                <button type="button" class="btn btn-secondary btn-small" data-team-template="C">C-Team Vorlage</button>
                            </div>
                            <div class="grid-2">
                                <div class="form-group"><label>Organisation *</label><select name="organizationId" required></select></div>
                                <div class="form-group"><label>Teamtyp *</label><select name="teamType" required><option value="A">A-Team</option><option value="B">B-Team</option><option value="C">C-Team</option></select></div>
                                <div class="form-group"><label>Name *</label><input type="text" name="name" required /></div>
                                <div class="form-group"><label>Saison</label><select name="seasonId"></select></div>
                                <div class="form-group">
                                    <label>Trainer/Manager suchen</label>
                                    <input type="search" name="managerUserLookup" list="ws-manager-user-options" placeholder="Username, Name, E-Mail oder ID" />
                                    <datalist id="ws-manager-user-options"></datalist>
                                </div>
                                <div class="form-group"><label>Meldestatus</label><input type="text" value="Entwurf (automatisch)" disabled /></div>
                            </div>
                            <div class="form-actions"><button type="submit" class="btn btn-primary btn-small">Team speichern</button></div>
                        </form>
                    </div>
                    <div class="workspace-team-grid" id="ws-org-team-grid"></div>
                </div>
            `;
            document.getElementById("ws-inbox-card")?.insertAdjacentElement("afterend", teamCard);
        }

        if (domainKey === "msc_admin" && !document.getElementById("ws-season-admin-card")) {
            const seasonCard = document.createElement("div");
            seasonCard.className = "card";
            seasonCard.id = "ws-season-admin-card";
            seasonCard.innerHTML = `
                <div class="card-header"><h2>Saisonverwaltung (Admin)</h2></div>
                <div class="card-body">
                    <form id="ws-season-form" class="workspace-inline-form">
                        <input type="hidden" name="seasonId" />
                        <div class="grid-3">
                            <div class="form-group"><label>Name *</label><input type="text" name="name" required /></div>
                            <div class="form-group"><label>Startdatum</label><input type="date" name="startDate" /></div>
                            <div class="form-group"><label>Enddatum</label><input type="date" name="endDate" /></div>
                            <div class="form-group"><label>Meldungsfrist</label><input type="datetime-local" name="registrationDeadlineAt" /></div>
                            <div class="form-group"><label>Transferfenster offen</label><input type="datetime-local" name="transferWindowOpenAt" /></div>
                            <div class="form-group"><label>Transferfenster zu</label><input type="datetime-local" name="transferWindowCloseAt" /></div>
                            <div class="form-group"><label>Status</label><select name="status"><option value="planned">Geplant</option><option value="active">Aktiv</option><option value="inactive">Inaktiv</option></select></div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-small" id="ws-season-submit">Saison speichern</button>
                            <button type="button" class="btn btn-secondary btn-small hidden" id="ws-season-cancel">Bearbeitung abbrechen</button>
                        </div>
                    </form>
                    <table class="table" style="margin-top: 12px;">
                        <thead><tr><th>Name</th><th>Zeitraum</th><th>Meldungsfrist</th><th>Transferfenster</th><th>Status</th><th>Aktion</th></tr></thead>
                        <tbody id="ws-seasons-body"></tbody>
                    </table>
                </div>
            `;
            document.getElementById("ws-inbox-card")?.insertAdjacentElement("afterend", seasonCard);
        }

        const recordsBody = document.getElementById("ws-records-body");
        const recordsCardBody = recordsBody?.closest(".card")?.querySelector(".card-body");
        if (recordsCardBody && !document.getElementById("ws-filter-row")) {
            const savedViewsBar = document.createElement("div");
            savedViewsBar.id = "ws-saved-view-row";
            savedViewsBar.className = "workspace-saved-view-bar";
            savedViewsBar.innerHTML = `
                <select id="ws-saved-view-select"><option value="">Gespeicherte Ansicht wählen</option></select>
                <input type="text" id="ws-saved-view-name" placeholder="Name für aktuelle Ansicht" />
                <select id="ws-saved-view-visibility"><option value="private">Privat</option><option value="role">Für Rolle teilen</option></select>
                <button type="button" class="btn btn-secondary btn-small" id="ws-save-view">Ansicht speichern</button>
                <button type="button" class="btn btn-danger btn-small" id="ws-delete-view">Ansicht löschen</button>
            `;
            recordsCardBody.prepend(savedViewsBar);

            const filterBar = document.createElement("div");
            filterBar.id = "ws-filter-row";
            filterBar.className = "workspace-filter-bar";
            filterBar.innerHTML = `
                <input type="search" id="ws-filter-search" placeholder="Suche nach Titel, Funktion, Owner, Tag, Referenz..." />
                <select id="ws-filter-status"><option value="">Alle Status</option></select>
                <select id="ws-filter-capability"><option value="">Alle Funktionen</option></select>
                <select id="ws-filter-owner"><option value="">Alle Owner</option></select>
                <select id="ws-filter-severity"><option value="">Alle Severity</option></select>
                <select id="ws-filter-due"><option value="">Alle SLA</option><option value="overdue">Überfällig</option><option value="soon">Bald fällig</option></select>
                <select id="ws-filter-deleted"><option value="no">Nur aktive</option><option value="all">Aktive + Gelöschte</option><option value="only">Nur gelöschte</option></select>
                <button type="button" class="btn btn-secondary btn-small" id="ws-clear-filters">Filter zurücksetzen</button>
            `;
            recordsCardBody.prepend(filterBar);
        }

        const form = document.getElementById("ws-record-form");
        const noteGroup = form?.querySelector("textarea[name='notes']")?.closest(".form-group");
        if (form && noteGroup && !form.querySelector("[data-ws-advanced='1']")) {
            const advanced = document.createElement("div");
            advanced.className = "grid-3";
            advanced.dataset.wsAdvanced = "1";
            advanced.innerHTML = `
                <div class="form-group">
                    <label>Severity</label>
                    <select name="severity">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Fällig bis</label>
                    <input type="datetime-local" name="dueAt" />
                </div>
                <div class="form-group">
                    <label>Eskalation</label>
                    <select name="escalation">
                        <option value="none">Keine</option>
                        <option value="loc">LOC</option>
                        <option value="msc">MSC</option>
                        <option value="medical">Medical</option>
                        <option value="legal">Legal</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tags (Komma-getrennt)</label>
                    <input type="text" name="tags" placeholder="critical, finals, weather" />
                </div>
                <div class="form-group">
                    <label>Externe Referenz</label>
                    <input type="text" name="externalRef" placeholder="INC-2026-0042 / DOC-91" />
                </div>
            `;
            noteGroup.insertAdjacentElement("beforebegin", advanced);
        }
    }

    function getFilterValues() {
        return {
            search: String(document.getElementById("ws-filter-search")?.value || "").trim().toLowerCase(),
            status: String(document.getElementById("ws-filter-status")?.value || "").trim().toLowerCase(),
            capability: String(document.getElementById("ws-filter-capability")?.value || "").trim(),
            owner: String(document.getElementById("ws-filter-owner")?.value || "").trim().toLowerCase(),
            severity: String(document.getElementById("ws-filter-severity")?.value || "").trim().toLowerCase(),
            due: String(document.getElementById("ws-filter-due")?.value || "").trim().toLowerCase(),
            deleted: String(document.getElementById("ws-filter-deleted")?.value || "no").trim().toLowerCase()
        };
    }

    function filteredRecords() {
        const filters = getFilterValues();
        return state.records.filter((entry) => {
            const meta = extractMeta(entry);
            const due = dueState(meta.dueAt);
            const isDeleted = Boolean(entry.deleted_at);
            if (filters.deleted === "no" && isDeleted) return false;
            if (filters.deleted === "only" && !isDeleted) return false;
            if (filters.status && normalizedStatus(entry.status) !== filters.status) return false;
            if (filters.capability && String(entry.capability_key || "") !== filters.capability) return false;
            if (filters.owner && String(entry.owner_role || "").toLowerCase() !== filters.owner) return false;
            if (filters.severity && normalizedSeverity(meta.severity) !== filters.severity) return false;
            if (filters.due === "overdue" && !due.overdue) return false;
            if (filters.due === "soon" && !due.dueSoon) return false;
            if (filters.search) {
                const source = [
                    entry.title,
                    capabilityLabel(entry.capability_key),
                    entry.owner_role,
                    meta.notes,
                    meta.externalRef,
                    meta.tags.join(" ")
                ].map((part) => String(part || "").toLowerCase()).join(" ");
                if (!source.includes(filters.search)) return false;
            }
            return true;
        });
    }

    function updateHeader() {
        const titleNode = document.getElementById("ws-domain-title");
        const descNode = document.getElementById("ws-domain-description");
        if (titleNode) titleNode.textContent = domainName();
        if (descNode) descNode.textContent = state.scopeDomain?.description || experience().subtitle;
    }

    function commandDeckQuery() {
        return String(document.getElementById("ws-command-filter")?.value || "").trim().toLowerCase();
    }

    function setCommandDeckCount(nodeId, visibleCount, totalCount) {
        const node = document.getElementById(nodeId);
        if (!node) return;
        node.textContent = visibleCount === totalCount ? String(totalCount) : `${visibleCount}/${totalCount}`;
    }

    function matchesCommandDeckQuery(parts = []) {
        const query = commandDeckQuery();
        if (!query) return true;
        return parts
            .map((part) => String(part || "").toLowerCase())
            .join(" ")
            .includes(query);
    }

    function commandDeckEmptyMessage(defaultMessage) {
        return commandDeckQuery() ? "<span class='workspace-muted'>Keine Treffer für den aktuellen Filter.</span>" : defaultMessage;
    }

    function updateKpis() {
        const records = filteredRecords();
        const live = records.filter((entry) => normalizedStatus(entry.status) === "live").length;
        const blocked = records.filter((entry) => normalizedStatus(entry.status) === "blocked").length;
        const critical = records.filter((entry) => normalizedSeverity(extractMeta(entry).severity) === "critical").length;
        const latest = records[0]?.updated_at || records[0]?.created_at || null;

        const totalNode = document.getElementById("ws-kpi-total");
        const liveNode = document.getElementById("ws-kpi-live");
        const blockedNode = document.getElementById("ws-kpi-blocked");
        const updatedNode = document.getElementById("ws-kpi-updated");

        if (totalNode) totalNode.textContent = String(records.length);
        if (liveNode) liveNode.textContent = String(live);
        if (blockedNode) blockedNode.textContent = `${blocked} (${critical} kritisch)`;
        if (updatedNode) updatedNode.textContent = latest ? formatDateTime(latest) : "—";
    }

    function renderCapabilities() {
        const container = document.getElementById("ws-capability-cards");
        if (!container) return;
        const capabilities = Array.isArray(state.scopeDomain?.capabilities) ? state.scopeDomain.capabilities : [];
        const html = capabilities.map((entry) => {
            const records = state.records.filter((record) => record.capability_key === entry.key);
            const done = records.filter((record) => normalizedStatus(record.status) === "completed").length;
            const readiness = records.length > 0 ? Math.round((done / records.length) * 100) : 0;
            return `
                <div class="kpi-card">
                    <div class="kpi-label">${escapeHtml(entry.name)}</div>
                    <div class="kpi-value">${records.length}</div>
                    <div class="kpi-subtext">Readiness ${readiness}%</div>
                    <div class="workspace-progress">
                        <span style="width:${readiness}%"></span>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary btn-small" type="button" data-prefill-capability="${escapeHtml(entry.key)}">Eintrag erstellen</button>
                    </div>
                </div>
            `;
        }).join("");
        container.innerHTML = html || "<div class='table-empty'>Keine Capabilities verfügbar.</div>";
        container.querySelectorAll("[data-prefill-capability]").forEach((button) => {
            button.addEventListener("click", () => {
                if (!state.canWrite) return;
                const capabilityKey = button.getAttribute("data-prefill-capability") || "";
                const form = document.getElementById("ws-record-form");
                if (!form) return;
                form.elements.capabilityKey.value = capabilityKey;
                form.elements.title.focus();
                form.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
        applyReadOnlyActionButtons(container);
    }

    function renderRecordForm() {
        const form = document.getElementById("ws-record-form");
        if (!form) return;
        const capabilitySelect = form.elements.capabilityKey;
        const capabilities = Array.isArray(state.scopeDomain?.capabilities) ? state.scopeDomain.capabilities : [];
        capabilitySelect.innerHTML = `<option value="">-- Bitte auswählen --</option>${
            capabilities.map((entry) => `<option value="${escapeHtml(entry.key)}">${escapeHtml(entry.name)}</option>`).join("")
        }`;
    }

    function resetRecordForm() {
        const form = document.getElementById("ws-record-form");
        if (!form) return;
        form.reset();
        form.elements.recordId.value = "";
        form.elements.severity.value = "medium";
        form.elements.escalation.value = "none";
        const submit = document.getElementById("ws-record-submit");
        if (submit) submit.textContent = "Eintrag speichern";
        document.getElementById("ws-record-cancel")?.classList.add("hidden");
        renderRecordForm();
        clearDraft();
    }

    function openRecordDetails(record) {
        const meta = extractMeta(record);
        const dueInfo = dueState(meta.dueAt);
        const payload = record?.payload && typeof record.payload === "object" ? record.payload : {};
        const json = escapeHtml(JSON.stringify(payload, null, 2));
        showModal(
            `Eintrag: ${escapeHtml(record.title || "—")}`,
            `
                <p><strong>Funktion:</strong> ${escapeHtml(capabilityLabel(record.capability_key))}</p>
                <p><strong>Status:</strong> ${escapeHtml(WORKSPACE_STATUS_LABELS[normalizedStatus(record.status)] || record.status || "—")}</p>
                <p><strong>Severity:</strong> ${WORKSPACE_SEVERITY_LABELS[meta.severity]}</p>
                <p><strong>SLA:</strong> ${meta.dueAt ? escapeHtml(formatDateTime(meta.dueAt)) : "—"} (${escapeHtml(dueInfo.label)})</p>
                <p><strong>Eskalation:</strong> ${escapeHtml(meta.escalation || "none")}</p>
                <p><strong>Tags:</strong> ${escapeHtml(meta.tags.join(", ") || "—")}</p>
                <p><strong>Referenz:</strong> ${escapeHtml(meta.externalRef || "—")}</p>
                <p><strong>Notiz:</strong> ${escapeHtml(meta.notes || "—")}</p>
                <pre class="workspace-json-preview">${json}</pre>
            `,
            [{ id: "close", label: "Schließen", primary: true }]
        );
    }

    async function runWorkflow(workflowKey, input = {}) {
        await api("/workflows/execute", {
            method: "POST",
            body: JSON.stringify({ workflowKey, input })
        });
    }

    async function createDomainRecord(payload) {
        await api("/domain-records", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }

    async function updateRecordStatus(recordId, status) {
        await api(`/domain-records/${recordId}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });
    }

    function renderRecordsTable() {
        const tbody = document.getElementById("ws-records-body");
        if (!tbody) return;
        const rows = filteredRecords();
        const html = rows.map((entry) => {
            const meta = extractMeta(entry);
            const due = dueState(meta.dueAt);
            const isDeleted = Boolean(entry.deleted_at);
            const tags = meta.tags.length ? `<span class="workspace-mini-pill-list">${meta.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</span>` : "";
            const noteBlock = `
                <div>${escapeHtml(meta.notes || "—")}</div>
                <div class="workspace-note-meta">${severityBadge(meta.severity)} <span class="badge badge-${due.tone}">${escapeHtml(due.label)}</span></div>
                ${isDeleted ? `<div class="workspace-note-meta"><span class="badge badge-danger">Gelöscht</span></div>` : ""}
                ${tags}
            `;
            return `
                <tr>
                    <td>${formatDateTime(entry.updated_at || entry.created_at)}</td>
                    <td>${escapeHtml(capabilityLabel(entry.capability_key))}</td>
                    <td><strong>${escapeHtml(entry.title || "—")}</strong></td>
                    <td>${statusBadge(normalizedStatus(entry.status))}</td>
                    <td>${escapeHtml(entry.owner_role || "—")}</td>
                    <td>${noteBlock}</td>
                    <td>
                        <div class="actions-inline">
                            <button class="btn btn-small btn-secondary" type="button" data-view-record="${entry.id}">Details</button>
                            <button class="btn btn-small btn-secondary" type="button" data-history-record="${entry.id}">Timeline</button>
                            ${state.canWrite && !isDeleted ? `<button class="btn btn-small btn-secondary" type="button" data-edit-record="${entry.id}">Bearbeiten</button>` : ""}
                            ${state.canWrite && !isDeleted ? `<button class="btn btn-small btn-secondary" type="button" data-mark-blocked="${entry.id}">Blockiert</button>` : ""}
                            ${state.canWrite && !isDeleted ? `<button class="btn btn-small btn-danger" type="button" data-delete-record="${entry.id}">Löschen</button>` : ""}
                            ${state.canWrite && isDeleted ? `<button class="btn btn-small btn-warning" type="button" data-restore-record="${entry.id}">Restore</button>` : ""}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
        tbody.innerHTML = html || "<tr><td colspan='7' class='table-empty'>Keine Einträge für die aktuelle Filterung.</td></tr>";

        tbody.querySelectorAll("[data-view-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-view-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                if (record) openRecordDetails(record);
            });
        });

        tbody.querySelectorAll("[data-edit-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-edit-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                if (!record) return;
                const meta = extractMeta(record);
                const form = document.getElementById("ws-record-form");
                form.elements.recordId.value = String(record.id);
                form.elements.capabilityKey.value = record.capability_key || "";
                form.elements.title.value = record.title || "";
                form.elements.status.value = normalizedStatus(record.status);
                form.elements.ownerRole.value = record.owner_role || "";
                form.elements.eventId.value = record.event_id ? String(record.event_id) : "";
                form.elements.notes.value = meta.notes || "";
                form.elements.severity.value = meta.severity || "medium";
                form.elements.dueAt.value = toLocalDateTimeInput(meta.dueAt);
                form.elements.escalation.value = meta.escalation || "none";
                form.elements.tags.value = meta.tags.join(", ");
                form.elements.externalRef.value = meta.externalRef || "";
                const submit = document.getElementById("ws-record-submit");
                if (submit) submit.textContent = "Eintrag aktualisieren";
                document.getElementById("ws-record-cancel")?.classList.remove("hidden");
                form.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });

        tbody.querySelectorAll("[data-mark-blocked]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = Number(button.getAttribute("data-mark-blocked"));
                try {
                    await updateRecordStatus(id, "blocked");
                    showToast("Status auf Blockiert gesetzt.", "warning");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });

        tbody.querySelectorAll("[data-history-record]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = Number(button.getAttribute("data-history-record"));
                try {
                    const history = await api(`/domain-records/${id}/history`);
                    const content = history.map((entry) => `
                        <div class="workspace-history-entry">
                            <strong>${escapeHtml(entry.action || "UPDATE")}</strong>
                            <div>${escapeHtml(entry.actor_username || "system")} · ${escapeHtml(formatDateTime(entry.created_at))}</div>
                            <div>${escapeHtml(entry.note || "—")}</div>
                        </div>
                    `).join("") || "<div class='table-empty'>Keine Timeline verfügbar.</div>";
                    showModal(`Timeline #${id}`, content, [{ id: "close", label: "Schließen", primary: true }]);
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });

        tbody.querySelectorAll("[data-delete-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-delete-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                confirmDelete(`Eintrag ${record?.title || id}`, async () => {
                    await api(`/domain-records/${id}`, { method: "DELETE" });
                    showToast("Eintrag gelöscht.", "success");
                    await refreshDomainWorkspacePage();
                });
            });
        });

        tbody.querySelectorAll("[data-restore-record]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = Number(button.getAttribute("data-restore-record"));
                try {
                    await api(`/domain-records/${id}/restore`, { method: "PATCH" });
                    showToast("Eintrag wiederhergestellt.", "success");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
        applyReadOnlyActionButtons(tbody);
    }

    function computeMetric(entry) {
        const records = filteredRecords();
        const kind = String(entry?.kind || "");
        if (kind === "status_count") {
            return records.filter((record) => normalizedStatus(record.status) === normalizedStatus(entry.status)).length;
        }
        if (kind === "severity_count") {
            return records.filter((record) => normalizedSeverity(extractMeta(record).severity) === normalizedSeverity(entry.severity)).length;
        }
        if (kind === "overdue_count") {
            return records.filter((record) => dueState(extractMeta(record).dueAt).overdue).length;
        }
        if (kind === "capability_status") {
            return records.filter((record) => record.capability_key === entry.capabilityKey && normalizedStatus(record.status) === normalizedStatus(entry.status)).length;
        }
        if (kind === "capability_severity") {
            return records.filter((record) => record.capability_key === entry.capabilityKey && normalizedSeverity(extractMeta(record).severity) === normalizedSeverity(entry.severity)).length;
        }
        if (kind === "blocked_capabilities") {
            const keys = Array.isArray(entry.capabilityKeys) ? entry.capabilityKeys : [];
            return records.filter((record) => keys.includes(record.capability_key) && normalizedStatus(record.status) === "blocked").length;
        }
        return 0;
    }

    function renderIntelligence() {
        const container = document.getElementById("ws-intelligence-grid");
        if (!container) return;
        const intelligence = experience().intelligence;
        if (!Array.isArray(intelligence) || intelligence.length === 0) {
            container.innerHTML = "<div class='table-empty'>Keine Intelligence-Module konfiguriert.</div>";
            return;
        }
        container.innerHTML = intelligence.map((entry) => {
            const value = computeMetric(entry);
            const tone = String(entry.tone || "info");
            return `
                <div class="workspace-intelligence-card tone-${escapeHtml(tone)}">
                    <div class="workspace-intelligence-title">${escapeHtml(entry.title || "Metrik")}</div>
                    <div class="workspace-intelligence-value">${value}</div>
                </div>
            `;
        }).join("");
    }

    function renderDomainModelCard() {
        const node = document.getElementById("ws-model-list");
        if (!node) return;
        const domainModel = state.models.find((entry) => entry.domainKey === domainKey);
        if (!domainModel || !Array.isArray(domainModel.capabilities)) {
            node.innerHTML = "<div class='table-empty'>Kein Modell verfügbar.</div>";
            return;
        }
        node.innerHTML = domainModel.capabilities.map((capability) => {
            const schema = capability.schema || { required: [], allowedEscalations: [] };
            const required = Array.isArray(schema.required) ? schema.required : [];
            const escalations = Array.isArray(schema.allowedEscalations) ? schema.allowedEscalations : [];
            return `
                <div class="workspace-model-item">
                    <strong>${escapeHtml(capability.name || capability.key)}</strong>
                    <div class="workspace-model-meta">Required: ${escapeHtml(required.join(", ") || "—")}</div>
                    <div class="workspace-model-meta">Escalation: ${escapeHtml(escalations.join(", ") || "none")}</div>
                </div>
            `;
        }).join("");
    }

    function renderStatusBoard() {
        const board = document.getElementById("ws-status-board");
        if (!board) return;
        const rows = filteredRecords();
        board.innerHTML = WORKSPACE_STATUS_ORDER.map((status) => {
            const items = rows.filter((entry) => normalizedStatus(entry.status) === status);
            const itemsHtml = items.slice(0, 8).map((entry) => {
                const meta = extractMeta(entry);
                return `
                    <li>
                        <button type="button" class="workspace-lane-item" data-focus-record="${entry.id}">
                            <span>${escapeHtml(entry.title || "—")}</span>
                            <small>${escapeHtml(capabilityLabel(entry.capability_key))}</small>
                            <small>${WORKSPACE_SEVERITY_LABELS[meta.severity]}</small>
                        </button>
                        ${state.canWrite && status !== "live" ? `<button type="button" class="btn btn-small btn-secondary" data-mark-live="${entry.id}">Live</button>` : ""}
                    </li>
                `;
            }).join("");
            return `
                <section class="workspace-lane">
                    <header>
                        <span class="workspace-lane-title">${escapeHtml(WORKSPACE_STATUS_LABELS[status] || status)}</span>
                        <span class="workspace-lane-count">${items.length}</span>
                    </header>
                    <ul>${itemsHtml || "<li class='table-empty'>Keine Einträge</li>"}</ul>
                </section>
            `;
        }).join("");

        board.querySelectorAll("[data-focus-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-focus-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                if (record) openRecordDetails(record);
            });
        });

        board.querySelectorAll("[data-mark-live]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = Number(button.getAttribute("data-mark-live"));
                try {
                    await updateRecordStatus(id, "live");
                    showToast("Status auf Live gesetzt.", "success");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
        applyReadOnlyActionButtons(board);
    }

    function renderSlaMonitor() {
        const tbody = document.getElementById("ws-sla-body");
        if (!tbody) return;
        const rows = filteredRecords()
            .filter((entry) => extractMeta(entry).dueAt)
            .sort((a, b) => new Date(extractMeta(a).dueAt).getTime() - new Date(extractMeta(b).dueAt).getTime())
            .slice(0, 12);

        tbody.innerHTML = rows.map((entry) => {
            const meta = extractMeta(entry);
            const due = dueState(meta.dueAt);
            return `
                <tr>
                    <td><strong>${escapeHtml(entry.title || "—")}</strong></td>
                    <td>${escapeHtml(capabilityLabel(entry.capability_key))}</td>
                    <td>${severityBadge(meta.severity)}</td>
                    <td>${escapeHtml(formatDateTime(meta.dueAt))} · <span class="badge badge-${due.tone}">${escapeHtml(due.label)}</span></td>
                    <td>${statusBadge(normalizedStatus(entry.status))}</td>
                </tr>
            `;
        }).join("") || "<tr><td colspan='5' class='table-empty'>Keine SLA-Einträge vorhanden.</td></tr>";
    }

    function serializeCurrentFilters() {
        return getFilterValues();
    }

    function applyFilters(filters = {}) {
        const previousDeleted = String(document.getElementById("ws-filter-deleted")?.value || "no").trim().toLowerCase();
        const setValue = (id, value, fallback = "") => {
            const node = document.getElementById(id);
            if (node) node.value = value !== undefined && value !== null && String(value).length > 0 ? String(value) : fallback;
        };
        setValue("ws-filter-search", filters.search || "", "");
        setValue("ws-filter-status", filters.status || "", "");
        setValue("ws-filter-capability", filters.capability || "", "");
        setValue("ws-filter-owner", filters.owner || "", "");
        setValue("ws-filter-severity", filters.severity || "", "");
        setValue("ws-filter-due", filters.due || "", "");
        setValue("ws-filter-deleted", filters.deleted || "no", "no");
        const nextDeleted = String(document.getElementById("ws-filter-deleted")?.value || "no").trim().toLowerCase();
        if (nextDeleted !== previousDeleted) {
            refreshDomainWorkspacePage().catch(() => {});
            return;
        }
        rerenderFilteredViews();
    }

    function renderSavedViews() {
        const select = document.getElementById("ws-saved-view-select");
        const nameInput = document.getElementById("ws-saved-view-name");
        if (!select) return;
        const current = select.value;
        select.innerHTML = "<option value=''>Gespeicherte Ansicht wählen</option>" + state.savedViews.map((view) => (
            `<option value="${view.id}">${escapeHtml(view.name)} (${view.visibility === "role" ? "Rolle" : "Privat"})</option>`
        )).join("");
        if (current && state.savedViews.some((view) => String(view.id) === String(current))) {
            select.value = current;
        }
        if (nameInput && !nameInput.value) {
            nameInput.placeholder = "Name für aktuelle Ansicht";
        }
    }

    function bindSavedViewActions() {
        const select = document.getElementById("ws-saved-view-select");
        const nameInput = document.getElementById("ws-saved-view-name");
        const visibility = document.getElementById("ws-saved-view-visibility");
        const saveButton = document.getElementById("ws-save-view");
        const deleteButton = document.getElementById("ws-delete-view");
        if (!select || select.dataset.bound === "1") return;
        select.dataset.bound = "1";

        select.addEventListener("change", () => {
            const id = Number(select.value || 0);
            const view = state.savedViews.find((entry) => Number(entry.id) === id);
            if (!view) return;
            if (nameInput) nameInput.value = view.name || "";
            if (visibility) visibility.value = view.visibility || "private";
            applyFilters(view.filters || {});
        });

        saveButton?.addEventListener("click", async () => {
            try {
                const payload = {
                    id: select.value ? Number(select.value) : undefined,
                    domainKey,
                    name: String(nameInput?.value || "").trim(),
                    visibility: String(visibility?.value || "private"),
                    filters: serializeCurrentFilters()
                };
                if (!payload.name) {
                    showToast("Bitte einen Namen für die Ansicht eingeben.", "warning");
                    return;
                }
                await api("/domain-views", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                showToast("Ansicht gespeichert.", "success");
                await refreshDomainWorkspacePage();
            } catch (error) {
                showToast(error.message, "error");
            }
        });

        deleteButton?.addEventListener("click", async () => {
            const id = Number(select.value || 0);
            if (!id) {
                showToast("Bitte zuerst eine gespeicherte Ansicht wählen.", "warning");
                return;
            }
            confirmDelete("gespeicherte Ansicht", async () => {
                await api(`/domain-views/${id}`, { method: "DELETE" });
                showToast("Ansicht gelöscht.", "success");
                if (nameInput) nameInput.value = "";
                await refreshDomainWorkspacePage();
            });
        });
    }

    function renderNotifications() {
        const list = document.getElementById("ws-notifications-list");
        if (!list) return;
        const rows = state.notifications.slice(0, 20);
        list.innerHTML = rows.map((entry) => `
            <div class="workspace-notification-item">
                <div class="workspace-notification-head">
                    <strong>${escapeHtml(entry.title || "Hinweis")}</strong>
                    <span class="badge badge-${entry.severity === "critical" ? "danger" : (entry.severity === "high" ? "warning" : "info")}">${escapeHtml(entry.severity || "info")}</span>
                </div>
                <div>${escapeHtml(entry.message || "")}</div>
                <small>${escapeHtml(formatDateTime(entry.created_at))}</small>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary btn-small" data-mark-read="${entry.id}">Als gelesen</button>
                </div>
            </div>
        `).join("") || "<div class='table-empty'>Keine offenen Benachrichtigungen.</div>";

        list.querySelectorAll("[data-mark-read]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = Number(button.getAttribute("data-mark-read"));
                try {
                    await api(`/notifications/${id}/read`, { method: "PATCH" });
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });

        const readAll = document.getElementById("ws-notification-read-all");
        if (readAll && readAll.dataset.bound !== "1") {
            readAll.dataset.bound = "1";
            readAll.addEventListener("click", async () => {
                try {
                    await api("/notifications/read-all", { method: "POST" });
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        }
    }

    function relevantWorkflows(scopeWorkflows = []) {
        return workflowKeys.length > 0
            ? scopeWorkflows.filter((entry) => workflowKeys.includes(entry.key))
            : scopeWorkflows;
    }

    function renderWorkflowOptions() {
        const select = document.querySelector("#ws-workflow-form select[name='workflowKey']");
        if (!select) return;
        const html = state.workflows.map((entry) => `<option value="${escapeHtml(entry.key)}">${escapeHtml(entry.name)}</option>`).join("");
        select.innerHTML = `<option value="">-- Bitte auswählen --</option>${html}`;
    }

    function renderWorkflowShortcuts() {
        const box = document.getElementById("ws-workflow-shortcuts");
        if (!box) return;
        const workflowsAll = Array.isArray(state.workflows) ? state.workflows : [];
        const workflows = workflowsAll.filter((workflow) => matchesCommandDeckQuery([
            workflow.name,
            workflow.key
        ]));
        setCommandDeckCount("ws-count-workflows", workflows.length, workflowsAll.length);
        if (workflows.length === 0) {
            box.innerHTML = commandDeckEmptyMessage("<span class='workspace-muted'>Keine Workflows verfügbar.</span>");
            return;
        }
        box.innerHTML = workflows.map((workflow) => `
            <button type="button" class="workspace-chip-btn" data-run-workflow="${escapeHtml(workflow.key)}" title="${escapeHtml(workflow.key)}">${escapeHtml(workflow.name)}</button>
        `).join("");
        box.querySelectorAll("[data-run-workflow]").forEach((button) => {
            if (!state.canWrite) {
                button.classList.add("readonly-action");
                button.disabled = true;
                return;
            }
            button.addEventListener("click", async () => {
                const workflowKey = button.getAttribute("data-run-workflow") || "";
                button.disabled = true;
                try {
                    await runWorkflow(workflowKey, { note: `Quick run from ${domainName()}` });
                    showToast("Workflow ausgeführt.", "success");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                } finally {
                    button.disabled = false;
                }
            });
        });
    }

    function renderPlaybooks() {
        const box = document.getElementById("ws-playbook-actions");
        if (!box) return;
        const playbooksAll = experience().playbooks;
        if (!Array.isArray(playbooksAll) || playbooksAll.length === 0) {
            setCommandDeckCount("ws-count-playbooks", 0, 0);
            box.innerHTML = "<span class='workspace-muted'>Keine Playbooks konfiguriert.</span>";
            return;
        }
        const playbooks = playbooksAll
            .map((entry, idx) => ({ ...entry, _idx: idx }))
            .filter((entry) => matchesCommandDeckQuery([
                entry.label,
                entry.title,
                entry.capabilityKey,
                entry.workflowKey,
                entry.severity
            ]));
        setCommandDeckCount("ws-count-playbooks", playbooks.length, playbooksAll.length);
        if (playbooks.length === 0) {
            box.innerHTML = commandDeckEmptyMessage("<span class='workspace-muted'>Keine Playbooks konfiguriert.</span>");
            return;
        }
        box.innerHTML = playbooks.map((entry) => `
            <button type="button" class="workspace-chip-btn" data-run-playbook="${entry._idx}" title="${escapeHtml(`Funktion: ${capabilityLabel(entry.capabilityKey)} | Severity: ${WORKSPACE_SEVERITY_LABELS[normalizedSeverity(entry.severity || "medium")]}`)}">${escapeHtml(entry.label || "Playbook")} · ${escapeHtml(WORKSPACE_SEVERITY_LABELS[normalizedSeverity(entry.severity || "medium")])}</button>
        `).join("");
        box.querySelectorAll("[data-run-playbook]").forEach((button) => {
            if (!state.canWrite) {
                button.classList.add("readonly-action");
                button.disabled = true;
                return;
            }
            button.addEventListener("click", async () => {
                const idx = Number(button.getAttribute("data-run-playbook"));
                const playbook = playbooksAll[idx];
                if (!playbook) return;
                button.disabled = true;
                try {
                    const dueAt = playbook.dueHours
                        ? new Date(Date.now() + Number(playbook.dueHours) * 60 * 60 * 1000).toISOString()
                        : null;
                    await createDomainRecord({
                        domainKey,
                        capabilityKey: playbook.capabilityKey,
                        title: playbook.title || playbook.label || "Playbook Task",
                        status: playbook.status || "in_progress",
                        ownerRole: "",
                        eventId: null,
                        payload: {
                            notes: playbook.note || `Playbook run: ${playbook.label || ""}`.trim(),
                            severity: playbook.severity || "medium",
                            dueAt,
                            escalation: playbook.escalation || "none",
                            tags: [`playbook:${String(playbook.label || "").toLowerCase().replace(/\s+/g, "_")}`]
                        }
                    });
                    if (playbook.workflowKey) {
                        await runWorkflow(playbook.workflowKey, {
                            note: playbook.note || `Playbook ${playbook.label || ""}`,
                            source: "domain-playbook"
                        });
                    }
                    showToast("Playbook ausgeführt.", "success");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                } finally {
                    button.disabled = false;
                }
            });
        });
    }

    function renderWorkflowLogs() {
        const tbody = document.getElementById("ws-workflow-body");
        if (!tbody) return;
        const html = state.workflowLogs.map((entry) => `
            <tr>
                <td>${formatDateTime(entry.created_at)}</td>
                <td><strong>${escapeHtml(entry.workflow_name || entry.workflow_key || "—")}</strong></td>
                <td>${statusBadge(entry.status || "completed")}</td>
                <td>${escapeHtml(entry.payload?.decision || entry.payload?.steps?.join(" → ") || entry.payload?.note || "—")}</td>
            </tr>
        `).join("");
        tbody.innerHTML = html || "<tr><td colspan='4' class='table-empty'>Keine Workflow-Läufe vorhanden.</td></tr>";
        applyReadOnlyActionButtons(tbody);
    }

    function renderRelatedLinks() {
        const node = document.getElementById("ws-related-links");
        if (!node) return;
        const linksAll = experience().relatedLinks;
        if (!Array.isArray(linksAll) || linksAll.length === 0) {
            setCommandDeckCount("ws-count-links", 0, 0);
            node.innerHTML = "<span class='workspace-muted'>Keine Verknüpfungen konfiguriert.</span>";
            return;
        }
        const links = linksAll.filter((entry) => matchesCommandDeckQuery([
            entry.label,
            entry.href
        ]));
        setCommandDeckCount("ws-count-links", links.length, linksAll.length);
        if (links.length === 0) {
            node.innerHTML = commandDeckEmptyMessage("<span class='workspace-muted'>Keine Verknüpfungen konfiguriert.</span>");
            return;
        }
        node.innerHTML = links.map((entry) => `
            <a class="workspace-chip-link" href="${escapeHtml(entry.href || "#")}" title="${escapeHtml(entry.href || "")}">${escapeHtml(entry.label || entry.href || "Bereich")} ↗</a>
        `).join("");
    }

    function renderProblemScanner() {
        const node = document.getElementById("ws-problem-scanner");
        if (!node) return;
        const records = Array.isArray(state.records) ? state.records : [];
        const orgs = Array.isArray(state.organizations) ? state.organizations : [];
        const teams = Array.isArray(state.teams) ? state.teams : [];
        const seasons = Array.isArray(state.seasons) ? state.seasons : [];
        const backendIssues = Array.isArray(state.errorReport?.issues) ? state.errorReport.issues : [];
        const issues = [];
        const scanRecords = records.reduce((acc, record) => {
            const meta = extractMeta(record);
            const status = normalizedStatus(record.status);
            const due = dueState(meta.dueAt);
            if (status === "blocked") acc.blocked += 1;
            if (due.overdue) acc.overdue += 1;
            if (due.dueSoon) acc.dueSoon += 1;
            if (normalizedSeverity(meta.severity) === "critical") acc.critical += 1;
            return acc;
        }, { blocked: 0, overdue: 0, dueSoon: 0, critical: 0 });

        if (scanRecords.blocked > 0) {
            issues.push({ label: `${scanRecords.blocked} Blocker`, tone: "danger" });
        }
        if (scanRecords.overdue > 0) {
            issues.push({ label: `${scanRecords.overdue} überfällige Einträge`, tone: "warning" });
        }
        if (scanRecords.critical > 0) {
            issues.push({ label: `${scanRecords.critical} kritische Punkte`, tone: "danger" });
        }

        if (domainKey === "team_portal") {
            const nextDeadline = teams
                .map((team) => {
                    const deadline = team.registration_deadline_at || seasons.find((season) => Number(season.id) === Number(team.season_id))?.registration_deadline_at || null;
                    if (!deadline) return null;
                    const date = new Date(deadline);
                    return Number.isNaN(date.getTime()) ? null : date;
                })
                .filter(Boolean)
                .sort((a, b) => a.getTime() - b.getTime())[0] || null;
            const orgIssues = orgs.reduce((acc, org) => {
                const orgTeams = teams.filter((team) => Number(team.organization_id) === Number(org.id));
                const hasA = orgTeams.some((team) => String(team.team_type || "").trim().toUpperCase() === "A");
                if (orgTeams.length > 3) acc.push(`${org.name}: mehr als 3 Teams`);
                if (orgTeams.length > 0 && !hasA) acc.push(`${org.name}: kein A-Team`);
                return acc;
            }, []);
            issues.push(...orgIssues.map((label) => ({ label, tone: "warning" })));
            if (nextDeadline) {
                issues.push({ label: `Nächste Frist: ${formatDateTime(nextDeadline.toISOString())}`, tone: Date.now() > nextDeadline.getTime() ? "danger" : "info" });
            }
            const summary = state.errorReport?.summary || {};
            if (Number(summary.critical || 0) > 0) {
                issues.push({ label: `${summary.critical} kritische Logikfehler`, tone: "danger" });
            }
            if (Number(summary.high || 0) > 0) {
                issues.push({ label: `${summary.high} hohe Risiken`, tone: "warning" });
            }
        }

        let nextStep = "Alles wirkt aktuell ruhig.";
        if (domainKey === "team_portal") {
            const confirmedTeams = teams.filter((team) => String(team.registration_status || "").toLowerCase() === "confirmed").length;
            const revisionTeams = teams.filter((team) => String(team.registration_status || "").toLowerCase() === "revision_requested").length;
            if (revisionTeams > 0) {
                nextStep = "Nächster sinnvoller Schritt: Rückfragen mit den Vorsitzenden klären.";
            } else if (confirmedTeams === 0 && teams.length > 0) {
                nextStep = "Nächster sinnvoller Schritt: Erstes Team prüfen und bestätigen.";
            } else if (teams.length === 0) {
                nextStep = "Nächster sinnvoller Schritt: Erste Organisation oder erstes Team anlegen.";
            } else {
                nextStep = "Nächster sinnvoller Schritt: Springer und Lizenzen gegenprüfen.";
            }
        } else if (scanRecords.blocked > 0) {
            nextStep = "Nächster sinnvoller Schritt: Blocker öffnen und erledigen.";
        } else if (scanRecords.overdue > 0) {
            nextStep = "Nächster sinnvoller Schritt: Überfällige Punkte priorisieren.";
        }
        if (domainKey === "team_portal" && backendIssues.length > 0) {
            nextStep = "Nächster sinnvoller Schritt: Kritische Logikfehler sofort beheben.";
        }

        node.innerHTML = `
            <div class="workspace-scanner-head">
                <strong>Problem-Scanner</strong>
                <span class="workspace-muted">${escapeHtml(issues.length > 0 ? `${issues.length} Hinweise` : "Keine Hinweise")}</span>
            </div>
            <div class="workspace-mini-pill-list workspace-scanner-pills">
                ${issues.length > 0 ? issues.slice(0, 6).map((issue) => `<span class="badge badge-${issue.tone}">${escapeHtml(issue.label)}</span>`).join("") : "<span class='workspace-team-ok'>Alles im grünen Bereich</span>"}
            </div>
            <div class="workspace-scanner-next">${escapeHtml(nextStep)}</div>
            ${domainKey === "team_portal" ? `
                <div class="workspace-scanner-issue-list">
                    <h4>Fehler, die geändert werden müssen</h4>
                    ${backendIssues.length > 0 ? `
                        <ul>
                            ${backendIssues.slice(0, 30).map((issue) => `
                                <li>
                                    <span class="badge badge-${String(issue.severity || "").toLowerCase() === "critical" ? "danger" : String(issue.severity || "").toLowerCase() === "high" ? "warning" : "info"}">${escapeHtml(String(issue.severity || "info").toUpperCase())}</span>
                                    <strong>${escapeHtml(issue.title || "Logikfehler")}</strong>
                                    <div class="workspace-muted">${escapeHtml(issue.detail || "Bitte prüfen.")}</div>
                                    <div class="workspace-muted">Nächste Aktion: ${escapeHtml(issue.action || "Korrigieren")}</div>
                                </li>
                            `).join("")}
                        </ul>
                    ` : "<div class='workspace-team-ok'>Keine logischen Fehler erkannt.</div>"}
                </div>
            ` : ""}
        `;
    }

    function renderTeamAdminPanel() {
        if (domainKey !== "team_portal") return;
        const orgSelect = document.querySelector("#ws-team-admin-form select[name='organizationId']");
        const seasonSelect = document.querySelector("#ws-team-admin-form select[name='seasonId']");
        const grid = document.getElementById("ws-org-team-grid");
        if (!orgSelect || !seasonSelect || !grid) return;

        const organizations = Array.isArray(state.organizations) ? state.organizations : [];
        const seasons = Array.isArray(state.seasons) ? state.seasons : [];
        const teams = Array.isArray(state.teams) ? state.teams : [];
        const users = Array.isArray(state.users) ? state.users : [];
        const canOrganizationsWrite = hasPermission("organizations.write");
        const canTeamsWrite = hasPermission("teams.write");
        const canTeamPortalWrite = hasPermission("team_portal.write");
        const currentScope = state.scopeDomain?.name || "Team Portal";
        const resolvedDeadline = (team) => {
            const deadline = team.registration_deadline_at || seasons.find((season) => Number(season.id) === Number(team.season_id))?.registration_deadline_at || null;
            if (!deadline) return null;
            const date = new Date(deadline);
            return Number.isNaN(date.getTime()) ? null : date;
        };
        const teamReviewLabel = (team) => {
            const status = String(team.registration_status || "draft").toLowerCase();
            if (status === "confirmed") return "Bestätigt";
            if (status === "revision_requested") return "Rückfrage";
            if (status === "submitted") return "Eingereicht";
            return "Entwurf";
        };
        const isLocked = (team) => {
            if (Number(team.registration_locked) === 1) return true;
            const deadline = resolvedDeadline(team);
            return Boolean(deadline && Date.now() > deadline.getTime());
        };
        const nextDeadline = teams
            .map((team) => resolvedDeadline(team))
            .filter(Boolean)
            .sort((a, b) => a.getTime() - b.getTime())[0] || null;
        const confirmedTeams = teams.filter((team) => String(team.registration_status || "").toLowerCase() === "confirmed");
        const lockedTeams = teams.filter((team) => isLocked(team));
        const revisionTeams = teams.filter((team) => String(team.registration_status || "").toLowerCase() === "revision_requested");
        const deadlineLabel = nextDeadline
            ? `${formatDateTime(nextDeadline.toISOString())}${Date.now() > nextDeadline.getTime() ? " · abgelaufen" : ""}`
            : "Keine aktive Frist";
        const registrationQuota = `${teams.length}/3 Teams`;
        const orgSummaries = organizations.map((org) => {
            const orgTeams = teams.filter((team) => Number(team.organization_id) === Number(org.id));
            const hasA = orgTeams.some((team) => String(team.team_type || "").trim().toUpperCase() === "A");
            const warnings = [];
            if (orgTeams.length > 3) warnings.push("mehr als 3 Teams");
            if (orgTeams.length > 0 && !hasA) warnings.push("kein A-Team");
            if (orgTeams.length > 0 && orgTeams[0] && String(orgTeams[0].team_type || "").trim().toUpperCase() !== "A") warnings.push("erstes Team ist nicht A");
            const tone = warnings.length > 0 ? "warning" : (orgTeams.length > 0 ? "success" : "info");
            return { org, orgTeams, warnings, tone };
        });
        const workflowWarnings = [
            ...(orgSummaries.flatMap((entry) => entry.warnings.map((warning) => `${entry.org.name}: ${warning}`))),
            ...(lockedTeams.length > 0 ? [`${lockedTeams.length} Teams nach Meldeschluss gesperrt`] : []),
            ...(revisionTeams.length > 0 ? [`${revisionTeams.length} Teams in Rückfrage`] : [])
        ];

        orgSelect.innerHTML = `<option value="">-- Organisation wählen --</option>${
            organizations.map((org) => `<option value="${escapeHtml(org.id)}">${escapeHtml(org.name)}${org.short_name ? ` (${escapeHtml(org.short_name)})` : ""}</option>`).join("")
        }`;
        const isScopedToSingleOrg = !canOrganizationsWrite && organizations.length === 1;
        if (isScopedToSingleOrg) {
            orgSelect.value = String(organizations[0].id);
            orgSelect.disabled = true;
            orgSelect.title = "Als Vorsitzende/r kannst du nur Teams deiner Organisation melden.";
        } else {
            orgSelect.disabled = false;
            orgSelect.title = "";
        }
        seasonSelect.innerHTML = `<option value="">-- Saison optional --</option>${
            seasons.map((season) => `<option value="${escapeHtml(season.id)}">${escapeHtml(season.name)}</option>`).join("")
        }`;
        const chairLookup = document.querySelector("#ws-organization-form input[name='chairUserLookup']");
        const chairOptions = document.getElementById("ws-chair-user-options");
        if (chairLookup) {
            chairLookup.placeholder = users.length > 0 ? "Username, Name oder E-Mail" : "Kein Account gefunden";
        }
        if (chairOptions) {
            chairOptions.innerHTML = users
                .filter((user) => String(user.status || "").toLowerCase() === "active")
                .map((user) => {
                    const label = `${user.username} · ${user.name} · ${user.email}`;
                    return `<option value="${escapeHtml(user.username)}"></option><option value="${escapeHtml(user.email)}"></option><option value="${escapeHtml(user.name)}"></option><option value="${escapeHtml(String(user.id))}"></option><option value="${escapeHtml(label)}"></option>`;
                })
                .join("");
        }
        const managerOptions = document.getElementById("ws-manager-user-options");
        if (managerOptions) {
            const managerUsers = users
                .filter((user) => String(user.status || "").toLowerCase() === "active")
                .filter((user) => {
                    const role = String(user.role || "").toLowerCase();
                    return role.includes("teammanager") || role.includes("trainer");
                });
            managerOptions.innerHTML = managerUsers
                .map((user) => {
                    const label = `${user.username} · ${user.name} · ${user.email} · ID ${user.id}`;
                    return `<option value="${escapeHtml(user.username)}"></option><option value="${escapeHtml(user.email)}"></option><option value="${escapeHtml(user.name)}"></option><option value="${escapeHtml(String(user.id))}"></option><option value="${escapeHtml(label)}"></option>`;
                })
                .join("");
        }

        const teamRows = teams.map((team) => {
            const org = organizations.find((entry) => Number(entry.id) === Number(team.organization_id));
            const reviewStatus = String(team.registration_status || "draft").toLowerCase();
            const locked = isLocked(team);
            const canReview = canOrganizationsWrite && canTeamPortalWrite;
            const canSubmit = reviewStatus === "draft" || reviewStatus === "revision_requested";
            const canManageTeam = canTeamsWrite;
            return `
                <tr>
                    <td><strong>${escapeHtml(team.name || "—")}</strong></td>
                    <td>${escapeHtml(org?.name || "—")}</td>
                    <td>${escapeHtml(String(team.team_type || "—"))}</td>
                    <td>${statusBadge(reviewStatus === "confirmed" ? "live" : reviewStatus === "revision_requested" ? "blocked" : reviewStatus === "submitted" ? "in_progress" : "planned")}</td>
                    <td>${escapeHtml(team.season_name || "—")}</td>
                    <td>${team.confirmed_at ? escapeHtml(formatDateTime(team.confirmed_at)) : "—"}</td>
                    <td>${escapeHtml(team.registration_review_comment || "—")}</td>
                    <td>${locked ? statusBadge("blocked") : statusBadge("planned")}</td>
                    <td>
                        <div class="actions-inline">
                            ${canSubmit ? `<button type="button" class="btn btn-small btn-primary" data-submit-team="${team.id}">Einreichen</button>` : ""}
                            ${canReview ? `<button type="button" class="btn btn-small btn-secondary" data-confirm-team="${team.id}">Bestätigen</button>` : ""}
                            ${canReview ? `<button type="button" class="btn btn-small btn-warning" data-reject-team="${team.id}">Rückfrage</button>` : ""}
                            ${canManageTeam ? `<button type="button" class="btn btn-small btn-secondary" data-edit-team="${team.id}">Bearbeiten</button>` : ""}
                            ${canManageTeam ? `<button type="button" class="btn btn-small btn-danger" data-delete-team="${team.id}">Löschen</button>` : ""}
                            <button type="button" class="btn btn-small btn-secondary" data-history-team="${team.id}">Historie</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        grid.innerHTML = `
            <div class="card workspace-team-summary">
                <div class="card-header"><h3>Meldefluss</h3></div>
                <div class="card-body">
                    <div class="workspace-mini-pill-list">
                        <span>${escapeHtml(registrationQuota)}</span>
                        <span>${escapeHtml(`${confirmedTeams.length} bestätigt`)}</span>
                        <span>${escapeHtml(`${lockedTeams.length} gesperrt`)}</span>
                        <span>${escapeHtml(`${revisionTeams.length} Rückfragen`)}</span>
                        <span>${escapeHtml(deadlineLabel)}</span>
                        <span>${escapeHtml(currentScope)}</span>
                    </div>
                    <ol class="workspace-team-flow">
                        <li><strong>1. Organisation</strong><span>Vorsitz und Scope festlegen, damit Teams im richtigen Kontext landen.</span></li>
                        <li><strong>2. Teams melden</strong><span>A-Team zuerst, dann maximal zwei weitere Teams bis zur Dreierrenze.</span></li>
                        <li><strong>3. Springer zuweisen</strong><span>Springer nur mit Lizenzen, die vor der Freigabe bestätigt werden.</span></li>
                        <li><strong>4. Prüfung & Freigabe</strong><span>Bestätigen oder mit Kommentar zur Überarbeitung zurückgeben.</span></li>
                    </ol>
                    <div class="workspace-team-warning-list">
                        ${workflowWarnings.length > 0
                            ? workflowWarnings.map((warning) => `<div class="workspace-team-warning">${escapeHtml(warning)}</div>`).join("")
                            : "<div class='workspace-team-ok'>Keine aktiven Regelverstöße.</div>"}
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Organisationen</h3></div>
                <div class="card-body">
                    <div class="workspace-mini-pill-list">
                        ${orgSummaries.map((entry) => {
                            const count = entry.orgTeams.length;
                            const label = `${entry.org.name}${entry.org.chair_username ? ` · Vorsitz: ${entry.org.chair_username}` : ""} · ${count}/3`;
                            return `<span class="workspace-team-org-pill badge badge-${entry.tone}">${escapeHtml(label)}</span>`;
                        }).join("") || "<span>Keine Organisationen</span>"}
                    </div>
                    <table class="table" style="margin-top: 12px;">
                        <thead><tr><th>Name</th><th>Kürzel</th><th>Vorsitz</th><th>Status</th><th>Aktion</th></tr></thead>
                        <tbody>
                            ${organizations.map((org) => `
                                <tr>
                                    <td><strong>${escapeHtml(org.name || "—")}</strong></td>
                                    <td>${escapeHtml(org.short_name || "—")}</td>
                                    <td>${escapeHtml(org.chair_username || org.chair_name || "—")}</td>
                                    <td>${statusBadge(org.status || "active")}</td>
                                    <td>${canOrganizationsWrite
                                        ? `<button type="button" class="btn btn-small btn-secondary" data-edit-organization="${org.id}">Bearbeiten</button>`
                                        : `<span class="badge badge-info">Leseansicht</span>`}
                                    </td>
                                </tr>
                            `).join("") || "<tr><td colspan='5' class='table-empty'>Keine Organisationen vorhanden.</td></tr>"}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Teams</h3></div>
                <div class="card-body">
                    <table class="table">
                        <thead><tr><th>Team</th><th>Organisation</th><th>Typ</th><th>Review</th><th>Saison</th><th>Bestätigt</th><th>Kommentar</th><th>Frist</th><th>Aktion</th></tr></thead>
                        <tbody>${teamRows || "<tr><td colspan='9' class='table-empty'>Keine Teams vorhanden.</td></tr>"}</tbody>
                    </table>
                </div>
            </div>
        `;

        grid.querySelectorAll("[data-confirm-team]").forEach((button) => {
            if (!canOrganizationsWrite || !canTeamPortalWrite) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const teamId = Number(button.getAttribute("data-confirm-team"));
            button.addEventListener("click", () => openTeamReviewModal(teamId, "confirm"));
        });
        grid.querySelectorAll("[data-reject-team]").forEach((button) => {
            if (!canOrganizationsWrite || !canTeamPortalWrite) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const teamId = Number(button.getAttribute("data-reject-team"));
            button.addEventListener("click", () => openTeamReviewModal(teamId, "reject"));
        });
        grid.querySelectorAll("[data-submit-team]").forEach((button) => {
            if (!canTeamPortalWrite) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const teamId = Number(button.getAttribute("data-submit-team"));
            button.addEventListener("click", async () => {
                try {
                    await api(`/teams/${teamId}/submit-registration`, { method: "POST" });
                    showToast("Teammeldung eingereicht.", "success");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        });
        grid.querySelectorAll("[data-edit-team]").forEach((button) => {
            if (!canTeamsWrite) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const teamId = Number(button.getAttribute("data-edit-team"));
            button.addEventListener("click", () => openTeamManageModal(teamId));
        });
        grid.querySelectorAll("[data-delete-team]").forEach((button) => {
            if (!canTeamsWrite) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const teamId = Number(button.getAttribute("data-delete-team"));
            button.addEventListener("click", () => {
                const team = teams.find((entry) => Number(entry.id) === teamId);
                if (!team) return;
                confirmDelete(`Team ${team.name || teamId}`, async () => {
                    try {
                        await api(`/teams/${teamId}`, { method: "DELETE" });
                        showToast("Team gelöscht.", "success");
                        await refreshDomainWorkspacePage();
                    } catch (error) {
                        showToast(error.message, "error");
                    }
                });
            });
        });
        grid.querySelectorAll("[data-edit-organization]").forEach((button) => {
            if (!canOrganizationsWrite) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const organizationId = Number(button.getAttribute("data-edit-organization"));
            button.addEventListener("click", () => openOrganizationEditModal(organizationId));
        });
        grid.querySelectorAll("[data-history-team]").forEach((button) => {
            if (!state.canWrite && !hasPermission("teams.read")) {
                button.disabled = true;
                button.classList.add("readonly-action");
                return;
            }
            const teamId = Number(button.getAttribute("data-history-team"));
            button.addEventListener("click", () => openTeamHistoryModal(teamId));
        });

    }

    function renderSeasonAdminPanel() {
        if (domainKey !== "msc_admin") return;
        const tbody = document.getElementById("ws-seasons-body");
        if (!tbody) return;
        const canSeasonsWrite = hasPermission("seasons.write");
        const seasons = Array.isArray(state.seasons) ? state.seasons : [];
        tbody.innerHTML = seasons.map((season) => {
            const period = `${season.start_date || "—"} bis ${season.end_date || "—"}`;
            const transferWindow = `${season.transfer_window_open_at ? formatDateTime(season.transfer_window_open_at) : "—"} → ${season.transfer_window_close_at ? formatDateTime(season.transfer_window_close_at) : "—"}`;
            return `
                <tr>
                    <td><strong>${escapeHtml(season.name || `Saison ${season.id}`)}</strong></td>
                    <td>${escapeHtml(period)}</td>
                    <td>${season.registration_deadline_at ? escapeHtml(formatDateTime(season.registration_deadline_at)) : "—"}</td>
                    <td>${escapeHtml(transferWindow)}</td>
                    <td>${statusBadge(String(season.status || "planned").toLowerCase())}</td>
                    <td>
                        <div class="actions-inline">
                            ${canSeasonsWrite ? `<button type="button" class="btn btn-small btn-secondary" data-edit-season="${season.id}">Bearbeiten</button>` : ""}
                            ${canSeasonsWrite ? `<button type="button" class="btn btn-small btn-danger" data-delete-season="${season.id}">Löschen</button>` : ""}
                        </div>
                    </td>
                </tr>
            `;
        }).join("") || "<tr><td colspan='6' class='table-empty'>Keine Saisons vorhanden.</td></tr>";

        tbody.querySelectorAll("[data-edit-season]").forEach((button) => {
            const seasonId = Number(button.getAttribute("data-edit-season"));
            button.addEventListener("click", () => {
                const season = seasons.find((entry) => Number(entry.id) === seasonId);
                const form = document.getElementById("ws-season-form");
                if (!season || !form) return;
                form.elements.seasonId.value = String(season.id);
                form.elements.name.value = season.name || "";
                form.elements.startDate.value = season.start_date || "";
                form.elements.endDate.value = season.end_date || "";
                form.elements.registrationDeadlineAt.value = toLocalDateTimeInput(season.registration_deadline_at);
                form.elements.transferWindowOpenAt.value = toLocalDateTimeInput(season.transfer_window_open_at);
                form.elements.transferWindowCloseAt.value = toLocalDateTimeInput(season.transfer_window_close_at);
                form.elements.status.value = season.status || "planned";
                const submit = document.getElementById("ws-season-submit");
                if (submit) submit.textContent = "Saison aktualisieren";
                document.getElementById("ws-season-cancel")?.classList.remove("hidden");
                form.scrollIntoView({ behavior: "smooth", block: "start" });
                form.elements.name.focus();
            });
        });

        tbody.querySelectorAll("[data-delete-season]").forEach((button) => {
            const seasonId = Number(button.getAttribute("data-delete-season"));
            button.addEventListener("click", () => {
                const season = seasons.find((entry) => Number(entry.id) === seasonId);
                if (!season) return;
                confirmDelete(`Saison ${season.name || seasonId}`, async () => {
                    try {
                        await api(`/seasons/${seasonId}`, { method: "DELETE" });
                        showToast("Saison gelöscht.", "success");
                        await refreshDomainWorkspacePage();
                    } catch (error) {
                        showToast(error.message, "error");
                    }
                });
            });
        });
    }

    function openTeamManageModal(teamId) {
        const team = (Array.isArray(state.teams) ? state.teams : [])
            .find((entry) => Number(entry.id) === Number(teamId));
        if (!team) return;
        const organizations = Array.isArray(state.organizations) ? state.organizations : [];
        const seasons = Array.isArray(state.seasons) ? state.seasons : [];
        const users = (Array.isArray(state.users) ? state.users : [])
            .filter((entry) => String(entry.status || "").toLowerCase() === "active")
            .filter((entry) => {
                const role = String(entry.role || "").trim().toLowerCase();
                return role === "teammanager" || role === "trainer";
            });
        const organizationOptions = organizations.map((org) => `
            <option value="${escapeHtml(org.id)}" ${Number(org.id) === Number(team.organization_id) ? "selected" : ""}>
                ${escapeHtml(org.name || `Organisation ${org.id}`)}
            </option>
        `).join("");
        const seasonOptions = [
            `<option value="">-- Keine Saison --</option>`,
            ...seasons.map((season) => `
                <option value="${escapeHtml(season.id)}" ${Number(season.id) === Number(team.season_id) ? "selected" : ""}>
                    ${escapeHtml(season.name || `Saison ${season.id}`)}
                </option>
            `)
        ].join("");
        const managerOptions = [
            `<option value="">-- Kein Trainer/Manager --</option>`,
            ...users.map((user) => `
                <option value="${escapeHtml(user.id)}" ${Number(user.id) === Number(team.manager_user_id) ? "selected" : ""}>
                    ${escapeHtml(user.name || user.username || `User ${user.id}`)} (${escapeHtml(user.username || String(user.id))})
                </option>
            `)
        ].join("");
        const content = `
            <form id="ws-team-manage-form">
                <div class="grid-2">
                    <div class="form-group"><label>Name *</label><input type="text" name="name" value="${escapeHtml(team.name || "")}" required /></div>
                    <div class="form-group"><label>Organisation *</label><select name="organizationId" required>${organizationOptions}</select></div>
                    <div class="form-group"><label>Teamtyp *</label><select name="teamType" required><option value="A" ${String(team.team_type || "").toUpperCase() === "A" ? "selected" : ""}>A-Team</option><option value="B" ${String(team.team_type || "").toUpperCase() === "B" ? "selected" : ""}>B-Team</option><option value="C" ${String(team.team_type || "").toUpperCase() === "C" ? "selected" : ""}>C-Team</option></select></div>
                    <div class="form-group"><label>Saison</label><select name="seasonId">${seasonOptions}</select></div>
                    <div class="form-group"><label>Nation</label><input type="text" name="nation" value="${escapeHtml(team.nation || "")}" /></div>
                    <div class="form-group"><label>Kategorie</label><input type="text" name="category" value="${escapeHtml(team.category || "")}" /></div>
                    <div class="form-group"><label>Trainer/Manager</label><select name="managerUserId">${managerOptions}</select></div>
                    <div class="form-group"><label>Status</label><select name="status"><option value="active" ${String(team.status || "").toLowerCase() !== "inactive" ? "selected" : ""}>Aktiv</option><option value="inactive" ${String(team.status || "").toLowerCase() === "inactive" ? "selected" : ""}>Inaktiv</option></select></div>
                </div>
                <div class="workspace-muted">Meldestatus bleibt im festen Ablauf und wird hier bewusst nicht direkt bearbeitet.</div>
            </form>
        `;
        showModal(`Team bearbeiten · ${escapeHtml(team.name || "Team")}`, content, [
            { id: "cancel", label: "Abbrechen", primary: false, handler: () => {} },
            {
                id: "save",
                label: "Speichern",
                primary: true,
                handler: async () => {
                    const form = document.getElementById("ws-team-manage-form");
                    if (!form) return false;
                    const data = getFormData(form);
                    const payload = {
                        name: data.name,
                        organizationId: data.organizationId,
                        teamType: data.teamType,
                        seasonId: data.seasonId || null,
                        managerUserId: data.managerUserId || null,
                        nation: String(data.nation || "").trim() || null,
                        category: String(data.category || "").trim() || null,
                        status: data.status === "inactive" ? "inactive" : "active"
                    };
                    try {
                        await api(`/teams/${teamId}`, {
                            method: "PATCH",
                            body: JSON.stringify(payload)
                        });
                        showToast("Team aktualisiert.", "success");
                        await refreshDomainWorkspacePage();
                    } catch (error) {
                        showToast(error.message, "error");
                        return false;
                    }
                }
            }
        ]);
    }

    async function openTeamHistoryModal(teamId) {
        const team = (Array.isArray(state.teams) ? state.teams : []).find((entry) => Number(entry.id) === Number(teamId));
        if (!team) return;
        try {
            const history = await api(`/teams/${teamId}/history`);
            const entries = Array.isArray(history) ? history : [];
            const content = `
                <div class="workspace-history-modal">
                    <p><strong>${escapeHtml(team.name || "Team")}</strong></p>
                    <div class="workspace-history-list">
                        ${entries.length > 0 ? entries.map((entry) => `
                            <div class="workspace-history-entry">
                                <div class="workspace-history-head">
                                    <strong>${escapeHtml(entry.action || "Aktion")}</strong>
                                    <span>${escapeHtml(formatDateTime(entry.created_at))}</span>
                                </div>
                                <div>${escapeHtml(entry.actor_username || "system")}</div>
                                <div class="workspace-muted">${escapeHtml(String(entry.details || "—"))}</div>
                            </div>
                        `).join("") : "<div class='workspace-muted'>Keine Historie vorhanden.</div>"}
                    </div>
                </div>
            `;
            showModal(`Historie · ${escapeHtml(team.name || "Team")}`, content, [{ id: "close", label: "Schließen", primary: true }]);
        } catch (error) {
            showToast(error.message, "error");
        }
    }

    function openOrganizationEditModal(organizationId) {
        const org = (Array.isArray(state.organizations) ? state.organizations : [])
            .find((entry) => Number(entry.id) === Number(organizationId));
        if (!org) return;
        const users = (Array.isArray(state.users) ? state.users : [])
            .filter((entry) => String(entry.status || "").toLowerCase() === "active");
        const datalistId = `ws-org-chair-options-${organizationId}`;
        const content = `
            <form id="ws-organization-edit-form">
                <div class="grid-2">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" value="${escapeHtml(org.name || "")}" required />
                    </div>
                    <div class="form-group">
                        <label>Kurzname</label>
                        <input type="text" name="shortName" value="${escapeHtml(org.short_name || "")}" />
                    </div>
                    <div class="form-group">
                        <label>Vorsitz neu zuweisen</label>
                        <input type="search" name="chairUserLookup" list="${datalistId}" placeholder="Username, Name oder E-Mail" />
                        <datalist id="${datalistId}">
                            ${users.map((user) => `<option value="${escapeHtml(user.username)}"></option><option value="${escapeHtml(user.email)}"></option><option value="${escapeHtml(user.name)}"></option><option value="${escapeHtml(String(user.id))}"></option>`).join("")}
                        </datalist>
                        <div class="help-text">Leer lassen = Vorsitz bleibt unverändert.</div>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="active" ${String(org.status || "").toLowerCase() !== "inactive" ? "selected" : ""}>Aktiv</option>
                            <option value="inactive" ${String(org.status || "").toLowerCase() === "inactive" ? "selected" : ""}>Inaktiv</option>
                        </select>
                    </div>
                </div>
                <div class="workspace-muted">Aktueller Vorsitz: ${escapeHtml(org.chair_username || org.chair_name || "nicht gesetzt")}</div>
            </form>
        `;
        showModal(`Organisation bearbeiten · ${escapeHtml(org.name || "Organisation")}`, content, [
            { id: "cancel", label: "Abbrechen", primary: false, handler: () => {} },
            {
                id: "clear-chair",
                label: "Vorsitz entfernen",
                primary: false,
                handler: async () => {
                    try {
                        await api(`/organizations/${organizationId}`, {
                            method: "PATCH",
                            body: JSON.stringify({ chairUserId: null })
                        });
                        showToast("Vorsitz entfernt.", "success");
                        await refreshDomainWorkspacePage();
                    } catch (error) {
                        showToast(error.message, "error");
                        return false;
                    }
                }
            },
            {
                id: "save",
                label: "Speichern",
                primary: true,
                handler: async () => {
                    const form = document.getElementById("ws-organization-edit-form");
                    if (!form) return false;
                    const data = getFormData(form);
                    const payload = {
                        name: data.name,
                        shortName: String(data.shortName || "").trim() || null,
                        status: data.status === "inactive" ? "inactive" : "active"
                    };
                    const lookup = String(data.chairUserLookup || "").trim();
                    if (lookup) payload.chairUserLookup = lookup;
                    try {
                        await api(`/organizations/${organizationId}`, {
                            method: "PATCH",
                            body: JSON.stringify(payload)
                        });
                        showToast("Organisation aktualisiert.", "success");
                        await refreshDomainWorkspacePage();
                    } catch (error) {
                        showToast(error.message, "error");
                        return false;
                    }
                }
            }
        ]);
    }

    function openTeamReviewModal(teamId, mode) {
        const team = (Array.isArray(state.teams) ? state.teams : []).find((entry) => Number(entry.id) === Number(teamId));
        if (!team) return;
        const title = mode === "confirm" ? "Teammeldung bestätigen" : "Rückfrage an Vorsitzende";
        const content = `
            <div class="workspace-review-modal">
                <p><strong>${escapeHtml(team.name || "Team")}</strong> · ${escapeHtml(teamReviewLabel(team))}</p>
                <div class="form-group">
                    <label>Kommentar ${mode === "reject" ? "*" : "(optional)"}</label>
                    <textarea id="ws-review-comment" rows="4" placeholder="${mode === "confirm" ? "Optionale Bemerkung zur Bestätigung" : "Bitte konkrete Rückfrage oder fehlende Punkte benennen"}"></textarea>
                </div>
            </div>
        `;
        showModal(title, content, [
            { id: "cancel", label: "Abbrechen", primary: false, handler: () => {} },
            {
                id: "save",
                label: mode === "confirm" ? "Bestätigen" : "Rückfrage senden",
                primary: true,
                handler: async () => {
                    const comment = document.getElementById("ws-review-comment")?.value?.trim() || "";
                    try {
                        await api(mode === "confirm" ? `/teams/${teamId}/confirm-registration` : `/teams/${teamId}/request-revision`, {
                            method: "POST",
                            body: JSON.stringify({ comment })
                        });
                        showToast(mode === "confirm" ? "Teammeldung bestätigt." : "Rückfrage gesendet.", "success");
                        await refreshDomainWorkspacePage();
                    } catch (error) {
                        showToast(error.message, "error");
                    }
                }
            }
        ]);
    }

    function bindTeamAdminPanel() {
        if (domainKey !== "team_portal" && domainKey !== "msc_admin") return;
        const isTeamPortal = domainKey === "team_portal";
        const orgForm = document.getElementById("ws-organization-form");
        const teamForm = document.getElementById("ws-team-admin-form");
        if (isTeamPortal && orgForm && orgForm.dataset.bound !== "1") {
            orgForm.dataset.bound = "1";
            orgForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const data = getFormData(orgForm);
                const newChairFilled = Boolean(String(data.newChairUsername || "").trim() || String(data.newChairName || "").trim() || String(data.newChairEmail || "").trim());
                const chairLookup = String(data.chairUserLookup || "").trim();
                const chairUser = newChairFilled
                    ? {
                        username: data.newChairUsername || "",
                        name: data.newChairName || "",
                        email: data.newChairEmail || "",
                        password: data.newChairPassword || "",
                        sendInvitation: data.newChairSendInvitation === "on"
                    }
                    : null;
                try {
                    await api("/organizations", {
                        method: "POST",
                        body: JSON.stringify({
                            name: data.name,
                            shortName: data.shortName || null,
                            chairUserId: null,
                            chairUserLookup: chairUser ? null : chairLookup || null,
                            chairUser,
                            status: "active"
                        })
                    });
                    showToast("Organisation gespeichert.", "success");
                    orgForm.reset();
                    const invitation = orgForm.querySelector("[name='newChairSendInvitation']");
                    if (invitation) invitation.checked = true;
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        }
        if (isTeamPortal && teamForm && teamForm.dataset.bound !== "1") {
            teamForm.dataset.bound = "1";
            teamForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const data = getFormData(teamForm);
                const organizations = Array.isArray(state.organizations) ? state.organizations : [];
                const teams = Array.isArray(state.teams) ? state.teams : [];
                const seasons = Array.isArray(state.seasons) ? state.seasons : [];
                const users = Array.isArray(state.users) ? state.users : [];
                const managerLookup = String(data.managerUserLookup || "").trim();
                const managerMatch = managerLookup
                    ? users.find((user) => {
                        const matchPool = [
                            String(user.id || ""),
                            String(user.username || ""),
                            String(user.email || ""),
                            String(user.name || "")
                        ].map((entry) => entry.trim().toLowerCase());
                        const needle = managerLookup.toLowerCase();
                        return matchPool.includes(needle) || matchPool.some((entry) => entry.includes(needle));
                    })
                    : null;
                const managerUserId = managerMatch ? Number(managerMatch.id) : null;
                const orgSelectField = teamForm.querySelector("select[name='organizationId']");
                const rawOrgValue = String(
                    data.organizationId
                    || orgSelectField?.value
                    || (orgSelectField?.disabled && organizations.length === 1 ? organizations[0].id : "")
                ).trim();
                const selectedOrgId = Number(rawOrgValue || 0);
                const selectedType = String(data.teamType || "").trim().toUpperCase();
                if (!selectedOrgId) {
                    showToast("Bitte eine Organisation auswählen.", "error");
                    return;
                }
                const selectedOrg = organizations.find((org) => Number(org.id) === selectedOrgId);
                if (!selectedOrg) {
                    showToast("Organisation wurde nicht gefunden oder liegt außerhalb deines Scopes.", "error");
                    return;
                }
                const orgTeams = teams.filter((team) => Number(team.organization_id) === selectedOrgId && String(team.status || "").toLowerCase() !== "inactive");
                if (orgTeams.length >= 3) {
                    showToast("Diese Organisation hat bereits 3 aktive Teams (Maximum erreicht).", "error");
                    return;
                }
                const hasA = orgTeams.some((team) => String(team.team_type || "").trim().toUpperCase() === "A");
                if (orgTeams.length === 0 && selectedType !== "A") {
                    showToast("Erstes Team einer Organisation muss ein A-Team sein.", "error");
                    return;
                }
                if (selectedType === "A" && hasA) {
                    showToast("Diese Organisation hat bereits ein A-Team.", "error");
                    return;
                }
                if (managerLookup && !managerMatch) {
                    showToast("Trainer/Manager wurde nicht gefunden.", "error");
                    return;
                }
                if (data.seasonId) {
                    const season = seasons.find((entry) => Number(entry.id) === Number(data.seasonId));
                    if (!season || String(season.status || "").toLowerCase() === "inactive") {
                        showToast("Bitte eine aktive oder geplante Saison wählen.", "error");
                        return;
                    }
                }
                try {
                    await api("/teams", {
                        method: "POST",
                        body: JSON.stringify({
                            name: data.name,
                            organizationId: selectedOrgId,
                            teamType: data.teamType,
                            seasonId: data.seasonId || null,
                            managerUserId
                        })
                    });
                    showToast("Team gespeichert.", "success");
                    teamForm.reset();
                    const orgSelect = teamForm.querySelector("select[name='organizationId']");
                    if (orgSelect && orgSelect.disabled && organizations.length === 1) {
                        orgSelect.value = String(organizations[0].id);
                    }
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        }
        const seasonForm = document.getElementById("ws-season-form");
        if (seasonForm && seasonForm.dataset.bound !== "1") {
            seasonForm.dataset.bound = "1";
            seasonForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const data = getFormData(seasonForm);
                const payload = {
                    name: String(data.name || "").trim(),
                    startDate: String(data.startDate || "").trim() || null,
                    endDate: String(data.endDate || "").trim() || null,
                    registrationDeadlineAt: toIsoFromLocalInput(data.registrationDeadlineAt),
                    transferWindowOpenAt: toIsoFromLocalInput(data.transferWindowOpenAt),
                    transferWindowCloseAt: toIsoFromLocalInput(data.transferWindowCloseAt),
                    status: String(data.status || "planned").trim().toLowerCase()
                };
                try {
                    const seasonId = Number(data.seasonId || 0);
                    await api(seasonId > 0 ? `/seasons/${seasonId}` : "/seasons", {
                        method: seasonId > 0 ? "PATCH" : "POST",
                        body: JSON.stringify(payload)
                    });
                    showToast(seasonId > 0 ? "Saison aktualisiert." : "Saison erstellt.", "success");
                    seasonForm.reset();
                    seasonForm.elements.seasonId.value = "";
                    const submit = document.getElementById("ws-season-submit");
                    if (submit) submit.textContent = "Saison speichern";
                    document.getElementById("ws-season-cancel")?.classList.add("hidden");
                    await refreshDomainWorkspacePage();
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        }
        const seasonCancel = document.getElementById("ws-season-cancel");
        if (seasonCancel && seasonCancel.dataset.bound !== "1") {
            seasonCancel.dataset.bound = "1";
            seasonCancel.addEventListener("click", () => {
                if (!seasonForm) return;
                seasonForm.reset();
                seasonForm.elements.seasonId.value = "";
                const submit = document.getElementById("ws-season-submit");
                if (submit) submit.textContent = "Saison speichern";
                seasonCancel.classList.add("hidden");
            });
        }
        if (!isTeamPortal) return;
        document.querySelectorAll("[data-team-template]").forEach((button) => {
            if (button.dataset.bound === "1") return;
            button.dataset.bound = "1";
            button.addEventListener("click", () => {
                const template = String(button.getAttribute("data-team-template") || "").toUpperCase();
                if (!teamForm) return;
                const teamTypeField = teamForm.elements.teamType;
                const nameField = teamForm.elements.name;
                if (teamTypeField) teamTypeField.value = template;
                if (nameField && !String(nameField.value || "").trim()) {
                    nameField.placeholder = `${template}-Team Name`;
                }
                showToast(`${template}-Team Vorlage geladen.`, "info", 1800);
            });
        });
    }

    function renderQuickActions() {
        const node = document.getElementById("ws-quick-actions");
        if (!node) return;
        const actionsAll = experience().quickActions;
        if (!Array.isArray(actionsAll) || actionsAll.length === 0) {
            setCommandDeckCount("ws-count-quick", 0, 0);
            node.innerHTML = "<span class='workspace-muted'>Keine Quick Actions konfiguriert.</span>";
            return;
        }
        const actions = actionsAll
            .map((entry, idx) => ({ ...entry, _idx: idx }))
            .filter((entry) => matchesCommandDeckQuery([
                entry.label,
                entry.title,
                entry.capabilityKey,
                entry.severity
            ]));
        setCommandDeckCount("ws-count-quick", actions.length, actionsAll.length);
        if (actions.length === 0) {
            node.innerHTML = commandDeckEmptyMessage("<span class='workspace-muted'>Keine Quick Actions konfiguriert.</span>");
            return;
        }
        node.innerHTML = actions.map((entry) => `
            <button type="button" class="workspace-chip-btn" data-quick-action="${entry._idx}" title="${escapeHtml(`Funktion: ${capabilityLabel(entry.capabilityKey)} | Status: ${WORKSPACE_STATUS_LABELS[normalizedStatus(entry.status || "planned")]}`)}">${escapeHtml(entry.label || "Aktion")} · ${escapeHtml(WORKSPACE_STATUS_LABELS[normalizedStatus(entry.status || "planned")])}</button>
        `).join("");
        node.querySelectorAll("[data-quick-action]").forEach((button) => {
            if (!state.canWrite) {
                button.classList.add("readonly-action");
                button.disabled = true;
                return;
            }
            button.addEventListener("click", () => {
                const idx = Number(button.getAttribute("data-quick-action"));
                const action = actionsAll[idx];
                if (!action) return;
                const dueAt = action.dueHours ? new Date(Date.now() + Number(action.dueHours) * 60 * 60 * 1000) : null;
                const form = document.getElementById("ws-record-form");
                form.elements.recordId.value = "";
                form.elements.capabilityKey.value = action.capabilityKey || "";
                form.elements.title.value = action.title || "";
                form.elements.status.value = action.status || "planned";
                form.elements.notes.value = action.note || "";
                form.elements.ownerRole.value = "";
                form.elements.eventId.value = "";
                form.elements.severity.value = action.severity || "medium";
                form.elements.escalation.value = action.escalation || "none";
                form.elements.tags.value = action.tags ? parseTags(action.tags).join(", ") : "";
                form.elements.externalRef.value = "";
                form.elements.dueAt.value = toLocalDateTimeInput(dueAt);
                const submit = document.getElementById("ws-record-submit");
                if (submit) submit.textContent = "Eintrag speichern";
                document.getElementById("ws-record-cancel")?.classList.add("hidden");
                form.scrollIntoView({ behavior: "smooth", block: "start" });
                form.elements.title.focus();
            });
        });
    }

    function rerenderCommandDeck() {
        renderQuickActions();
        renderPlaybooks();
        renderWorkflowShortcuts();
        renderRelatedLinks();
    }

    function renderFilterOptions() {
        const statusSelect = document.getElementById("ws-filter-status");
        if (statusSelect && statusSelect.options.length <= 1) {
            statusSelect.innerHTML = `<option value="">Alle Status</option>${
                WORKSPACE_STATUS_ORDER.map((status) => `<option value="${status}">${WORKSPACE_STATUS_LABELS[status]}</option>`).join("")
            }`;
        }

        const severitySelect = document.getElementById("ws-filter-severity");
        if (severitySelect && severitySelect.options.length <= 1) {
            severitySelect.innerHTML = `<option value="">Alle Severity</option>${
                WORKSPACE_SEVERITIES.map((entry) => `<option value="${entry}">${WORKSPACE_SEVERITY_LABELS[entry]}</option>`).join("")
            }`;
        }

        const capabilitySelect = document.getElementById("ws-filter-capability");
        if (capabilitySelect) {
            const selected = capabilitySelect.value;
            const capabilities = Array.isArray(state.scopeDomain?.capabilities) ? state.scopeDomain.capabilities : [];
            capabilitySelect.innerHTML = `<option value="">Alle Funktionen</option>${
                capabilities.map((entry) => `<option value="${escapeHtml(entry.key)}">${escapeHtml(entry.name)}</option>`).join("")
            }`;
            capabilitySelect.value = selected;
        }

        const ownerSelect = document.getElementById("ws-filter-owner");
        if (ownerSelect) {
            const selected = ownerSelect.value;
            const owners = Array.from(
                new Set(
                    state.records
                        .map((entry) => String(entry.owner_role || "").trim())
                        .filter(Boolean)
                )
            ).sort((a, b) => a.localeCompare(b, "de"));
            ownerSelect.innerHTML = `<option value="">Alle Owner</option>${
                owners.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join("")
            }`;
            ownerSelect.value = selected;
        }
    }

    function rerenderFilteredViews() {
        updateKpis();
        renderIntelligence();
        renderStatusBoard();
        renderSlaMonitor();
        renderRecordsTable();
    }

    function bindFilterEvents() {
        const search = document.getElementById("ws-filter-search");
        const status = document.getElementById("ws-filter-status");
        const capability = document.getElementById("ws-filter-capability");
        const owner = document.getElementById("ws-filter-owner");
        const severity = document.getElementById("ws-filter-severity");
        const due = document.getElementById("ws-filter-due");
        const deleted = document.getElementById("ws-filter-deleted");
        const clear = document.getElementById("ws-clear-filters");
        if (!search || search.dataset.bound === "1") return;

        search.dataset.bound = "1";
        [search, status, capability, owner, severity, due].forEach((node) => {
            if (!node) return;
            node.addEventListener("input", rerenderFilteredViews);
            node.addEventListener("change", rerenderFilteredViews);
        });
        deleted?.addEventListener("change", async () => {
            await refreshDomainWorkspacePage();
        });
        clear?.addEventListener("click", () => {
            search.value = "";
            if (status) status.value = "";
            if (capability) capability.value = "";
            if (owner) owner.value = "";
            if (severity) severity.value = "";
            if (due) due.value = "";
            if (deleted) deleted.value = "no";
            rerenderFilteredViews();
        });
    }

    function bindCommandDeckEvents() {
        const search = document.getElementById("ws-command-filter");
        const clear = document.getElementById("ws-command-filter-clear");
        if (!search || search.dataset.bound === "1") return;
        search.dataset.bound = "1";
        search.addEventListener("input", () => {
            rerenderCommandDeck();
        });
        clear?.addEventListener("click", () => {
            search.value = "";
            rerenderCommandDeck();
            search.focus();
        });
    }

    async function refreshDomainWorkspacePage() {
        const filterState = getFilterValues();
        const recordsQuery = new URLSearchParams({
            domainKey,
            status: filterState.status || "",
            capabilityKey: filterState.capability || "",
            ownerRole: filterState.owner || "",
            search: filterState.search || "",
            severity: filterState.severity || "",
            dueState: filterState.due || "",
            includeDeleted: filterState.deleted === "all" ? "true" : "false",
            onlyDeleted: filterState.deleted === "only" ? "true" : "false",
            limit: "300",
            offset: "0"
        });
        const extras = domainKey === "team_portal"
            ? [
                api("/organizations"),
                api("/seasons"),
                api("/teams"),
                hasPermission("users.read") ? api("/users") : Promise.resolve([]),
                api("/team-portal/error-report").catch(() => ({ summary: { total: 0 }, issues: [] }))
                ]
                : domainKey === "msc_admin"
                    ? [
                        Promise.resolve([]),
                        api("/seasons").catch(() => []),
                        Promise.resolve([]),
                        Promise.resolve([]),
                        Promise.resolve({ summary: { total: 0 }, issues: [] })
                    ]
                : [Promise.resolve([]), Promise.resolve([]), Promise.resolve([]), Promise.resolve([]), Promise.resolve({ summary: { total: 0 }, issues: [] })];
        const [scope, records, logs, savedViews, notifications, models, organizations, seasons, teams, users, errorReport] = await Promise.all([
                api("/system-scope"),
                api(`/domain-records?${recordsQuery.toString()}`),
                api("/workflows/logs?limit=200&offset=0"),
                api(`/domain-views?domainKey=${encodeURIComponent(domainKey)}`),
                api("/notifications?limit=50&offset=0"),
                api("/domain-models"),
                ...extras
        ]);
        const domains = Array.isArray(scope?.domains) ? scope.domains : [];
        const workflows = Array.isArray(scope?.workflows) ? scope.workflows : [];
        state.scopeDomain = domains.find((entry) => entry.key === domainKey) || null;
        state.records = Array.isArray(records) ? records : [];
        state.workflows = relevantWorkflows(workflows);
        state.workflowLogs = (Array.isArray(logs) ? logs : []).filter((entry) => state.workflows.some((wf) => wf.key === entry.workflow_key));
        state.savedViews = Array.isArray(savedViews) ? savedViews : [];
        state.notifications = Array.isArray(notifications) ? notifications : [];
        state.models = Array.isArray(models) ? models : [];
        state.organizations = Array.isArray(organizations) ? organizations : [];
        state.seasons = Array.isArray(seasons) ? seasons : [];
        state.teams = Array.isArray(teams) ? teams : [];
        state.users = Array.isArray(users) ? users : [];
        state.errorReport = errorReport && typeof errorReport === "object" ? errorReport : { summary: { total: 0 }, issues: [] };

        ensureEnhancedSections();
        updateHeader();
        renderRecordForm();
        renderFilterOptions();
        renderSavedViews();
        bindSavedViewActions();
        bindFilterEvents();
        renderCapabilities();
        bindCommandDeckEvents();
        rerenderCommandDeck();
        renderDomainModelCard();
        renderWorkflowOptions();
        renderWorkflowLogs();
        renderNotifications();
        renderProblemScanner();
        renderTeamAdminPanel();
        renderSeasonAdminPanel();
        bindTeamAdminPanel();
        if (!hasPermission("organizations.write")) {
            applyReadOnlyUi("#ws-organization-form");
        }
        if (!hasPermission("teams.write")) {
            applyReadOnlyUi("#ws-team-admin-form");
        }
        if (domainKey === "msc_admin" && !hasPermission("seasons.write")) {
            applyReadOnlyUi("#ws-season-form");
            const seasonCard = document.getElementById("ws-season-admin-card");
            const body = seasonCard?.querySelector(".card-body");
            if (body && !body.querySelector("[data-season-readonly-hint='1']")) {
                const hint = document.createElement("div");
                hint.dataset.seasonReadonlyHint = "1";
                hint.className = "workspace-muted";
                hint.style.marginBottom = "10px";
                hint.textContent = "Saisonbearbeitung ist nur mit Admin-/Saison-Schreibrechten verfügbar.";
                body.prepend(hint);
            }
        }
        rerenderFilteredViews();
    }

    window.refreshDomainWorkspacePage = refreshDomainWorkspacePage;

    document.addEventListener("DOMContentLoaded", async () => {
        const recordForm = document.getElementById("ws-record-form");
        const workflowForm = document.getElementById("ws-workflow-form");
        state.canWrite = hasPermission(config.writePermission);

        if (recordForm && state.canWrite) {
            recordForm.addEventListener("input", () => saveDraft(recordForm));
            recordForm.addEventListener("change", () => saveDraft(recordForm));
        }

        recordForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const data = getFormData(recordForm);
            const payload = {
                domainKey,
                capabilityKey: data.capabilityKey || "",
                title: data.title || "",
                status: data.status || "planned",
                ownerRole: data.ownerRole || "",
                eventId: data.eventId ? Number(data.eventId) : null,
                payload: {
                    notes: data.notes || "",
                    severity: normalizedSeverity(data.severity || "medium"),
                    dueAt: toIsoFromLocalInput(data.dueAt),
                    escalation: data.escalation || "none",
                    tags: parseTags(data.tags),
                    externalRef: data.externalRef || ""
                }
            };
            try {
                if (data.eventId && (!Number.isInteger(Number(data.eventId)) || Number(data.eventId) <= 0)) {
                    throw new Error("Event-ID muss eine positive Zahl sein.");
                }
                if (data.dueAt && !payload.payload.dueAt) {
                    throw new Error("Ungültiges Fälligkeitsdatum.");
                }
                const recordId = Number(data.recordId || 0);
                await api(recordId > 0 ? `/domain-records/${recordId}` : "/domain-records", {
                    method: recordId > 0 ? "PATCH" : "POST",
                    body: JSON.stringify(payload)
                });
                showToast(recordId > 0 ? "Eintrag aktualisiert." : "Eintrag gespeichert.", "success");
                resetRecordForm();
                await refreshDomainWorkspacePage();
            } catch (error) {
                showToast(error.message, "error");
            }
        });

        workflowForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const data = getFormData(workflowForm);
            try {
                await runWorkflow(data.workflowKey || "", {
                    eventId: data.eventId ? Number(data.eventId) : null,
                    note: data.note || "",
                    clearance: data.clearance === "true",
                    source: `domain:${domainKey}`
                });
                showToast("Workflow ausgeführt.", "success");
                workflowForm.reset();
                await refreshDomainWorkspacePage();
            } catch (error) {
                showToast(error.message, "error");
            }
        });

        document.getElementById("ws-record-cancel")?.addEventListener("click", () => {
            resetRecordForm();
        });

        document.getElementById("ws-refresh-all")?.addEventListener("click", async () => {
            await refreshDomainWorkspacePage();
            showToast("Seite aktualisiert.", "info");
        });

        if (!state.canWrite) {
            applyReadOnlyUi("#ws-record-form");
            applyReadOnlyUi("#ws-workflow-form");
        }

        await refreshDomainWorkspacePage();
        if (recordForm && state.canWrite) {
            applyDraftToForm(recordForm, loadDraft());
        }
    });
}
