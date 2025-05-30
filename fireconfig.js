// Firebase Konfiguration - NUR ONLINE MODUS
// Diese Datei wird über Netlify-Umgebungsvariablen konfiguriert

// Funktion zum Laden der Environment Variables
function getNetlifyEnvVar(varName) {
    // In Netlify werden Environment Variables zur Build-Zeit in window._env injiziert
    if (typeof window !== 'undefined' && window._env && window._env[varName]) {
        return window._env[varName];
    }
    
    // Kein Fallback - Firebase ist zwingend erforderlich
    throw new Error(`Firebase-Konfiguration fehlt: ${varName}`);
}

// Firebase-Konfiguration (MUSS über Netlify Environment Variables gesetzt werden)
const firebaseConfig = {
    apiKey: getNetlifyEnvVar('FIREBASE_API_KEY'),
    authDomain: getNetlifyEnvVar('FIREBASE_AUTH_DOMAIN'),
    projectId: getNetlifyEnvVar('FIREBASE_PROJECT_ID'),
    storageBucket: getNetlifyEnvVar('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getNetlifyEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getNetlifyEnvVar('FIREBASE_APP_ID'),
    databaseURL: getNetlifyEnvVar('FIREBASE_DATABASE_URL')
};

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
            // Kritischer Fehler - App kann nicht starten
            const errorMsg = 'Firebase-Konfiguration fehlt! Bitte kontaktieren Sie den Administrator.';
            if (document.body) {
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: #e74c3c;
                        color: white;
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    ">
                        <div>
                            <h1>⚠️ Konfigurationsfehler</h1>
                            <p>${errorMsg}</p>
                        </div>
                    </div>
                `;
            }
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('❌ KRITISCHER FEHLER:', error.message);
        window.firebaseConfigValid = false;
    }
}

// Logging für Produktion
if (typeof window !== 'undefined' && window.firebaseConfigValid) {
    console.log('🔥 Firebase Konfiguration geladen für Projekt:', firebaseConfig.projectId);
}
