// Login-System mit Firebase Authentication Integration - KORRIGIERT
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Login-System wird initialisiert...');
    
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });
    
    // Status-Updates für Login-Screen
    setupLoginStatusUpdates();
});

// Status-Updates für Login-Screen
function setupLoginStatusUpdates() {
    // Überwache Firebase-Initialisierung
    const checkFirebaseStatus = () => {
        const statusIndicator = document.getElementById('statusIndicator');
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (!statusIndicator || !connectionStatus) return;
        
        if (window.firebaseInitialized) {
            statusIndicator.textContent = '🔥 Firebase bereit - Anmeldung möglich';
            connectionStatus.style.background = '#d4edda';
            connectionStatus.style.color = '#155724';
            connectionStatus.style.border = '1px solid #c3e6cb';
        } else if (window.firebaseConfigValid === false) {
            statusIndicator.textContent = '🏠 Lokaler Modus - Anmeldung möglich';
            connectionStatus.style.background = '#cce7ff';
            connectionStatus.style.color = '#004085';
            connectionStatus.style.border = '1px solid #66b3ff';
        } else {
            statusIndicator.textContent = '🔄 Initialisierung läuft...';
            connectionStatus.style.background = '#fff3cd';
            connectionStatus.style.color = '#856404';
            connectionStatus.style.border = '1px solid #ffeaa7';
        }
    };
    
    // Initial check
    checkFirebaseStatus();
    
    // Event Listeners
    window.addEventListener('firebaseReady', () => {
        console.log('🔥 Firebase ready - Login bereit');
        checkFirebaseStatus();
    });
    
    window.addEventListener('localModeReady', () => {
        console.log('🏠 Lokaler Modus ready - Login bereit');
        checkFirebaseStatus();
    });
    
    // Backup: Regelmäßige Status-Checks
    const statusInterval = setInterval(() => {
        checkFirebaseStatus();
        
        // Stop interval nach 30 Sekunden
        setTimeout(() => clearInterval(statusInterval), 30000);
    }, 1000);
}

async function loginUser() {
    const email = document.getElementById('email').value.trim();
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
        console.log('🔐 Anmeldeversuch für:', email);
        
        let loginResult = null;
        
        // Firebase Authentication verwenden falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            console.log('🔥 Firebase-Login wird versucht...');
            loginResult = await window.FirebaseClient.login(email, password);
        } else if (window.firebaseConfigValid === false) {
            // Explizit lokaler Modus
            console.log('🏠 Lokaler Login (Firebase deaktiviert)');
            loginResult = loginUserLocal(email, password);
        } else {
            // Warte kurz auf Firebase, dann Fallback
            console.log('⏳ Warte auf Firebase-Initialisierung...');
            await waitForFirebaseOrTimeout(2000);
            
            if (window.firebaseInitialized) {
                loginResult = await window.FirebaseClient.login(email, password);
            } else {
                console.log('🔄 Firebase-Timeout - verwende lokalen Login');
                loginResult = loginUserLocal(email, password);
            }
        }
        
        if (loginResult && loginResult.success) {
            // Globale currentUser Variable setzen
            currentUser = loginResult.user;
            window.currentUser = loginResult.user;
            
            showApp();
            console.log('✅ Login erfolgreich:', currentUser.name, `(${window.firebaseInitialized ? 'Firebase' : 'Lokal'})`);
            
            // Admin-Setup prüfen
            if (currentUser.role === 'admin') {
                checkAdminSetup();
            }
        } else {
            const errorMsg = loginResult?.error || 'Login fehlgeschlagen';
            showError(errorMsg);
            console.error('❌ Login fehlgeschlagen:', errorMsg);
        }
    } catch (error) {
        console.error('❌ Login-Fehler:', error);
        
        // Als letzter Ausweg: Lokaler Login
        console.log('🔄 Versuche lokalen Login als Fallback...');
        const fallbackResult = loginUserLocal(email, password);
        
        if (fallbackResult.success) {
            currentUser = fallbackResult.user;
            window.currentUser = fallbackResult.user;
            showApp();
            console.log('✅ Fallback-Login erfolgreich:', currentUser.name);
        } else {
            showError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
        }
    } finally {
        // Loading-Anzeige zurücksetzen
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// Warte auf Firebase mit Timeout
function waitForFirebaseOrTimeout(timeoutMs) {
    return new Promise((resolve) => {
        if (window.firebaseInitialized) {
            resolve(true);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.firebaseInitialized) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeoutMs) {
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 100);
    });
}

// Lokale Authentifizierung (Fallback)
function loginUserLocal(email, password) {
    console.log('🏠 Lokaler Login für:', email);
    
    // users Array aus main.js verwenden
    if (!window.users || !Array.isArray(window.users)) {
        console.error('❌ Lokale Benutzerdaten nicht verfügbar');
        return {
            success: false,
            error: 'Lokale Daten nicht verfügbar'
        };
    }
    
    const user = window.users.find(u => u.email === email && u.password === password);
    if (user) {
        return {
            success: true,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                uid: `local-${user.email}`,
                isLocal: true
            }
        };
    } else {
        return {
            success: false,
            error: 'Ungültige Anmeldedaten'
        };
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Fehler nach 8 Sekunden ausblenden
    setTimeout(() => {
        if (errorDiv.textContent === message) {
            errorDiv.style.display = 'none';
        }
    }, 8000);
}

function showApp() {
    console.log('🎬 Zeige Hauptanwendung für:', currentUser.name);
    
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
    
    // Connection Status in Header aktualisieren
    updateConnectionStatusInHeader();
    
    // Erfolgreiche Anmeldung loggen
    console.log(`🚀 App für ${currentUser.name} (${currentUser.role}) gestartet`);
}

