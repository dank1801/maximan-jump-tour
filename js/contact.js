// EmailJS initialisieren
emailjs.init("DEIN_PUBLIC_KEY");

// Whitelist
const whitelist = [
    "beispiel1@gmail.com",
    "beispiel2@web.de",
    "beispiel3@posteo.de"
];

document.getElementById("contactForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;

    const formMessage = document.getElementById("formMessage");

    // Whitelist prüfen
    if (!whitelist.includes(email)) {
        formMessage.innerHTML = "Diese E-Mail-Adresse ist nicht freigeschaltet.";
        formMessage.style.color = "red";
        return;
    }

    // Token erzeugen
    const token = Math.random().toString(36).substring(2);

    // Daten speichern
    localStorage.setItem(token, JSON.stringify({
        name,
        email,
        subject,
        message
    }));

    // Bestätigungs-Mail senden
    emailjs.send("DEIN_SERVICE_ID", "DEIN_TEMPLATE_CONFIRM", {
        to_email: email,
        token: token
    }).then(() => {
        formMessage.innerHTML = "Bitte bestätige deine E-Mail. Wir haben dir eine Nachricht geschickt.";
        formMessage.style.color = "green";
    });
});
