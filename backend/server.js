const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const { WebSocketServer } = require("ws");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const RENDER_DISK_MOUNT_PATH = process.env.RENDER_DISK_MOUNT_PATH || "";
function parseEnvBoolean(value, fallback = false) {
    const raw = String(value ?? "").trim().toLowerCase();
    if (!raw) return fallback;
    if (["true", "1", "yes", "on", "ja"].includes(raw)) return true;
    if (["false", "0", "no", "off", "nein"].includes(raw)) return false;
    return fallback;
}
const REQUIRE_PERSISTENT_DB = parseEnvBoolean(process.env.REQUIRE_PERSISTENT_DB, IS_PRODUCTION);
const BASE_URL = process.env.BASE_URL || (IS_PRODUCTION ? "https://maximan-jump-tour.onrender.com" : "http://localhost:3000");
const INVITATION_TOKEN_EXPIRES_HOURS = 48;

let emailTransporter = null;

const DEFAULT_RUNTIME_DIR = path.join(__dirname, "..", ".runtime", "data");
const PERSISTENT_DIR_CANDIDATES = [
    String(process.env.DB_DIR || "").trim(),
    RENDER_DISK_MOUNT_PATH ? RENDER_DISK_MOUNT_PATH : "",
    "/var/data"
].filter(Boolean);

function ensureWritableDirectory(directory) {
    fs.mkdirSync(directory, { recursive: true });
    fs.accessSync(directory, fs.constants.W_OK);
}

let DB_DIR = DEFAULT_RUNTIME_DIR;
let usingPersistentStorage = false;
let lastPersistentError = null;

if (IS_PRODUCTION) {
    for (const candidate of PERSISTENT_DIR_CANDIDATES) {
        try {
            ensureWritableDirectory(candidate);
            DB_DIR = candidate;
            usingPersistentStorage = true;
            break;
        } catch (error) {
            lastPersistentError = `${candidate}: ${error.message}`;
        }
    }
    if (!usingPersistentStorage) {
        if (REQUIRE_PERSISTENT_DB) {
            throw new Error(
                `Kein persistentes Datenverzeichnis verfügbar (${lastPersistentError || "kein Kandidat"}). `
                + "Bitte in Render einen Persistent Disk Mount einrichten und DB_DIR auf den Mount-Pfad setzen."
            );
        }
        console.warn(
            `WARNUNG: Persistenter Speicher nicht verfügbar (${lastPersistentError || "kein Kandidat"}). `
            + "Es wird ein temporäres Laufzeitverzeichnis genutzt; Daten können bei Redeploy verloren gehen."
        );
        ensureWritableDirectory(DEFAULT_RUNTIME_DIR);
        DB_DIR = DEFAULT_RUNTIME_DIR;
    }
} else {
    ensureWritableDirectory(DEFAULT_RUNTIME_DIR);
    DB_DIR = DEFAULT_RUNTIME_DIR;
}

const DB_PATH = path.join(DB_DIR, "msc-portal.db");
const STATIC_ROOT = path.join(__dirname, "..");

