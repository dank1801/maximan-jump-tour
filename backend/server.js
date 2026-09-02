const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

let DB_DIR = IS_PRODUCTION ? "/var/data" : path.join(__dirname, "..", ".runtime", "data");

if (!fs.existsSync(DB_DIR)) {
    try {
        fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (error) {
        console.warn(`Cannot create ${DB_DIR}: ${error.message}, falling back to local directory`);
        DB_DIR = path.join(__dirname, "..", ".runtime", "data");
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

const DB_PATH = path.join(DB_DIR, "msc-portal.db");
const STATIC_ROOT = path.join(__dirname, "..");

if (IS_PRODUCTION && !JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production");
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || "dev-insecure-secret";

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            last_login_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        req.user = payload;
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

function logAudit(actor, action, entityType, entityId, details) {
    db.prepare(
        `INSERT INTO audit_logs (actor_user_id, actor_username, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).run(actor?.sub || null, actor?.username || "system", action, entityType, entityId ? String(entityId) : null, details || null);
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

const ADMIN_ROLES = ["msc admin", "admin", "root-admin"];
const TEAM_WRITE_ROLES = [...ADMIN_ROLES, "teammanager"];
const JURY_WRITE_ROLES = [...ADMIN_ROLES, "jury"];
const REPORT_WRITE_ROLES = [...ADMIN_ROLES, "reporter", "media"];

app.get("/api/health", (_, res) => {
    res.json({ status: "ok" });
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
    if (!user || user.status !== "active" || !bcrypt.compareSync(password, user.password_hash)) {
        res.status(401).json({ error: "Invalid credentials" });
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

app.get("/api/dashboard", authRequired, (_, res) => {
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

app.get("/api/audit-logs", authRequired, (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const rows = db.prepare(
        `SELECT id, created_at, actor_username, action, entity_type, entity_id, details
         FROM audit_logs
         ORDER BY id DESC
         LIMIT ?`
    ).all(limit);
    res.json(rows);
});

app.get("/api/users", authRequired, (req, res) => {
    const rows = db.prepare(
        `SELECT id, username, name, email, role, status, last_login_at, created_at
         FROM users
         ORDER BY id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/users", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
    const { username, name, email, role, password } = req.body || {};
    if (!requireFields(res, req.body || {}, ["username", "name", "email", "role", "password"])) return;
    const hash = bcrypt.hashSync(password, 12);
    const result = db
        .prepare(
            `INSERT INTO users (username, name, email, role, password_hash, status)
             VALUES (?, ?, ?, ?, ?, 'active')`
        )
        .run(username.trim(), name.trim(), email.trim().toLowerCase(), role.trim(), hash);
    const created = db.prepare("SELECT id, username, name, email, role, status, created_at FROM users WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_USER", "users", created.id, `${created.username} (${created.role})`);
    res.status(201).json(created);
});

app.patch("/api/users/:id", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        res.status(400).json({ error: "Invalid user id" });
        return;
    }
    const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!existing) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    const allowed = ["name", "email", "role", "status"];
    const updates = [];
    const values = [];
    allowed.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(field === "email" ? String(req.body[field]).trim().toLowerCase() : String(req.body[field]).trim());
        }
    });
    if (req.body.password) {
        updates.push("password_hash = ?");
        values.push(bcrypt.hashSync(String(req.body.password), 12));
    }
    if (updates.length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
    }
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const updated = db.prepare("SELECT id, username, name, email, role, status, last_login_at FROM users WHERE id = ?").get(id);
    logAudit(req.user, "UPDATE_USER", "users", id, JSON.stringify(req.body));
    res.json(updated);
});

