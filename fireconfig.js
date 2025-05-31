// Polyfill für Browser-Umgebungen ohne process-Objekt
if (typeof process === 'undefined') {
    window.process = { env: {} };
}

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
        apiKey:            getNetlifyEnvVar('FIREBASE_API_KEY'),
        authDomain:        getNetlifyEnvVar('FIREBASE_AUTH_DOMAIN'),
        projectId:         getNetlifyEnvVar('FIREBASE_PROJECT_ID'),
        storageBucket:     getNetlifyEnvVar('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getNetlifyEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
        appId:             getNetlifyEnvVar('FIREBASE_APP_ID'),
        databaseURL:       getNetlifyEnvVar('FIREBASE_DATABASE_URL')
    };
} catch (error) {
    console.error('❌ Fehler beim Laden der Firebase-Konfiguration:', error);
}

// Aktivierte Firebase-Dienste
const FIREBASE_SERVICES = {
    auth: true,           // Authentication aktiviert
    firestore: true,      // Firestore Database aktiviert
    storage: true         // Cloud Storage aktiviert
};

// Produktionsmodus Einstellungen
const PRODUCTION_MODE = {
    requireAuth:  true,   // Authentifizierung erforderlich
    requireOnline: true,  // Online-Verbindung erforderlich
    logLevel:     'error' // Nur Fehler loggen
};

// Datenstruktur Mapping für Firebase
const FIREBASE_COLLECTIONS = {
    users:         'users',         // Benutzer
    themen:        'themen',        // Themen
    gruppen:       'gruppen',       // Gruppen
    bewertungen:   'bewertungen',   // Bewertungen
    vorlagen:      'vorlagen',      // Vorlagen
    news:          'news',          // News
    settings:      'settings',      // Einstellungen
    checkpoints:   'checkpoints',   // Checkpoints
    faecher:       'faecher',       // Fächer
    briefvorlagen: 'briefvorlagen'  // Briefvorlagen
};

// Zugriffsregeln
const SECURITY_RULES = {
    adminOnly:     ['settings', 'checkpoints', 'faecher', 'briefvorlagen'],
    teacherAccess: ['vorlagen', 'bewertungen', 'gruppen'],
    publicRead:    ['news', 'themen'],
    userSpecific:  ['users']
};

// App-Konstanten
const APP_CONFIG = {
    name:               'Zeig, was du kannst!',
    version:            '1.0.0',
    schuljahr:          '2025/26',
    maxFileSize:        5 * 1024 * 1024,      // 5 MB
    supportedFileTypes: ['png', 'jpg', 'jpeg', 'pdf'],
    sessionTimeout:     8 * 60 * 60 * 1000    // 8 h
};

// Validierung der Konfiguration
function validateConfig() {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
    const missing  = required.filter(k => !firebaseConfig[k]);
    if (missing.length) {
        console.error('❌ Firebase-Konfiguration unvollständig! Fehlende Felder:', missing.join(', '));
        return false;
    }
    console.log('✅ Firebase-Konfiguration vollständig');
    return true;
}

// Export nach window
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG       = firebaseConfig;
    window.FIREBASE_SERVICES     = FIREBASE_SERVICES;
    window.PRODUCTION_MODE       = PRODUCTION_MODE;
    window.FIREBASE_COLLECTIONS  = FIREBASE_COLLECTIONS;
    window.SECURITY_RULES        = SECURITY_RULES;
    window.APP_CONFIG            = APP_CONFIG;
    window.firebaseConfigValid   = validateConfig();

    if (window.firebaseConfigValid) {
        console.log('🔥 Firebase Konfiguration geladen für Projekt:', firebaseConfig.projectId || 'unbekannt');
    } else {
        console.warn('⚠️ Firebase-Konfiguration unvollständig – App läuft im eingeschränkten Modus');
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
