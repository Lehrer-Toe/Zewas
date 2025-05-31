// Login-System - NUR Firebase Authentication
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Login-System wird initialisiert...');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginUser();
        });
    }
    
    // Status-Updates für Login-Screen
    setupLoginStatusUpdates();
});

// Status-Updates für Login-Screen
function setupLoginStatusUpdates() {
    const checkFirebaseStatus = () => {
        const statusIndicator = document.getElementById('statusIndicator');
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (!statusIndicator || !connectionStatus) return;
        
        if (window.firebaseInitialized) {
            statusIndicator.textContent = '🔥 Firebase verbunden - Anmeldung möglich';
            connectionStatus.style.background = '#d4edda';
            connectionStatus.style.color = '#155724';
            connectionStatus.style.border = '1px solid #c3e6cb';
        } else {
            statusIndicator.textContent = '⏳ Verbindung zu Firebase wird hergestellt...';
            connectionStatus.style.background = '#fff3cd';
            connectionStatus.style.color = '#856404';
            connectionStatus.style.border = '1px solid #ffeaa7';
        }
    };
    
    // Initial check
    checkFirebaseStatus();
    
    // Event Listeners
    window.addEventListener('firebaseReady', () => {
        console.log('🔥 Firebase bereit');
        checkFirebaseStatus();
    });
    
    // Regelmäßige Status-Checks
    const statusInterval = setInterval(() => {
        checkFirebaseStatus();
    }, 1000);
    
    // Stop interval wenn Firebase bereit ist
    setTimeout(() => {
        if (window.firebaseInitialized) {
            clearInterval(statusInterval);
        }
    }, 10000);
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
        // Warte auf Firebase-Initialisierung
        if (!window.firebaseInitialized) {
            console.log('⏳ Warte auf Firebase...');
            await waitForFirebase(5000); // 5 Sekunden warten
        }
        
        if (!window.firebaseInitialized) {
            throw new Error('Firebase konnte nicht initialisiert werden. Bitte laden Sie die Seite neu.');
        }
        
        console.log('🔐 Anmeldeversuch für:', email);
        
        const loginResult = await window.FirebaseClient.login(email, password);
        
        if (loginResult && loginResult.success) {
            // Globale currentUser Variable setzen
            currentUser = loginResult.user;
            window.currentUser = loginResult.user;
            
            showApp();
            console.log('✅ Login erfolgreich:', currentUser.name);
            
            // WICHTIG: Initiale Daten erst NACH erfolgreichem Login laden
            await loadInitialData();
            
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
        showError(error.message || 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.');
    } finally {
        // Loading-Anzeige zurücksetzen
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// Warte auf Firebase
function waitForFirebase(timeoutMs) {
    return new Promise((resolve, reject) => {
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
                reject(new Error('Firebase-Timeout'));
            }
        }, 100);
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Fehler nach 8 Sekunden ausblenden
        setTimeout(() => {
            if (errorDiv.textContent === message) {
                errorDiv.style.display = 'none';
            }
        }, 8000);
    }
}

function showApp() {
    console.log('🎬 Zeige Hauptanwendung für:', currentUser.name);
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('currentUser').textContent = `${currentUser.name} (${currentUser.role})`;
    
    // Fehlermeldung ausblenden
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    
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
        console.error('⚠️ Unbekannte Benutzerrolle:', currentUser.role);
        showError('Unbekannte Benutzerrolle. Bitte kontaktieren Sie den Administrator.');
        return;
    }
    
    // App initialisieren
    initializeApp();
    
    // Connection Status in Header aktualisieren
    updateConnectionStatusInHeader();
    
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
        connectionIcon.textContent = '⚠️';
        connectionText.textContent = 'Offline';
    }
}

// KRITISCHE Funktion: Firebase-Daten bereinigen
function cleanFirebaseData(data, expectedStructure = null) {
    if (!data || typeof data !== 'object') return data;
    
    const cleaned = { ...data };
    
    // Entferne Firebase-Metadaten
    delete cleaned.id;
    delete cleaned.lastModified;
    delete cleaned.created;
    delete cleaned.lastUpdate;
    
    // Debug-Ausgabe
    console.log('🧹 Bereinigte Firebase-Daten:', Object.keys(cleaned));
    
    return cleaned;
}