if (IS_PRODUCTION && !JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production");
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || "dev-insecure-secret";

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
const wsClients = new Map();

function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            description TEXT,
            permissions_json TEXT NOT NULL,
            required_assignments_json TEXT NOT NULL DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'active',
            is_system INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            last_login_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_scope_assignments (
            user_id INTEGER PRIMARY KEY,
            team_id INTEGER,
            event_id INTEGER,
            venue_code TEXT,
            other_scope TEXT,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            nation TEXT,
            category TEXT,
            manager_user_id INTEGER,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            member_role TEXT NOT NULL,
            license_type TEXT,
            license_valid_until TEXT,
            license_status TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS seasons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            start_date TEXT,
            end_date TEXT,
            points_rules TEXT,
            status TEXT NOT NULL DEFAULT 'planned',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            event_date TEXT,
            season_id INTEGER,
            event_type TEXT,
            status TEXT NOT NULL DEFAULT 'planned',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS jury_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            decision_type TEXT NOT NULL,
            notes TEXT NOT NULL,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS point_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            rule_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS event_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            entry_name TEXT NOT NULL,
            rank_position INTEGER,
            points REAL NOT NULL DEFAULT 0,
            bonus_points REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            athlete_name TEXT NOT NULL,
            from_team_id INTEGER,
            to_team_id INTEGER,
            status TEXT NOT NULL DEFAULT 'requested',
            lock_until TEXT,
            is_emergency INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_team_id) REFERENCES teams(id) ON DELETE SET NULL,
            FOREIGN KEY (to_team_id) REFERENCES teams(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            status TEXT NOT NULL DEFAULT 'in_review',
            expires_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS publications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            format TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            published_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS module_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_key TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            owner_role TEXT,
            payload_json TEXT NOT NULL DEFAULT '{}',
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workflow_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workflow_key TEXT NOT NULL,
            workflow_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed',
            payload_json TEXT NOT NULL DEFAULT '{}',
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_user_id INTEGER,
            actor_username TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            details TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

function migrateUsersEmailConstraint() {
    const schemaRow = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
    const createSql = String(schemaRow?.sql || "");
    if (!/email[^,]*\bunique\b/i.test(createSql)) {
        return;
    }
    db.exec(`
        PRAGMA foreign_keys = OFF;
        BEGIN;
        ALTER TABLE users RENAME TO users_old_unique_email;
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            last_login_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users (id, username, name, email, role, password_hash, status, last_login_at, created_at, updated_at)
        SELECT id, username, name, email, role, password_hash, status, last_login_at, created_at, updated_at
        FROM users_old_unique_email;
        DROP TABLE users_old_unique_email;
        COMMIT;
        PRAGMA foreign_keys = ON;
    `);
}

function dropUsersEmailUniqueIndexes() {
    const indexes = db.prepare("PRAGMA index_list(users)").all();
    for (const index of indexes) {
        if (!index || Number(index.unique) !== 1 || !index.name || String(index.name).startsWith("sqlite_autoindex")) {
            continue;
        }
        const columns = db.prepare(`PRAGMA index_info("${String(index.name).replace(/"/g, "\"\"")}")`).all();
        const hasEmailColumn = columns.some((column) => String(column?.name || "").toLowerCase() === "email");
        if (!hasEmailColumn) {
            continue;
        }
        db.prepare(`DROP INDEX IF EXISTS "${String(index.name).replace(/"/g, "\"\"")}"`).run();
    }
}

function ensureRolesRequiredAssignmentsColumn() {
    const columns = db.prepare("PRAGMA table_info(roles)").all();
    const hasColumn = columns.some((column) => column.name === "required_assignments_json");
    if (!hasColumn) {
        db.prepare("ALTER TABLE roles ADD COLUMN required_assignments_json TEXT NOT NULL DEFAULT '[]'").run();
    }
}

function ensureInvitationsTable() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            expires_at TEXT NOT NULL,
            accepted_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
        CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
    `);
}

async function initializeEmailTransporter() {
    if (IS_PRODUCTION && process.env.SMTP_HOST) {
        emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else if (IS_PRODUCTION) {
        console.warn("WARNUNG: Kein SMTP konfiguriert. Invitations werden nicht per Email versendet.");
        emailTransporter = null;
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            emailTransporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log("Test-Email-Account konfiguriert. Preview-URLs werden in Logs angezeigt.");
        } catch (err) {
            console.error("Email-Transporter konnte nicht initialisiert werden:", err.message);
            emailTransporter = null;
        }
    }
    return emailTransporter;
}

async function sendInvitationEmail(email, token) {
    if (!emailTransporter) {
        console.warn(`Invitation-Email an ${email} konnte nicht versendet werden (Email nicht konfiguriert). Token: ${token}`);
        return false;
    }

    const acceptUrl = `${BASE_URL}/accept-invitation.html?token=${encodeURIComponent(token)}`;
    const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@maximan-jump-tour.local",
        to: email,
        subject: "Willkommen! MSC Portal Account aktivieren",
        html: `
            <h2>Willkommen zum MSC Portal!</h2>
            <p>Ein Administrator hat einen Account für Sie erstellt.</p>
            <p>Um Ihren Account zu aktivieren und ein Passwort zu setzen, bitte klicken Sie hier:</p>
            <p><a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Account aktivieren</a></p>
            <p>Dieser Link läuft in ${INVITATION_TOKEN_EXPIRES_HOURS} Stunden ab.</p>
            <hr>
            <p>Falls Sie diesen Link nicht angefordert haben, ignorieren Sie diese Email.</p>
        `
    };

    try {
        const info = await emailTransporter.sendMail(mailOptions);
        if (!IS_PRODUCTION) {
            console.log("Test-Email versendet. Preview-URL:", nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (err) {
        console.error(`Fehler beim Versand von Invitation-Email an ${email}:`, err.message);
        return false;
    }
}


const ALL_PERMISSIONS = [
    "dashboard.read",
    "audit.read",
    "users.read",
    "users.write",
    "roles.read",
    "roles.write",
    "teams.read",
    "teams.write",
    "team_members.read",
    "team_members.write",
    "seasons.read",
    "seasons.write",
    "events.read",
    "events.write",
    "jury_decisions.read",
    "jury_decisions.write",
    "point_rules.read",
    "point_rules.write",
    "event_scores.read",
    "event_scores.write",
    "transfers.read",
    "transfers.write",
    "contracts.read",
    "contracts.write",
    "publications.read",
    "publications.write",
    "settings.read",
    "settings.write",
    "venues.read",
    "venues.write",
    "competition_engine.read",
    "competition_engine.write",
    "medical.read",
    "medical.write",
    "material.read",
    "material.write",
    "discipline.read",
    "discipline.write",
    "finance.read",
    "finance.write",
    "accreditation.read",
    "accreditation.write",
    "public_api.read",
    "workflows.execute"
];

const DEFAULT_ROLE_DEFINITIONS = [
    {
        name: "MSC Admin",
        description: "Voller Zugriff auf alle Bereiche.",
        permissions: [...ALL_PERMISSIONS]
    },
    {
        name: "Teammanager",
        description: "Verwaltet Teams, Mitglieder und Teamdaten.",
        requiredAssignments: ["team"],
        permissions: [
            "dashboard.read",
            "teams.read",
            "teams.write",
            "team_members.read",
            "team_members.write",
            "events.read",
            "point_rules.read",
            "event_scores.read",
            "transfers.read",
            "contracts.read"
        ]
    },
    {
        name: "Jury",
        description: "Pflegt Wettkämpfe, Punktregeln und Jury-Entscheidungen.",
        requiredAssignments: ["event"],
        permissions: [
            "dashboard.read",
            "events.read",
            "events.write",
            "jury_decisions.read",
            "jury_decisions.write",
            "point_rules.read",
            "point_rules.write",
            "event_scores.read",
            "event_scores.write",
            "teams.read",
            "team_members.read",
            "transfers.read",
            "publications.read"
        ]
    },
    {
        name: "Lizenzstelle",
        description: "Bearbeitet Lizenz- und Vertragsprozesse.",
        requiredAssignments: ["team"],
        permissions: [
            "dashboard.read",
            "teams.read",
            "team_members.read",
            "team_members.write",
            "transfers.read",
            "transfers.write",
            "contracts.read",
            "contracts.write",
            "audit.read"
        ]
    },
    {
        name: "Reporter",
        description: "Erstellt Veröffentlichungen und Reporting-Ausgaben.",
        requiredAssignments: [],
        permissions: [
            "dashboard.read",
            "events.read",
            "point_rules.read",
            "event_scores.read",
            "publications.read",
            "publications.write",
            "audit.read"
        ]
    }
];

const POINT_RULE_TEMPLATE_IDS = [
    "top_10",
    "top_30",
    "top_50",
    "maedzn_2026",
    "microjump_2026",
    "puenki_2026",
    "finalissimo_2026"
];

const TIE_BREAK_OPTIONS = [
    "most_wins",
    "most_second_places",
    "most_third_places",
    "best_single",
    "head_to_head",
    "best_final_round",
    "last_event",
    "lot_draw"
];

const BONUS_TRIGGER_OPTIONS = [
    "record",
    "streak",
    "mastery",
    "momentum",
    "clean_sweep",
    "finalissimo_double"
];

const ROLE_ASSIGNMENT_TARGETS = ["team", "venue", "event", "other"];

const SYSTEM_SCOPE_MODULES = [
    { key: "identity_access", name: "Identity & Access", priority: "critical", category: "governance" },
    { key: "team_athlete_management", name: "Team & Athlete Management", priority: "critical", category: "sport" },
    { key: "season_event_management", name: "Season & Event Management", priority: "critical", category: "sport" },
    { key: "venue_hill_management", name: "Venue & Hill Management", priority: "high", category: "operations" },
    { key: "competition_engine", name: "Competition Engine", priority: "critical", category: "sport" },
    { key: "scoring_rule_engine", name: "Scoring & Rule Engine", priority: "critical", category: "sport" },
    { key: "medical_safety", name: "Medical & Safety", priority: "critical", category: "safety" },
    { key: "material_control", name: "Material Control", priority: "high", category: "operations" },
    { key: "transfers_contracts", name: "Transfers & Contracts", priority: "high", category: "governance" },
    { key: "discipline_ethics", name: "Discipline & Ethics", priority: "high", category: "governance" },
    { key: "finance_prize_money", name: "Finance & Prize Money", priority: "high", category: "finance" },
    { key: "media_accreditation", name: "Media & Accreditation", priority: "high", category: "media" },
    { key: "reporting_public_api", name: "Reporting & Public API", priority: "critical", category: "media" }
];

const WORKFLOW_BLUEPRINTS = [
    {
        key: "event_setup",
        name: "Event Setup",
        steps: ["LOC erstellt Event", "MSC prüft Zertifizierung", "Jury wird zugewiesen", "Startlisten werden veröffentlicht"]
    },
    {
        key: "result_flow",
        name: "Result Flow",
        steps: ["Haltungsnoten erfasst", "Weitenfeed empfangen", "Wettkampfleitung bestätigt", "Rule Engine berechnet", "Live Push"]
    },
    {
        key: "jury_intervention",
        name: "Jury Intervention",
        steps: ["Gate Change/Abort", "Sofort Audit", "Benachrichtigung an Teams", "Neuberechnung wenn erforderlich"]
    },
    {
        key: "medical_flow",
        name: "Medical Flow",
        steps: ["SPU/ZU/FPU/NSU Upload", "Medical Clearance gesetzt", "Startfreigabe geprüft"]
    }
];

function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

function hasAnyRole(userRole, allowedRoles) {
    const normalized = normalizeRole(userRole);
    return allowedRoles.map(normalizeRole).includes(normalized);
}

function signToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role,
            name: user.name
        },
        EFFECTIVE_JWT_SECRET,
        { expiresIn: "12h" }
    );
}

function parsePermissions(value) {
    const list = Array.isArray(value) ? value : [];
    return [...new Set(list.map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function parseRoleRequiredAssignments(value) {
    const list = Array.isArray(value) ? value : [];
    return [...new Set(list
        .map((entry) => String(entry || "").trim().toLowerCase())
        .filter((entry) => ROLE_ASSIGNMENT_TARGETS.includes(entry))
    )];
}

function getRoleAssignmentRequirementsByName(roleName) {
    const row = db
        .prepare("SELECT required_assignments_json FROM roles WHERE LOWER(name) = LOWER(?) LIMIT 1")
        .get(String(roleName || "").trim());
    if (!row) {
        const fallback = DEFAULT_ROLE_DEFINITIONS.find(
            (entry) => normalizeRole(entry.name) === normalizeRole(roleName)
        );
        return parseRoleRequiredAssignments(fallback?.requiredAssignments || []);
    }
    return parseRoleRequiredAssignments(parseConfigJsonSafely(row.required_assignments_json || "[]"));
}

function buildDescendingScale(maxRank, startPoints, step, minimumPoints = 1) {
    const safeMax = Math.max(1, Number(maxRank) || 1);
    const safeStart = Math.max(1, Number(startPoints) || 1);
    const safeStep = Math.max(0, Number(step) || 0);
    const safeMin = Math.max(0, Number(minimumPoints) || 0);
    return Array.from({ length: safeMax }, (_, index) => {
        const rank = index + 1;
        const points = Math.max(safeMin, safeStart - (index * safeStep));
        return { rank, points: Number(points.toFixed(2)) };
    });
}

function pointRuleTemplates() {
    return [
        {
            id: "top_10",
            label: "Top 10",
            description: "Klassische lineare Top-10-Wertung.",
            ruleType: "top_10",
            config: {
                pointsScale: buildDescendingScale(10, 100, 9, 10),
                team: { method: "sum", topN: 3, rounding: "none", dropWorst: 0 },
                bonusProfiles: [],
                tieBreak: ["most_wins", "best_single", "last_event"]
            }
        },
        {
            id: "top_30",
            label: "Top 30",
            description: "Breite Saisonwertung mit Punkten bis Platz 30.",
            ruleType: "top_30",
            config: {
                pointsScale: buildDescendingScale(30, 120, 4, 2),
                team: { method: "best_n", topN: 4, rounding: "none", dropWorst: 1 },
                bonusProfiles: [],
                tieBreak: ["most_wins", "most_second_places", "best_single", "last_event"]
            }
        },
        {
            id: "top_50",
            label: "Top 50",
            description: "Sehr breite Wertung für große Starterfelder.",
            ruleType: "top_50",
            config: {
                pointsScale: buildDescendingScale(50, 150, 3, 1),
                team: { method: "best_n", topN: 5, rounding: "none", dropWorst: 1 },
                bonusProfiles: [],
                tieBreak: ["most_wins", "most_second_places", "most_third_places", "best_single", "last_event"]
            }
        },
        {
            id: "maedzn_2026",
            label: "Mädzn 2026/27",
            description: "Regelwerksnahes Setup mit Mastery- und Momentum-Bonus.",
            ruleType: "msc_2026",
            config: {
                pointsScale: buildDescendingScale(30, 100, 3, 3),
                team: { method: "best_n", topN: 4, rounding: "none", dropWorst: 1 },
                bonusProfiles: [
                    { trigger: "mastery", points: 12, multiplier: 1, threshold: 2, appliesTo: "all", enabled: true },
                    { trigger: "momentum", points: 8, multiplier: 1, threshold: 3, appliesTo: "all", enabled: true }
                ],
                tieBreak: ["most_wins", "best_final_round", "head_to_head", "last_event"]
            }
        },
        {
            id: "microjump_2026",
            label: "MicroJump 2026/27",
            description: "Kompakte Punkteverteilung mit Fokus auf Konstanz.",
            ruleType: "msc_2026",
            config: {
                pointsScale: buildDescendingScale(20, 80, 3, 2),
                team: { method: "avg", topN: 3, rounding: "round", dropWorst: 0 },
                bonusProfiles: [
                    { trigger: "streak", points: 10, multiplier: 1, threshold: 3, appliesTo: "qualification", enabled: true }
                ],
                tieBreak: ["most_wins", "most_second_places", "best_single", "last_event"]
            }
        },
        {
            id: "puenki_2026",
            label: "Pünki 2026/27",
            description: "Setup mit Bonus für Clean-Sweep pro Block.",
            ruleType: "msc_2026",
            config: {
                pointsScale: buildDescendingScale(25, 90, 3, 2),
                team: { method: "best_n", topN: 3, rounding: "none", dropWorst: 0 },
                bonusProfiles: [
                    { trigger: "clean_sweep", points: 15, multiplier: 1, threshold: 1, appliesTo: "knockout", enabled: true }
                ],
                tieBreak: ["most_wins", "head_to_head", "best_single", "last_event"]
            }
        },
        {
            id: "finalissimo_2026",
            label: "Finalissimo 2026/27",
            description: "Finalmodus mit Double-Points Bonusprofil.",
            ruleType: "msc_2026",
            config: {
                pointsScale: buildDescendingScale(16, 120, 6, 4),
                team: { method: "sum", topN: 2, rounding: "none", dropWorst: 0 },
                bonusProfiles: [
                    { trigger: "finalissimo_double", points: 0, multiplier: 2, threshold: 1, appliesTo: "finalissimo", enabled: true }
                ],
                tieBreak: ["most_wins", "best_final_round", "head_to_head", "lot_draw"]
            }
        }
    ];
}

function normalizePointScale(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const sanitized = [];
    value.forEach((entry) => {
        const rank = Number(entry?.rank);
        const points = Number(entry?.points);
        if (!Number.isInteger(rank) || rank <= 0 || rank > 500) return;
        if (!Number.isFinite(points) || points < 0) return;
        if (seen.has(rank)) return;
        seen.add(rank);
        sanitized.push({ rank, points: Number(points.toFixed(2)) });
    });
    return sanitized.sort((a, b) => a.rank - b.rank);
}

function normalizeBonusProfiles(value) {
    if (Array.isArray(value)) {
        return value
            .map((profile) => {
                const trigger = String(profile?.trigger || "").trim();
                if (!BONUS_TRIGGER_OPTIONS.includes(trigger)) return null;
                const points = Number(profile?.points ?? 0);
                const multiplier = Number(profile?.multiplier ?? 1);
                const threshold = Number(profile?.threshold ?? 1);
                return {
                    trigger,
                    points: Number.isFinite(points) && points >= 0 ? Number(points.toFixed(2)) : 0,
                    multiplier: Number.isFinite(multiplier) && multiplier > 0 ? Number(multiplier.toFixed(2)) : 1,
                    threshold: Number.isInteger(threshold) && threshold > 0 ? threshold : 1,
                    appliesTo: String(profile?.appliesTo || "all").trim() || "all",
                    enabled: profile?.enabled !== false
                };
            })
            .filter(Boolean);
    }

    // Backward compatibility for legacy bonus object format.
    const legacy = value && typeof value === "object" ? value : {};
    const mapped = [];
    if (legacy.recordEnabled) {
        mapped.push({
            trigger: "record",
            points: Number(legacy.recordPoints) || 0,
            multiplier: 1,
            threshold: 1,
            appliesTo: "all",
            enabled: true
        });
    }
    if (legacy.seriesEnabled) {
        mapped.push({
            trigger: "streak",
            points: Number(legacy.seriesPoints) || 0,
            multiplier: 1,
            threshold: 3,
            appliesTo: "all",
            enabled: true
        });
    }
    if (legacy.doubleEnabled) {
        mapped.push({
            trigger: "finalissimo_double",
            points: 0,
            multiplier: Number(legacy.doubleMultiplier) || 2,
            threshold: 1,
            appliesTo: "finalissimo",
            enabled: true
        });
    }
    return mapped;
}

function normalizePointRuleConfig(config) {
    const input = config && typeof config === "object" ? config : {};
    const pointsScale = normalizePointScale(input.pointsScale || []);
    const tieBreakRaw = Array.isArray(input.tieBreak) ? input.tieBreak : [];
    const tieBreak = [...new Set(tieBreakRaw
        .map((entry) => String(entry || "").trim())
        .filter((entry) => TIE_BREAK_OPTIONS.includes(entry))
    )].slice(0, 8);
    const teamInput = input.team && typeof input.team === "object" ? input.team : {};
    const topN = Number(teamInput.topN);
    const dropWorst = Number(teamInput.dropWorst);
    const team = {
        method: ["sum", "avg", "best_n"].includes(teamInput.method) ? teamInput.method : "sum",
        topN: Number.isInteger(topN) && topN > 0 && topN <= 30 ? topN : 3,
        rounding: ["none", "round", "floor", "ceil"].includes(teamInput.rounding) ? teamInput.rounding : "none",
        dropWorst: Number.isInteger(dropWorst) && dropWorst >= 0 && dropWorst <= 10 ? dropWorst : 0
    };

    const bonusProfiles = normalizeBonusProfiles(input.bonusProfiles || input.bonus);
    const metaInput = input.meta && typeof input.meta === "object" ? input.meta : {};
    const meta = {
        eventScope: String(metaInput.eventScope || "all").trim(),
        competitionMode: String(metaInput.competitionMode || "season").trim(),
        notes: String(metaInput.notes || "").trim()
    };
    return { pointsScale, tieBreak, team, bonusProfiles, meta };
}

function validatePointRulePayload(payload) {
    const errors = [];
    const name = String(payload?.name || "").trim();
    const ruleType = String(payload?.ruleType || "").trim();
    if (!name) errors.push("Regelname fehlt.");
    if (!ruleType) errors.push("Regeltyp fehlt.");
    const config = normalizePointRuleConfig(payload?.config || {});
    if (config.pointsScale.length === 0) errors.push("Mindestens ein Punktewert ist erforderlich.");
    if (config.tieBreak.length === 0) errors.push("Mindestens ein Tie-Break-Kriterium ist erforderlich.");
    const invalidTemplate = POINT_RULE_TEMPLATE_IDS.includes(ruleType) || ruleType === "custom" || ruleType === "msc_2026";
    if (!invalidTemplate) errors.push("Unbekannter Regeltyp.");
    return {
        errors,
        normalized: {
            name,
            ruleType,
            config,
            active: payload?.active === false ? 0 : 1
        }
    };
}

function parseConfigJsonSafely(value) {
    try {
        return JSON.parse(value || "{}");
    } catch (error) {
        return {};
    }
}

function parseBooleanSetting(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on", "ja"].includes(normalized)) return true;
        if (["false", "0", "no", "off", "nein"].includes(normalized)) return false;
    }
    if (typeof value === "number") return value === 1;
    return fallback;
}

function getSettingValue(key) {
    const row = db.prepare("SELECT value_json FROM settings WHERE key = ?").get(String(key || "").trim());
    if (!row) return null;
    return parseConfigJsonSafely(row.value_json);
}

function isDuplicateEmailAllowed() {
    const directSetting = getSettingValue("allow_duplicate_emails");
    if (directSetting !== null && directSetting !== undefined) {
        return parseBooleanSetting(directSetting, false);
    }
    const securityConfig = getSettingValue("security_config");
    if (securityConfig && typeof securityConfig === "object") {
        return parseBooleanSetting(securityConfig.allow_duplicate_emails, false);
    }
    return false;
}

function findUserByEmail(email, exceptUserId = null) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return null;
    if (exceptUserId) {
        return db
            .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ? LIMIT 1")
            .get(normalizedEmail, exceptUserId);
    }
    return db
        .prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1")
        .get(normalizedEmail);
}

function mapUserWriteError(error) {
    const message = String(error?.message || "");
    if (message.includes("users.username")) {
        return "Diese Benutzerkennung ist bereits vergeben.";
    }
    if (message.includes("users.email")) {
        return "Diese E-Mail-Adresse ist bereits vergeben.";
    }
    return null;
}

function seedDefaultRoles() {
    const upsert = db.prepare(
        `INSERT INTO roles (name, description, permissions_json, required_assignments_json, status, is_system, updated_at)
         VALUES (?, ?, ?, ?, 'active', 1, CURRENT_TIMESTAMP)
         ON CONFLICT(name) DO UPDATE SET
           description = excluded.description,
           permissions_json = excluded.permissions_json,
           required_assignments_json = excluded.required_assignments_json,
           updated_at = CURRENT_TIMESTAMP`
    );
    DEFAULT_ROLE_DEFINITIONS.forEach((role) => {
        upsert.run(
           role.name,
           role.description,
           JSON.stringify(role.permissions),
           JSON.stringify(parseRoleRequiredAssignments(role.requiredAssignments || []))
        );
    });
}

function getBearerToken(authorizationHeader) {
    if (!authorizationHeader) return null;
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) return null;
    return token;
}

function authRequired(req, res, next) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
        res.status(401).json({ error: "Missing Bearer token" });
        return;
    }
    try {
        const payload = jwt.verify(token, EFFECTIVE_JWT_SECRET);
        const dbUser = db
            .prepare("SELECT id, username, name, email, role, status FROM users WHERE id = ?")
            .get(payload.sub);
        if (!dbUser || dbUser.status !== "active") {
            res.status(401).json({ error: "User account is not active" });
            return;
        }

        const roleRow = db
            .prepare("SELECT permissions_json FROM roles WHERE name = ? AND status = 'active'")
            .get(dbUser.role);
        const defaultRole = DEFAULT_ROLE_DEFINITIONS.find(
            (entry) => normalizeRole(entry.name) === normalizeRole(dbUser.role)
        );
        let permissions = defaultRole ? [...defaultRole.permissions] : [];
        if (roleRow?.permissions_json) {
            try {
                permissions = parsePermissions(JSON.parse(roleRow.permissions_json));
            } catch (error) {
                permissions = parsePermissions(permissions);
            }
        }

        req.user = { ...payload, ...dbUser, permissions };
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

function requireRoles(allowedRoles) {
    return (req, res, next) => {
        if (!hasAnyRole(req.user.role, allowedRoles)) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
        }
        next();
    };
}

function requirePermission(permission) {
    return (req, res, next) => {
        const userPermissions = parsePermissions(req.user?.permissions || []);
        if (!userPermissions.includes(permission)) {
            res.status(403).json({ error: `Missing permission: ${permission}` });
            return;
        }
        next();
    };
}

function requireAnyPermission(permissions) {
    return (req, res, next) => {
        const userPermissions = parsePermissions(req.user?.permissions || []);
        if (!permissions.some((permission) => userPermissions.includes(permission))) {
            res.status(403).json({ error: `Missing one of permissions: ${permissions.join(", ")}` });
            return;
        }
        next();
    };
}

function logAudit(actor, action, entityType, entityId, details) {
    db.prepare(
        `INSERT INTO audit_logs (actor_user_id, actor_username, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).run(actor?.sub || null, actor?.username || "system", action, entityType, entityId ? String(entityId) : null, details || null);
    broadcastLiveUpdate({
        type: "audit",
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: details || null,
        actor: actor?.username || "system"
    });
}

function broadcastLiveUpdate(event) {
    const payload = JSON.stringify({
        ...event,
        timestamp: new Date().toISOString()
    });
    wsClients.forEach((session, socket) => {
        if (socket.readyState === 1) {
            socket.send(payload);
            return;
        }
        wsClients.delete(socket);
    });
}

function registerWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: "/ws" });
    wss.on("connection", (socket, req) => {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const token = url.searchParams.get("token");
        if (!token) {
            socket.close(1008, "Missing token");
            return;
        }
        try {
            const payload = jwt.verify(token, EFFECTIVE_JWT_SECRET);
            wsClients.set(socket, { userId: payload.sub, username: payload.username });
            socket.send(JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }));
        } catch (error) {
            socket.close(1008, "Invalid token");
            return;
        }
        socket.on("close", () => {
            wsClients.delete(socket);
        });
        socket.on("error", () => {
            wsClients.delete(socket);
        });
    });
}

