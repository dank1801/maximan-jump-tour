const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

function randomPort() {
    return 3500 + Math.floor(Math.random() * 1200);
}

async function waitForServer(baseUrl, timeoutMs = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(`${baseUrl}/api/auth/bootstrap-status`);
            if (response.ok) return;
        } catch (_error) {
            // retry
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("Server did not become ready in time");
}

async function jsonRequest(baseUrl, urlPath, { method = "GET", token = "", body = undefined, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    return { response, payload };
}

test("core governance flows remain stable", async (t) => {
    const port = randomPort();
    const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "msc-regression-"));
    const baseUrl = `http://127.0.0.1:${port}`;
    const server = spawn("node", ["backend/server.js"], {
        cwd: path.join(__dirname, "..", ".."),
        env: {
            ...process.env,
            PORT: String(port),
            HOST: "127.0.0.1",
            DB_DIR: dbDir,
            ENABLE_ONLINE_SNAPSHOT: "false",
            REQUIRE_PERSISTENT_DB: "false",
            NODE_ENV: "test",
            JWT_SECRET: "test-secret"
        },
        stdio: "pipe"
    });
    const serverOutput = [];
    server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
    server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

    t.after(() => {
        server.kill("SIGTERM");
        fs.rmSync(dbDir, { recursive: true, force: true });
    });

    await waitForServer(baseUrl);

    const bootstrap = await jsonRequest(baseUrl, "/api/auth/bootstrap", {
        method: "POST",
        body: {
            username: "admin",
            name: "Admin",
            email: "admin@example.com",
            password: "password1234"
        }
    });
    assert.equal(bootstrap.response.status, 201, JSON.stringify({ serverOutput, bootstrap: bootstrap.payload }));
    const adminToken = bootstrap.payload.token;

    const createOrg = await jsonRequest(baseUrl, "/api/organizations", {
        method: "POST",
        token: adminToken,
        body: { name: "Org Alpha", shortName: "OA", status: "active" }
    });
    assert.equal(createOrg.response.status, 201);
    const orgId = createOrg.payload.id;

    const createSeason = await jsonRequest(baseUrl, "/api/seasons", {
        method: "POST",
        token: adminToken,
        body: {
            name: "Saison 2030",
            registrationDeadlineAt: "2030-02-01T12:00:00.000Z",
            transferWindowOpenAt: "2030-01-01T00:00:00.000Z",
            transferWindowCloseAt: "2030-01-15T00:00:00.000Z",
            status: "planned"
        }
    });
    assert.equal(createSeason.response.status, 201);
    const season = createSeason.payload;

    const createTeam = await jsonRequest(baseUrl, "/api/teams", {
        method: "POST",
        token: adminToken,
        body: { name: "Org Alpha A", organizationId: orgId, teamType: "A" }
    });
    assert.equal(createTeam.response.status, 201);
    const teamId = createTeam.payload.id;

    const teamsList = await jsonRequest(baseUrl, "/api/teams", { token: adminToken });
    const createdTeam = teamsList.payload.find((entry) => Number(entry.id) === Number(teamId));
    assert.ok(createdTeam);

    const patchTeamOk = await jsonRequest(baseUrl, `/api/teams/${teamId}`, {
        method: "PATCH",
        token: adminToken,
        headers: { "X-Entity-Updated-At": String(createdTeam.updated_at || "") },
        body: { category: "A1" }
    });
    assert.equal(patchTeamOk.response.status, 200);

    const patchTeamConflict = await jsonRequest(baseUrl, `/api/teams/${teamId}`, {
        method: "PATCH",
        token: adminToken,
        headers: { "X-Entity-Updated-At": String(createdTeam.updated_at || "") },
        body: { category: "A2" }
    });
    assert.equal(patchTeamConflict.response.status, 409);

    const bulkAssignSeason = await jsonRequest(baseUrl, "/api/teams/bulk-update", {
        method: "POST",
        token: adminToken,
        body: { teamIds: [teamId], action: "assignSeason", seasonId: season.id }
    });
    assert.equal(bulkAssignSeason.response.status, 200);
    assert.equal(Number(bulkAssignSeason.payload.updatedCount || 0), 1);

    const addMember = await jsonRequest(baseUrl, `/api/teams/${teamId}/members`, {
        method: "POST",
        token: adminToken,
        body: { name: "Max Mustermann", memberRole: "Athlet", isSpringer: false }
    });
    assert.equal(addMember.response.status, 201);

    const submitTeam = await jsonRequest(baseUrl, `/api/teams/${teamId}/submit-registration`, {
        method: "POST",
        token: adminToken
    });
    assert.equal(submitTeam.response.status, 200);
    assert.equal(String(submitTeam.payload.registration_status), "submitted");

    const rollbackTeam = await jsonRequest(baseUrl, `/api/teams/${teamId}/rollback-registration`, {
        method: "POST",
        token: adminToken
    });
    assert.equal(rollbackTeam.response.status, 200);
    assert.equal(String(rollbackTeam.payload.registration_status), "draft");

    const patchSeason = await jsonRequest(baseUrl, `/api/seasons/${season.id}`, {
        method: "PATCH",
        token: adminToken,
        headers: { "X-Entity-Updated-At": String(season.updated_at || "") },
        body: { registrationDeadlineAt: "2030-03-01T12:00:00.000Z" }
    });
    assert.equal(patchSeason.response.status, 200);

    const rollbackSeason = await jsonRequest(baseUrl, `/api/seasons/${season.id}/rollback-deadlines`, {
        method: "POST",
        token: adminToken
    });
    assert.equal(rollbackSeason.response.status, 200);
    assert.equal(String(rollbackSeason.payload.registration_deadline_at), "2030-02-01T12:00:00.000Z");

    const runRuleNotifications = await jsonRequest(baseUrl, "/api/team-portal/rule-notifications/run", {
        method: "POST",
        token: adminToken
    });
    assert.equal(runRuleNotifications.response.status, 200);
    assert.ok(Number(runRuleNotifications.payload.scannedOrganizations || 0) >= 1);

    const orgHistory = await jsonRequest(baseUrl, `/api/organizations/${orgId}/history`, { token: adminToken });
    assert.equal(orgHistory.response.status, 200);
    assert.ok(Array.isArray(orgHistory.payload));

    const seasonHistory = await jsonRequest(baseUrl, `/api/seasons/${season.id}/history`, { token: adminToken });
    assert.equal(seasonHistory.response.status, 200);
    assert.ok(Array.isArray(seasonHistory.payload));
});
