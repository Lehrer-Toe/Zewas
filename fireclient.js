// Firebase Client - Integration für "Zeig, was du kannst!" - KORRIGIERT
// Diese Datei bereitet die Firebase-Integration vor und bietet Fallback-Funktionalität

// Firebase SDK wird über CDN geladen (in Produktion)
let firebase = null;
let db = null;
let auth = null;
let storage = null;

// Status der Firebase-Verbindung
let firebaseInitialized = false;
let isOnline = true;
let syncQueue = [];

// Initialisierung
async function initializeFirebase() {
    try {
        if (typeof window !== 'undefined' && window.FIREBASE_CONFIG && window.firebaseConfigValid) {
            console.log('🔥 Initialisiere Firebase...');
            
            // Firebase SDK laden (über CDN - neue Version)
            if (typeof firebase === 'undefined') {
                console.log('📦 Firebase SDK wird über CDN geladen...');
                await loadFirebaseSDK();
            }
            
            // Firebase App initialisieren
            if (!firebase.apps || firebase.apps.length === 0) {
                const app = firebase.initializeApp(window.FIREBASE_CONFIG);
                console.log('✅ Firebase App initialisiert');
            }
            
            // Services initialisieren
            if (window.FIREBASE_SERVICES.auth) {
                auth = firebase.auth();
                console.log('🔐 Firebase Auth initialisiert');
                
                // Auth State Listener
                auth.onAuthStateChanged((user) => {
                    if (user) {
                        console.log('👤 Benutzer angemeldet:', user.email);
                    } else {
                        console.log('👤 Benutzer abgemeldet');
                    }
                });
            }
            
            if (window.FIREBASE_SERVICES.firestore) {
                db = firebase.firestore();
                
                // Offline-Unterstützung aktivieren
                if (window.DEVELOPMENT_MODE.offlineSupport) {
                    try {
                        await db.enablePersistence({ synchronizeTabs: true });
                        console.log('💾 Offline-Persistence aktiviert');
                    } catch (err) {
                        if (err.code === 'failed-precondition') {
                            console.warn('⚠️ Persistence failed: Mehrere Tabs geöffnet');
                        } else if (err.code === 'unimplemented') {
                            console.warn('⚠️ Persistence nicht verfügbar in diesem Browser');
                        } else {
                            console.warn('⚠️ Offline-Persistence nicht verfügbar:', err);
                        }
                    }
                }
                console.log('📊 Firestore initialisiert');
            }
            
            if (window.FIREBASE_SERVICES.storage) {
                storage = firebase.storage();
                console.log('📁 Firebase Storage initialisiert');
            }
            
            firebaseInitialized = true;
            window.firebaseInitialized = true;
            
            // Online/Offline Status überwachen
            setupNetworkMonitoring();
            
            // Auto-Sync starten
            if (window.SYNC_CONFIG.enabled) {
                startAutoSync();
            }
            
            console.log('🚀 Firebase vollständig initialisiert');
            
            // Custom Event für andere Module
            window.dispatchEvent(new CustomEvent('firebaseReady', { 
                detail: { initialized: true } 
            }));
            
        } else {
            console.log('⚡ Lokalmodus: Verwende lokale Daten (Firebase-Config nicht verfügbar)');
            setupLocalFallback();
        }
    } catch (error) {
        console.error('❌ Firebase Initialisierung fehlgeschlagen:', error);
        setupLocalFallback();
    }
}

// Firebase SDK dynamisch laden - KORRIGIERTE VERSION
async function loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
        // Prüfe ob Firebase bereits verfügbar ist
        if (typeof firebase !== 'undefined') {
            resolve();
            return;
        }
        
        // Firebase v9 Modular SDK über unpkg.com (CORS-freundlich)
        const scripts = [
            'https://unpkg.com/firebase@9.22.2/compat/firebase-compat-app.js',
            'https://unpkg.com/firebase@9.22.2/compat/firebase-compat-auth.js',
            'https://unpkg.com/firebase@9.22.2/compat/firebase-compat-firestore.js',
            'https://unpkg.com/firebase@9.22.2/compat/firebase-compat-storage.js'
        ];
        
        let loadedCount = 0;
        const totalScripts = scripts.length;
        
        scripts.forEach((src, index) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Wichtig für richtige Ladereihenfolge
            
            script.onload = () => {
                loadedCount++;
                console.log(`📦 Firebase Modul ${index + 1}/${totalScripts} geladen`);
                
                if (loadedCount === totalScripts) {
                    // Warte kurz bis alle Module verfügbar sind
                    setTimeout(() => {
                        if (typeof firebase !== 'undefined') {
                            console.log('✅ Firebase SDK vollständig geladen');
                            resolve();
                        } else {
                            reject(new Error('Firebase SDK nicht verfügbar nach dem Laden'));
                        }
                    }, 100);
                }
            };
            
            script.onerror = (error) => {
                console.error(`❌ Fehler beim Laden von ${src}:`, error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    });
}