function parseId(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function requireFields(res, payload, fields) {
    const missing = fields.filter((field) => !String(payload[field] || "").trim());
    if (missing.length > 0) {
        res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
        return false;
    }
    return true;
}

function resolveActiveRoleName(roleName) {
    const row = db
        .prepare("SELECT name FROM roles WHERE LOWER(name) = LOWER(?) AND status = 'active'")
        .get(String(roleName || "").trim());
    return row?.name || null;
}

function isTeamManagerRole(roleName) {
    return normalizeRole(roleName) === "teammanager";
}

function getUserById(userId) {
    return db
        .prepare("SELECT id, username, role, status FROM users WHERE id = ?")
        .get(userId);
}

function getTeamById(teamId) {
    return db
        .prepare("SELECT id, name, status, manager_user_id FROM teams WHERE id = ?")
        .get(teamId);
}

function findTeamManagedByUser(userId, exceptTeamId = null) {
    if (!userId) return null;
    if (exceptTeamId) {
        return db
            .prepare("SELECT id, name FROM teams WHERE manager_user_id = ? AND id != ? AND status != 'inactive' LIMIT 1")
            .get(userId, exceptTeamId);
    }
    return db
        .prepare("SELECT id, name FROM teams WHERE manager_user_id = ? AND status != 'inactive' LIMIT 1")
        .get(userId);
}

function parseOptionalIdStrict(value) {
    if (value === undefined) {
        return { provided: false, value: null, valid: true };
    }
    if (value === null || String(value).trim() === "") {
        return { provided: true, value: null, valid: true };
    }
    const parsed = parseId(value);
    return { provided: true, value: parsed, valid: Boolean(parsed) };
}

function getEventById(eventId) {
    return db
        .prepare("SELECT id, name, status FROM events WHERE id = ?")
        .get(eventId);
}

function normalizeUserAssignments(input, fallbackTeamId = undefined) {
    const source = input && typeof input === "object" ? input : {};
    const hasTeamId = Object.prototype.hasOwnProperty.call(source, "teamId");
    const hasEventId = Object.prototype.hasOwnProperty.call(source, "eventId");
    const hasVenueCode = Object.prototype.hasOwnProperty.call(source, "venueCode");
    const hasOtherScope = Object.prototype.hasOwnProperty.call(source, "otherScope");
    const rawTeamId = hasTeamId ? source.teamId : fallbackTeamId;
    const teamResult = parseOptionalIdStrict(rawTeamId);
    const eventResult = parseOptionalIdStrict(source.eventId);
    if (!teamResult.valid || !eventResult.valid) {
        return { valid: false, assignments: null };
    }
    const venueCode = String(source.venueCode || "").trim();
    const otherScope = String(source.otherScope || "").trim();
    return {
        valid: true,
        assignments: {
            teamId: teamResult.value,
            eventId: eventResult.value,
            venueCode,
            otherScope
        },
        provided: {
            teamId: hasTeamId || fallbackTeamId !== undefined,
            eventId: hasEventId,
            venueCode: hasVenueCode,
            otherScope: hasOtherScope
        }
    };
}

function validateUserAssignments(assignments, requiredAssignments) {
    if (!assignments || typeof assignments !== "object") return "Ungültige Zuordnungsdaten.";
    const required = parseRoleRequiredAssignments(requiredAssignments || []);
    if (required.includes("team") && !assignments.teamId) return "Für diese Rolle ist ein Team verpflichtend.";
    if (required.includes("event") && !assignments.eventId) return "Für diese Rolle ist ein Wettbewerb verpflichtend.";
    if (required.includes("venue") && !assignments.venueCode) return "Für diese Rolle ist eine Schanze verpflichtend.";
    if (required.includes("other") && !assignments.otherScope) return "Für diese Rolle ist eine zusätzliche Zuordnung verpflichtend.";
    if (assignments.teamId) {
        const team = getTeamById(assignments.teamId);
        if (!team || team.status === "inactive") return "Ausgewähltes Team wurde nicht gefunden.";
    }
    if (assignments.eventId) {
        const eventEntry = getEventById(assignments.eventId);
        if (!eventEntry) return "Ausgewählter Wettbewerb wurde nicht gefunden.";
    }
    return null;
}

function upsertUserScopeAssignments(userId, assignments) {
    db.prepare(
        `INSERT INTO user_scope_assignments (user_id, team_id, event_id, venue_code, other_scope, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           team_id = excluded.team_id,
           event_id = excluded.event_id,
           venue_code = excluded.venue_code,
           other_scope = excluded.other_scope,
           updated_at = CURRENT_TIMESTAMP`
    ).run(
        userId,
        assignments.teamId || null,
        assignments.eventId || null,
        assignments.venueCode || null,
        assignments.otherScope || null
    );
}

function getUserScopeAssignments(userId) {
    const row = db
        .prepare(
            `SELECT usa.user_id, usa.team_id, usa.event_id, usa.venue_code, usa.other_scope,
                    t.name AS team_name, e.name AS event_name
             FROM user_scope_assignments usa
             LEFT JOIN teams t ON t.id = usa.team_id
             LEFT JOIN events e ON e.id = usa.event_id
             WHERE usa.user_id = ?`
        )
        .get(userId);
    if (!row) {
        return {
            teamId: null,
            teamName: null,
            eventId: null,
            eventName: null,
            venueCode: "",
            otherScope: ""
        };
    }
    return {
        teamId: row.team_id || null,
        teamName: row.team_name || null,
        eventId: row.event_id || null,
        eventName: row.event_name || null,
        venueCode: row.venue_code || "",
        otherScope: row.other_scope || ""
    };
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(morgan(IS_PRODUCTION ? "combined" : "dev"));
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false
}));
app.use(express.json({ limit: "1mb" }));

