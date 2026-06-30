// Öffnen des Modals
document.getElementById('btn-create-user').addEventListener('click', () => {
    document.getElementById('modal-create-user').style.display = 'flex';
});

// Schließen des Modals
document.getElementById('modal-close-create').addEventListener('click', () => {
    document.getElementById('modal-create-user').style.display = 'none';
});

// Speichern (später API)
document.getElementById('btn-save-user').addEventListener('click', () => {
    // später: POST /api/users
    alert("Benutzer wird später über API gespeichert.");
});