// Initiale Daten aus Firebase laden - NUR NACH LOGIN
async function loadInitialData() {
    try {
        console.log('📊 Lade initiale Daten aus Firebase...');
        
        // Lade App-Einstellungen
        const settingsResult = await window.FirebaseClient.load('settings');
        if (settingsResult.success && settingsResult.data.length > 0) {
            const settingsDoc = settingsResult.data.find(s => s.id === 'app-settings');
            if (settingsDoc) {
                console.log('📋 Settings-Struktur:', Object.keys(settingsDoc));
                
                if (settingsDoc.schuljahr) {
                    window.schuljahr = settingsDoc.schuljahr;
                    schuljahr = settingsDoc.schuljahr;
                }
                
                // Prüfe ob Settings die globalen Daten enthalten
                if (settingsDoc.alleFaecherGlobal && Object.keys(settingsDoc.alleFaecherGlobal).length > 0) {
                    window.alleFaecherGlobal = cleanFirebaseData(settingsDoc.alleFaecherGlobal);
                    alleFaecherGlobal = window.alleFaecherGlobal;
                    console.log('📚 Fächer aus Settings geladen');
                }
                
                if (settingsDoc.bewertungsCheckpoints && Object.keys(settingsDoc.bewertungsCheckpoints).length > 0) {
                    window.bewertungsCheckpoints = cleanFirebaseData(settingsDoc.bewertungsCheckpoints);
                    bewertungsCheckpoints = window.bewertungsCheckpoints;
                    console.log('✅ Checkpoints aus Settings geladen');
                }
                
                if (settingsDoc.briefvorlage && settingsDoc.briefvorlage.anrede) {
                    window.briefvorlage = cleanFirebaseData(settingsDoc.briefvorlage);
                    briefvorlage = window.briefvorlage;
                    console.log('📝 Briefvorlage aus Settings geladen');
                }
                
                if (settingsDoc.staerkenFormulierungen && Object.keys(settingsDoc.staerkenFormulierungen).length > 0) {
                    window.staerkenFormulierungen = cleanFirebaseData(settingsDoc.staerkenFormulierungen);
                    staerkenFormulierungen = window.staerkenFormulierungen;
                    console.log('📝 Formulierungen aus Settings geladen');
                }
            }
        }
        
        // Lade Fächer falls noch nicht geladen
        if (!alleFaecherGlobal || Object.keys(alleFaecherGlobal).length === 0) {
            const faecherResult = await window.FirebaseClient.load('faecher');
            if (faecherResult.success && faecherResult.data.length > 0) {
                const faecherDoc = faecherResult.data.find(f => f.id === 'standard-faecher');
                if (faecherDoc) {
                    const cleanFaecher = cleanFirebaseData(faecherDoc);
                    
                    // Prüfe ob es echte Fächer-Daten sind
                    if (cleanFaecher.D) {
                        window.alleFaecherGlobal = cleanFaecher;
                        alleFaecherGlobal = cleanFaecher;
                        console.log('📚 Fächer separat geladen');
                    }
                }
            }
        }
        
        // Lade Checkpoints falls noch nicht geladen
        if (!bewertungsCheckpoints || Object.keys(bewertungsCheckpoints).length === 0) {
            const checkpointsResult = await window.FirebaseClient.load('checkpoints');
            if (checkpointsResult.success && checkpointsResult.data.length > 0) {
                const checkpointsDoc = checkpointsResult.data.find(c => c.id === 'bewertungs-checkpoints');
                if (checkpointsDoc) {
                    const cleanCheckpoints = cleanFirebaseData(checkpointsDoc);
                    
                    // Prüfe ob es echte Checkpoint-Daten sind
                    if (cleanCheckpoints['Fachliches Arbeiten']) {
                        window.bewertungsCheckpoints = cleanCheckpoints;
                        bewertungsCheckpoints = cleanCheckpoints;
                        console.log('✅ Bewertungs-Checkpoints separat geladen');
                    }
                }
            }
        }
        
        // Lade Briefvorlagen falls noch nicht geladen
        if (!briefvorlage || !briefvorlage.anrede) {
            const briefvorlagenResult = await window.FirebaseClient.load('briefvorlagen');
            if (briefvorlagenResult.success && briefvorlagenResult.data.length > 0) {
                const vorlageDoc = briefvorlagenResult.data.find(v => v.id === 'standard-vorlage');
                if (vorlageDoc && vorlageDoc.anrede) {
                    const cleanVorlage = cleanFirebaseData(vorlageDoc);
                    
                    window.briefvorlage = cleanVorlage;
                    briefvorlage = cleanVorlage;
                    console.log('📝 Briefvorlage separat geladen');
                }
                
                const formulierungenDoc = briefvorlagenResult.data.find(v => v.id === 'staerken-formulierungen');
                if (formulierungenDoc) {
                    const cleanFormulierungen = cleanFirebaseData(formulierungenDoc);
                    
                    window.staerkenFormulierungen = cleanFormulierungen;
                    staerkenFormulierungen = cleanFormulierungen;
                    console.log('📝 Stärken-Formulierungen separat geladen');
                }
            }
        }
        
        // Lade alle anderen Daten
        const dataToLoad = {
            'users': 'users',
            'themen': 'themen', 
            'gruppen': 'gruppen',
            'bewertungen': 'bewertungen',
            'news': 'news',
            'vorlagen': 'vorlagen'
        };
        
        for (const [collection, globalVar] of Object.entries(dataToLoad)) {
            const result = await window.FirebaseClient.load(collection);
            if (result.success) {
                window[globalVar] = result.data;
                // Auch die lokalen Variablen aktualisieren
                if (typeof window[globalVar] !== 'undefined') {
                    // Dynamische Zuweisung für lokale Variablen
                    switch(globalVar) {
                        case 'users':
                            users = window[globalVar];
                            break;
                        case 'themen':
                            themen = window[globalVar];
                            break;
                        case 'gruppen':
                            gruppen = window[globalVar];
                            break;
                        case 'bewertungen':
                            bewertungen = window[globalVar];
                            break;
                        case 'news':
                            news = window[globalVar];
                            break;
                        case 'vorlagen':
                            vorlagen = window[globalVar];
                            break;
                    }
                }
                console.log(`✅ ${collection} geladen (${result.data.length} Einträge)`);
            } else {
                console.warn(`⚠️ Fehler beim Laden von ${collection}:`, result.error);
            }
        }
        
        // DEBUG: Zeige die Struktur der geladenen Checkpoints
        console.log('🔍 DEBUG bewertungsCheckpoints Struktur:', bewertungsCheckpoints);
        if (bewertungsCheckpoints && typeof bewertungsCheckpoints === 'object') {
            Object.keys(bewertungsCheckpoints).forEach(key => {
                console.log(`🔍 Kategorie "${key}":`, Array.isArray(bewertungsCheckpoints[key]) ? 'Array' : typeof bewertungsCheckpoints[key]);
            });
        }
        
        console.log('✅ Alle Daten geladen');
        
        // Initialisiere UI nach Datenladen
        loadSchuelerLehrerAuswahl();
        
        // Tab-Inhalte VORSICHTIG laden
        setTimeout(() => {
            try {
                if (typeof window.loadNews === 'function') {
                    window.loadNews();
                } else {
                    console.warn('⚠️ loadNews noch nicht verfügbar');
                }
                
                if (typeof window.loadThemen === 'function') {
                    window.loadThemen();
                } else {
                    console.warn('⚠️ loadThemen noch nicht verfügbar');
                }
            } catch (error) {
                console.warn('⚠️ Einige Tab-Inhalte konnten nicht geladen werden:', error);
            }
        }, 1000); // Längere Verzögerung
        
        // Event auslösen, dass Daten geladen sind
        window.dispatchEvent(new CustomEvent('dataLoaded', { detail: { success: true } }));
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Daten:', error);
        showError('Fehler beim Laden der Daten aus Firebase. Einige Funktionen sind möglicherweise nicht verfügbar.');
    }
}