initDb();
migrateUsersEmailConstraint();
dropUsersEmailUniqueIndexes();
ensureRolesRequiredAssignmentsColumn();
ensureInvitationsTable();
seedDefaultRoles();

const ADMIN_ROLES = ["msc admin", "admin", "root-admin"];
const TEAM_WRITE_ROLES = [...ADMIN_ROLES, "teammanager"];
const JURY_WRITE_ROLES = [...ADMIN_ROLES, "jury"];
const REPORT_WRITE_ROLES = [...ADMIN_ROLES, "reporter", "media"];

app.get("/api/health", (_, res) => {
    res.json({
        status: "ok",
        dbPath: DB_PATH,
        persistentStorage: usingPersistentStorage
    });
});

app.get("/api/auth/bootstrap-status", (_, res) => {
    const row = db.prepare("SELECT COUNT(*) AS count FROM users").get();
    res.json({ requiresBootstrap: row.count === 0 });
});

app.post("/api/auth/bootstrap", (req, res) => {
    const row = db.prepare("SELECT COUNT(*) AS count FROM users").get();
    if (row.count > 0) {
        res.status(409).json({ error: "Bootstrap already completed" });
        return;
    }

    const { username, name, email, password } = req.body || {};
    if (!requireFields(res, req.body || {}, ["username", "name", "email", "password"])) return;

    const passwordHash = bcrypt.hashSync(password, 12);
    const result = db
        .prepare(
            `INSERT INTO users (username, name, email, role, password_hash, status)
             VALUES (?, ?, ?, 'MSC Admin', ?, 'active')`
        )
        .run(username.trim(), name.trim(), email.trim().toLowerCase(), passwordHash);

    const user = db.prepare("SELECT id, username, name, email, role, status FROM users WHERE id = ?").get(result.lastInsertRowid);
    const token = signToken(user);
    logAudit({ sub: user.id, username: user.username }, "BOOTSTRAP_ADMIN", "users", user.id, "Initial admin account created");
    res.status(201).json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!requireFields(res, req.body || {}, ["username", "password"])) return;

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username.trim());
    if (!user) {
        res.status(401).json({ error: "Benutzerkennung existiert nicht" });
        return;
    }
    
    if (user.status !== "active") {
        res.status(401).json({ error: "Dieses Benutzerkonto ist deaktiviert" });
        return;
    }
    
    if (!bcrypt.compareSync(password, user.password_hash)) {
        res.status(401).json({ error: "Passwort ist ungültig" });
        return;
    }

    db.prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
    const safeUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
    };
    const token = signToken(safeUser);
    logAudit({ sub: user.id, username: user.username }, "LOGIN", "users", user.id, "User logged in");
    res.json({ token, user: safeUser });
});

app.get("/api/auth/me", authRequired, (req, res) => {
    const user = db.prepare("SELECT id, username, name, email, role, status, last_login_at FROM users WHERE id = ?").get(req.user.sub);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json({ user });
});

app.get("/api/permissions", authRequired, requirePermission("roles.read"), (_req, res) => {
    res.json({ permissions: ALL_PERMISSIONS });
});

app.get("/api/roles", authRequired, requirePermission("roles.read"), (_req, res) => {
    const rows = db.prepare(
        `SELECT r.id, r.name, r.description, r.status, r.is_system, r.permissions_json, r.required_assignments_json, r.created_at, r.updated_at,
                (SELECT COUNT(*) FROM users u WHERE LOWER(u.role) = LOWER(r.name)) AS user_count
         FROM roles r
         ORDER BY r.name ASC`
    ).all();
    const mapped = rows.map((row) => {
        let permissions = [];
        let requiredAssignments = [];
        try {
            permissions = parsePermissions(JSON.parse(row.permissions_json || "[]"));
        } catch (error) {
            permissions = [];
        }
        try {
            requiredAssignments = parseRoleRequiredAssignments(JSON.parse(row.required_assignments_json || "[]"));
        } catch (error) {
            requiredAssignments = [];
        }
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            is_system: row.is_system === 1,
            user_count: row.user_count,
            created_at: row.created_at,
            updated_at: row.updated_at,
            permissions,
            required_assignments: requiredAssignments
        };
    });
    res.json(mapped);
});

app.post("/api/roles", authRequired, requirePermission("roles.write"), (req, res) => {
    const { name, description, permissions, requiredAssignments, status } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name"])) return;
    const normalizedPermissions = parsePermissions(permissions || []);
    const normalizedRequiredAssignments = parseRoleRequiredAssignments(requiredAssignments || []);
    const invalid = normalizedPermissions.filter((entry) => !ALL_PERMISSIONS.includes(entry));
    if (invalid.length > 0) {
        res.status(400).json({ error: `Unknown permissions: ${invalid.join(", ")}` });
        return;
    }
    try {
        const result = db.prepare(
            `INSERT INTO roles (name, description, permissions_json, required_assignments_json, status, is_system, updated_at)
             VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`
        ).run(
            String(name).trim(),
            description ? String(description).trim() : null,
            JSON.stringify(normalizedPermissions),
            JSON.stringify(normalizedRequiredAssignments),
            status === "inactive" ? "inactive" : "active"
        );
        const created = db.prepare("SELECT id, name, description, status, is_system, created_at, updated_at FROM roles WHERE id = ?").get(result.lastInsertRowid);
        logAudit(req.user, "CREATE_ROLE", "roles", created.id, created.name);
        res.status(201).json({
            ...created,
            is_system: created.is_system === 1,
            permissions: normalizedPermissions,
            required_assignments: normalizedRequiredAssignments
        });
    } catch (error) {
        res.status(409).json({ error: "Role already exists" });
    }
});

