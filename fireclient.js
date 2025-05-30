// Firebase Client - NUR ONLINE MODUS für "Zeig, was du kannst!"
// Kein lokaler Fallback - die App funktioniert nur mit aktiver Firebase-Verbindung

// Firebase SDK wird über CDN geladen
let firebase = null;
let db = null;
let auth = null;
let storage = null;

// Status der Firebase-Verbindung
let firebaseInitialized = false;
let isOnline = true;

// Initialisierung
async function initializeFirebase() {
    try {
        if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
            console.log('🔥 Initialisiere Firebase...');
            
            // Firebase SDK laden
            if (typeof firebase === 'undefined') {
                console.log('📦 Firebase SDK wird geladen...');
                await loadFirebaseSDK();
            }
            
            // Firebase App initialisieren
            if (!firebase.apps || firebase.apps.length === 0) {
                const app = firebase.initializeApp(window.FIREBASE_CONFIG);
                console.log('✅ Firebase App initialisiert');
            }
            
            // Services initialisieren
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
            
            db = firebase.firestore();
            
            // Offline-Persistence DEAKTIVIERT - nur Online-Modus
            console.log('📊 Firestore initialisiert (Online-Modus)');
            
            storage = firebase.storage();
            console.log('📁 Firebase Storage initialisiert');
            
            firebaseInitialized = true;
            window.firebaseInitialized = true;
            
            // Online/Offline Status überwachen
            setupNetworkMonitoring();
            
            console.log('🚀 Firebase vollständig initialisiert');
            
            // Custom Event für andere Module
            window.dispatchEvent(new CustomEvent('firebaseReady', { 
                detail: { initialized: true } 
            }));
            
        } else {
            throw new Error('Firebase-Konfiguration fehlt! Die App kann nicht gestartet werden.');
        }
    } catch (error) {
        console.error('❌ KRITISCHER FEHLER: Firebase konnte nicht initialisiert werden:', error);
        showCriticalError('Firebase-Verbindung fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung und laden Sie die Seite neu.');
        throw error;
    }
}

// Firebase SDK dynamisch laden
async function loadFirebaseSDK() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            resolve();
            return;
        }
        
        // Firebase v8 Compat SDK - stabiler für Produktion
        const scripts = [
            'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
            'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
            'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
            'https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js'
        ];
        
        let loadedCount = 0;
        const totalScripts = scripts.length;
        
        scripts.forEach((src, index) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            
            script.onload = () => {
                loadedCount++;
                console.log(`📦 Firebase Modul ${index + 1}/${totalScripts} geladen`);
                
                if (loadedCount === totalScripts) {
                    setTimeout(() => {
                        if (typeof firebase !== 'undefined') {
                            console.log('✅ Firebase SDK vollständig geladen');
                            resolve();
                        } else {
                            reject(new Error('Firebase SDK nicht verfügbar'));
                        }
                    }, 100);
                }
            };
            
            script.onerror = (error) => {
                console.error(`❌ Fehler beim Laden von ${src}:`, error);
                reject(new Error('Firebase SDK konnte nicht geladen werden'));
            };
            
            document.head.appendChild(script);
        });
    });
}

// Kritischen Fehler anzeigen
function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-size: 1.2rem;
        text-align: center;
        padding: 20px;
    `;
    
    errorDiv.innerHTML = `
        <div>
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <div style="max-width: 600px;">
                <h2>Verbindungsfehler</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 30px;
                    font-size: 1rem;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Seite neu laden</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
}

// Netzwerk-Monitoring
function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('🌐 Internetverbindung wiederhergestellt');
        location.reload(); // Seite neu laden bei Verbindungswiederherstellung
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        console.log('📴 Keine Internetverbindung');
        showCriticalError('Keine Internetverbindung. Die App benötigt eine aktive Internetverbindung.');
    });
    
    // Initial Status prüfen
    isOnline = navigator.onLine;
    if (!isOnline) {
        showCriticalError('Keine Internetverbindung. Die App benötigt eine aktive Internetverbindung.');
    }
}

// === DATEN-OPERATIONEN ===