function showTab(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.style.display = 'block';
    }
}

// Connection Status im Header aktualisieren
function updateConnectionStatusInHeader() {
    const connectionIcon = document.getElementById('connectionIcon');
    const connectionText = document.getElementById('connectionText');
    
    if (!connectionIcon || !connectionText) return;
    
    if (window.firebaseInitialized) {
        connectionIcon.textContent = '🔥';
        connectionText.textContent = 'Firebase';
    } else {
        connectionIcon.textContent = '🏠';
        connectionText.textContent = 'Lokal';
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
    if (!data) return;
    
    switch (collection) {
        case 'users':
            if (Array.isArray(data)) {
                window.users = data;
                users = data; // Globale Referenz aktualisieren
            }
            break;
        case 'themen':
            if (Array.isArray(data)) {
                window.themen = data;
                themen = data;
            }
            break;
        case 'gruppen':
            if (Array.isArray(data)) {
                window.gruppen = data;
                gruppen = data;
            }
            break;
        case 'bewertungen':
            if (Array.isArray(data)) {
                window.bewertungen = data;
                bewertungen = data;
            }
            break;
        case 'news':
            if (Array.isArray(data)) {
                window.news = data;
                news = data;
            }
            break;
        case 'settings':
            if (data && typeof data === 'object') {
                // Settings können als Array oder Objekt kommen
                const settingsData = Array.isArray(data) ? data[0] : data;
                
                if (settingsData.schuljahr) {
                    window.schuljahr = settingsData.schuljahr;
                    schuljahr = settingsData.schuljahr;
                }
                if (settingsData.alleFaecherGlobal) {
                    window.alleFaecherGlobal = settingsData.alleFaecherGlobal;
                    alleFaecherGlobal = settingsData.alleFaecherGlobal;
                }
                if (settingsData.bewertungsCheckpoints) {
                    window.bewertungsCheckpoints = settingsData.bewertungsCheckpoints;
                    bewertungsCheckpoints = settingsData.bewertungsCheckpoints;
                }
                if (settingsData.briefvorlage) {
                    window.briefvorlage = settingsData.briefvorlage;
                    briefvorlage = settingsData.briefvorlage;
                }
                if (settingsData.staerkenFormulierungen) {
                    window.staerkenFormulierungen = settingsData.staerkenFormulierungen;
                    staerkenFormulierungen = settingsData.staerkenFormulierungen;
                }
            }
            break;
    }
    
    console.log(`📊 ${collection} Daten aktualisiert (${Array.isArray(data) ? data.length : 'object'} Einträge)`);
}

// Admin-Setup prüfen
async function checkAdminSetup() {
    try {
        console.log('🔧 Prüfe Admin-Setup...');
        
        // Warte auf das Admin-Setup-System
        if (typeof window.AdminSetup !== 'undefined') {
            await window.AdminSetup.checkAndRun();
        } else {
            // Fallback: Warte und versuche erneut
            setTimeout(() => {
                if (typeof window.AdminSetup !== 'undefined') {
                    window.AdminSetup.checkAndRun();
                } else {
                    console.warn('⚠️ Admin-Setup-System nicht verfügbar');
                }
            }, 2000);
        }
    } catch (error) {
        console.warn('⚠️ Admin-Setup-Prüfung fehlgeschlagen:', error);
    }
}

async function logout() {
    try {
        console.log('👋 Logout für:', currentUser?.name);
        
        // Firebase Logout falls verfügbar
        if (window.FirebaseClient && window.firebase && window.firebase.auth()) {
            try {
                await window.firebase.auth().signOut();
                console.log('🔐 Firebase Logout erfolgreich');
            } catch (firebaseLogoutError) {
                console.warn('⚠️ Firebase Logout Warnung:', firebaseLogoutError);
            }
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
        window.currentUser = null;
        
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
        
        // Status zurücksetzen
        setupLoginStatusUpdates();
        
        console.log('👋 Logout abgeschlossen');
    }
}

// Auto-Login bei bestehender Firebase-Session
window.addEventListener('load', function() {
    // Warten bis Firebase initialisiert ist
    setTimeout(checkExistingSession, 1500);
});

async function checkExistingSession() {
    try {
        if (window.firebase && window.firebase.auth && window.firebaseInitialized) {
            console.log('🔍 Prüfe bestehende Firebase-Session...');
            
            window.firebase.auth().onAuthStateChanged(async (user) => {
                if (user && !currentUser) {
                    console.log('🔄 Bestehende Firebase-Session gefunden:', user.email);
                    
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
                            window.currentUser = currentUser;
                            
                            showApp();
                            console.log('✅ Auto-Login erfolgreich:', currentUser.name);
                        } else {
                            console.warn('⚠️ Benutzerdaten nicht in Firestore gefunden');
                        }
                    } catch (error) {
                        console.warn('⚠️ Auto-Login fehlgeschlagen:', error);
                    }
                }
            });
        } else {
            console.log('🏠 Kein Auto-Login verfügbar (lokaler Modus oder Firebase nicht bereit)');
        }
    } catch (error) {
        console.log('🔧 Auto-Login nicht verfügbar:', error.message);
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

// Debug-Informationen für Entwicklung
if (window.DEVELOPMENT_MODE && window.DEVELOPMENT_MODE.enabled) {
    window.debugLogin = {
        loginUserLocal,
        checkAdminSetup,
        updateLocalData,
        showError,
        getCurrentUser: () => currentUser
    };
    
    console.log('🐛 Debug-Login-Funktionen verfügbar unter window.debugLogin');
}

console.log('🔐 Login-System mit verbesserter Firebase-Integration geladen');
