// News-System mit Firebase-Integration
async function loadNews() {
    const liste = document.getElementById('newsList');
    if (!liste) return;
    
    // Admin News Editor nur für Admins anzeigen
    const adminEditor = document.getElementById('adminNewsEditor');
    if (adminEditor && currentUser && currentUser.role === 'admin') {
        adminEditor.style.display = 'block';
    }
    
    if (!window.firebaseInitialized) {
        liste.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    if (!news || news.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Nachrichten vorhanden.</p></div>';
        return;
    }
    
    // News nach Datum sortieren (neueste zuerst)
    const sortedNews = [...news].sort((a, b) => {
        const dateA = new Date(a.created || a.datum || '2024-01-01');
        const dateB = new Date(b.created || b.datum || '2024-01-01');
        return dateB - dateA;
    });
    
    let html = '';
    sortedNews.forEach((newsItem, index) => {
        // Prüfe ob News abgelaufen ist
        if (newsItem.ablauf) {
            const ablaufDatum = new Date(newsItem.ablauf);
            if (ablaufDatum < new Date()) {
                return; // Überspringe abgelaufene News
            }
        }
        
        const wichtigClass = newsItem.wichtig ? 'wichtig' : '';
        
        html += `<div class="news-item ${wichtigClass}">
            <div class="news-gelesen-bereich">
                <input type="checkbox" ${newsItem.gelesen ? 'checked' : ''} 
                       onchange="newsGelesenToggle(${index}, this.checked)">
                <label>Gelesen</label>
            </div>
            <h3>${newsItem.titel}</h3>
            <p>${newsItem.text}</p>
            <small>Von: ${newsItem.autor} am ${newsItem.datum}</small>
            ${currentUser && currentUser.role === 'admin' ? 
                `<div style="margin-top: 10px;">
                    <button class="btn btn-sm btn-danger" onclick="newsLoeschen(${index})">Löschen</button>
                </div>` : 
                ''}
        </div>`;
    });
    
    if (!html) {
        html = '<div class="card"><p>Keine aktuellen Nachrichten.</p></div>';
    }
    
    liste.innerHTML = html;
}

function newsGelesenToggle(index, gelesen) {
    if (news[index]) {
        news[index].gelesen = gelesen;
        
        // In Firebase speichern falls verfügbar
        if (window.firebaseInitialized && news[index].id) {
            window.FirebaseClient.save('news', news[index], news[index].id)
                .catch(error => console.warn('News-Status konnte nicht gespeichert werden:', error));
        }
    }
}

async function newsLoeschen(index) {
    if (currentUser.role !== 'admin') {
        alert('Keine Berechtigung');
        return;
    }
    
    if (confirm('Nachricht wirklich löschen?')) {
        const newsItem = news[index];
        
        // Aus Firebase löschen falls verfügbar
        if (window.firebaseInitialized && newsItem.id) {
            try {
                const result = await window.FirebaseClient.delete('news', newsItem.id);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Fehler beim Löschen der News:', error);
                alert('Fehler beim Löschen: ' + error.message);
                return;
            }
        }
        
        // Lokal löschen
        news.splice(index, 1);
        window.news = news;
        loadNews();
    }
}

async function adminNewsErstellen() {
    if (currentUser.role !== 'admin') {
        alert('Keine Berechtigung');
        return;
    }
    
    const titel = document.getElementById('newsTitel').value.trim();
    const text = document.getElementById('newsText').value.trim();
    const wichtig = document.getElementById('newsWichtig').checked;
    const zeitbegrenzt = document.getElementById('newsZeitbegrenzt').checked;
    const ablauf = zeitbegrenzt ? document.getElementById('newsAblauf').value : null;
    
    if (!titel || !text) {
        alert('Bitte füllen Sie Titel und Text aus!');
        return;
    }
    
    if (zeitbegrenzt && !ablauf) {
        alert('Bitte wählen Sie ein Ablaufdatum!');
        return;
    }
    
    try {
        await addNews(titel, text, wichtig, 'Administrator', ablauf);
        
        // Felder zurücksetzen
        document.getElementById('newsTitel').value = '';
        document.getElementById('newsText').value = '';
        document.getElementById('newsWichtig').checked = false;
        document.getElementById('newsZeitbegrenzt').checked = false;
        document.getElementById('newsAblauf').value = '';
        document.getElementById('newsAblauf').style.display = 'none';
        
        loadNews();
    } catch (error) {
        console.error('Fehler beim Erstellen der News:', error);
        alert('Fehler beim Erstellen der Nachricht: ' + error.message);
    }
}

// Event-Listener für zeitbegrenzte News
document.addEventListener('DOMContentLoaded', function() {
    const zeitbegrenztCheckbox = document.getElementById('newsZeitbegrenzt');
    const ablaufInput = document.getElementById('newsAblauf');
    
    if (zeitbegrenztCheckbox && ablaufInput) {
        zeitbegrenztCheckbox.addEventListener('change', function() {
            ablaufInput.style.display = this.checked ? 'inline-block' : 'none';
        });
    }
});

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

console.log('📰 News-System geladen');