app.delete("/api/users/:id", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.get("/api/teams", authRequired, (_, res) => {
    const rows = db.prepare(
        `SELECT t.id, t.name, t.nation, t.category, t.status, t.created_at, u.username AS manager_username
         FROM teams t
         LEFT JOIN users u ON u.id = t.manager_user_id
         ORDER BY t.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/teams", authRequired, requireRoles(TEAM_WRITE_ROLES), (req, res) => {
    const { name, nation, category, managerUserId } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name"])) return;
    const managerId = managerUserId ? parseId(managerUserId) : null;
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

app.patch("/api/teams/:id", authRequired, requireRoles(TEAM_WRITE_ROLES), (req, res) => {
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
    allowed.forEach((field) => {
        const requestKey = field === "manager_user_id" ? "managerUserId" : field;
        if (req.body[requestKey] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(field === "manager_user_id" ? parseId(req.body[requestKey]) : String(req.body[requestKey]).trim());
        }
    });
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

app.delete("/api/teams/:id", authRequired, requireRoles(TEAM_WRITE_ROLES), (req, res) => {
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

app.get("/api/teams/:id/members", authRequired, (req, res) => {
    const teamId = parseId(req.params.id);
    if (!teamId) {
        res.status(400).json({ error: "Invalid team id" });
        return;
    }
    const rows = db.prepare("SELECT * FROM team_members WHERE team_id = ? ORDER BY id DESC").all(teamId);
    res.json(rows);
});

app.post("/api/teams/:id/members", authRequired, requireRoles(TEAM_WRITE_ROLES), (req, res) => {
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

app.patch("/api/team-members/:id", authRequired, requireRoles(TEAM_WRITE_ROLES), (req, res) => {
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

app.delete("/api/team-members/:id", authRequired, requireRoles(TEAM_WRITE_ROLES), (req, res) => {
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

app.get("/api/seasons", authRequired, (_, res) => {
    res.json(db.prepare("SELECT * FROM seasons ORDER BY id DESC").all());
});

app.post("/api/seasons", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.delete("/api/seasons/:id", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.get("/api/events", authRequired, (_, res) => {
    const rows = db.prepare(
        `SELECT e.*, s.name AS season_name
         FROM events e
         LEFT JOIN seasons s ON s.id = e.season_id
         ORDER BY e.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/events", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.patch("/api/events/:id", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.delete("/api/events/:id", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.get("/api/jury-decisions", authRequired, (req, res) => {
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

app.post("/api/jury-decisions", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.delete("/api/jury-decisions/:id", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.get("/api/point-rules", authRequired, (_, res) => {
    res.json(db.prepare("SELECT * FROM point_rules ORDER BY id DESC").all());
});

app.post("/api/point-rules", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
    const { name, ruleType, config, active } = req.body || {};
    if (!requireFields(res, req.body || {}, ["name", "ruleType"])) return;
    const configJson = JSON.stringify(config || {});
    const result = db
        .prepare("INSERT INTO point_rules (name, rule_type, config_json, active) VALUES (?, ?, ?, ?)")
        .run(name.trim(), ruleType.trim(), configJson, active === false ? 0 : 1);
    const created = db.prepare("SELECT * FROM point_rules WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_POINT_RULE", "point_rules", created.id, created.name);
    res.status(201).json(created);
});

app.delete("/api/point-rules/:id", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.get("/api/event-scores", authRequired, (req, res) => {
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

app.post("/api/event-scores", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.delete("/api/event-scores/:id", authRequired, requireRoles(JURY_WRITE_ROLES), (req, res) => {
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

app.get("/api/transfers", authRequired, (_, res) => {
    const rows = db.prepare(
        `SELECT tr.*, tf.name AS from_team_name, tt.name AS to_team_name
         FROM transfers tr
         LEFT JOIN teams tf ON tf.id = tr.from_team_id
         LEFT JOIN teams tt ON tt.id = tr.to_team_id
         ORDER BY tr.id DESC`
    ).all();
    res.json(rows);
});

app.post("/api/transfers", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.delete("/api/transfers/:id", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.get("/api/contracts", authRequired, (_, res) => {
    res.json(db.prepare("SELECT * FROM contracts ORDER BY id DESC").all());
});

app.post("/api/contracts", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.delete("/api/contracts/:id", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.get("/api/publications", authRequired, (_, res) => {
    res.json(db.prepare("SELECT * FROM publications ORDER BY id DESC").all());
});

app.post("/api/publications", authRequired, requireRoles(REPORT_WRITE_ROLES), (req, res) => {
    const { title, format, status, publishedAt } = req.body || {};
    if (!requireFields(res, req.body || {}, ["title", "format"])) return;
    const result = db
        .prepare("INSERT INTO publications (title, format, status, published_at) VALUES (?, ?, ?, ?)")
        .run(title.trim(), format.trim(), status || "draft", publishedAt || null);
    const created = db.prepare("SELECT * FROM publications WHERE id = ?").get(result.lastInsertRowid);
    logAudit(req.user, "CREATE_PUBLICATION", "publications", created.id, created.title);
    res.status(201).json(created);
});

app.delete("/api/publications/:id", authRequired, requireRoles(REPORT_WRITE_ROLES), (req, res) => {
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

app.get("/api/settings", authRequired, (_, res) => {
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

app.put("/api/settings/:key", authRequired, requireRoles(ADMIN_ROLES), (req, res) => {
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

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`MSC backend running on http://localhost:${PORT}`);
});
