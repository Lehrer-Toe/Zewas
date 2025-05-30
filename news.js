// News-System
function loadNews() {
    // Admin-Editor anzeigen
    if (currentUser.role === 'admin') {
        document.getElementById('adminNewsEditor').style.display = 'block';
        // Zeitbegrenzung Toggle
        document.getElementById('newsZeitbegrenzt').addEventListener('change', function() {
            document.getElementById('newsAblauf').style.display = this.checked ? 'block' : 'none';
        });
    }
    
    const newsList = document.getElementById('newsList');
    
    // Abgelaufene News filtern und bereits als gelesen markierte entfernen
    const aktuelleNews = news.filter(item => {
        // Entferne gelesen markierte News dauerhaft
        if (item.gelesen === true) {
            return false;
        }
        
        // Prüfe Ablaufdatum
        if (item.ablauf) {
            return new Date(item.ablauf) >= new Date();
        }
        return true;
    });
    
    if (aktuelleNews.length === 0) {
        newsList.innerHTML = '<div class="card"><p>Keine aktuellen News vorhanden.</p></div>';
        return;
    }
    
    let html = '';
    aktuelleNews.forEach((item, index) => {
        html += `<div class="news-item ${item.wichtig ? 'wichtig' : ''}" id="news-${index}">
            <div class="news-gelesen-bereich">
                <label style="font-size: 0.9rem; cursor: pointer;">
                    <input type="checkbox" onchange="newsAlsGelesenMarkieren(${news.indexOf(item)})" style="margin-right: 5px;">
                    Gelesen
                </label>
            </div>
            <strong>${item.titel}</strong><br>
            ${item.text}<br>
            <small>${item.datum} ${item.autor ? '- ' + item.autor : ''}</small>
            ${currentUser.role === 'admin' ? `<button class="btn btn-danger" style="float: right; margin-top: 10px;" onclick="newsLoeschen(${news.indexOf(item)})">Löschen</button>` : ''}
        </div>`;
    });
    newsList.innerHTML = html;
}

function adminNewsErstellen() {
    const titel = document.getElementById('newsTitel').value.trim();
    const text = document.getElementById('newsText').value.trim();
    const wichtig = document.getElementById('newsWichtig').checked;
    const zeitbegrenzt = document.getElementById('newsZeitbegrenzt').checked;
    const ablauf = zeitbegrenzt ? document.getElementById('newsAblauf').value : null;
    
    if (!titel || !text) {
        alert('Bitte füllen Sie Titel und Text aus!');
        return;
    }
    
    addNews(titel, text, wichtig, currentUser.name, ablauf);
    
    // Felder zurücksetzen
    document.getElementById('newsTitel').value = '';
    document.getElementById('newsText').value = '';
    document.getElementById('newsWichtig').checked = false;
    document.getElementById('newsZeitbegrenzt').checked = false;
    document.getElementById('newsAblauf').value = '';
    document.getElementById('newsAblauf').style.display = 'none';
    
    loadNews();
}

function addNews(titel, text, wichtig = false, autor = null, ablauf = null) {
    news.unshift({
        titel,
        text,
        datum: new Date().toLocaleDateString('de-DE'),
        wichtig,
        autor,
        ablauf,
        gelesen: false
    });
}

function newsLoeschen(index) {
    if (confirm('News wirklich löschen?')) {
        news.splice(index, 1);
        loadNews();
    }
}

function newsAlsGelesenMarkieren(index) {
    if (index >= 0 && index < news.length) {
        news[index].gelesen = true;
        // News wird beim nächsten Laden automatisch ausgeblendet
        setTimeout(() => {
            loadNews();
        }, 500); // Kurze Verzögerung für bessere UX
    }
}