// Lokalen Fallback einrichten
function setupLocalFallback() {
    console.log('🔧 Lokaler Fallback aktiviert');
    firebaseInitialized = false;
    window.firebaseInitialized = false;
    
    // Lokale Daten laden falls vorhanden
    loadLocalData();
    
    // Periodisches Speichern
    setInterval(saveLocalData, window.SYNC_CONFIG?.interval || 60000);
    
    // Event für lokalen Modus
    window.dispatchEvent(new CustomEvent('localModeReady', { 
        detail: { localMode: true } 
    }));
}

// Netzwerk-Monitoring
function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('🌐 Verbindung wiederhergestellt');
        processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        console.log('📴 Offline-Modus');
    });
    
    // Initial Status prüfen
    isOnline = navigator.onLine;
    console.log(`🌐 Netzwerk-Status: ${isOnline ? 'Online' : 'Offline'}`);
}

// Auto-Sync
function startAutoSync() {
    setInterval(() => {
        if (isOnline && firebaseInitialized) {
            syncAllData();
        }
    }, window.SYNC_CONFIG.interval);
    
    console.log(`🔄 Auto-Sync aktiviert (${window.SYNC_CONFIG.interval/1000}s Intervall)`);
}

// === DATEN-OPERATIONEN ===

// Benutzer-Authentifizierung
async function loginUser(email, password) {
    try {
        if (firebaseInitialized && auth) {
            console.log('🔐 Firebase-Login für:', email);
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Benutzerdaten aus Firestore laden
            const userDoc = await db.collection(window.FIREBASE_COLLECTIONS.users).doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                    success: true,
                    user: {
                        email: user.email,
                        name: userData.name,
                        role: userData.role,
                        uid: user.uid
                    }
                };
            } else {
                throw new Error('Benutzerdaten nicht gefunden');
            }
        } else {
            // Fallback: Lokale Authentifizierung
            return loginUserLocal(email, password);
        }
    } catch (error) {
        console.error('❌ Login fehlgeschlagen:', error);
        
        // Bei Firebase-Fehlern auch lokalen Login versuchen
        if (error.code === 'auth/network-request-failed' || 
            error.code === 'auth/too-many-requests') {
            console.log('🔄 Versuche lokalen Login als Fallback...');
            return loginUserLocal(email, password);
        }
        
        return {
            success: false,
            error: translateFirebaseError(error)
        };
    }
}

// Firebase-Fehler übersetzen
function translateFirebaseError(error) {
    const translations = {
        'auth/user-not-found': 'Benutzer nicht gefunden',
        'auth/wrong-password': 'Falsches Passwort',
        'auth/invalid-email': 'Ungültige E-Mail-Adresse',
        'auth/user-disabled': 'Benutzerkonto deaktiviert',
        'auth/too-many-requests': 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.',
        'auth/network-request-failed': 'Netzwerkfehler. Prüfen Sie Ihre Internetverbindung.'
    };
    
    return translations[error.code] || error.message || 'Unbekannter Fehler';
}

// Lokale Authentifizierung (Fallback)
function loginUserLocal(email, password) {
    console.log('🏠 Lokaler Login für:', email);
    
    // users Array aus main.js verwenden
    if (typeof window.users === 'undefined') {
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
            user: user
        };
    } else {
        return {
            success: false,
            error: 'Ungültige Anmeldedaten'
        };
    }
}

// Daten speichern
async function saveData(collection, data, docId = null) {
    try {
        if (firebaseInitialized && db && isOnline) {
            const collectionRef = db.collection(window.FIREBASE_COLLECTIONS[collection] || collection);
            
            if (docId) {
                await collectionRef.doc(docId).set(data, { merge: true });
            } else {
                const docRef = await collectionRef.add(data);
                docId = docRef.id;
            }
            
            console.log(`✅ Daten gespeichert in ${collection}${docId ? ` (${docId})` : ''}`);
            return { success: true, id: docId };
        } else {
            // Zur Sync-Queue hinzufügen
            addToSyncQueue('save', collection, data, docId);
            return { success: true, queued: true };
        }
    } catch (error) {
        console.error(`❌ Fehler beim Speichern in ${collection}:`, error);
        addToSyncQueue('save', collection, data, docId);
        return { success: false, error: error.message };
    }
}

