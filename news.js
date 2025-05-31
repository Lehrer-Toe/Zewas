// News-System für "Zeig, was du kannst!"

// News laden und anzeigen
async function loadNews() {
    const liste = document.getElementById('newsList');
    if (!liste) return;
    
    // Admin-Editor anzeigen/verstecken
    const editor = document.getElementById('adminNewsEditor');
    if (editor && currentUser) {
        editor.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
    
    if (!window.firebaseInitialized) {
        liste.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    if (news.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine News vorhanden.</p></div>';
        return;
    }
    
    // News nach Datum sortieren (neueste zuerst)
    const sortedNews = [...news].sort((a, b) => {
        const dateA = new Date(a.created || a.datum);
        const dateB = new Date(b.created || b.datum);
        return dateB - dateA;
    });
    
    let html = '';
    sortedNews.forEach((item, index) => {
        const originalIndex = news.indexOf(item);
        const istAbgelaufen = item.ablauf && new Date(item.ablauf) < new Date();
        const istWichtig = item.wichtig && !istAbgelaufen;
        
        if (!istAbgelaufen) {
            html += `<div class="news-item ${istWichtig ? 'wichtig' : ''}">
                <div class="news-gelesen-bereich">
                    <input type="checkbox" ${item.gelesen ? 'checked' : ''} 
                           onchange="newsAlsGelesenMarkieren(${originalIndex})">
                    <small>Gelesen</small>
                </div>
                <strong>${item.titel}</strong><br>
                ${item.text}<br>
                <small>Datum: ${item.datum} | Von: ${item.autor || 'System'}</small>
                ${item.ablauf ? `<br><small>Gültig bis: ${new Date(item.ablauf).toLocaleDateString('de-DE')}</small>` : ''}
                ${currentUser.role === 'admin' ? 
                    `<button class="btn btn-danger btn-sm" style="margin-top: 10px;" onclick="newsLoeschen(${originalIndex})">Löschen</button>` : 
                    ''}
            </div>`;
        }
    });
    
    liste.innerHTML = html || '<div class="card"><p>Keine aktuellen News vorhanden.</p></div>';
}

// News als gelesen markieren
async function newsAlsGelesenMarkieren(index) {
    if (!window.firebaseInitialized) return;
    
    news[index].gelesen = !news[index].gelesen;
    
    // In Firebase speichern falls ID vorhanden
    if (news[index].id) {
        try {
            await window.FirebaseClient.save('news', news[index], news[index].id);
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der News:', error);
        }
    }
}

// Admin: News erstellen
async function adminNewsErstellen() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const titel = document.getElementById('newsTitel').value.trim();
    const text = document.getElementById('newsText').value.trim();
    const wichtig = document.getElementById('newsWichtig').checked;
    const zeitbegrenzt = document.getElementById('newsZeitbegrenzt').checked;
    const ablauf = zeitbegrenzt ? document.getElementById('newsAblauf').value : null;
    
    if (!titel || !text) {
        alert('Bitte Titel und Text eingeben!');
        return;
    }
    
    try {
        await addNews(titel, text, wichtig, currentUser.name, ablauf);
        
        // Felder zurücksetzen
        document.getElementById('newsTitel').value = '';
        document.getElementById('newsText').value = '';
        document.getElementById('newsWichtig').checked = false;
        document.getElementById('newsZeitbegrenzt').checked = false;
        document.getElementById('newsAblauf').value = '';
        document.getElementById('newsAblauf').style.display = 'none';
        
        loadNews();
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der News:', error);
        alert('Fehler beim Erstellen der Nachricht.');
    }
}

// Admin: News löschen
async function newsLoeschen(index) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (confirm('News wirklich löschen?')) {
        try {
            const newsItem = news[index];
            
            // Aus Firebase löschen falls ID vorhanden
            if (newsItem.id) {
                await window.FirebaseClient.delete('news', newsItem.id);
            }
            
            // Aus lokalem Array entfernen
            news.splice(index, 1);
            loadNews();
        } catch (error) {
            console.error('❌ Fehler beim Löschen der News:', error);
            alert('Fehler beim Löschen der Nachricht.');
        }
    }
}

// Event-Handler für Zeitbegrenzung
document.addEventListener('DOMContentLoaded', function() {
    const zeitbegrenztCheckbox = document.getElementById('newsZeitbegrenzt');
    const ablaufInput = document.getElementById('newsAblauf');
    
    if (zeitbegrenztCheckbox && ablaufInput) {
        zeitbegrenztCheckbox.addEventListener('change', function() {
            ablaufInput.style.display = this.checked ? 'block' : 'none';
            if (this.checked && !ablaufInput.value) {
                // Standardmäßig 7 Tage in der Zukunft
                const date = new Date();
                date.setDate(date.getDate() + 7);
                ablaufInput.value = date.toISOString().split('T')[0];
            }
        });
    }
});

console.log('📰 News-System geladen');