app.patch("/api/roles/:id", authRequired, requirePermission("roles.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid role id" });
        return;
    }
    const existing = db.prepare("SELECT id, name, is_system FROM roles WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "Role not found" });
        return;
    }

    const updates = [];
    const values = [];
    if (req.body?.name !== undefined) {
        const nextName = String(req.body.name || "").trim();
        if (!nextName) {
            res.status(400).json({ error: "Role name cannot be empty" });
            return;
        }
        if (existing.is_system === 1 && nextName.toLowerCase() !== String(existing.name || "").toLowerCase()) {
            res.status(400).json({ error: "System role names cannot be changed" });
            return;
        }
        updates.push("name = ?");
        values.push(nextName);
    }
    if (req.body?.description !== undefined) {
        updates.push("description = ?");
        values.push(req.body.description ? String(req.body.description).trim() : null);
    }
    if (req.body?.status !== undefined) {
        const nextStatus = req.body.status === "inactive" ? "inactive" : "active";
        updates.push("status = ?");
        values.push(nextStatus);
    }
    if (req.body?.permissions !== undefined) {
        const normalizedPermissions = parsePermissions(req.body.permissions);
        const invalid = normalizedPermissions.filter((entry) => !ALL_PERMISSIONS.includes(entry));
        if (invalid.length > 0) {
            res.status(400).json({ error: `Unknown permissions: ${invalid.join(", ")}` });
            return;
        }
        updates.push("permissions_json = ?");
        values.push(JSON.stringify(normalizedPermissions));
    }
    if (req.body?.requiredAssignments !== undefined) {
        const normalizedRequiredAssignments = parseRoleRequiredAssignments(req.body.requiredAssignments);
        updates.push("required_assignments_json = ?");
        values.push(JSON.stringify(normalizedRequiredAssignments));
    }
    if (updates.length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    try {
        db.prepare(`UPDATE roles SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    } catch (error) {
        res.status(409).json({ error: "Role name already exists" });
        return;
    }

    const updated = db.prepare(
        "SELECT id, name, description, status, is_system, created_at, updated_at, permissions_json, required_assignments_json FROM roles WHERE id = ?"
    ).get(id);
    let permissions = [];
    let requiredAssignments = [];
    try {
        permissions = parsePermissions(JSON.parse(updated.permissions_json || "[]"));
    } catch (error) {
        permissions = [];
    }
    try {
        requiredAssignments = parseRoleRequiredAssignments(JSON.parse(updated.required_assignments_json || "[]"));
    } catch (error) {
        requiredAssignments = [];
    }
    logAudit(req.user, "UPDATE_ROLE", "roles", id, JSON.stringify(req.body || {}));
    res.json({
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        is_system: updated.is_system === 1,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        permissions,
        required_assignments: requiredAssignments
    });
});

app.delete("/api/roles/:id", authRequired, requirePermission("roles.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid role id" });
        return;
    }
    const role = db.prepare("SELECT id, name, is_system FROM roles WHERE id = ?").get(id);
    if (!role) {
        res.status(404).json({ error: "Role not found" });
        return;
    }
    if (role.is_system === 1) {
        res.status(400).json({ error: "System roles cannot be deleted" });
        return;
    }
    const assigned = db.prepare("SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = LOWER(?)").get(role.name).count;
    if (assigned > 0) {
        res.status(409).json({ error: "Role is assigned to users and cannot be deleted" });
        return;
    }
    db.prepare("DELETE FROM roles WHERE id = ?").run(id);
    logAudit(req.user, "DELETE_ROLE", "roles", id, role.name);
    res.status(204).send();
});

app.get("/api/dashboard", authRequired, requirePermission("dashboard.read"), (_, res) => {
    const stats = {
        users: db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").get().count,
        teams: db.prepare("SELECT COUNT(*) AS count FROM teams WHERE status = 'active'").get().count,
        events: db.prepare("SELECT COUNT(*) AS count FROM events").get().count,
        transfers: db.prepare("SELECT COUNT(*) AS count FROM transfers WHERE status != 'completed'").get().count,
        licensesPending: db.prepare("SELECT COUNT(*) AS count FROM team_members WHERE license_status = 'in_review'").get().count
    };

    const recentAudit = db.prepare(
        `SELECT created_at, actor_username, action, entity_type, entity_id, details
         FROM audit_logs
         ORDER BY id DESC
         LIMIT 8`
    ).all();

    const nextEvents = db.prepare(
        `SELECT id, name, location, event_date, status
         FROM events
         WHERE event_date IS NOT NULL
         ORDER BY event_date ASC
         LIMIT 8`
    ).all();

    const pendingLicenses = db.prepare(
        `SELECT tm.id, tm.name, tm.license_type, tm.license_status, t.name AS team_name
         FROM team_members tm
         LEFT JOIN teams t ON t.id = tm.team_id
         WHERE tm.license_status IS NOT NULL
         ORDER BY tm.id DESC
         LIMIT 8`
    ).all();

    res.json({ stats, recentAudit, nextEvents, pendingLicenses });
});

app.get("/api/audit-logs", authRequired, requirePermission("audit.read"), (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const rows = db.prepare(
        `SELECT id, created_at, actor_username, action, entity_type, entity_id, details
         FROM audit_logs
         ORDER BY id DESC
         LIMIT ?`
    ).all(limit);
    res.json(rows);
});

app.get("/api/users", authRequired, requirePermission("users.read"), (req, res) => {
    const rows = db.prepare(
        `SELECT u.id, u.username, u.name, u.email, u.role, u.status, u.last_login_at, u.created_at,
                usa.team_id AS assignment_team_id,
                team.name AS assignment_team_name,
                usa.event_id AS assignment_event_id,
                event.name AS assignment_event_name,
                usa.venue_code AS assignment_venue_code,
                usa.other_scope AS assignment_other_scope,
                (SELECT t.id FROM teams t WHERE t.manager_user_id = u.id AND t.status != 'inactive' ORDER BY t.id ASC LIMIT 1) AS managed_team_id,
                (SELECT t.name FROM teams t WHERE t.manager_user_id = u.id AND t.status != 'inactive' ORDER BY t.id ASC LIMIT 1) AS managed_team_name
         FROM users u
         LEFT JOIN user_scope_assignments usa ON usa.user_id = u.id
         LEFT JOIN teams team ON team.id = usa.team_id
         LEFT JOIN events event ON event.id = usa.event_id
         ORDER BY u.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/users", authRequired, requirePermission("users.write"), async (req, res) => {
    const { username, name, email, role, password, status, managedTeamId, sendInvitation } = req.body || {};
    
    // Wenn sendInvitation=true, ist password optional
    const requirePassword = sendInvitation !== true;
    if (!requireFields(res, req.body || {}, ["username", "name", "email", "role", ...(requirePassword ? ["password"] : [])])) return;
    
    if (!isDuplicateEmailAllowed() && findUserByEmail(email)) {
        res.status(409).json({ error: "Diese E-Mail-Adresse ist bereits vergeben." });
        return;
    }
    const resolvedRole = resolveActiveRoleName(role);
    if (!resolvedRole) {
        res.status(400).json({ error: "Unknown or inactive role" });
        return;
    }
    const normalizedAssignments = normalizeUserAssignments(req.body?.assignments, managedTeamId);
    if (!normalizedAssignments.valid) {
        res.status(400).json({ error: "Ungültige Zuordnungsdaten." });
        return;
    }
    const requiredAssignments = getRoleAssignmentRequirementsByName(resolvedRole);
    const assignmentError = validateUserAssignments(normalizedAssignments.assignments, requiredAssignments);
    if (assignmentError) {
        res.status(400).json({ error: assignmentError });
        return;
    }
    if (isTeamManagerRole(resolvedRole) && !normalizedAssignments.assignments.teamId) {
        res.status(400).json({ error: "Teammanager muss einem Team zugeordnet sein." });
        return;
    }
    if (normalizedAssignments.assignments.teamId) {
        const targetTeam = getTeamById(normalizedAssignments.assignments.teamId);
        if (!targetTeam || targetTeam.status === "inactive") {
            res.status(404).json({ error: "Ausgewähltes Team wurde nicht gefunden." });
            return;
        }
        if (isTeamManagerRole(resolvedRole) && targetTeam.manager_user_id) {
            res.status(409).json({ error: "Dieses Team hat bereits einen Teammanager." });
            return;
        }
    }

    // Passwort: entweder vom Admin gesetzt oder platzhalter, wenn Invitation versendet wird
    let hash;
    if (password) {
        hash = bcrypt.hashSync(password, 12);
    } else if (sendInvitation === true) {
        // Platzhalter-Hash für noch nicht aktivierte Accounts
        hash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 12);
    } else {
        res.status(400).json({ error: "Passwort ist erforderlich, wenn keine Einladung versendet wird." });
        return;
    }

    let result;
    const createUserWithAssignment = db.transaction(() => {
        result = db
            .prepare(
                `INSERT INTO users (username, name, email, role, password_hash, status)
                 VALUES (?, ?, ?, ?, ?, ?)`
            )
            .run(
                username.trim(),
                name.trim(),
                email.trim().toLowerCase(),
                resolvedRole,
                hash,
                sendInvitation === true ? "inactive" : (status === "inactive" ? "inactive" : "active")
            );
        if (normalizedAssignments.assignments.teamId && isTeamManagerRole(resolvedRole)) {
            db.prepare("UPDATE teams SET manager_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .run(result.lastInsertRowid, normalizedAssignments.assignments.teamId);
        }
        upsertUserScopeAssignments(result.lastInsertRowid, normalizedAssignments.assignments);
    });
    
    try {
        createUserWithAssignment();
    } catch (error) {
        const userMessage = mapUserWriteError(error);
        if (userMessage) {
            res.status(409).json({ error: userMessage });
            return;
        }
        throw error;
    }

    const created = db.prepare(
        `SELECT u.id, u.username, u.name, u.email, u.role, u.status, u.created_at,
                (SELECT t.id FROM teams t WHERE t.manager_user_id = u.id AND t.status != 'inactive' ORDER BY t.id ASC LIMIT 1) AS managed_team_id,
                (SELECT t.name FROM teams t WHERE t.manager_user_id = u.id AND t.status != 'inactive' ORDER BY t.id ASC LIMIT 1) AS managed_team_name
         FROM users u
         WHERE u.id = ?`
    ).get(result.lastInsertRowid);
    const assignment = getUserScopeAssignments(result.lastInsertRowid);

    // Wenn Einladung versendet werden soll
    if (sendInvitation === true) {
        const invitationToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + INVITATION_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000).toISOString();
        
        db.prepare(
            `INSERT INTO invitations (token, user_id, email, status, expires_at)
             VALUES (?, ?, ?, ?, ?)`
        ).run(invitationToken, result.lastInsertRowid, email.trim().toLowerCase(), "pending", expiresAt);

        const emailSent = await sendInvitationEmail(email.trim().toLowerCase(), invitationToken);
        
        logAudit(req.user, "CREATE_USER", "users", created.id, `${created.username} (${created.role}) - Einladung versendet`);
        
        res.status(201).json({
            ...created,
            invitation_sent: emailSent,
            invitation_token: invitationToken,
            assignment_team_id: assignment.teamId,
            assignment_team_name: assignment.teamName,
            assignment_event_id: assignment.eventId,
            assignment_event_name: assignment.eventName,
            assignment_venue_code: assignment.venueCode,
            assignment_other_scope: assignment.otherScope
        });
    } else {
        logAudit(req.user, "CREATE_USER", "users", created.id, `${created.username} (${created.role})`);
        res.status(201).json({
            ...created,
            assignment_team_id: assignment.teamId,
            assignment_team_name: assignment.teamName,
            assignment_event_id: assignment.eventId,
            assignment_event_name: assignment.eventName,
            assignment_venue_code: assignment.venueCode,
            assignment_other_scope: assignment.otherScope
        });
    }
});

app.patch("/api/users/:id", authRequired, requirePermission("users.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid user id" });
        return;
    }
    const existing = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    const allowed = ["name", "email", "role", "status"];
    const updates = [];
    const values = [];
    let invalidRole = false;
    let nextRole = existing.role;
    if (req.body.email !== undefined && !isDuplicateEmailAllowed() && findUserByEmail(req.body.email, id)) {
        res.status(409).json({ error: "Diese E-Mail-Adresse ist bereits vergeben." });
        return;
    }
    allowed.forEach((field) => {
        if (req.body[field] !== undefined) {
            if (field === "role") {
                const resolvedRole = resolveActiveRoleName(req.body[field]);
                if (!resolvedRole) {
                    invalidRole = true;
                    return;
                }
                nextRole = resolvedRole;
                updates.push(`${field} = ?`);
                values.push(resolvedRole);
                return;
            }
            updates.push(`${field} = ?`);
            values.push(field === "email" ? String(req.body[field]).trim().toLowerCase() : String(req.body[field]).trim());
        }
    });
    if (invalidRole) {
        res.status(400).json({ error: "Unknown or inactive role" });
        return;
    }
    const currentManagedTeam = findTeamManagedByUser(id);
    const currentAssignments = getUserScopeAssignments(id);
    const normalizedAssignments = normalizeUserAssignments(
        req.body?.assignments,
        req.body?.managedTeamId !== undefined ? req.body.managedTeamId : currentAssignments.teamId
    );
    if (!normalizedAssignments.valid) {
        res.status(400).json({ error: "Ungültige Zuordnungsdaten." });
        return;
    }
    const finalAssignments = {
        teamId: normalizedAssignments.assignments.teamId,
        eventId: normalizedAssignments.provided.eventId
            ? normalizedAssignments.assignments.eventId
            : currentAssignments.eventId,
        venueCode: normalizedAssignments.provided.venueCode
            ? normalizedAssignments.assignments.venueCode
            : currentAssignments.venueCode,
        otherScope: normalizedAssignments.provided.otherScope
            ? normalizedAssignments.assignments.otherScope
            : currentAssignments.otherScope
    };
    const requiredAssignments = getRoleAssignmentRequirementsByName(nextRole);
    const assignmentError = validateUserAssignments(finalAssignments, requiredAssignments);
    if (assignmentError) {
        res.status(400).json({ error: assignmentError });
        return;
    }

    if (isTeamManagerRole(nextRole)) {
        if (!finalAssignments.teamId) {
            res.status(400).json({ error: "Teammanager muss einem Team zugeordnet sein." });
            return;
        }
        const targetTeam = getTeamById(finalAssignments.teamId);
        if (!targetTeam || targetTeam.status === "inactive") {
            res.status(404).json({ error: "Ausgewähltes Team wurde nicht gefunden." });
            return;
        }
        if (targetTeam.manager_user_id && targetTeam.manager_user_id !== id) {
            res.status(409).json({ error: "Dieses Team hat bereits einen anderen Teammanager." });
            return;
        }
    }

    if (req.body.password) {
        updates.push("password_hash = ?");
        values.push(bcrypt.hashSync(String(req.body.password), 12));
    }
    const hasAssignmentChange =
        finalAssignments.teamId !== currentAssignments.teamId ||
        finalAssignments.eventId !== currentAssignments.eventId ||
        finalAssignments.venueCode !== currentAssignments.venueCode ||
        finalAssignments.otherScope !== currentAssignments.otherScope;
    if (updates.length === 0 && !hasAssignmentChange && normalizeRole(nextRole) === normalizeRole(existing.role)) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
    }
    if (updates.length > 0) {
        updates.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);
    }

    const updateUserAndAssignments = db.transaction(() => {
        if (updates.length > 0) {
            db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);
        }
        upsertUserScopeAssignments(id, finalAssignments);
        if (isTeamManagerRole(nextRole)) {
            if (currentManagedTeam && currentManagedTeam.id !== finalAssignments.teamId) {
                db.prepare("UPDATE teams SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .run(currentManagedTeam.id);
            }
            db.prepare("UPDATE teams SET manager_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .run(id, finalAssignments.teamId);
        } else if (currentManagedTeam) {
            db.prepare("UPDATE teams SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_user_id = ?")
                .run(id);
        }
    });
    try {
        updateUserAndAssignments();
    } catch (error) {
        const userMessage = mapUserWriteError(error);
        if (userMessage) {
            res.status(409).json({ error: userMessage });
            return;
        }
        throw error;
    }
    const updated = db.prepare(
        `SELECT u.id, u.username, u.name, u.email, u.role, u.status, u.last_login_at,
                (SELECT t.id FROM teams t WHERE t.manager_user_id = u.id AND t.status != 'inactive' ORDER BY t.id ASC LIMIT 1) AS managed_team_id,
                (SELECT t.name FROM teams t WHERE t.manager_user_id = u.id AND t.status != 'inactive' ORDER BY t.id ASC LIMIT 1) AS managed_team_name
         FROM users u
         WHERE u.id = ?`
    ).get(id);
    const assignment = getUserScopeAssignments(id);
    logAudit(req.user, "UPDATE_USER", "users", id, JSON.stringify(req.body));
    res.json({
        ...updated,
        assignment_team_id: assignment.teamId,
        assignment_team_name: assignment.teamName,
        assignment_event_id: assignment.eventId,
        assignment_event_name: assignment.eventName,
        assignment_venue_code: assignment.venueCode,
        assignment_other_scope: assignment.otherScope
    });
});

