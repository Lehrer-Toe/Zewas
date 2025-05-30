// Firebase Konfiguration
// WICHTIG: Diese Datei wird über Netlify-Umgebungsvariablen konfiguriert

// Firebase-Konfiguration (wird über Netlify Environment Variables gesetzt)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "zeig-was-du-kannst-demo.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "zeig-was-du-kannst-demo",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "zeig-was-du-kannst-demo.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdefghijklmnop",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://zeig-was-du-kannst-demo-default-rtdb.europe-west1.firebasedatabase.app/"
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
        SYNC_CONFIG
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
}

// Logging für Debug-Zwecke
if (DEVELOPMENT_MODE.enabled && DEVELOPMENT_MODE.logLevel === 'debug') {
    console.log('🔥 Firebase Config geladen:', {
        projectId: firebaseConfig.projectId,
        services: FIREBASE_SERVICES,
        collections: Object.keys(FIREBASE_COLLECTIONS),
        developmentMode: DEVELOPMENT_MODE.enabled
    });
}