// Benutzer-Authentifizierung - NUR Firebase
async function loginUser(email, password) {
    if (!firebaseInitialized || !auth) {
        throw new Error('Firebase nicht initialisiert');
    }
    
    if (!isOnline) {
        throw new Error('Keine Internetverbindung');
    }
    
    try {
        console.log('🔐 Firebase-Login für:', email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Benutzerdaten aus Firestore laden
        const userDoc = await db.collection('users').doc(user.uid).get();
        
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
            // Erstelle Benutzerdokument falls nicht vorhanden
            const userData = {
                email: user.email,
                name: user.email.split('@')[0],
                role: 'lehrer',
                created: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('users').doc(user.uid).set(userData);
            
            return {
                success: true,
                user: {
                    email: user.email,
                    name: userData.name,
                    role: userData.role,
                    uid: user.uid
                }
            };
        }
    } catch (error) {
        console.error('❌ Login fehlgeschlagen:', error);
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

// Daten speichern
async function saveData(collection, data, docId = null) {
    if (!firebaseInitialized || !db) {
        throw new Error('Firebase nicht initialisiert');
    }
    
    if (!isOnline) {
        throw new Error('Keine Internetverbindung');
    }
    
    try {
        const collectionRef = db.collection(collection);
        
        // Timestamp hinzufügen
        data.lastModified = firebase.firestore.FieldValue.serverTimestamp();
        
        if (docId) {
            await collectionRef.doc(docId).set(data, { merge: true });
        } else {
            const docRef = await collectionRef.add(data);
            docId = docRef.id;
        }
        
        console.log(`✅ Daten gespeichert in ${collection}${docId ? ` (${docId})` : ''}`);
        return { success: true, id: docId };
    } catch (error) {
        console.error(`❌ Fehler beim Speichern in ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

// Daten laden
async function loadData(collection, filter = null) {
    if (!firebaseInitialized || !db) {
        throw new Error('Firebase nicht initialisiert');
    }
    
    if (!isOnline) {
        throw new Error('Keine Internetverbindung');
    }
    
    try {
        let query = db.collection(collection);
        
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
    } catch (error) {
        console.error(`❌ Fehler beim Laden aus ${collection}:`, error);
        return { success: false, error: error.message, data: [] };
    }
}

// Daten löschen
async function deleteData(collection, docId) {
    if (!firebaseInitialized || !db) {
        throw new Error('Firebase nicht initialisiert');
    }
    
    if (!isOnline) {
        throw new Error('Keine Internetverbindung');
    }
    
    try {
        await db.collection(collection).doc(docId).delete();
        console.log(`✅ Dokument ${docId} aus ${collection} gelöscht`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Fehler beim Löschen aus ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

// Batch-Operationen für bessere Performance
async function batchUpdate(collection, updates) {
    if (!firebaseInitialized || !db) {
        throw new Error('Firebase nicht initialisiert');
    }
    
    const batch = db.batch();
    
    updates.forEach(({ docId, data }) => {
        const ref = db.collection(collection).doc(docId);
        batch.update(ref, {
            ...data,
            lastModified: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
    
    try {
        await batch.commit();
        console.log(`✅ Batch-Update für ${updates.length} Dokumente in ${collection}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Batch-Update fehlgeschlagen:', error);
        return { success: false, error: error.message };
    }
}

// Datei-Upload
async function uploadFile(file, path) {
    if (!firebaseInitialized || !storage) {
        throw new Error('Firebase Storage nicht initialisiert');
    }
    
    if (!isOnline) {
        throw new Error('Keine Internetverbindung');
    }
    
    try {
        const storageRef = storage.ref().child(path);
        const uploadTask = await storageRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        console.log('📤 Datei hochgeladen:', downloadURL);
        return { success: true, url: downloadURL };
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
        configValid: !!window.FIREBASE_CONFIG
    };
}

// Benutzer erstellen (für Admin)
async function createUser(email, password, userData) {
    if (!firebaseInitialized || !auth) {
        throw new Error('Firebase nicht initialisiert');
    }
    
    try {
        // Benutzer in Firebase Auth erstellen
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Benutzerdaten in Firestore speichern
        await db.collection('users').doc(user.uid).set({
            ...userData,
            email: email,
            created: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Benutzer ${email} erstellt`);
        return { success: true, uid: user.uid };
    } catch (error) {
        console.error('❌ Benutzer konnte nicht erstellt werden:', error);
        return { success: false, error: translateFirebaseError(error) };
    }
}

// Export für Verwendung in anderen Modulen
window.FirebaseClient = {
    initialize: initializeFirebase,
    login: loginUser,
    save: saveData,
    load: loadData,
    delete: deleteData,
    batchUpdate: batchUpdate,
    upload: uploadFile,
    status: getConnectionStatus,
    createUser: createUser
};

// Automatische Initialisierung
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

console.log('🔧 Firebase Client (Online-Only) geladen');
