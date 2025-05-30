// Login-System mit Firebase Authentication Integration
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });
});

async function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Bitte E-Mail und Passwort eingeben!');
        return;
    }
    
    // Loading-Anzeige
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Anmelden...';
    loginBtn.disabled = true;
    
    try {
        // Firebase Authentication verwenden falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            console.log('🔐 Firebase Login wird versucht...');
            const result = await window.FirebaseClient.login(email, password);
            
            if (result.success) {
                currentUser = result.user;
                showApp();
                console.log('✅ Firebase Login erfolgreich:', currentUser.name);
            } else {
                showError(result.error || 'Login fehlgeschlagen');
            }
        } else {
            // Fallback: Lokale Authentifizierung
            console.log('🔧 Lokaler Login (Firebase nicht verfügbar)');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = user;
                showApp();
                console.log('✅ Lokaler Login erfolgreich:', user.name);
            } else {
                showError('Ungültige Anmeldedaten!');
            }
        }
    } catch (error) {
        console.error('❌ Login-Fehler:', error);
        showError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
        // Loading-Anzeige zurücksetzen
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Fehler nach 5 Sekunden ausblenden
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('currentUser').textContent = `${currentUser.name} (${currentUser.role})`;
    
    // Fehlermeldung ausblenden
    document.getElementById('errorMessage').style.display = 'none';
    
    // ALLE Tabs erst mal verstecken
    const allTabs = [
        'newsTab', 'themenTab', 'gruppenTab', 'lehrerTab', 
        'datenTab', 'bewertenTab', 'vorlagenTab', 'uebersichtTab', 'adminvorlagenTab'
    ];
    
    allTabs.forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) tab.style.display = 'none';
    });
    
    // Tabs je nach Rolle anzeigen
    if (currentUser.role === 'admin') {
        // Admin sieht: News, Lehrer verwalten, Datenverwaltung, Admin-Vorlagen
        showTab('newsTab');
        showTab('lehrerTab');
        showTab('datenTab');
        showTab('adminvorlagenTab');
        
        console.log('👑 Admin-Interface aktiviert');
    } else if (currentUser.role === 'lehrer') {
        // Lehrer sieht: News, Themen, Gruppen erstellen, Schüler bewerten, Bewertungsvorlagen, Übersicht
        showTab('newsTab');
        showTab('themenTab');
        showTab('gruppenTab');
        showTab('bewertenTab');
        showTab('vorlagenTab');
        showTab('uebersichtTab');
        
        console.log('👨‍🏫 Lehrer-Interface aktiviert');
    } else {
        console.warn('⚠️ Unbekannte Benutzerrolle:', currentUser.role);
        showError('Unbekannte Benutzerrolle. Bitte kontaktieren Sie den Administrator.');
        return;
    }
    
    // App initialisieren
    initializeApp();
    
    // Firebase-Daten laden falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        loadFirebaseData();
    }
    
    // Erfolgreiche Anmeldung loggen
    console.log(`🚀 App für ${currentUser.name} (${currentUser.role}) gestartet`);
}

function showTab(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.style.display = 'block';
    }
}

async function loadFirebaseData() {
    try {
        console.log('📊 Lade Daten aus Firebase...');
        
        // Benutzer-spezifische Daten laden
        if (currentUser.role === 'admin') {
            // Admin lädt alle Daten
            await loadAllFirebaseData();
        } else {
            // Lehrer lädt nur relevante Daten
            await loadTeacherFirebaseData();
        }
        
        console.log('✅ Firebase-Daten geladen');
    } catch (error) {
        console.warn('⚠️ Firebase-Daten konnten nicht geladen werden:', error);
        console.log('🔧 Verwende lokale Daten als Fallback');
    }
}

