document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------------
    // LOGIN
    // -----------------------------------------
    const MSC_ADMIN_USER = "msc.admin";
    const MSC_ADMIN_PASS = "Maximan2026!";

    const loginBtn = document.getElementById("login-button");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const user = document.getElementById("login-username").value.trim();
            const pass = document.getElementById("login-password").value.trim();

            if (user === MSC_ADMIN_USER && pass === MSC_ADMIN_PASS) {
                localStorage.setItem("msc_logged_in", "true");
                localStorage.setItem("msc_user", MSC_ADMIN_USER);
                localStorage.setItem("msc_role", "MSC Admin");

                window.location.href = "dashboard.html";
            } else {
                alert("Ungültige Kennung oder Passwort.");
            }
        });
    }

    // -----------------------------------------
    // DASHBOARD-SCHUTZ
    // -----------------------------------------
    if (window.location.pathname.includes("dashboard.html")) {
        const loggedIn = localStorage.getItem("msc_logged_in");
        if (!loggedIn) {
            window.location.href = "login.html";
        } else {
            const userField = document.getElementById("current-user");
            const roleField = document.getElementById("current-role");

            if (userField) userField.innerText = localStorage.getItem("msc_user");
            if (roleField) roleField.innerText = localStorage.getItem("msc_role");
        }
    }

    // -----------------------------------------
    // BENUTZER-MODAL (users.html)
    // -----------------------------------------
    const btnCreateUser = document.getElementById("btn-create-user");
    const modalCreateUser = document.getElementById("modal-create-user");
    const modalCloseUser = document.getElementById("modal-close-create");

    if (btnCreateUser && modalCreateUser && modalCloseUser) {
        btnCreateUser.addEventListener("click", () => {
            modalCreateUser.style.display = "flex";
        });

        modalCloseUser.addEventListener("click", () => {
            modalCreateUser.style.display = "none";
        });
    }

    // -----------------------------------------
    // TEAM-MODAL (teams.html)
    // -----------------------------------------
    const btnCreateTeam = document.getElementById("btn-create-team");
    const modalCreateTeam = document.getElementById("modal-create-team");
    const modalCloseTeam = document.getElementById("modal-close-team");

    if (btnCreateTeam && modalCreateTeam && modalCloseTeam) {
        btnCreateTeam.addEventListener("click", () => {
            modalCreateTeam.style.display = "flex";
        });

        modalCloseTeam.addEventListener("click", () => {
            modalCreateTeam.style.display = "none";
        });
    }

});