// Daten laden
async function loadData(collection, filter = null) {
    try {
        if (firebaseInitialized && db && isOnline) {
            let query = db.collection(window.FIREBASE_COLLECTIONS[collection] || collection);
            
            // Filter anwenden falls vorhanden
            if (filter) {
                Object.entries(filter).forEach(([field, value]) => {
                    query = query.where(field, '==', value);
                });
            }
            
            const snapshot = await query.get();
            const data = [];
            
            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 ${data.length} Einträge aus ${collection} geladen`);
            return { success: true, data };
        } else {
            // Fallback: Lokale Daten
            return loadDataLocal(collection, filter);
        }
    } catch (error) {
        console.error(`❌ Fehler beim Laden aus ${collection}:`, error);
        return loadDataLocal(collection, filter);
    }
}

// Lokale Daten laden (Fallback)
function loadDataLocal(collection, filter) {
    let data = [];
    
    // Verwende globale Variablen aus main.js
    switch (collection) {
        case 'users':
            data = window.users || [];
            break;
        case 'themen':
            data = window.themen || [];
            break;
        case 'gruppen':
            data = window.gruppen || [];
            break;
        case 'bewertungen':
            data = window.bewertungen || [];
            break;
        case 'news':
            data = window.news || [];
            break;
        case 'vorlagen':
            data = Object.values(window.vorlagen || {}).flat();
            break;
        default:
            console.warn(`Unbekannte Collection: ${collection}`);
            data = [];
    }
    
    // Filter anwenden falls vorhanden
    if (filter && data.length > 0) {
        Object.entries(filter).forEach(([field, value]) => {
            data = data.filter(item => item[field] === value);
        });
    }
    
    console.log(`📁 ${data.length} lokale Einträge aus ${collection} geladen`);
    return { success: true, data };
}

// Sync-Queue Management
function addToSyncQueue(operation, collection, data, docId = null) {
    syncQueue.push({
        operation,
        collection,
        data,
        docId,
        timestamp: Date.now()
    });
    
    console.log(`📝 Operation zur Sync-Queue hinzugefügt: ${operation} in ${collection} (Queue: ${syncQueue.length})`);
}

async function processSyncQueue() {
    if (!firebaseInitialized || !isOnline || syncQueue.length === 0) {
        return;
    }
    
    console.log(`🔄 Verarbeite ${syncQueue.length} Operationen aus Sync-Queue`);
    
    const operations = [...syncQueue];
    syncQueue = [];
    
    for (const operation of operations) {
        try {
            if (operation.operation === 'save') {
                await saveData(operation.collection, operation.data, operation.docId);
                console.log(`✅ Sync erfolgreich: ${operation.collection}`);
            }
        } catch (error) {
            console.error('❌ Sync-Operation fehlgeschlagen:', error);
            // Zurück in die Queue falls Fehler
            syncQueue.push(operation);
        }
    }
    
    if (syncQueue.length > 0) {
        console.log(`⚠️ ${syncQueue.length} Operationen konnten nicht synchronisiert werden`);
    } else {
        console.log('✅ Alle Sync-Operationen erfolgreich');
    }
}

// Alle Daten synchronisieren
async function syncAllData() {
    if (!firebaseInitialized || !isOnline) {
        return;
    }
    
    try {
        console.log('🔄 Vollständige Datensynchronisation...');
        
        // Zuerst Sync-Queue abarbeiten
        await processSyncQueue();
        
        // App-Einstellungen synchronisieren
        if (window.currentUser && window.currentUser.role === 'admin') {
            const settings = {
                schuljahr: window.schuljahr,
                alleFaecherGlobal: window.alleFaecherGlobal,
                bewertungsCheckpoints: window.bewertungsCheckpoints,
                briefvorlage: window.briefvorlage,
                staerkenFormulierungen: window.staerkenFormulierungen,
                lastSync: new Date().toISOString()
            };
            await saveData('settings', settings, 'app-settings');
        }
        
        console.log('✅ Datensynchronisation abgeschlossen');
        localStorage.setItem('last-sync-time', new Date().toISOString());
    } catch (error) {
        console.error('❌ Sync-Fehler:', error);
    }
}

// Lokale Daten speichern
function saveLocalData() {
    try {
        const localData = {
            users: window.users || [],
            themen: window.themen || [],
            gruppen: window.gruppen || [],
            bewertungen: window.bewertungen || [],
            news: window.news || [],
            vorlagen: window.vorlagen || {},
            schuljahr: window.schuljahr || '2025/26',
            alleFaecherGlobal: window.alleFaecherGlobal || {},
            bewertungsCheckpoints: window.bewertungsCheckpoints || {},
            briefvorlage: window.briefvorlage || {},
            staerkenFormulierungen: window.staerkenFormulierungen || {},
            lastSaved: Date.now()
        };
        
        localStorage.setItem('zeig-was-du-kannst-data', JSON.stringify(localData));
        console.log('💾 Lokale Daten gespeichert');
    } catch (error) {
        console.warn('⚠️ Lokale Daten konnten nicht gespeichert werden:', error);
    }
}

// Lokale Daten laden
function loadLocalData() {
    try {
        const savedData = localStorage.getItem('zeig-was-du-kannst-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Daten nur laden wenn sie nicht zu alt sind (24h)
            const maxAge = 24 * 60 * 60 * 1000;
            if (Date.now() - data.lastSaved < maxAge) {
                // Globale Variablen aktualisieren falls noch nicht definiert
                if (!window.users && data.users) window.users = data.users;
                if (!window.themen && data.themen) window.themen = data.themen;
                if (!window.gruppen && data.gruppen) window.gruppen = data.gruppen;
                if (!window.bewertungen && data.bewertungen) window.bewertungen = data.bewertungen;
                if (!window.news && data.news) window.news = data.news;
                if (!window.vorlagen && data.vorlagen) window.vorlagen = data.vorlagen;
                if (!window.schuljahr && data.schuljahr) window.schuljahr = data.schuljahr;
                if (!window.alleFaecherGlobal && data.alleFaecherGlobal) window.alleFaecherGlobal = data.alleFaecherGlobal;
                if (!window.bewertungsCheckpoints && data.bewertungsCheckpoints) window.bewertungsCheckpoints = data.bewertungsCheckpoints;
                if (!window.briefvorlage && data.briefvorlage) window.briefvorlage = data.briefvorlage;
                if (!window.staerkenFormulierungen && data.staerkenFormulierungen) window.staerkenFormulierungen = data.staerkenFormulierungen;
                
                console.log('📁 Lokale Daten geladen (Stand:', new Date(data.lastSaved).toLocaleString(), ')');
            } else {
                console.log('📁 Lokale Daten zu alt, verwende Standard-Daten');
            }
        }
    } catch (error) {
        console.warn('⚠️ Lokale Daten konnten nicht geladen werden:', error);
    }
}

// Datei-Upload (für Briefkopf etc.)
async function uploadFile(file, path) {
    try {
        if (firebaseInitialized && storage && isOnline) {
            const storageRef = storage.ref().child(path);
            const uploadTask = await storageRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();
            
            console.log('📤 Datei hochgeladen:', downloadURL);
            return { success: true, url: downloadURL };
        } else {
            console.log('📁 Datei wird lokal zwischengespeichert');
            // Lokale Zwischenspeicherung
            return { success: true, url: URL.createObjectURL(file), local: true };
        }
    } catch (error) {
        console.error('❌ Upload fehlgeschlagen:', error);
        return { success: false, error: error.message };
    }
}

// Status-Informationen
function getConnectionStatus() {
    return {
        firebaseInitialized,
        isOnline,
        syncQueueLength: syncQueue.length,
        lastSync: localStorage.getItem('last-sync-time'),
        configValid: window.firebaseConfigValid || false
    };
}

// Export für Verwendung in anderen Modulen
window.FirebaseClient = {
    initialize: initializeFirebase,
    login: loginUser,
    save: saveData,
    load: loadData,
    sync: syncAllData,
    upload: uploadFile,
    status: getConnectionStatus,
    saveLocal: saveLocalData,
    loadLocal: loadLocalData
};

// Automatische Initialisierung
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

// Graceful Shutdown
window.addEventListener('beforeunload', () => {
    saveLocalData();
    if (syncQueue.length > 0) {
        console.log(`⚠️ ${syncQueue.length} offene Sync-Operationen beim Seitenwechsel`);
    }
});

// Periodisches lokales Speichern
setInterval(() => {
    if (!firebaseInitialized || !isOnline) {
        saveLocalData();
    }
}, 300000); // Alle 5 Minuten

console.log('🔧 Firebase Client geladen und bereit');
