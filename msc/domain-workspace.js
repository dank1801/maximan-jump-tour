/* ========================================
   MSC Portal - Dedicated Domain Workspaces
   ======================================== */

const DOMAIN_EXPERIENCE_PRESETS = {
    msc_admin: {
        subtitle: "Regelversionierung, Saisonplanung, Jury, Disziplinar und Finanzen in einer Leitstelle.",
        quickActions: [
            { label: "Neue Regelversion", capabilityKey: "rule_versioning", status: "planned", title: "Regelwerk Update" },
            { label: "Jury-Fall eröffnen", capabilityKey: "jury_management", status: "in_progress", title: "Jury Incident Case" },
            { label: "Disziplinarvorgang starten", capabilityKey: "discipline_cases", status: "in_progress", title: "Disziplinarfall" }
        ],
        relatedLinks: [
            { href: "points.html", label: "Punkte & Wertungen" },
            { href: "events.html", label: "Wettkämpfe" },
            { href: "reporting.html", label: "Reporting & Audit" }
        ]
    },
    loc: {
        subtitle: "Schanzenfreigabe, Windmonitoring, Gate-Steuerung und Notfallmanagement.",
        quickActions: [
            { label: "Schanze freigeben", capabilityKey: "hill_clearance", status: "live", title: "Hill Clearance Ready" },
            { label: "Wind-Alarm anlegen", capabilityKey: "wind_monitoring", status: "blocked", title: "Wind Alert" },
            { label: "Notfallprotokoll starten", capabilityKey: "emergency_protocols", status: "in_progress", title: "Emergency Protocol" }
        ],
        relatedLinks: [
            { href: "operations.html", label: "Operations Hub" },
            { href: "events.html", label: "Wettkampfsteuerung" },
            { href: "dashboard.html", label: "Gesamtdashboard" }
        ]
    },
    team_portal: {
        subtitle: "Registrierung, Athletenpflege, Materialchecks, Transfers und Medical Uploads.",
        quickActions: [
            { label: "Team-Registrierung prüfen", capabilityKey: "registration", status: "in_progress", title: "Registrierung Check" },
            { label: "Materialcheck öffnen", capabilityKey: "material_checks", status: "planned", title: "Materialprüfung" },
            { label: "Medical Upload prüfen", capabilityKey: "medical_uploads", status: "in_progress", title: "Medical Review" }
        ],
        relatedLinks: [
            { href: "teams.html", label: "Teams & Lizenzen" },
            { href: "transfers.html", label: "Transfers & Verträge" },
            { href: "events.html", label: "Eventbezug" }
        ]
    },
    athlete_app: {
        subtitle: "Athletenprofil, Medical Clearance, Startlisten, Resultate und Notifications.",
        quickActions: [
            { label: "Profil aktualisieren", capabilityKey: "profiles", status: "in_progress", title: "Athlete Profile Update" },
            { label: "Medical Status setzen", capabilityKey: "medical_clearance", status: "live", title: "Medical Clearance" },
            { label: "Notification einplanen", capabilityKey: "notifications", status: "planned", title: "Push Benachrichtigung" }
        ],
        relatedLinks: [
            { href: "events.html", label: "Startlisten & Events" },
            { href: "reporting.html", label: "Resultat-Reporting" },
            { href: "operations.html", label: "Operations Hub" }
        ]
    },
    public_site: {
        subtitle: "Live Ticker, Startlisten, Standings und Clip-Publikation mit Embargo-Kontrolle.",
        quickActions: [
            { label: "Ticker-Eintrag live schalten", capabilityKey: "live_ticker", status: "live", title: "Live Ticker Update" },
            { label: "Standings einfrieren", capabilityKey: "standings", status: "in_progress", title: "Standings Freeze" },
            { label: "Embargo-Clip vorbereiten", capabilityKey: "embargo_clips", status: "planned", title: "Embargo Clip Queue" }
        ],
        relatedLinks: [
            { href: "reporting.html", label: "Publikationen" },
            { href: "points.html", label: "Wertungen" },
            { href: "operations.html", label: "Live Operations" }
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
        editingRecordId: null,
        canWrite: false
    };

    function experience() {
        return {
            subtitle: config.subtitle || preset.subtitle || "Domänensteuerung",
            quickActions: Array.isArray(config.quickActions) ? config.quickActions : (preset.quickActions || []),
            relatedLinks: Array.isArray(config.relatedLinks) ? config.relatedLinks : (preset.relatedLinks || [])
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
            if (secondCard) {
                secondCard.insertAdjacentElement("afterend", commandCard);
            } else {
                content.prepend(commandCard);
            }
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
            const commandCard = document.getElementById("ws-command-deck-card");
            if (commandCard) {
                commandCard.insertAdjacentElement("afterend", boardCard);
            }
        }

        const recordsBody = document.getElementById("ws-records-body");
        const recordsCardBody = recordsBody?.closest(".card")?.querySelector(".card-body");
        if (recordsCardBody && !document.getElementById("ws-filter-row")) {
            const filterBar = document.createElement("div");
            filterBar.id = "ws-filter-row";
            filterBar.className = "workspace-filter-bar";
            filterBar.innerHTML = `
                <input type="search" id="ws-filter-search" placeholder="Suche nach Titel, Funktion, Owner, Notiz..." />
                <select id="ws-filter-status"><option value="">Alle Status</option></select>
                <select id="ws-filter-capability"><option value="">Alle Funktionen</option></select>
                <select id="ws-filter-owner"><option value="">Alle Owner</option></select>
                <button type="button" class="btn btn-secondary btn-small" id="ws-clear-filters">Filter zurücksetzen</button>
            `;
            recordsCardBody.prepend(filterBar);
        }
    }

    function getFilterValues() {
        return {
            search: String(document.getElementById("ws-filter-search")?.value || "").trim().toLowerCase(),
            status: String(document.getElementById("ws-filter-status")?.value || "").trim().toLowerCase(),
            capability: String(document.getElementById("ws-filter-capability")?.value || "").trim(),
            owner: String(document.getElementById("ws-filter-owner")?.value || "").trim().toLowerCase()
        };
    }

    function filteredRecords() {
        const filters = getFilterValues();
        return state.records.filter((entry) => {
            const entryStatus = normalizedStatus(entry.status);
            if (filters.status && entryStatus !== filters.status) return false;
            if (filters.capability && String(entry.capability_key || "") !== filters.capability) return false;
            if (filters.owner && String(entry.owner_role || "").toLowerCase() !== filters.owner) return false;
            if (filters.search) {
                const source = [
                    entry.title,
                    capabilityLabel(entry.capability_key),
                    entry.owner_role,
                    entry.payload?.notes
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
        const total = records.length;
        const live = records.filter((entry) => normalizedStatus(entry.status) === "live").length;
        const blocked = records.filter((entry) => normalizedStatus(entry.status) === "blocked").length;
        const latest = records[0]?.updated_at || records[0]?.created_at || null;
        const kpiTotal = document.getElementById("ws-kpi-total");
        const kpiLive = document.getElementById("ws-kpi-live");
        const kpiBlocked = document.getElementById("ws-kpi-blocked");
        const kpiUpdated = document.getElementById("ws-kpi-updated");
        if (kpiTotal) kpiTotal.textContent = String(total);
        if (kpiLive) kpiLive.textContent = String(live);
        if (kpiBlocked) kpiBlocked.textContent = String(blocked);
        if (kpiUpdated) kpiUpdated.textContent = latest ? formatDateTime(latest) : "—";
    }

    function renderCapabilities() {
        const container = document.getElementById("ws-capability-cards");
        if (!container) return;
        const capabilities = Array.isArray(state.scopeDomain?.capabilities) ? state.scopeDomain.capabilities : [];
        const html = capabilities.map((entry) => {
            const records = state.records.filter((record) => record.capability_key === entry.key);
            const liveCount = records.filter((record) => normalizedStatus(record.status) === "live").length;
            const blockedCount = records.filter((record) => normalizedStatus(record.status) === "blocked").length;
            return `
                <div class="kpi-card">
                    <div class="kpi-label">${escapeHtml(entry.name)}</div>
                    <div class="kpi-value">${records.length}</div>
                    <div class="kpi-subtext">Live: ${liveCount} · Blockiert: ${blockedCount}</div>
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
        state.editingRecordId = null;
        const submit = document.getElementById("ws-record-submit");
        if (submit) submit.textContent = "Eintrag speichern";
        document.getElementById("ws-record-cancel")?.classList.add("hidden");
        renderRecordForm();
    }

    function openRecordDetails(record) {
        const payload = record?.payload && typeof record.payload === "object" ? record.payload : {};
        const notes = String(payload.notes || "—");
        const json = escapeHtml(JSON.stringify(payload, null, 2));
        showModal(
            `Eintrag: ${escapeHtml(record.title || "—")}`,
            `
                <p><strong>Funktion:</strong> ${escapeHtml(capabilityLabel(record.capability_key))}</p>
                <p><strong>Status:</strong> ${escapeHtml(WORKSPACE_STATUS_LABELS[normalizedStatus(record.status)] || record.status || "—")}</p>
                <p><strong>Owner:</strong> ${escapeHtml(record.owner_role || "—")}</p>
                <p><strong>Event-ID:</strong> ${escapeHtml(record.event_id ? String(record.event_id) : "—")}</p>
                <p><strong>Notiz:</strong> ${escapeHtml(notes)}</p>
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
        const html = rows.map((entry) => `
            <tr>
                <td>${formatDateTime(entry.updated_at || entry.created_at)}</td>
                <td>${escapeHtml(capabilityLabel(entry.capability_key))}</td>
                <td><strong>${escapeHtml(entry.title || "—")}</strong></td>
                <td>${statusBadge(normalizedStatus(entry.status))}</td>
                <td>${escapeHtml(entry.owner_role || "—")}</td>
                <td>${escapeHtml(entry.payload?.notes || "—")}</td>
                <td>
                    <div class="actions-inline">
                        <button class="btn btn-small btn-secondary" type="button" data-view-record="${entry.id}">Details</button>
                        ${state.canWrite ? `<button class="btn btn-small btn-secondary" type="button" data-edit-record="${entry.id}">Bearbeiten</button>` : ""}
                        ${state.canWrite ? `<button class="btn btn-small btn-danger" type="button" data-delete-record="${entry.id}">Löschen</button>` : ""}
                    </div>
                </td>
            </tr>
        `).join("");
        tbody.innerHTML = html || "<tr><td colspan='7' class='table-empty'>Keine Einträge für die aktuelle Filterung.</td></tr>";

        tbody.querySelectorAll("[data-view-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-view-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                if (!record) return;
                openRecordDetails(record);
            });
        });

        tbody.querySelectorAll("[data-edit-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-edit-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                if (!record) return;
                const form = document.getElementById("ws-record-form");
                form.elements.recordId.value = String(record.id);
                form.elements.capabilityKey.value = record.capability_key || "";
                form.elements.title.value = record.title || "";
                form.elements.status.value = normalizedStatus(record.status);
                form.elements.ownerRole.value = record.owner_role || "";
                form.elements.eventId.value = record.event_id ? String(record.event_id) : "";
                form.elements.notes.value = record.payload?.notes || "";
                state.editingRecordId = record.id;
                const submit = document.getElementById("ws-record-submit");
                if (submit) submit.textContent = "Eintrag aktualisieren";
                document.getElementById("ws-record-cancel")?.classList.remove("hidden");
                form.scrollIntoView({ behavior: "smooth", block: "start" });
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

    function renderStatusBoard() {
        const board = document.getElementById("ws-status-board");
        if (!board) return;
        const rows = filteredRecords();
        const html = WORKSPACE_STATUS_ORDER.map((status) => {
            const items = rows.filter((entry) => normalizedStatus(entry.status) === status);
            const rowsHtml = items.slice(0, 8).map((entry) => `
                <li>
                    <button type="button" class="workspace-lane-item" data-focus-record="${entry.id}">
                        <span>${escapeHtml(entry.title || "—")}</span>
                        <small>${escapeHtml(capabilityLabel(entry.capability_key))}</small>
                    </button>
                    ${
                        state.canWrite && status !== "live"
                            ? `<button type="button" class="btn btn-small btn-secondary" data-mark-live="${entry.id}">Live</button>`
                            : ""
                    }
                </li>
            `).join("");
            return `
                <section class="workspace-lane">
                    <header>
                        <span class="workspace-lane-title">${escapeHtml(WORKSPACE_STATUS_LABELS[status] || status)}</span>
                        <span class="workspace-lane-count">${items.length}</span>
                    </header>
                    <ul>${rowsHtml || "<li class='table-empty'>Keine Einträge</li>"}</ul>
                </section>
            `;
        }).join("");
        board.innerHTML = html;

        board.querySelectorAll("[data-focus-record]").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.getAttribute("data-focus-record"));
                const record = state.records.find((entry) => Number(entry.id) === id);
                if (!record) return;
                openRecordDetails(record);
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

    function relevantWorkflows(scopeWorkflows = []) {
        const byConfig = workflowKeys.length > 0
            ? scopeWorkflows.filter((entry) => workflowKeys.includes(entry.key))
            : scopeWorkflows;
        return byConfig;
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

    function renderWorkflowLogs() {
        const tbody = document.getElementById("ws-workflow-body");
        if (!tbody) return;
        const html = state.workflowLogs.map((entry) => `
            <tr>
                <td>${formatDateTime(entry.created_at)}</td>
                <td><strong>${escapeHtml(entry.workflow_name || entry.workflow_key || "—")}</strong></td>
                <td>${statusBadge(entry.status || "completed")}</td>
                <td>${escapeHtml(entry.payload?.decision || entry.payload?.steps?.join(" → ") || "—")}</td>
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
                const form = document.getElementById("ws-record-form");
                if (!form) return;
                form.elements.recordId.value = "";
                form.elements.capabilityKey.value = action.capabilityKey || "";
                form.elements.title.value = action.title || "";
                form.elements.status.value = action.status || "planned";
                form.elements.notes.value = action.note || "";
                form.elements.ownerRole.value = "";
                form.elements.eventId.value = "";
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

    function bindFilterEvents() {
        const search = document.getElementById("ws-filter-search");
        const status = document.getElementById("ws-filter-status");
        const capability = document.getElementById("ws-filter-capability");
        const owner = document.getElementById("ws-filter-owner");
        const clear = document.getElementById("ws-clear-filters");
        if (!search || search.dataset.bound === "1") return;

        const rerender = () => {
            updateKpis();
            renderRecordsTable();
            renderStatusBoard();
        };

        search.dataset.bound = "1";
        [search, status, capability, owner].forEach((node) => {
            if (!node) return;
            node.addEventListener("input", rerender);
            node.addEventListener("change", rerender);
        });
        clear?.addEventListener("click", () => {
            search.value = "";
            if (status) status.value = "";
            if (capability) capability.value = "";
            if (owner) owner.value = "";
            rerender();
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
        updateKpis();
        renderCapabilities();
        renderQuickActions();
        renderRelatedLinks();
        renderStatusBoard();
        renderRecordsTable();
        renderWorkflowOptions();
        renderWorkflowShortcuts();
        renderWorkflowLogs();
    }

    window.refreshDomainWorkspacePage = refreshDomainWorkspacePage;

    document.addEventListener("DOMContentLoaded", async () => {
        const recordForm = document.getElementById("ws-record-form");
        const workflowForm = document.getElementById("ws-workflow-form");
        state.canWrite = hasPermission(config.writePermission) || hasPermission("dashboard.read");

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
                payload: { notes: data.notes || "" }
            };
            try {
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
            const payload = {
                workflowKey: data.workflowKey || "",
                input: {
                    eventId: data.eventId ? Number(data.eventId) : null,
                    note: data.note || "",
                    clearance: data.clearance === "true"
                }
            };
            try {
                await runWorkflow(payload.workflowKey, payload.input);
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
    });
}
