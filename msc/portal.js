const SESSION_KEY = "msc_portal_session";

function getPageName() {
    return (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
}

function loadSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function isLoginPage() {
    return getPageName() === "login.html";
}

function setActiveNav() {
    const page = getPageName();
    document.querySelectorAll(".portal-nav a").forEach((link) => {
        const target = (link.getAttribute("href") || "").toLowerCase();
        link.classList.toggle("active", target === page);
    });
}

function syncIdentity(session) {
    const userNodes = document.querySelectorAll("[data-session-user]");
    const roleNodes = document.querySelectorAll("[data-session-role]");

    userNodes.forEach((node) => {
        node.textContent = session?.displayName || session?.username || "Nicht gesetzt";
    });

    roleNodes.forEach((node) => {
        node.textContent = session?.role || "Nicht gesetzt";
    });
}

function protectPortal() {
    if (isLoginPage()) return;
    const session = loadSession();
    if (!session) {
        window.location.href = "login.html";
        return;
    }
    syncIdentity(session);
}

function attachLogin() {
    if (!isLoginPage()) return;

    const existing = loadSession();
    if (existing) {
        window.location.href = "dashboard.html";
        return;
    }

    const username = document.getElementById("login-username");
    const password = document.getElementById("login-password");
    const role = document.getElementById("login-role");
    const button = document.getElementById("login-button");
    const message = document.getElementById("login-message");

    const login = () => {
        const userValue = username?.value.trim() || "";
        const passValue = password?.value || "";
        const roleValue = role?.value.trim() || "Nicht gesetzt";

        if (!userValue || !passValue) {
            if (message) {
                message.textContent = "Bitte Benutzerkennung und Passwort eingeben.";
                message.classList.remove("hidden");
            }
            return;
        }

        saveSession({
            username: userValue,
            displayName: userValue,
            role: roleValue
        });
        window.location.href = "dashboard.html";
    };

    button?.addEventListener("click", login);
    [username, password].forEach((field) => {
        field?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") login();
        });
    });
}

function attachLogout() {
    const button = document.getElementById("logout-button");
    button?.addEventListener("click", () => {
        clearSession();
        window.location.href = "login.html";
    });
}

function attachTabs() {
    document.querySelectorAll("[data-tab-group]").forEach((group) => {
        const buttons = group.querySelectorAll("[data-tab-target]");
        const panels = group.querySelectorAll("[data-tab-panel]");
        const activate = (target) => {
            buttons.forEach((button) => {
                button.classList.toggle("active", button.getAttribute("data-tab-target") === target);
            });
            panels.forEach((panel) => {
                panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === target);
            });
        };
        buttons.forEach((button) => {
            button.addEventListener("click", () => activate(button.getAttribute("data-tab-target")));
        });
        const activeButton = group.querySelector("[data-tab-target].active") || buttons[0];
        if (activeButton) activate(activeButton.getAttribute("data-tab-target"));
    });
}

function attachModals() {
    document.querySelectorAll("[data-open-modal]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
            const target = document.getElementById(trigger.getAttribute("data-open-modal"));
            target?.classList.remove("hidden");
        });
    });

    document.querySelectorAll("[data-close-modal]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
            trigger.closest(".modal")?.classList.add("hidden");
        });
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) modal.classList.add("hidden");
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    protectPortal();
    attachLogin();
    attachLogout();
    attachTabs();
    attachModals();
});