app.delete("/api/users/:id", authRequired, requirePermission("users.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid user id" });
        return;
    }
    const result = db.prepare("UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    logAudit(req.user, "DEACTIVATE_USER", "users", id, "Soft-deactivated user");
    res.status(204).send();
});

app.get("/api/teams", authRequired, requirePermission("teams.read"), (_, res) => {
    const rows = db.prepare(
        `SELECT t.id, t.name, t.nation, t.category, t.status, t.created_at, u.username AS manager_username
         FROM teams t
         LEFT JOIN users u ON u.id = t.manager_user_id
         ORDER BY t.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/teams", authRequired, requirePermission("teams.write"), (req, res) => {
    const { name, nation, category, managerUserId } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name"])) return;
    const parsedManager = parseOptionalIdStrict(managerUserId);
    if (!parsedManager.valid) {
        res.status(400).json({ error: "Ungültige Teammanager-ID." });
        return;
    }
    const managerId = parsedManager.value;
    if (managerId) {
        const managerUser = getUserById(managerId);
        if (!managerUser || managerUser.status !== "active") {
            res.status(404).json({ error: "Teammanager nicht gefunden oder inaktiv." });
            return;
        }
        if (!isTeamManagerRole(managerUser.role)) {
            res.status(400).json({ error: "Ausgewählter Benutzer hat nicht die Rolle Teammanager." });
            return;
        }
        const managedTeam = findTeamManagedByUser(managerId);
        if (managedTeam) {
            res.status(409).json({ error: `Teammanager ist bereits mit Team "${managedTeam.name}" verknüpft.` });
            return;
        }
    }
    const result = db
        .prepare(
            `INSERT INTO teams (name, nation, category, manager_user_id, status)
             VALUES (?, ?, ?, ?, 'active')`
        )
        .run(name.trim(), nation ? String(nation).trim() : null, category ? String(category).trim() : null, managerId);
    const created = db.prepare("SELECT * FROM teams WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_TEAM", "teams", created.id, created.name);
    res.status(201).json(created);
});

app.patch("/api/teams/:id", authRequired, requirePermission("teams.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid team id" });
        return;
    }
    const existing = db.prepare("SELECT id FROM teams WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "Team not found" });
        return;
    }
    const allowed = ["name", "nation", "category", "status", "manager_user_id"];
    const updates = [];
    const values = [];
    let managerValidationError = null;
    let managerValidationStatus = 400;
    allowed.forEach((field) => {
        const requestKey = field === "manager_user_id" ? "managerUserId" : field;
        if (req.body[requestKey] !== undefined) {
            if (field === "manager_user_id") {
                const parsedManager = parseOptionalIdStrict(req.body[requestKey]);
                if (!parsedManager.valid) {
                    managerValidationError = "Ungültige Teammanager-ID.";
                    return;
                }
                if (parsedManager.value) {
                    const managerUser = getUserById(parsedManager.value);
                    if (!managerUser || managerUser.status !== "active") {
                        managerValidationError = "Teammanager nicht gefunden oder inaktiv.";
                        return;
                    }
                    if (!isTeamManagerRole(managerUser.role)) {
                        managerValidationError = "Ausgewählter Benutzer hat nicht die Rolle Teammanager.";
                        return;
                    }
                    const managedTeam = findTeamManagedByUser(parsedManager.value, id);
                    if (managedTeam) {
                        managerValidationError = `Teammanager ist bereits mit Team "${managedTeam.name}" verknüpft.`;
                        managerValidationStatus = 409;
                        return;
                    }
                }
                updates.push(`${field} = ?`);
                values.push(parsedManager.value);
                return;
            }
            updates.push(`${field} = ?`);
            values.push(String(req.body[requestKey]).trim());
        }
    });
    if (managerValidationError) {
        res.status(managerValidationStatus).json({ error: managerValidationError });
        return;
    }
    if (updates.length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
    }
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.prepare(`UPDATE teams SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const updated = db.prepare("SELECT * FROM teams WHERE id = ?").get(id);
    logAudit(req.user, "UPDATE_TEAM", "teams", id, JSON.stringify(req.body));
    res.json(updated);
});

app.delete("/api/teams/:id", authRequired, requirePermission("teams.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid team id" });
        return;
    }
    const result = db.prepare("UPDATE teams SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Team not found" });
        return;
    }
    logAudit(req.user, "DEACTIVATE_TEAM", "teams", id, "Soft-deactivated team");
    res.status(204).send();
});

app.get("/api/teams/:id/members", authRequired, requirePermission("team_members.read"), (req, res) => {
    const teamId = parseId(req.params.id);
    if (!teamId) {
        res.status(400).json({ error: "Invalid team id" });
        return;
    }
    const rows = db.prepare("SELECT * FROM team_members WHERE team_id = ? ORDER BY id DESC").all(teamId);
    res.json(rows);
});

app.post("/api/teams/:id/members", authRequired, requirePermission("team_members.write"), (req, res) => {
    const teamId = parseId(req.params.id);
    if (!teamId) {
        res.status(400).json({ error: "Invalid team id" });
        return;
    }
    const { name, memberRole, licenseType, licenseValidUntil, licenseStatus } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name", "memberRole"])) return;
    const result = db
        .prepare(
            `INSERT INTO team_members (team_id, name, member_role, license_type, license_valid_until, license_status, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`
        )
        .run(teamId, name.trim(), memberRole.trim(), licenseType ? String(licenseType).trim() : null, licenseValidUntil || null, licenseStatus || null);
    const created = db.prepare("SELECT * FROM team_members WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_TEAM_MEMBER", "team_members", created.id, created.name);
    res.status(201).json(created);
});

app.patch("/api/team-members/:id", authRequired, requirePermission("team_members.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid member id" });
        return;
    }
    const allowedMap = {
        name: "name",
        memberRole: "member_role",
        licenseType: "license_type",
        licenseValidUntil: "license_valid_until",
        licenseStatus: "license_status",
        status: "status"
    };
    const updates = [];
    const values = [];
    Object.entries(allowedMap).forEach(([requestKey, dbField]) => {
        if (req.body[requestKey] !== undefined) {
            updates.push(`${dbField} = ?`);
            values.push(String(req.body[requestKey]).trim());
        }
    });
    if (updates.length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
    }
    values.push(id);
    db.prepare(`UPDATE team_members SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const updated = db.prepare("SELECT * FROM team_members WHERE id = ?").get(id);
    if (!updated) {
        res.status(404).json({ error: "Team member not found" });
        return;
    }
    logAudit(req.user, "UPDATE_TEAM_MEMBER", "team_members", id, JSON.stringify(req.body));
    res.json(updated);
});

app.delete("/api/team-members/:id", authRequired, requirePermission("team_members.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid member id" });
        return;
    }
    const result = db.prepare("DELETE FROM team_members WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Team member not found" });
        return;
    }
    logAudit(req.user, "DELETE_TEAM_MEMBER", "team_members", id, "Member removed");
    res.status(204).send();
});

app.get("/api/seasons", authRequired, requirePermission("seasons.read"), (_, res) => {
    res.json(db.prepare("SELECT * FROM seasons ORDER BY id DESC").all());
});

app.post("/api/seasons", authRequired, requirePermission("seasons.write"), (req, res) => {
    const { name, startDate, endDate, pointsRules, status } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name"])) return;
    const result = db
        .prepare(
            `INSERT INTO seasons (name, start_date, end_date, points_rules, status)
             VALUES (?, ?, ?, ?, ?)`
        )
        .run(name.trim(), startDate || null, endDate || null, pointsRules || null, status || "planned");
    const created = db.prepare("SELECT * FROM seasons WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_SEASON", "seasons", created.id, created.name);
    res.status(201).json(created);
});

app.delete("/api/seasons/:id", authRequired, requirePermission("seasons.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid season id" });
        return;
    }
    const result = db.prepare("DELETE FROM seasons WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Season not found" });
        return;
    }
    logAudit(req.user, "DELETE_SEASON", "seasons", id, "Season removed");
    res.status(204).send();
});

app.get("/api/events", authRequired, requirePermission("events.read"), (_, res) => {
    const rows = db.prepare(
        `SELECT e.*, s.name AS season_name
         FROM events e
         LEFT JOIN seasons s ON s.id = e.season_id
         ORDER BY e.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/events", authRequired, requirePermission("events.write"), (req, res) => {
    const { name, location, eventDate, seasonId, eventType, status } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name"])) return;
    const result = db
        .prepare(
            `INSERT INTO events (name, location, event_date, season_id, event_type, status)
             VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
            name.trim(),
            location ? String(location).trim() : null,
            eventDate || null,
            seasonId ? parseId(seasonId) : null,
            eventType ? String(eventType).trim() : null,
            status || "planned"
        );
    const created = db.prepare("SELECT * FROM events WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_EVENT", "events", created.id, created.name);
    res.status(201).json(created);
});

app.patch("/api/events/:id", authRequired, requirePermission("events.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid event id" });
        return;
    }
    const map = {
        name: "name",
        location: "location",
        eventDate: "event_date",
        seasonId: "season_id",
        eventType: "event_type",
        status: "status"
    };
    const updates = [];
    const values = [];
    Object.entries(map).forEach(([key, field]) => {
        if (req.body[key] !== undefined) {
            updates.push(`${field} = ?`);
            if (key === "seasonId") {
                values.push(parseId(req.body[key]));
            } else {
                values.push(String(req.body[key]).trim());
            }
        }
    });
    if (updates.length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
    }
    values.push(id);
    db.prepare(`UPDATE events SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const updated = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
    if (!updated) {
        res.status(404).json({ error: "Event not found" });
        return;
    }
    logAudit(req.user, "UPDATE_EVENT", "events", id, JSON.stringify(req.body));
    res.json(updated);
});

app.delete("/api/events/:id", authRequired, requirePermission("events.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid event id" });
        return;
    }
    const result = db.prepare("DELETE FROM events WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Event not found" });
        return;
    }
    logAudit(req.user, "DELETE_EVENT", "events", id, "Event removed");
    res.status(204).send();
});

app.get("/api/jury-decisions", authRequired, requirePermission("jury_decisions.read"), (req, res) => {
    const eventId = req.query.eventId ? parseId(req.query.eventId) : null;
    if (req.query.eventId && !eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
    }
    const query = eventId
        ? `SELECT jd.*, e.name AS event_name FROM jury_decisions jd
           LEFT JOIN events e ON e.id = jd.event_id
           WHERE jd.event_id = ?
           ORDER BY jd.id DESC`
        : `SELECT jd.*, e.name AS event_name FROM jury_decisions jd
           LEFT JOIN events e ON e.id = jd.event_id
           ORDER BY jd.id DESC`;
    const rows = eventId ? db.prepare(query).all(eventId) : db.prepare(query).all();
    res.json(rows);
});