async function loadAllFirebaseData() {
    try {
        // Alle Collections für Admin laden
        const collections = ['users', 'themen', 'gruppen', 'bewertungen', 'news', 'settings'];
        
        for (const collection of collections) {
            const result = await window.FirebaseClient.load(collection);
            if (result.success && result.data) {
                updateLocalData(collection, result.data);
            }
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Admin-Daten:', error);
    }
}

async function loadTeacherFirebaseData() {
    try {
        // Nur relevante Daten für Lehrer laden
        const themenResult = await window.FirebaseClient.load('themen');
        if (themenResult.success) updateLocalData('themen', themenResult.data);
        
        const newsResult = await window.FirebaseClient.load('news');
        if (newsResult.success) updateLocalData('news', newsResult.data);
        
        const gruppenResult = await window.FirebaseClient.load('gruppen', { lehrer: currentUser.name });
        if (gruppenResult.success) updateLocalData('gruppen', gruppenResult.data);
        
        const bewertungenResult = await window.FirebaseClient.load('bewertungen', { lehrer: currentUser.name });
        if (bewertungenResult.success) updateLocalData('bewertungen', bewertungenResult.data);
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Lehrer-Daten:', error);
    }
}

function updateLocalData(collection, data) {
    switch (collection) {
        case 'users':
            if (Array.isArray(data)) users = data;
            break;
        case 'themen':
            if (Array.isArray(data)) themen = data;
            break;
        case 'gruppen':
            if (Array.isArray(data)) gruppen = data;
            break;
        case 'bewertungen':
            if (Array.isArray(data)) bewertungen = data;
            break;
        case 'news':
            if (Array.isArray(data)) news = data;
            break;
        case 'settings':
            if (data && typeof data === 'object') {
                if (data.schuljahr) schuljahr = data.schuljahr;
                if (data.alleFaecherGlobal) alleFaecherGlobal = data.alleFaecherGlobal;
                if (data.bewertungsCheckpoints) bewertungsCheckpoints = data.bewertungsCheckpoints;
                if (data.briefvorlage) briefvorlage = data.briefvorlage;
                if (data.staerkenFormulierungen) staerkenFormulierungen = data.staerkenFormulierungen;
            }
            break;
    }
    
    console.log(`📊 ${collection} Daten aktualisiert (${Array.isArray(data) ? data.length : 'object'} Einträge)`);
}

async function logout() {
    try {
        // Firebase Logout falls verfügbar
        if (window.FirebaseClient && window.firebase && window.firebase.auth()) {
            await window.firebase.auth().signOut();
            console.log('🔐 Firebase Logout erfolgreich');
        }
        
        // Lokale Daten speichern
        if (window.FirebaseClient) {
            window.FirebaseClient.saveLocal();
        }
        
    } catch (error) {
        console.warn('⚠️ Logout-Warnung:', error);
    } finally {
        // UI zurücksetzen
        currentUser = null;
        
        // Alle Tabs verstecken
        const allTabs = [
            'newsTab', 'themenTab', 'gruppenTab', 'lehrerTab', 
            'datenTab', 'bewertenTab', 'vorlagenTab', 'uebersichtTab', 'adminvorlagenTab'
        ];
        
        allTabs.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'none';
        });
        
        // Login-Screen anzeigen
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('errorMessage').style.display = 'none';
        
        console.log('👋 Logout abgeschlossen');
    }
}

// Auto-Login bei bestehender Firebase-Session
window.addEventListener('load', function() {
    // Warten bis Firebase initialisiert ist
    setTimeout(checkExistingSession, 1000);
});

async function checkExistingSession() {
    try {
        if (window.firebase && window.firebase.auth()) {
            window.firebase.auth().onAuthStateChanged(async (user) => {
                if (user && !currentUser) {
                    console.log('🔄 Bestehende Firebase-Session gefunden');
                    
                    // Benutzerdaten aus Firestore laden
                    try {
                        const userDoc = await window.firebase.firestore()
                            .collection('users')
                            .doc(user.uid)
                            .get();
                        
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            currentUser = {
                                email: user.email,
                                name: userData.name,
                                role: userData.role,
                                uid: user.uid
                            };
                            
                            showApp();
                            console.log('✅ Auto-Login erfolgreich:', currentUser.name);
                        }
                    } catch (error) {
                        console.warn('⚠️ Auto-Login fehlgeschlagen:', error);
                    }
                }
            });
        }
    } catch (error) {
        console.log('🔧 Kein Auto-Login verfügbar (lokaler Modus)');
    }
}

// Keyboard-Support für Login
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (document.activeElement === emailField && emailField.value) {
            passwordField.focus();
        } else if (document.activeElement === passwordField && passwordField.value) {
            loginUser();
        }
    }
});

console.log('🔐 Login-System mit Firebase-Integration geladen');
