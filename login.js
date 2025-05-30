// Login-System
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            showApp();
        } else {
            showError('Ungültige Anmeldedaten!');
        }
    });
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('currentUser').textContent = `${currentUser.name} (${currentUser.role})`;
    
    // ALLE Tabs erst mal verstecken
    document.getElementById('newsTab').style.display = 'none';
    document.getElementById('themenTab').style.display = 'none';
    document.getElementById('gruppenTab').style.display = 'none';
    document.getElementById('lehrerTab').style.display = 'none';
    document.getElementById('datenTab').style.display = 'none';
    document.getElementById('bewertenTab').style.display = 'none';
    document.getElementById('vorlagenTab').style.display = 'none';
    document.getElementById('uebersichtTab').style.display = 'none';
    document.getElementById('adminvorlagenTab').style.display = 'none';
    
    // Tabs je nach Rolle anzeigen
    if (currentUser.role === 'admin') {
        // Admin sieht: News, Lehrer verwalten, Datenverwaltung, Admin-Vorlagen
        document.getElementById('newsTab').style.display = 'block';
        document.getElementById('lehrerTab').style.display = 'block';
        document.getElementById('datenTab').style.display = 'block';
        document.getElementById('adminvorlagenTab').style.display = 'block';
    } else {
        // Lehrer sieht: News, Themen, Gruppen erstellen, Schüler bewerten, Bewertungsvorlagen, Übersicht
        document.getElementById('newsTab').style.display = 'block';
        document.getElementById('themenTab').style.display = 'block';
        document.getElementById('gruppenTab').style.display = 'block';
        document.getElementById('bewertenTab').style.display = 'block';
        document.getElementById('vorlagenTab').style.display = 'block';
        document.getElementById('uebersichtTab').style.display = 'block';
    }
    
    initializeApp();
}

function logout() {
    currentUser = null;
    
    // Alle Tabs verstecken beim Logout
    document.getElementById('newsTab').style.display = 'none';
    document.getElementById('themenTab').style.display = 'none';
    document.getElementById('gruppenTab').style.display = 'none';
    document.getElementById('lehrerTab').style.display = 'none';
    document.getElementById('datenTab').style.display = 'none';
    document.getElementById('bewertenTab').style.display = 'none';
    document.getElementById('vorlagenTab').style.display = 'none';
    document.getElementById('uebersichtTab').style.display = 'none';
    document.getElementById('adminvorlagenTab').style.display = 'none';
    
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('errorMessage').style.display = 'none';
}