app.post("/api/jury-decisions", authRequired, requirePermission("jury_decisions.write"), (req, res) => {
    const { eventId, decisionType, notes } = req.body || {};
    if (!requireFields(res, req.body || {}, ["decisionType", "notes"])) return;
    const result = db
        .prepare(
            `INSERT INTO jury_decisions (event_id, decision_type, notes, created_by)
             VALUES (?, ?, ?, ?)`
        )
        .run(eventId ? parseId(eventId) : null, decisionType.trim(), notes.trim(), req.user.sub);
    const created = db.prepare("SELECT * FROM jury_decisions WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_JURY_DECISION", "jury_decisions", created.id, created.decision_type);
    res.status(201).json(created);
});

app.delete("/api/jury-decisions/:id", authRequired, requirePermission("jury_decisions.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid decision id" });
        return;
    }
    const result = db.prepare("DELETE FROM jury_decisions WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Decision not found" });
        return;
    }
    logAudit(req.user, "DELETE_JURY_DECISION", "jury_decisions", id, "Decision removed");
    res.status(204).send();
});

app.get("/api/point-rules", authRequired, requirePermission("point_rules.read"), (_, res) => {
    res.json(db.prepare("SELECT * FROM point_rules ORDER BY id DESC").all());
});

app.get("/api/system-scope", authRequired, requirePermission("dashboard.read"), (_req, res) => {
    const rows = db
        .prepare("SELECT module_key, title, status, owner_role, payload_json, created_at, updated_at FROM module_records ORDER BY id DESC")
        .all();
    const latestPerModule = {};
    rows.forEach((row) => {
        if (!latestPerModule[row.module_key]) {
            let payload = {};
            try {
                payload = JSON.parse(row.payload_json || "{}");
            } catch (error) {
                payload = {};
            }
            latestPerModule[row.module_key] = {
                title: row.title,
                status: row.status,
                ownerRole: row.owner_role || null,
                payload,
                updated_at: row.updated_at
            };
        }
    });
    const modules = SYSTEM_SCOPE_MODULES.map((entry) => ({
        ...entry,
        state: latestPerModule[entry.key] || null
    }));
    res.json({
        modules,
        workflows: WORKFLOW_BLUEPRINTS
    });
});

app.get("/api/module-records", authRequired, requirePermission("dashboard.read"), (req, res) => {
    const moduleKey = String(req.query.moduleKey || "").trim();
    const rows = moduleKey
        ? db.prepare("SELECT * FROM module_records WHERE module_key = ? ORDER BY id DESC LIMIT 200").all(moduleKey)
        : db.prepare("SELECT * FROM module_records ORDER BY id DESC LIMIT 200").all();
    const mapped = rows.map((row) => ({
        ...row,
        payload: parseConfigJsonSafely(row.payload_json)
    }));
    res.json(mapped);
});

app.post("/api/module-records", authRequired, requirePermission("dashboard.read"), (req, res) => {
    const moduleKey = String(req.body?.moduleKey || "").trim();
    const title = String(req.body?.title || "").trim();
    if (!moduleKey || !title) {
        res.status(400).json({ error: "moduleKey und title sind erforderlich" });
        return;
    }
    if (!SYSTEM_SCOPE_MODULES.some((entry) => entry.key === moduleKey)) {
        res.status(400).json({ error: "Unbekanntes Modul" });
        return;
    }
    const status = String(req.body?.status || "open").trim();
    const ownerRole = req.body?.ownerRole ? String(req.body.ownerRole).trim() : null;
    const payloadJson = JSON.stringify(req.body?.payload || {});
    const result = db.prepare(
        `INSERT INTO module_records (module_key, title, status, owner_role, payload_json, created_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(moduleKey, title, status, ownerRole, payloadJson, req.user.sub);
    const created = db.prepare("SELECT * FROM module_records WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_MODULE_RECORD", "module_records", created.id, `${moduleKey}: ${title}`);
    res.status(201).json({
        ...created,
        payload: parseConfigJsonSafely(created.payload_json)
    });
});

app.patch("/api/module-records/:id", authRequired, requirePermission("dashboard.read"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Ungültige Datensatz-ID" });
        return;
    }
    const existing = db.prepare("SELECT * FROM module_records WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "Datensatz nicht gefunden" });
        return;
    }
    const nextTitle = req.body?.title !== undefined ? String(req.body.title || "").trim() : existing.title;
    const nextStatus = req.body?.status !== undefined ? String(req.body.status || "").trim() : existing.status;
    const nextOwnerRole = req.body?.ownerRole !== undefined
        ? (req.body.ownerRole ? String(req.body.ownerRole).trim() : null)
        : existing.owner_role;
    if (!nextTitle) {
        res.status(400).json({ error: "title darf nicht leer sein" });
        return;
    }
    const payloadSource = req.body?.payload !== undefined ? req.body.payload : parseConfigJsonSafely(existing.payload_json);
    db.prepare(
        `UPDATE module_records
         SET title = ?, status = ?, owner_role = ?, payload_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
    ).run(nextTitle, nextStatus, nextOwnerRole, JSON.stringify(payloadSource || {}), id);
    const updated = db.prepare("SELECT * FROM module_records WHERE id = ?").get(id);
    logAudit(req.user, "UPDATE_MODULE_RECORD", "module_records", id, `${updated.module_key}: ${updated.title}`);
    res.json({
        ...updated,
        payload: parseConfigJsonSafely(updated.payload_json)
    });
});

app.delete("/api/module-records/:id", authRequired, requirePermission("dashboard.read"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Ungültige Datensatz-ID" });
        return;
    }
    const existing = db.prepare("SELECT id, module_key, title FROM module_records WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "Datensatz nicht gefunden" });
        return;
    }
    db.prepare("DELETE FROM module_records WHERE id = ?").run(id);
    logAudit(req.user, "DELETE_MODULE_RECORD", "module_records", id, `${existing.module_key}: ${existing.title}`);
    res.status(204).send();
});

app.post("/api/workflows/execute", authRequired, requireAnyPermission(["dashboard.read", "workflows.execute"]), (req, res) => {
    const workflowKey = String(req.body?.workflowKey || "").trim();
    const workflow = WORKFLOW_BLUEPRINTS.find((entry) => entry.key === workflowKey);
    if (!workflow) {
        res.status(400).json({ error: "Unbekannter Workflow" });
        return;
    }
    const input = req.body?.input || {};
    const payload = {
        input,
        emittedAt: new Date().toISOString(),
        steps: workflow.steps
    };
    let status = "completed";
    if (workflow.key === "medical_flow" && input.clearance !== true) {
        status = "blocked";
        payload.decision = "Athlet nicht startberechtigt: medical clearance fehlt";
    }
    if (workflow.key === "jury_intervention") {
        payload.decision = "Intervention dokumentiert, Teams benachrichtigt, Recalc markiert";
    }
    const result = db.prepare(
        `INSERT INTO workflow_runs (workflow_key, workflow_name, status, payload_json, created_by)
         VALUES (?, ?, ?, ?, ?)`
    ).run(workflow.key, workflow.name, status, JSON.stringify(payload), req.user.sub);
    const created = db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "EXECUTE_WORKFLOW", "workflow_runs", created.id, workflow.name);
    res.status(201).json({
        ...created,
        payload
    });
});

app.get("/api/workflows/logs", authRequired, requirePermission("dashboard.read"), (_req, res) => {
    const rows = db.prepare("SELECT * FROM workflow_runs ORDER BY id DESC LIMIT 200").all();
    const mapped = rows.map((row) => ({
        ...row,
        payload: parseConfigJsonSafely(row.payload_json)
    }));
    res.json(mapped);
});

app.get("/api/point-rule-templates", authRequired, requirePermission("point_rules.read"), (_req, res) => {
    res.json({ templates: pointRuleTemplates() });
});

app.post("/api/point-rules", authRequired, requirePermission("point_rules.write"), (req, res) => {
    const { errors, normalized } = validatePointRulePayload(req.body || {});
    if (errors.length > 0) {
        res.status(400).json({ error: errors.join(" ") });
        return;
    }
    const configJson = JSON.stringify(normalized.config);
    if (normalized.active === 1) {
        db.prepare("UPDATE point_rules SET active = 0 WHERE active = 1").run();
    }
    let result;
    try {
        result = db
            .prepare("INSERT INTO point_rules (name, rule_type, config_json, active) VALUES (?, ?, ?, ?)")
            .run(normalized.name, normalized.ruleType, configJson, normalized.active);
    } catch (error) {
        res.status(409).json({ error: "Regelname existiert bereits" });
        return;
    }
    const created = db.prepare("SELECT * FROM point_rules WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_POINT_RULE", "point_rules", created.id, created.name);
    res.status(201).json(created);
});

app.patch("/api/point-rules/:id", authRequired, requirePermission("point_rules.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid point rule id" });
        return;
    }
    const existing = db.prepare("SELECT id, name, rule_type, config_json, active FROM point_rules WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "Point rule not found" });
        return;
    }

    const merged = {
        name: req.body?.name ?? existing.name,
        ruleType: req.body?.ruleType ?? existing.rule_type,
        config: req.body?.config ?? parseConfigJsonSafely(existing.config_json),
        active: req.body?.active ?? (existing.active === 1)
    };
    const { errors, normalized } = validatePointRulePayload(merged);
    if (errors.length > 0) {
        res.status(400).json({ error: errors.join(" ") });
        return;
    }
    if (normalized.active === 1) {
        db.prepare("UPDATE point_rules SET active = 0 WHERE id != ?").run(id);
    }
    try {
        db.prepare(
            "UPDATE point_rules SET name = ?, rule_type = ?, config_json = ?, active = ? WHERE id = ?"
        ).run(normalized.name, normalized.ruleType, JSON.stringify(normalized.config), normalized.active, id);
    } catch (error) {
        res.status(409).json({ error: "Regelname existiert bereits" });
        return;
    }

    const updated = db.prepare("SELECT * FROM point_rules WHERE id = ?").get(id);
    logAudit(req.user, "UPDATE_POINT_RULE", "point_rules", id, updated.name);
    res.json(updated);
});

app.post("/api/point-rules/:id/activate", authRequired, requirePermission("point_rules.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid point rule id" });
        return;
    }
    const existing = db.prepare("SELECT id, name FROM point_rules WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "Point rule not found" });
        return;
    }
    db.prepare("UPDATE point_rules SET active = 0 WHERE active = 1").run();
    db.prepare("UPDATE point_rules SET active = 1 WHERE id = ?").run(id);
    const activated = db.prepare("SELECT * FROM point_rules WHERE id = ?").get(id);
    if (activated) {
        const settingValue = JSON.stringify({
            name: activated.name,
            ruleType: activated.rule_type,
            config: parseConfigJsonSafely(activated.config_json),
            active: true
        });
        db.prepare(
            `INSERT INTO settings (key, value_json, updated_at)
             VALUES ('point_rules_current', ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET
               value_json = excluded.value_json,
               updated_at = CURRENT_TIMESTAMP`
        ).run(settingValue);
    }
    logAudit(req.user, "ACTIVATE_POINT_RULE", "point_rules", id, existing.name);
    res.json({ id, active: true });
});

app.delete("/api/point-rules/:id", authRequired, requirePermission("point_rules.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid point rule id" });
        return;
    }
    const result = db.prepare("DELETE FROM point_rules WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Point rule not found" });
        return;
    }
    logAudit(req.user, "DELETE_POINT_RULE", "point_rules", id, "Point rule removed");
    res.status(204).send();
});