// Admin-Setup prüfen
async function checkAdminSetup() {
    try {
        console.log('🔧 Prüfe Admin-Setup...');
        
        // Prüfe ob bereits Einstellungen vorhanden sind
        const settingsResult = await window.FirebaseClient.load('settings');
        if (!settingsResult.success || settingsResult.data.length === 0) {
            console.log('🚀 Erstmalige Einrichtung erforderlich');
            
            // Lade Admin-Setup-Script
            const script = document.createElement('script');
            script.src = 'admin-setup.js';
            script.onload = () => {
                if (typeof window.AdminSetup !== 'undefined') {
                    console.log('🔧 Admin-Setup-Script geladen, starte Einrichtung...');
                    window.dispatchEvent(new CustomEvent('adminLoginSuccess'));
                    window.AdminSetup.checkAndRun();
                }
            };
            document.head.appendChild(script);
        } else {
            console.log('✅ System bereits eingerichtet');
        }
    } catch (error) {
        console.warn('⚠️ Admin-Setup-Prüfung fehlgeschlagen:', error);
    }
}

async function logout() {
    try {
        console.log('👋 Logout für:', currentUser?.name);
        
        // Firebase Logout
        if (window.firebase && window.firebase.auth()) {
            await window.firebase.auth().signOut();
            console.log('🔐 Firebase Logout erfolgreich');
        }
        
    } catch (error) {
        console.warn('⚠️ Logout-Warnung:', error);
    } finally {
        // UI zurücksetzen
        currentUser = null;
        window.currentUser = null;
        
        // Daten löschen
        window.users = [];
        window.themen = [];
        window.gruppen = [];
        window.bewertungen = [];
        window.news = [];
        window.vorlagen = {};
        
        // Lokale Variablen auch zurücksetzen
        users = [];
        themen = [];
        gruppen = [];
        bewertungen = [];
        news = [];
        vorlagen = {};
        
        // Login-Screen anzeigen
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        // Status zurücksetzen
        setupLoginStatusUpdates();
        
        console.log('👋 Logout abgeschlossen');
    }
}

// Auto-Login bei bestehender Firebase-Session - ENTFERNT
// (Da dies das Problem mit fehlenden Permissions verursacht)

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

console.log('🔐 Login-System (Online-Only) geladen');
