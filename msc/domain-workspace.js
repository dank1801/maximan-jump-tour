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

        if (!document.getElementById("ws-command-deck-card")) {
            const commandCard = document.createElement("div");
            commandCard.className = "card";
            commandCard.id = "ws-command-deck-card";
            commandCard.innerHTML = `
                <div class="card-header"><h2>Command Deck</h2></div>
                <div class="card-body">
                    <div class="workspace-actions-wrap">
                        <div class="workspace-action-box">
                            <h3>Quick Actions</h3>
                            <div class="workspace-chip-list" id="ws-quick-actions"></div>
                        </div>
                        <div class="workspace-action-box">
                            <h3>Playbooks</h3>
                            <div class="workspace-chip-list" id="ws-playbook-actions"></div>
                        </div>
                        <div class="workspace-action-box">
                            <h3>One-Click Workflows</h3>
                            <div class="workspace-chip-list" id="ws-workflow-shortcuts"></div>
                        </div>
                        <div class="workspace-action-box">
                            <h3>Verknüpfte Bereiche</h3>
                            <div class="workspace-chip-list" id="ws-related-links"></div>
                        </div>
                    </div>
                </div>
            `;
            const secondCard = content.querySelectorAll(".card")[1];
            if (secondCard) secondCard.insertAdjacentElement("afterend", commandCard);
            else content.prepend(commandCard);
        }

        if (!document.getElementById("ws-intelligence-card")) {
            const intelCard = document.createElement("div");
            intelCard.className = "card";
            intelCard.id = "ws-intelligence-card";
            intelCard.innerHTML = `
                <div class="card-header"><h2>Domain Intelligence</h2></div>
                <div class="card-body">
                    <div class="workspace-intelligence-grid" id="ws-intelligence-grid"></div>
                </div>
            `;
            document.getElementById("ws-command-deck-card")?.insertAdjacentElement("afterend", intelCard);
        }

        if (!document.getElementById("ws-status-board-card")) {
            const boardCard = document.createElement("div");
            boardCard.className = "card";
            boardCard.id = "ws-status-board-card";
            boardCard.innerHTML = `
                <div class="card-header"><h2>Operations Board</h2></div>
                <div class="card-body">
                    <div class="workspace-lane-grid" id="ws-status-board"></div>
                </div>
            `;
            document.getElementById("ws-intelligence-card")?.insertAdjacentElement("afterend", boardCard);
        }

        if (!document.getElementById("ws-sla-card")) {
            const slaCard = document.createElement("div");
            slaCard.className = "card";
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

        const recordsBody = document.getElementById("ws-records-body");
        const recordsCardBody = recordsBody?.closest(".card")?.querySelector(".card-body");
        if (recordsCardBody && !document.getElementById("ws-filter-row")) {
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
            due: String(document.getElementById("ws-filter-due")?.value || "").trim().toLowerCase()
        };
    }

    function filteredRecords() {
        const filters = getFilterValues();
        return state.records.filter((entry) => {
            const meta = extractMeta(entry);
            const due = dueState(meta.dueAt);
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
            const tags = meta.tags.length ? `<span class="workspace-mini-pill-list">${meta.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</span>` : "";
            const noteBlock = `
                <div>${escapeHtml(meta.notes || "—")}</div>
                <div class="workspace-note-meta">${severityBadge(meta.severity)} <span class="badge badge-${due.tone}">${escapeHtml(due.label)}</span></div>
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
                            ${state.canWrite ? `<button class="btn btn-small btn-secondary" type="button" data-edit-record="${entry.id}">Bearbeiten</button>` : ""}
                            ${state.canWrite ? `<button class="btn btn-small btn-secondary" type="button" data-mark-blocked="${entry.id}">Blockiert</button>` : ""}
                            ${state.canWrite ? `<button class="btn btn-small btn-danger" type="button" data-delete-record="${entry.id}">Löschen</button>` : ""}
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
        if (state.workflows.length === 0) {
            box.innerHTML = "<span class='workspace-muted'>Keine Workflows verfügbar.</span>";
            return;
        }
        box.innerHTML = state.workflows.map((workflow) => `
            <button type="button" class="workspace-chip-btn" data-run-workflow="${escapeHtml(workflow.key)}">${escapeHtml(workflow.name)}</button>
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
        const playbooks = experience().playbooks;
        if (!Array.isArray(playbooks) || playbooks.length === 0) {
            box.innerHTML = "<span class='workspace-muted'>Keine Playbooks konfiguriert.</span>";
            return;
        }
        box.innerHTML = playbooks.map((entry, idx) => `
            <button type="button" class="workspace-chip-btn" data-run-playbook="${idx}">${escapeHtml(entry.label || "Playbook")}</button>
        `).join("");
        box.querySelectorAll("[data-run-playbook]").forEach((button) => {
            if (!state.canWrite) {
                button.classList.add("readonly-action");
                button.disabled = true;
                return;
            }
            button.addEventListener("click", async () => {
                const idx = Number(button.getAttribute("data-run-playbook"));
                const playbook = playbooks[idx];
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
        const links = experience().relatedLinks;
        if (!Array.isArray(links) || links.length === 0) {
            node.innerHTML = "<span class='workspace-muted'>Keine Verknüpfungen konfiguriert.</span>";
            return;
        }
        node.innerHTML = links.map((entry) => `
            <a class="workspace-chip-link" href="${escapeHtml(entry.href || "#")}">${escapeHtml(entry.label || entry.href || "Bereich")}</a>
        `).join("");
    }

    function renderQuickActions() {
        const node = document.getElementById("ws-quick-actions");
        if (!node) return;
        const actions = experience().quickActions;
        if (!Array.isArray(actions) || actions.length === 0) {
            node.innerHTML = "<span class='workspace-muted'>Keine Quick Actions konfiguriert.</span>";
            return;
        }
        node.innerHTML = actions.map((entry, idx) => `
            <button type="button" class="workspace-chip-btn" data-quick-action="${idx}">${escapeHtml(entry.label || "Aktion")}</button>
        `).join("");
        node.querySelectorAll("[data-quick-action]").forEach((button) => {
            if (!state.canWrite) {
                button.classList.add("readonly-action");
                button.disabled = true;
                return;
            }
            button.addEventListener("click", () => {
                const idx = Number(button.getAttribute("data-quick-action"));
                const action = actions[idx];
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
        const clear = document.getElementById("ws-clear-filters");
        if (!search || search.dataset.bound === "1") return;

        search.dataset.bound = "1";
        [search, status, capability, owner, severity, due].forEach((node) => {
            if (!node) return;
            node.addEventListener("input", rerenderFilteredViews);
            node.addEventListener("change", rerenderFilteredViews);
        });
        clear?.addEventListener("click", () => {
            search.value = "";
            if (status) status.value = "";
            if (capability) capability.value = "";
            if (owner) owner.value = "";
            if (severity) severity.value = "";
            if (due) due.value = "";
            rerenderFilteredViews();
        });
    }

    async function refreshDomainWorkspacePage() {
        const [scope, records, logs] = await Promise.all([
            api("/system-scope"),
            api(`/domain-records?domainKey=${encodeURIComponent(domainKey)}`),
            api("/workflows/logs")
        ]);
        const domains = Array.isArray(scope?.domains) ? scope.domains : [];
        const workflows = Array.isArray(scope?.workflows) ? scope.workflows : [];
        state.scopeDomain = domains.find((entry) => entry.key === domainKey) || null;
        state.records = Array.isArray(records) ? records : [];
        state.workflows = relevantWorkflows(workflows);
        state.workflowLogs = (Array.isArray(logs) ? logs : []).filter((entry) => state.workflows.some((wf) => wf.key === entry.workflow_key));

        ensureEnhancedSections();
        updateHeader();
        renderRecordForm();
        renderFilterOptions();
        bindFilterEvents();
        renderCapabilities();
        renderQuickActions();
        renderPlaybooks();
        renderWorkflowShortcuts();
        renderRelatedLinks();
        renderWorkflowOptions();
        renderWorkflowLogs();
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
