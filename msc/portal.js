const btnCreateUser = document.getElementById('btn-create-user');
if (btnCreateUser) {
    btnCreateUser.addEventListener('click', () => {
        // Modal öffnen
    });
}

const modalCloseUser = document.getElementById("modal-close-create");
if (modalCloseUser) {
    modalCloseUser.addEventListener("click", () => {
        modalCreateUser.style.display = "none";
    });
}

// Speichern (später API)
document.getElementById('btn-save-user').addEventListener('click', () => {
    // später: POST /api/users
    alert("Benutzer wird später über API gespeichert.");
});

// Feste Admin-Kennung (später API)
const MSC_ADMIN_USER = "msc.admin";
const MSC_ADMIN_PASS = "Maximan2026!";

// Login-Button Listener
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-button");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const user = document.getElementById("login-username").value.trim();
            const pass = document.getElementById("login-password").value.trim();

            if (user === MSC_ADMIN_USER && pass === MSC_ADMIN_PASS) {
                // Login erfolgreich → Session setzen
                localStorage.setItem("msc_logged_in", "true");
                localStorage.setItem("msc_user", MSC_ADMIN_USER);
                localStorage.setItem("msc_role", "MSC Admin");

                // Weiterleitung ins Dashboard
                window.location.href = "dashboard.html";
            } else {
                alert("Ungültige Kennung oder Passwort.");
            }
        });
    }

    // Dashboard-Schutz
    if (window.location.pathname.includes("dashboard.html")) {
        const loggedIn = localStorage.getItem("msc_logged_in");

        if (!loggedIn) {
            window.location.href = "login.html";
        } else {
            // Benutzername anzeigen
            const userField = document.getElementById("current-user");
            const roleField = document.getElementById("current-role");

            if (userField) userField.innerText = localStorage.getItem("msc_user");
            if (roleField) roleField.innerText = localStorage.getItem("msc_role");
        }
    }
});

// Team-Modal öffnen
const btnCreateTeam = document.getElementById("btn-create-team");
const modalCreateTeam = document.getElementById("modal-create-team");
const modalCloseTeam = document.getElementById("modal-close-team");

if (btnCreateTeam) {
    btnCreateTeam.addEventListener("click", () => {
        modalCreateTeam.style.display = "flex";
    });
}

if (modalCloseTeam) {
    modalCloseTeam.addEventListener("click", () => {
        modalCreateTeam.style.display = "none";
    });
}

// Team speichern (später API)
const btnSaveTeam = document.getElementById("btn-save-team");

if (btnSaveTeam) {
    btnSaveTeam.addEventListener("click", () => {
        alert("Team wird später über API gespeichert.");
    });
}