app.get("/api/event-scores", authRequired, requirePermission("event_scores.read"), (req, res) => {
    const eventId = req.query.eventId ? parseId(req.query.eventId) : null;
    if (req.query.eventId && !eventId) {
        res.status(400).json({ error: "Invalid event id" });
        return;
    }
    const query = eventId
        ? `SELECT es.*, e.name AS event_name
           FROM event_scores es
           LEFT JOIN events e ON e.id = es.event_id
           WHERE es.event_id = ?
           ORDER BY es.rank_position ASC, es.id DESC`
        : `SELECT es.*, e.name AS event_name
           FROM event_scores es
           LEFT JOIN events e ON e.id = es.event_id
           ORDER BY es.id DESC`;
    const rows = eventId ? db.prepare(query).all(eventId) : db.prepare(query).all();
    res.json(rows);
});

app.post("/api/event-scores", authRequired, requirePermission("event_scores.write"), (req, res) => {
    const { eventId, entryName, rankPosition, points, bonusPoints, notes } = req.body || {};
    if (!requireFields(res, req.body || {}, ["entryName"])) return;
    const result = db
        .prepare(
            `INSERT INTO event_scores (event_id, entry_name, rank_position, points, bonus_points, notes)
             VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
            eventId ? parseId(eventId) : null,
            entryName.trim(),
            rankPosition ? Number(rankPosition) : null,
            points ? Number(points) : 0,
            bonusPoints ? Number(bonusPoints) : 0,
            notes ? String(notes).trim() : null
        );
    const created = db.prepare("SELECT * FROM event_scores WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_EVENT_SCORE", "event_scores", created.id, created.entry_name);
    res.status(201).json(created);
});

app.delete("/api/event-scores/:id", authRequired, requirePermission("event_scores.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid score id" });
        return;
    }
    const result = db.prepare("DELETE FROM event_scores WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Score not found" });
        return;
    }
    logAudit(req.user, "DELETE_EVENT_SCORE", "event_scores", id, "Score removed");
    res.status(204).send();
});

app.get("/api/transfers", authRequired, requirePermission("transfers.read"), (_, res) => {
    const rows = db.prepare(
        `SELECT tr.*, tf.name AS from_team_name, tt.name AS to_team_name
         FROM transfers tr
         LEFT JOIN teams tf ON tf.id = tr.from_team_id
         LEFT JOIN teams tt ON tt.id = tr.to_team_id
         ORDER BY tr.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/transfers", authRequired, requirePermission("transfers.write"), (req, res) => {
    const { athleteName, fromTeamId, toTeamId, status, lockUntil, isEmergency, notes } = req.body || {};
    if (!requireFields(res, req.body || {}, ["athleteName"])) return;
    const result = db
        .prepare(
            `INSERT INTO transfers (athlete_name, from_team_id, to_team_id, status, lock_until, is_emergency, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
            athleteName.trim(),
            fromTeamId ? parseId(fromTeamId) : null,
            toTeamId ? parseId(toTeamId) : null,
            status || "requested",
            lockUntil || null,
            isEmergency ? 1 : 0,
            notes ? String(notes).trim() : null
        );
    const created = db.prepare("SELECT * FROM transfers WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_TRANSFER", "transfers", created.id, created.athlete_name);
    res.status(201).json(created);
});

app.delete("/api/transfers/:id", authRequired, requirePermission("transfers.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid transfer id" });
        return;
    }
    const result = db.prepare("DELETE FROM transfers WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Transfer not found" });
        return;
    }
    logAudit(req.user, "DELETE_TRANSFER", "transfers", id, "Transfer removed");
    res.status(204).send();
});

app.get("/api/contracts", authRequired, requirePermission("contracts.read"), (_, res) => {
    res.json(db.prepare("SELECT * FROM contracts ORDER BY id DESC").all());
});

app.post("/api/contracts", authRequired, requirePermission("contracts.write"), (req, res) => {
    const { fileName, entityType, entityId, status, expiresAt } = req.body || {};
    if (!requireFields(res, req.body || {}, ["fileName", "entityType"])) return;
    const result = db
        .prepare(
            `INSERT INTO contracts (file_name, entity_type, entity_id, status, expires_at)
             VALUES (?, ?, ?, ?, ?)`
        )
        .run(fileName.trim(), entityType.trim(), entityId ? parseId(entityId) : null, status || "in_review", expiresAt || null);
    const created = db.prepare("SELECT * FROM contracts WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_CONTRACT", "contracts", created.id, created.file_name);
    res.status(201).json(created);
});

app.delete("/api/contracts/:id", authRequired, requirePermission("contracts.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid contract id" });
        return;
    }
    const result = db.prepare("DELETE FROM contracts WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Contract not found" });
        return;
    }
    logAudit(req.user, "DELETE_CONTRACT", "contracts", id, "Contract removed");
    res.status(204).send();
});

app.get("/api/publications", authRequired, requirePermission("publications.read"), (_, res) => {
    res.json(db.prepare("SELECT * FROM publications ORDER BY id DESC").all());
});

app.post("/api/publications", authRequired, requirePermission("publications.write"), (req, res) => {
    const { title, format, status, publishedAt } = req.body || {};
    if (!requireFields(res, req.body || {}, ["title", "format"])) return;
    const result = db
        .prepare("INSERT INTO publications (title, format, status, published_at) VALUES (?, ?, ?, ?)")
        .run(title.trim(), format.trim(), status || "draft", publishedAt || null);
    const created = db.prepare("SELECT * FROM publications WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_PUBLICATION", "publications", created.id, created.title);
    res.status(201).json(created);
});

app.delete("/api/publications/:id", authRequired, requirePermission("publications.write"), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid publication id" });
        return;
    }
    const result = db.prepare("DELETE FROM publications WHERE id = ?").run(id);
    if (result.changes === 0) {
        res.status(404).json({ error: "Publication not found" });
        return;
    }
    logAudit(req.user, "DELETE_PUBLICATION", "publications", id, "Publication removed");
    res.status(204).send();
});

app.get("/api/settings", authRequired, requirePermission("settings.read"), (_, res) => {
    const rows = db.prepare("SELECT key, value_json, updated_at FROM settings ORDER BY key ASC").all();
    const mapped = rows.map((row) => {
        let parsedValue = null;
        try {
            parsedValue = JSON.parse(row.value_json);
        } catch (error) {
            parsedValue = row.value_json;
        }
        return { key: row.key, value: parsedValue, updated_at: row.updated_at };
    });
    res.json(mapped);
});

app.post("/api/settings", authRequired, requirePermission("settings.write"), (req, res) => {
    const key = String(req.body?.key || "").trim();
    if (!key) {
        res.status(400).json({ error: "Missing setting key" });
        return;
    }
    const valueJson = JSON.stringify(req.body?.value ?? null);
    db.prepare(
        `INSERT INTO settings (key, value_json, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = CURRENT_TIMESTAMP`
    ).run(key, valueJson);
    logAudit(req.user, "UPSERT_SETTING", "settings", key, valueJson);
    res.json({ key, value: req.body?.value ?? null });
});

app.put("/api/settings/:key", authRequired, requirePermission("settings.write"), (req, res) => {
    const key = String(req.params.key || "").trim();
    if (!key) {
        res.status(400).json({ error: "Missing setting key" });
        return;
    }
    const valueJson = JSON.stringify(req.body?.value ?? null);
    db.prepare(
        `INSERT INTO settings (key, value_json, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = CURRENT_TIMESTAMP`
    ).run(key, valueJson);
    logAudit(req.user, "UPSERT_SETTING", "settings", key, valueJson);
    res.json({ key, value: req.body?.value ?? null });
});

app.get("/api/public/standings", (_req, res) => {
    const rows = db.prepare(
        `SELECT entry_name, SUM(points + bonus_points) AS total_points, COUNT(*) AS starts
         FROM event_scores
         GROUP BY entry_name
         ORDER BY total_points DESC, entry_name ASC
         LIMIT 100`
    ).all();
    const standings = rows.map((row, index) => ({
        rank: index + 1,
        entryName: row.entry_name,
        totalPoints: Number(row.total_points || 0),
        starts: row.starts || 0
    }));
    res.json({ standings, updatedAt: new Date().toISOString() });
});

// Invitation endpoints (no auth required)
app.get("/api/invitations/:token", (req, res) => {
    const token = String(req.params.token || "").trim();
    if (!token) {
        res.status(400).json({ error: "Token ist erforderlich." });
        return;
    }

    const invitation = db.prepare(
        `SELECT i.id, i.user_id, i.email, i.status, i.expires_at, u.username, u.name, u.role
         FROM invitations i
         JOIN users u ON u.id = i.user_id
         WHERE i.token = ?`
    ).get(token);

    if (!invitation) {
        res.status(404).json({ error: "Einladung nicht gefunden." });
        return;
    }

    // Token abgelaufen?
    if (new Date(invitation.expires_at) < new Date()) {
        res.status(410).json({ error: "Diese Einladung ist abgelaufen." });
        return;
    }

    // Bereits akzeptiert?
    if (invitation.status !== "pending") {
        res.status(400).json({ error: "Diese Einladung wurde bereits verwendet." });
        return;
    }

    res.json({
        token,
        email: invitation.email,
        username: invitation.username,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expires_at
    });
});

app.post("/api/invitations/:token/accept", async (req, res) => {
    const token = String(req.params.token || "").trim();
    const { password } = req.body || {};

    if (!token) {
        res.status(400).json({ error: "Token ist erforderlich." });
        return;
    }

    if (!password || String(password).trim().length < 8) {
        res.status(400).json({ error: "Passwort muss mindestens 8 Zeichen lang sein." });
        return;
    }

    const invitation = db.prepare(
        `SELECT i.id, i.user_id, i.email, i.status, i.expires_at
         FROM invitations i
         WHERE i.token = ?`
    ).get(token);

    if (!invitation) {
        res.status(404).json({ error: "Einladung nicht gefunden." });
        return;
    }

    if (new Date(invitation.expires_at) < new Date()) {
        res.status(410).json({ error: "Diese Einladung ist abgelaufen." });
        return;
    }

    if (invitation.status !== "pending") {
        res.status(400).json({ error: "Diese Einladung wurde bereits verwendet." });
        return;
    }

    const hash = bcrypt.hashSync(password.trim(), 12);
    
    const acceptInvitation = db.transaction(() => {
        // Passwort und Status aktualisieren
        db.prepare(
            `UPDATE users SET password_hash = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
        ).run(hash, invitation.user_id);

        // Einladung als akzeptiert markieren
        db.prepare(
            `UPDATE invitations SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
             WHERE id = ?`
        ).run(invitation.id);
    });

    try {
        acceptInvitation();
    } catch (error) {
        console.error("Fehler beim Akzeptieren der Einladung:", error.message);
        res.status(500).json({ error: "Einladung konnte nicht akzeptiert werden." });
        return;
    }

    const user = db.prepare("SELECT id, username, name, email, role FROM users WHERE id = ?").get(invitation.user_id);
    logAudit({ username: user.username, role: user.role }, "ACCEPT_INVITATION", "invitations", invitation.id, `Account aktiviert für ${user.username}`);

    res.json({
        message: "Account erfolgreich aktiviert!",
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

app.use("/api", (req, res) => {
    res.status(404).json({ error: `Unknown endpoint: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
    res.status(500).json({ error: "Internal server error", details: error.message });
});

app.use(express.static(STATIC_ROOT));

app.get("/{*path}", (req, res) => {
    if (req.path.startsWith("/api/")) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    const filePath = path.join(STATIC_ROOT, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.sendFile(filePath);
        return;
    }
    res.sendFile(path.join(STATIC_ROOT, "index.html"));
});

const server = http.createServer(app);
registerWebSocketServer(server);

async function startServer() {
    await initializeEmailTransporter();
    server.listen(PORT, HOST, () => {
        // eslint-disable-next-line no-console
        console.log(`MSC backend running on http://${HOST}:${PORT} (DB: ${DB_PATH})`);
    });
}

startServer().catch(err => {
    console.error("Fehler beim Starten des Servers:", err);
    process.exit(1);
});
