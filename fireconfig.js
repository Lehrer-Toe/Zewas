// Firebase Konfiguration - NUR ONLINE MODUS
// Diese Datei wird über Netlify-Umgebungsvariablen konfiguriert

// Funktion zum Laden der Environment Variables
function getNetlifyEnvVar(varName) {
    // In Netlify werden Environment Variables zur Build-Zeit in window._env injiziert
    if (typeof window !== 'undefined' && window._env && window._env[varName]) {
        return window._env[varName];
    }
    
    // Fallback: Versuche aus process.env zu lesen (für lokale Entwicklung)
    if (typeof process !== 'undefined' && process.env && process.env[varName]) {
        return process.env[varName];
    }
    
    console.warn(`Environment Variable ${varName} nicht gefunden`);
    return null;
}

// Firebase-Konfiguration laden
let firebaseConfig = {};

try {
    firebaseConfig = {
        apiKey: getNetlifyEnvVar('FIREBASE_API_KEY'),
        authDomain: getNetlifyEnvVar('FIREBASE_AUTH_DOMAIN'),
        projectId: getNetlifyEnvVar('FIREBASE_PROJECT_ID'),
        storageBucket: getNetlifyEnvVar('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getNetlifyEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
        appId: getNetlifyEnvVar('FIREBASE_APP_ID'),
        databaseURL: getNetlifyEnvVar('FIREBASE_DATABASE_URL')
    };
} catch (error) {
    console.error('❌ Fehler beim Laden der Firebase-Konfiguration:', error);
    firebaseConfig = {};
}

// Firebase Services Konfiguration
const FIREBASE_SERVICES = {
    auth: true,           // Authentication aktiviert
    firestore: true,      // Firestore Database aktiviert
    storage: true         // Cloud Storage aktiviert
};

// Produktionsmodus Einstellungen
const PRODUCTION_MODE = {
    requireAuth: true,           // Authentifizierung erforderlich
    requireOnline: true,         // Online-Verbindung erforderlich
    logLevel: 'error'           // Nur Fehler loggen
};

// Datenstruktur Mapping für Firebase
const FIREBASE_COLLECTIONS = {
    users: 'users',                  // Benutzer
    themen: 'themen',               // Themenvorschläge
    gruppen: 'gruppen',             // Schülergruppen
    bewertungen: 'bewertungen',     // Bewertungen
    vorlagen: 'vorlagen',           // Bewertungsvorlagen
    news: 'news',                   // News/Nachrichten
    settings: 'settings',           // App-Einstellungen
    checkpoints: 'checkpoints',     // Bewertungs-Checkpoints
    faecher: 'faecher',            // Fächer-Definitionen
    briefvorlagen: 'briefvorlagen'  // Brief-Templates
};

// Sicherheitsregeln Konfiguration
const SECURITY_RULES = {
    adminOnly: ['settings', 'checkpoints', 'faecher', 'briefvorlagen'],
    teacherAccess: ['vorlagen', 'bewertungen', 'gruppen'],
    publicRead: ['news', 'themen'],
    userSpecific: ['users']
};

// App-spezifische Konfiguration
const APP_CONFIG = {
    name: 'Zeig, was du kannst!',
    version: '1.0.0',
    schuljahr: '2025/26',
    maxFileSize: 5 * 1024 * 1024,    // 5MB für Uploads
    supportedFileTypes: ['png', 'jpg', 'jpeg', 'pdf'],
    sessionTimeout: 8 * 60 * 60 * 1000  // 8 Stunden
};

// Prüfe ob Firebase-Konfiguration vollständig ist
function validateFirebaseConfig() {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
        if (!firebaseConfig[field]) {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0) {
        console.error('❌ Firebase-Konfiguration unvollständig! Fehlende Felder:', missingFields.join(', '));
        console.error('🔍 Aktuelle Konfiguration:', {
            apiKey: firebaseConfig.apiKey ? '[GESETZT]' : '[FEHLT]',
            authDomain: firebaseConfig.authDomain ? '[GESETZT]' : '[FEHLT]',
            projectId: firebaseConfig.projectId ? '[GESETZT]' : '[FEHLT]',
            storageBucket: firebaseConfig.storageBucket ? '[GESETZT]' : '[FEHLT]',
            appId: firebaseConfig.appId ? '[GESETZT]' : '[FEHLT]'
        });
        return false;
    }
    
    console.log('✅ Firebase-Konfiguration vollständig');
    return true;
}

// Export der Konfiguration
if (typeof window !== 'undefined') {
    // Browser Environment
    window.FIREBASE_CONFIG = firebaseConfig;
    window.FIREBASE_SERVICES = FIREBASE_SERVICES;
    window.PRODUCTION_MODE = PRODUCTION_MODE;
    window.FIREBASE_COLLECTIONS = FIREBASE_COLLECTIONS;
    window.SECURITY_RULES = SECURITY_RULES;
    window.APP_CONFIG = APP_CONFIG;
    
    // Validierung beim Laden ausführen
    try {
        const configValid = validateFirebaseConfig();
        window.firebaseConfigValid = configValid;
        
        if (!configValid) {
            // Warnung anzeigen, aber nicht blockieren
            console.warn('⚠️ Firebase-Konfiguration unvollständig - App läuft im eingeschränkten Modus');
            
            // Zeige eine weniger invasive Warnung
            setTimeout(() => {
                if (document.body && !configValid) {
                    const warningDiv = document.createElement('div');
                    warningDiv.style.cssText = `
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background: #f39c12;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        max-width: 300px;
                        z-index: 9999;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        cursor: pointer;
                    `;
                    warningDiv.innerHTML = `
                        <strong>⚠️ Firebase-Konfiguration</strong><br>
                        Einige Environment Variables fehlen.<br>
                        <small>Klicken zum Schließen</small>
                    `;
                    warningDiv.onclick = () => warningDiv.remove();
                    
                    document.body.appendChild(warningDiv);
                    
                    // Automatisch nach 10 Sekunden entfernen
                    setTimeout(() => {
                        if (warningDiv.parentNode) {
                            warningDiv.remove();
                        }
                    }, 10000);
                }
            }, 2000);
        }
    } catch (error) {
        console.error('❌ KRITISCHER FEHLER bei Firebase-Konfiguration:', error.message);
        window.firebaseConfigValid = false;
    }
}

// Logging für Produktion
if (typeof window !== 'undefined') {
    if (firebaseConfig.projectId) {
        console.log('🔥 Firebase Konfiguration geladen für Projekt:', firebaseConfig.projectId);
    } else {
        console.log('⚠️ Firebase-Projekt-ID nicht verfügbar');
    }
    
    // Debug-Info für Entwicklung
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🛠️ Entwicklungsmodus erkannt');
        console.log('🔍 Environment Variables Status:', {
            '_env verfügbar': !!window._env,
            'FIREBASE_API_KEY': window._env?.FIREBASE_API_KEY ? '[GESETZT]' : '[FEHLT]',
            'FIREBASE_PROJECT_ID': window._env?.FIREBASE_PROJECT_ID ? '[GESETZT]' : '[FEHLT]'
        });
    }
}
