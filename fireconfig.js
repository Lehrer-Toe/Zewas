// Firebase Konfiguration - Korrigiert für Browser-Umgebung
// WICHTIG: Diese Datei wird über Netlify-Umgebungsvariablen konfiguriert

// Funktion zum Laden der Environment Variables (Netlify-spezifisch)
function getNetlifyEnvVar(varName, fallback) {
    // In Netlify werden Environment Variables zur Build-Zeit in window._env injiziert
    if (typeof window !== 'undefined' && window._env && window._env[varName]) {
        return window._env[varName];
    }
    
    // Fallback für lokale Entwicklung oder wenn Variables nicht verfügbar
    return fallback;
}

// Firebase-Konfiguration (wird über Netlify Environment Variables gesetzt)
const firebaseConfig = {
    apiKey: getNetlifyEnvVar('FIREBASE_API_KEY', "demo-api-key"),
    authDomain: getNetlifyEnvVar('FIREBASE_AUTH_DOMAIN', "zeig-was-du-kannst-demo.firebaseapp.com"),
    projectId: getNetlifyEnvVar('FIREBASE_PROJECT_ID', "zeig-was-du-kannst-demo"),
    storageBucket: getNetlifyEnvVar('FIREBASE_STORAGE_BUCKET', "zeig-was-du-kannst-demo.appspot.com"),
    messagingSenderId: getNetlifyEnvVar('FIREBASE_MESSAGING_SENDER_ID', "123456789"),
    appId: getNetlifyEnvVar('FIREBASE_APP_ID', "1:123456789:web:abcdefghijklmnop"),
    databaseURL: getNetlifyEnvVar('FIREBASE_DATABASE_URL', "https://zeig-was-du-kannst-demo-default-rtdb.europe-west1.firebasedatabase.app/")
};

// Firebase Services Konfiguration
const FIREBASE_SERVICES = {
    auth: true,           // Authentication aktiviert
    firestore: true,      // Firestore Database aktiviert
    realtime: false,      // Realtime Database (optional)
    storage: true,        // Cloud Storage aktiviert
    functions: false      // Cloud Functions (optional)
};

// Entwicklungsmodus Einstellungen
const DEVELOPMENT_MODE = {
    enabled: true,                    // Entwicklungsmodus aktiviert
    useLocalData: true,              // Lokale Daten als Fallback
    logLevel: 'debug',               // Debug-Logging
    offlineSupport: true,            // Offline-Unterstützung
    emulatorPorts: {
        auth: 9099,
        firestore: 8080,
        storage: 9199,
        functions: 5001
    }
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
    autoSaveInterval: 30000,          // 30 Sekunden
    sessionTimeout: 24 * 60 * 60 * 1000  // 24 Stunden
};

// Backup und Sync Konfiguration
const SYNC_CONFIG = {
    enabled: true,
    interval: 60000,                  // 1 Minute Sync-Intervall
    retryAttempts: 3,
    backupOnChange: true,
    conflictResolution: 'server-wins' // oder 'client-wins', 'manual'
};

// Prüfe ob Firebase-Konfiguration verfügbar ist
function validateFirebaseConfig() {
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const isValid = requiredFields.every(field => 
        firebaseConfig[field] && firebaseConfig[field] !== `demo-${field.toLowerCase()}`
    );
    
    if (!isValid) {
        console.warn('⚠️ Firebase-Konfiguration unvollständig - verwende Demo-Modus');
        DEVELOPMENT_MODE.useLocalData = true;
        FIREBASE_SERVICES.auth = false;
        FIREBASE_SERVICES.firestore = false;
        FIREBASE_SERVICES.storage = false;
    }
    
    return isValid;
}

// Export der Konfiguration für andere Module
if (typeof module !== 'undefined' && module.exports) {
    // Node.js Environment (Netlify Functions)
    module.exports = {
        firebaseConfig,
        FIREBASE_SERVICES,
        DEVELOPMENT_MODE,
        FIREBASE_COLLECTIONS,
        SECURITY_RULES,
        APP_CONFIG,
        SYNC_CONFIG,
        validateFirebaseConfig
    };
} else {
    // Browser Environment
    window.FIREBASE_CONFIG = firebaseConfig;
    window.FIREBASE_SERVICES = FIREBASE_SERVICES;
    window.DEVELOPMENT_MODE = DEVELOPMENT_MODE;
    window.FIREBASE_COLLECTIONS = FIREBASE_COLLECTIONS;
    window.SECURITY_RULES = SECURITY_RULES;
    window.APP_CONFIG = APP_CONFIG;
    window.SYNC_CONFIG = SYNC_CONFIG;
    
    // Validierung beim Laden ausführen
    const configValid = validateFirebaseConfig();
    
    // Global verfügbar machen
    window.firebaseConfigValid = configValid;
}

// Logging für Debug-Zwecke
if (DEVELOPMENT_MODE.enabled && DEVELOPMENT_MODE.logLevel === 'debug') {
    console.log('🔥 Firebase Config geladen:', {
        projectId: firebaseConfig.projectId,
        services: FIREBASE_SERVICES,
        collections: Object.keys(FIREBASE_COLLECTIONS),
        developmentMode: DEVELOPMENT_MODE.enabled,
        configValid: typeof window !== 'undefined' ? window.firebaseConfigValid : 'unknown'
    });
}

// Hilfsfunktion für Environment Variables Setup in Netlify
function setupNetlifyEnvVars() {
    console.log(`
🔧 Firebase Konfiguration:

Zur korrekten Funktion müssen in Netlify folgende Environment Variables gesetzt werden:

FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.europe-west1.firebasedatabase.app/

Aktueller Status: ${window.firebaseConfigValid ? '✅ Konfiguriert' : '❌ Demo-Modus'}
    `);
}

// Setup-Hilfe nur im Development Mode anzeigen
if (typeof window !== 'undefined' && DEVELOPMENT_MODE.enabled && !window.firebaseConfigValid) {
    setTimeout(setupNetlifyEnvVars, 1000);
}
