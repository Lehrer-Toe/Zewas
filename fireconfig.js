// === fireconfig.js ===
// Browser-kompatible Firebase-Konfiguration (Online-Modus)
// Fehlerbehebung für "process is not defined"

// Polyfill für Umgebungen ohne process-Objekt
if (typeof process === 'undefined') {
    window.process = { env: {} };
}

/**
 * Liest eine Umgebungsvariable aus:
 * - Versucht zuerst window._env (Netlify-Injektion zur Build-Zeit)
 * - Falls nicht vorhanden, greift auf process.env zurück (lokale Entwicklung)
 * - Gibt null zurück, falls die Variable nicht gefunden wurde
 */
function getEnvVar(name) {
    // Netlify: window._env enthält zur Build-Zeit injizierte Variablen
    if (typeof window !== 'undefined' && window._env && window._env[name]) {
        return window._env[name];
    }
    // Lokaler Fallback (z. B. Netlify-CLI, lokale NODE_ENV)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    console.warn(`Environment Variable "${name}" nicht gefunden`);
    return null;
}

// ----------------------------------------------------------------
// Firebase-Konfiguration
// ----------------------------------------------------------------
let firebaseConfig = {};
try {
    firebaseConfig = {
        apiKey:            getEnvVar('FIREBASE_API_KEY'),
        authDomain:        getEnvVar('FIREBASE_AUTH_DOMAIN'),
        projectId:         getEnvVar('FIREBASE_PROJECT_ID'),
        storageBucket:     getEnvVar('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
        appId:             getEnvVar('FIREBASE_APP_ID'),
        databaseURL:       getEnvVar('FIREBASE_DATABASE_URL')
    };
} catch (err) {
    console.error('❌ Fehler beim Zusammenstellen der Firebase-Konfiguration:', err);
}

// ----------------------------------------------------------------
// Aktivierte Firebase-Dienste
// ----------------------------------------------------------------
const FIREBASE_SERVICES = {
    auth:      true,     // Firebase Authentication aktivieren
    firestore: true,     // Firestore (NoSQL-Datenbank) aktivieren
    storage:   true      // Cloud Storage aktivieren
};

// ----------------------------------------------------------------
// Produktionsmodus-Einstellungen
// ----------------------------------------------------------------
const PRODUCTION_MODE = {
    requireAuth:   true,    // Anmeldung zwingend erforderlich
    requireOnline: true,    // Internetverbindung voraussetzen
    logLevel:      'error'  // Nur Fehlermeldungen protokollieren
};

// ----------------------------------------------------------------
// Sammlungs-Mapping (Firestore Collections)
// ----------------------------------------------------------------
const FIREBASE_COLLECTIONS = {
    users:         'users',
    themen:        'themen',
    gruppen:       'gruppen',
    bewertungen:   'bewertungen',
    vorlagen:      'vorlagen',
    news:          'news',
    settings:      'settings',
    checkpoints:   'checkpoints',
    faecher:       'faecher',
    briefvorlagen: 'briefvorlagen'
};

// ----------------------------------------------------------------
// Zugriffsregeln (nur in Firestore-Sicherheitsregeln relevant)
// ----------------------------------------------------------------
const SECURITY_RULES = {
    adminOnly:     ['settings', 'checkpoints', 'faecher', 'briefvorlagen'],
    teacherAccess: ['vorlagen', 'bewertungen', 'gruppen'],
    publicRead:    ['news', 'themen'],
    userSpecific:  ['users']
};

// ----------------------------------------------------------------
// Statische App-Konstanten
// ----------------------------------------------------------------
const APP_CONFIG = {
    name:               'Zeig, was du kannst!',
    version:            '1.0.0',
    schuljahr:          '2025/26',
    maxFileSize:        5 * 1024 * 1024,        // 5 MB
    supportedFileTypes: ['png', 'jpg', 'jpeg', 'pdf'],
    sessionTimeout:     8 * 60 * 60 * 1000      // 8 Stunden in Millisekunden
};

/**
 * Überprüft, ob alle notwendigen Firebase-Konfigurationsfelder gesetzt sind.
 * Gibt true zurück, wenn die Konfiguration vollständig ist, sonst false.
 */
function validateConfig() {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
    const missing = requiredKeys.filter(key => !firebaseConfig[key]);
    if (missing.length > 0) {
        console.error(
            '❌ Firebase-Konfiguration unvollständig. Fehlende Felder: ' +
            missing.join(', ')
        );
        return false;
    }
    console.log('✅ Firebase-Konfiguration vollständig.');
    return true;
}

// ----------------------------------------------------------------
// Export in window für globalen Zugriff im Frontend
// ----------------------------------------------------------------
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG      = firebaseConfig;
    window.FIREBASE_SERVICES    = FIREBASE_SERVICES;
    window.PRODUCTION_MODE      = PRODUCTION_MODE;
    window.FIREBASE_COLLECTIONS = FIREBASE_COLLECTIONS;
    window.SECURITY_RULES       = SECURITY_RULES;
    window.APP_CONFIG           = APP_CONFIG;
    window.firebaseConfigValid  = validateConfig();

    if (window.firebaseConfigValid) {
        console.log(
            '🔥 Firebase-Konfiguration geladen für Projekt: ' +
            (firebaseConfig.projectId || 'unbekannt')
        );
    } else {
        console.warn(
            '⚠️ Firebase-Konfiguration unvollständig – App läuft im eingeschränkten Modus.'
        );
    }

    // Optional: Debug-Hinweise, wenn lokal auf localhost entwickelt wird
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('🛠️ Entwicklungsmodus erkannt (localhost)');
        console.log('🔍 Status der Environment-Variablen:', {
            'window._env vorhanden': !!window._env,
            'FIREBASE_API_KEY': window._env?.FIREBASE_API_KEY ? '[GESETZT]' : '[FEHLT]',
            'FIREBASE_PROJECT_ID': window._env?.FIREBASE_PROJECT_ID ? '[GESETZT]' : '[FEHLT]'
        });
    }
}
