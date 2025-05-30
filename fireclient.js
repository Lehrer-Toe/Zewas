// Firebase Client - Integration für "Zeig, was du kannst!"
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
        if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
            console.log('🔥 Initialisiere Firebase...');
            
            // Firebase SDK laden (über CDN)
            if (typeof firebase === 'undefined') {
                console.log('📦 Firebase SDK wird über CDN geladen...');
                await loadFirebaseSDK();
            }
            
            // Firebase App initialisieren
            if (!firebase.apps.length) {
                firebase.initializeApp(window.FIREBASE_CONFIG);
                console.log('✅ Firebase App initialisiert');
            }
            
            // Services initialisieren
            if (window.FIREBASE_SERVICES.auth) {
                auth = firebase.auth();
                console.log('🔐 Firebase Auth initialisiert');
            }
            
            if (window.FIREBASE_SERVICES.firestore) {
                db = firebase.firestore();
                
                // Offline-Unterstützung aktivieren
                if (window.DEVELOPMENT_MODE.offlineSupport) {
                    await db.enablePersistence().catch(err => {
                        console.warn('⚠️ Offline-Persistence nicht verfügbar:', err);
                    });
                }
                console.log('📊 Firestore initialisiert');
            }
            
            if (window.FIREBASE_SERVICES.storage) {
                storage = firebase.storage();
                console.log('📁 Firebase Storage initialisiert');
            }
            
            firebaseInitialized = true;
            
            // Online/Offline Status überwachen
            setupNetworkMonitoring();
            
            // Auto-Sync starten
            if (window.SYNC_CONFIG.enabled) {
                startAutoSync();
            }
            
            console.log('🚀 Firebase vollständig initialisiert');
            
        } else {
            console.log('⚡ Entwicklungsmodus: Verwende lokale Daten');
            setupLocalFallback();
        }
    } catch (error) {
        console.error('❌ Firebase Initialisierung fehlgeschlagen:', error);
        setupLocalFallback();
    }
}

// Firebase SDK dynamisch laden
async function loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
        // Firebase App
        const appScript = document.createElement('script');
        appScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
        appScript.onload = () => {
            // Firebase Auth
            const authScript = document.createElement('script');
            authScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
            authScript.onload = () => {
                // Firebase Firestore
                const firestoreScript = document.createElement('script');
                firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
                firestoreScript.onload = () => {
                    // Firebase Storage
                    const storageScript = document.createElement('script');
                    storageScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
                    storageScript.onload = resolve;
                    storageScript.onerror = reject;
                    document.head.appendChild(storageScript);
                };
                firestoreScript.onerror = reject;
                document.head.appendChild(firestoreScript);
            };
            authScript.onerror = reject;
            document.head.appendChild(authScript);
        };
        appScript.onerror = reject;
        document.head.appendChild(appScript);
    });
}

// Lokalen Fallback einrichten
function setupLocalFallback() {
    console.log('🔧 Lokaler Fallback aktiviert');
    firebaseInitialized = false;
    
    // Lokale Daten laden falls vorhanden
    loadLocalData();
    
    // Periodisches Speichern
    setInterval(saveLocalData, window.SYNC_CONFIG?.interval || 60000);
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
}

// Auto-Sync
function startAutoSync() {
    setInterval(() => {
        if (isOnline && firebaseInitialized) {
            syncAllData();
        }
    }, window.SYNC_CONFIG.interval);
}

// === DATEN-OPERATIONEN ===

// Benutzer-Authentifizierung
async function loginUser(email, password) {
    try {
        if (firebaseInitialized && auth) {
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
        console.error('Login fehlgeschlagen:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Lokale Authentifizierung (Fallback)
function loginUserLocal(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
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
            const collectionRef = db.collection(window.FIREBASE_COLLECTIONS[collection]);
            
            if (docId) {
                await collectionRef.doc(docId).set(data, { merge: true });
            } else {
                await collectionRef.add(data);
            }
            
            console.log(`✅ Daten gespeichert in ${collection}`);
            return { success: true };
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
            let query = db.collection(window.FIREBASE_COLLECTIONS[collection]);
            
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
    
    switch (collection) {
        case 'users':
            data = users;
            break;
        case 'themen':
            data = themen;
            break;
        case 'gruppen':
            data = gruppen;
            break;
        case 'bewertungen':
            data = bewertungen;
            break;
        case 'news':
            data = news;
            break;
        default:
            data = [];
    }
    
    // Filter anwenden falls vorhanden
    if (filter && data.length > 0) {
        Object.entries(filter).forEach(([field, value]) => {
            data = data.filter(item => item[field] === value);
        });
    }
    
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
    
    console.log(`📝 Operation zur Sync-Queue hinzugefügt: ${operation} in ${collection}`);
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
            }
        } catch (error) {
            console.error('❌ Sync-Operation fehlgeschlagen:', error);
            // Zurück in die Queue falls Fehler
            syncQueue.push(operation);
        }
    }
}

// Alle Daten synchronisieren
async function syncAllData() {
    if (!firebaseInitialized || !isOnline) {
        return;
    }
    
    try {
        console.log('🔄 Vollständige Datensynchronisation...');
        
        // Lokale Daten mit Firebase synchronisieren
        await saveData('users', users);
        await saveData('themen', themen);
        await saveData('gruppen', gruppen);
        await saveData('bewertungen', bewertungen);
        await saveData('news', news);
        
        // Auch App-Einstellungen synchronisieren
        const settings = {
            schuljahr,
            alleFaecherGlobal,
            bewertungsCheckpoints,
            briefvorlage,
            staerkenFormulierungen
        };
        await saveData('settings', settings, 'app-settings');
        
        console.log('✅ Datensynchronisation abgeschlossen');
    } catch (error) {
        console.error('❌ Sync-Fehler:', error);
    }
}

// Lokale Daten speichern
function saveLocalData() {
    try {
        const localData = {
            users,
            themen,
            gruppen,
            bewertungen,
            news,
            vorlagen,
            schuljahr,
            alleFaecherGlobal,
            bewertungsCheckpoints,
            briefvorlage,
            staerkenFormulierungen,
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
                // Globale Variablen aktualisieren
                if (data.users) users = data.users;
                if (data.themen) themen = data.themen;
                if (data.gruppen) gruppen = data.gruppen;
                if (data.bewertungen) bewertungen = data.bewertungen;
                if (data.news) news = data.news;
                if (data.vorlagen) vorlagen = data.vorlagen;
                if (data.schuljahr) schuljahr = data.schuljahr;
                if (data.alleFaecherGlobal) alleFaecherGlobal = data.alleFaecherGlobal;
                if (data.bewertungsCheckpoints) bewertungsCheckpoints = data.bewertungsCheckpoints;
                if (data.briefvorlage) briefvorlage = data.briefvorlage;
                if (data.staerkenFormulierungen) staerkenFormulierungen = data.staerkenFormulierungen;
                
                console.log('📁 Lokale Daten geladen (Stand:', new Date(data.lastSaved).toLocaleString(), ')');
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
        lastSync: localStorage.getItem('last-sync-time')
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
        console.log('⚠️ Offene Sync-Operationen beim Seitenwechsel');
    }
});

console.log('🔧 Firebase Client geladen und bereit');
