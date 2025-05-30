// App-Initialisierung - ONLINE-ONLY MODUS
function initializeApp() {
    console.log('🚀 Initialisiere App im Online-Modus...');
    
    try {
        // Warte auf Firebase - App startet erst, wenn Firebase bereit ist
        if (window.firebaseInitialized) {
            console.log('🔥 Firebase bereits initialisiert - bereit für Login');
            // KEINE automatische Datenladung - nur bei Login
        } else {
            console.log('⏳ Warte auf Firebase-Initialisierung...');
            // Event-Listener für Firebase
            window.addEventListener('firebaseReady', () => {
                console.log('🔥 Firebase ready - bereit für Login');
                // KEINE automatische Datenladung - nur bei Login
            });
            
            // Timeout für Firebase-Initialisierung
            setTimeout(() => {
                if (!window.firebaseInitialized) {
                    console.error('❌ Firebase konnte nicht initialisiert werden');
                    showFirebaseError('Firebase konnte nicht initialisiert werden. Bitte überprüfen Sie Ihre Internetverbindung und laden Sie die Seite neu.');
                }
            }, 10000); // 10 Sekunden Timeout
        }
    } catch (error) {
        console.error('❌ Fehler bei App-Initialisierung:', error);
        showFirebaseError('Ein Fehler ist aufgetreten. Bitte laden Sie die Seite neu.');
    }
}

// Firebase-Fehler anzeigen
function showFirebaseError(message) {
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

// Initialisiere Inhalte für alle Tabs - wird nach Login aufgerufen
function loadTabInhalte() {
    loadNews();
    loadThemen();
    
    // Tab-spezifische Inhalte nur laden, wenn Tab aktiv ist
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabId = activeTab.id;
        
        if (tabId === 'gruppen') loadGruppen();
        if (tabId === 'lehrer') loadLehrer();
        if (tabId === 'daten') loadDatenverwaltung();
        if (tabId === 'bewerten') loadBewertungen();
        if (tabId === 'vorlagen') loadVorlagen();
        if (tabId === 'uebersicht') loadUebersicht();
        if (tabId === 'adminvorlagen') loadAdminVorlagen();
    }
}
