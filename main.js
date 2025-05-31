// News-Funktion mit Firebase-Integration
async function addNews(titel, text, wichtig = false, autor = null, ablauf = null) {
    const newsItem = {
        titel,
        text,
        datum: new Date().toLocaleDateString('de-DE'),
        wichtig,
        autor: autor || currentUser?.name || 'System',
        ablauf,
        gelesen: false,
        created: new Date().toISOString()
    };
    
    // Lokalen Zustand aktualisieren
    news.unshift(newsItem);
    
    // In Firebase speichern falls verfügbar
    if (window.firebaseInitialized) {
        try {
            const result = await window.FirebaseClient.save('news', newsItem);
            if (result.success) {
                newsItem.id = result.id;
            } else {
                console.warn('⚠️ Fehler beim Speichern der News:', result.error);
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der News:', error);
        }
    }
    
    return newsItem;
}

// Globale currentUser für andere Module verfügbar machen
window.getCurrentUser = () => currentUser;

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM geladen - starte App-Initialisierung');
});

// Auch beim window.load Event sicherheitshalber
window.addEventListener('load', function() {
    if (!window.appInitialized) {
        console.log('🔄 Backup-Initialisierung gestartet');
        initializeApp();
        window.appInitialized = true;
    }
});

console.log('🚀 Main.js (Online-Only Modus) geladen und bereit');

// Export-Funktionen
async function meineSchuelerExportieren() {
    alert('Export-Funktion wird implementiert...');
    
    // Hier würde eine PDF/Excel Export-Funktion implementiert werden
    // Diese würde die Firebase-Daten verwenden
}

function druckansichtÖffnen() {
    window.print();
}

function generatePDF(schuelerId) {
    // Diese Funktion wird in pdf.js behandelt
    if (typeof createPDF === 'function') {
        createPDF(schuelerId);
    } else {
        alert('PDF-System wird geladen...');
    }
}

// Datenverwaltung
function loadDatenverwaltung() {
    if (!document.getElementById('schuljahr')) return;
    
    document.getElementById('schuljahr').value = schuljahr || '';
    
    const statistiken = document.getElementById('statistiken');
    if (!statistiken) return;
    
    if (!window.firebaseInitialized) {
        statistiken.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    statistiken.innerHTML = `
        <div class="statistik-card">
            <strong>Schuljahr:</strong> ${schuljahr || '(nicht gesetzt)'}<br>
            <strong>Anzahl Gruppen:</strong> ${gruppen.length}<br>
            <strong>Anzahl Bewertungen:</strong> ${bewertungen.length}<br>
            <strong>Anzahl Lehrer:</strong> ${users.filter(u => u.role === 'lehrer').length}<br>
            <strong>Firebase Status:</strong> ${window.firebaseInitialized ? 'Verbunden' : 'Nicht verbunden'}<br>
            <strong>Datenbank:</strong> ${window.firebaseInitialized ? (window.FirebaseClient.status().configValid ? 'Firebase' : 'Lokal') : 'Lokal'}
        </div>
    `;
}

async function schuljahrSpeichern() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const neuesSchuljahr = document.getElementById('schuljahr').value.trim();
    if (!neuesSchuljahr) {
        alert('Bitte geben Sie ein Schuljahr ein.');
        return;
    }
    
    try {
        // UI blockieren während des Speichervorgangs
        const saveButton = document.querySelector('button[onclick="schuljahrSpeichern()"]');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Speichern...';
        
        // Lokalen Zustand aktualisieren
        schuljahr = neuesSchuljahr;
        window.schuljahr = neuesSchuljahr;
        
        // Firebase speichern
        const settings = {
            schuljahr: window.schuljahr,
            lastUpdate: new Date().toISOString()
        };
        
        const result = await window.FirebaseClient.save('settings', settings, 'app-settings');
        
        if (result.success) {
            await addNews('Schuljahr geändert', `Das Schuljahr wurde auf ${schuljahr} gesetzt.`);
            loadDatenverwaltung();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
        
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Schuljahrs:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

function datenExportieren(typ) {
    alert(`Export von ${typ} wird implementiert...`);
    
    // Hier würde eine Export-Funktion implementiert werden
    // Diese würde die Firebase-Daten verwenden
}

async function datenLoeschen(typ) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const nachricht = {
        'bewertungen': 'Alle Bewertungen',
        'gruppen': 'Alle Gruppen',
        'news': 'Alle News',
        'alle': 'ALLE DATEN'
    };
    
    if (confirm(`Wirklich ${nachricht[typ]} löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
        if (typ === 'alle' && !confirm('ACHTUNG: Diese Aktion löscht ALLE Daten! Sind Sie wirklich sicher?')) {
            return;
        }
        
        try {
            // UI-Feedback
            const button = document.querySelector(`button[onclick="datenLoeschen('${typ}')"]`);
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Löschen...';
            
            switch(typ) {
                case 'bewertungen':
                    // Alle Bewertungen löschen
                    for (const bewertung of bewertungen) {
                        if (bewertung.id) {
                            await window.FirebaseClient.delete('bewertungen', bewertung.id);
                        }
                    }
                    bewertungen = [];
                    window.bewertungen = [];
                    break;
                    
                case 'gruppen':
                    // Alle Gruppen löschen
                    for (const gruppe of gruppen) {
                        if (gruppe.id) {
                            await window.FirebaseClient.delete('gruppen', gruppe.id);
                        }
                    }
                    gruppen = [];
                    window.gruppen = [];
                    break;
                    
                case 'news':
                    // Alle News löschen
                    for (const newsItem of news) {
                        if (newsItem.id) {
                            await window.FirebaseClient.delete('news', newsItem.id);
                        }
                    }
                    news = [];
                    window.news = [];
                    break;
                    
                case 'alle':
                    // Vorsichtshalber Sammlungen einzeln löschen
                    for (const bewertung of bewertungen) {
                        if (bewertung.id) {
                            await window.FirebaseClient.delete('bewertungen', bewertung.id);
                        }
                    }
                    
                    for (const gruppe of gruppen) {
                        if (gruppe.id) {
                            await window.FirebaseClient.delete('gruppen', gruppe.id);
                        }
                    }
                    
                    for (const newsItem of news) {
                        if (newsItem.id) {
                            await window.FirebaseClient.delete('news', newsItem.id);
                        }
                    }
                    
                    // Themen auf Standardthemen zurücksetzen
                    themen = [
                        { name: 'Klimawandel', ersteller: 'System', faecher: ['BIO', 'G'] },
                        { name: 'Digitalisierung', ersteller: 'System', faecher: ['IT', 'ALL'] },
                        { name: 'Nachhaltigkeit', ersteller: 'System', faecher: ['BIO', 'G', 'WBS'] }
                    ];
                    
                    // Standardthemen speichern
                    for (const thema of themen) {
                        await window.FirebaseClient.save('themen', thema);
                    }
                    
                    // Lokale Variablen aktualisieren
                    bewertungen = [];
                    gruppen = [];
                    news = [];
                    window.bewertungen = [];
                    window.gruppen = [];
                    window.news = [];
                    window.themen = themen;
                    break;
            }
            
            await addNews('Daten gelöscht', `${nachricht[typ]} wurden gelöscht.`, true);
            loadDatenverwaltung();
            
            // UI wiederherstellen
            button.disabled = false;
            button.textContent = originalText;
            
        } catch (error) {
            console.error(`❌ Fehler beim Löschen von ${typ}:`, error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

// Übersicht-Tab mit Filter
let uebersichtFilter = {
    sortierung: 'name-az',
    status: 'alle'
};

function loadUebersicht() {
    loadLehrerStatistiken();
    loadMeineSchueler();
}

function loadLehrerStatistiken() {
    const statistikDiv = document.getElementById('lehrerStatistiken');
    if (!statistikDiv) return;
    
    if (!window.firebaseInitialized) {
        statistikDiv.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    // Sammle Statistiken für den aktuellen Lehrer
    const meineSchueler = [];
    gruppen.forEach(gruppe => {
        gruppe.schueler.forEach(schueler => {
            if (schueler.lehrer === currentUser.name) {
                meineSchueler.push({
                    name: schueler.name,
                    thema: gruppe.thema,
                    schuelerId: `${gruppe.id}-${schueler.name.replace(/\s/g, '-')}`
                });
            }
        });
    });
    
    const bewertet = meineSchueler.filter(s => 
        bewertungen.find(b => b.schuelerId === s.schuelerId)
    ).length;
    
    const nichtBewertet = meineSchueler.length - bewertet;
    
    statistikDiv.innerHTML = `
        <div class="statistik-card">
            <strong>Gesamtzahl Schüler:</strong> ${meineSchueler.length}<br>
            <strong>Bewertet:</strong> ${bewertet}<br>
            <strong>Noch nicht bewertet:</strong> ${nichtBewertet}<br>
            <strong>Schuljahr:</strong> ${schuljahr || '(nicht gesetzt)'}
        </div>
    `;
}

function loadMeineSchueler() {
    const liste = document.getElementById('meineSchuelerListe');
    if (!liste) return;
    
    if (!window.firebaseInitialized) {
        liste.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    // Sammle alle Schüler des aktuellen Lehrers mit Bewertungen
    let meineSchueler = [];
    gruppen.forEach(gruppe => {
        gruppe.schueler.forEach(schueler => {
            if (schueler.lehrer === currentUser.name) {
                const schuelerId = `${gruppe.id}-${schueler.name.replace(/\s/g, '-')}`;
                const bewertung = bewertungen.find(b => b.schuelerId === schuelerId);
                meineSchueler.push({
                    name: schueler.name,
                    thema: gruppe.thema,
                    bewertung: bewertung,
                    schuelerId: schuelerId,
                    fach: schueler.fach,
                    datum: bewertung ? bewertung.datum : null,
                    note: bewertung ? bewertung.endnote : null
                });
            }
        });
    });
    
    // Filter anwenden
    meineSchueler = filterMeineSchueler(meineSchueler);
    
    if (meineSchueler.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Schüler gefunden.</p></div>';
        return;
    }
    
    let html = '';
    meineSchueler.forEach(schueler => {
        const fachInfo = schueler.fach ? ` (${getFachNameFromGlobal(schueler.fach)})` : '';
        html += `<div class="liste-item">
            <div>
                <strong>${schueler.name}</strong>${fachInfo}<br>
                Thema: ${schueler.thema}<br>
                ${schueler.bewertung ? 
                    `Note: ${schueler.bewertung.endnote} (${schueler.bewertung.datum})` : 
                    '<span style="color: #e74c3c;">Noch nicht bewertet</span>'}
            </div>
            ${schueler.bewertung ? 
                `<button class="btn pdf-btn-enabled" onclick="generatePDF('${schueler.schuelerId}')">PDF</button>` : 
                ''}
        </div>`;
    });
    
    liste.innerHTML = html;
}

function filterMeineSchueler(schueler) {
    // Status-Filter
    if (uebersichtFilter.status === 'bewertet') {
        schueler = schueler.filter(s => s.bewertung);
    } else if (uebersichtFilter.status === 'nicht-bewertet') {
        schueler = schueler.filter(s => !s.bewertung);
    }
    
    // Sortierung
    switch (uebersichtFilter.sortierung) {
        case 'name-az':
            schueler.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-za':
            schueler.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'note-auf':
            schueler.sort((a, b) => {
                if (!a.note && !b.note) return 0;
                if (!a.note) return 1;
                if (!b.note) return -1;
                return a.note - b.note;
            });
            break;
        case 'note-ab':
            schueler.sort((a, b) => {
                if (!a.note && !b.note) return 0;
                if (!a.note) return 1;
                if (!b.note) return -1;
                return b.note - a.note;
            });
            break;
        case 'datum':
            schueler.sort((a, b) => {
                if (!a.datum && !b.datum) return 0;
                if (!a.datum) return 1;
                if (!b.datum) return -1;
                return new Date(a.datum.split('.').reverse().join('-')) - new Date(b.datum.split('.').reverse().join('-'));
            });
            break;
    }
    
    return schueler;
}

function updateUebersichtFilter(typ, wert) {
    uebersichtFilter[typ] = wert;
    loadMeineSchueler();
}

// Admin-Vorlagen (umbenannt von Briefvorlagen)
function loadAdminVorlagen() {
    if (currentUser.role !== 'admin') {
        document.getElementById('adminvorlagen').innerHTML = '<div class="card"><p>Keine Berechtigung.</p></div>';
        return;
    }
    
    loadStaerkenFormulierungen();
    loadBriefvorlageEditor();
    loadFaecherVerwaltung();
    loadCheckpointsVerwaltung();
}

function loadStaerkenFormulierungen() {
    const container = document.getElementById('staerkenFormulierungen');
    if (!container) return;
    
    if (!window.firebaseInitialized) {
        container.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    const icons = {
        'Fachliches Arbeiten': '🧠',
        'Zusammenarbeit': '🤝',
        'Kommunikation': '🗣️',
        'Eigenständigkeit': '🎯',
        'Reflexionsfähigkeit': '🔁',
        'Persönlichkeitsentwicklung': '🌱'
    };
    
    let html = '';
    Object.keys(bewertungsCheckpoints).forEach(kategorie => {
        html += `
            <div class="staerken-formulierung">
                <h4>${icons[kategorie]} ${kategorie}</h4>
        `;
        
        bewertungsCheckpoints[kategorie].forEach((text, index) => {
            const key = `${kategorie}_${index}`;
            const formulierung = staerkenFormulierungen[key] || text;
            
            html += `
                <div class="formulierung-item">
                    <label>${text}:</label>
                    <input type="text" value="${formulierung}" 
                           onchange="updateStaerkenFormulierung('${key}', this.value)"
                           placeholder="Formulierung für PDF-Brief">
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function loadBriefvorlageEditor() {
    if (!briefvorlage) {
        console.warn('⚠️ Briefvorlage noch nicht geladen');
        return;
    }
    
    document.getElementById('briefAnrede').value = briefvorlage.anrede || '';
    document.getElementById('briefSchluss').value = briefvorlage.schluss || '';
}

function updateStaerkenFormulierung(key, value) {
    staerkenFormulierungen[key] = value;
    window.staerkenFormulierungen[key] = value;
}

async function staerkenFormulierungenSpeichern() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    try {
        // UI blockieren während des Speichervorgangs
        const saveButton = document.querySelector('button[onclick="staerkenFormulierungenSpeichern()"]');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Speichern...';
        
        // Firebase speichern
        const result = await window.FirebaseClient.save('briefvorlagen', window.staerkenFormulierungen, 'staerken-formulierungen');
        
        if (result.success) {
            await addNews('Vorlagen aktualisiert', 'Die Standardformulierungen wurden gespeichert.', false, 'Administrator');
            alert('Formulierungen gespeichert!');
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
        
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Formulierungen:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

async function briefvorlageSpeichern() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    try {
        // UI blockieren während des Speichervorgangs
        const saveButton = document.querySelector('button[onclick="briefvorlageSpeichern()"]');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Speichern...';
        
        // Lokalen Zustand aktualisieren
        briefvorlage.anrede = document.getElementById('briefAnrede').value;
        briefvorlage.schluss = document.getElementById('briefSchluss').value;
        briefvorlage.lastUpdated = new Date().toISOString();
        
        window.briefvorlage = briefvorlage;
        
        // Firebase speichern
        const result = await window.FirebaseClient.save('briefvorlagen', window.briefvorlage, 'standard-vorlage');
        
        if (result.success) {
            await addNews('Briefvorlage aktualisiert', 'Die Briefvorlage wurde angepasst.', false, 'Administrator');
            alert('Briefvorlage gespeichert!');
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
        
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Briefvorlage:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

// Admin-Funktionen für Bewertungs-Checkpoints
function loadCheckpointsVerwaltung() {
    if (currentUser.role !== 'admin') return;
    
    const container = document.getElementById('checkpointsVerwaltung');
    if (!container) return;
    
    if (!window.firebaseInitialized) {
        container.innerHTML = '<h3>Bewertungs-Checkpoints verwalten</h3><div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    let html = '<h3>Bewertungs-Checkpoints verwalten</h3>';
    
    Object.entries(bewertungsCheckpoints).forEach(([kategorie, checkpoints]) => {
        html += `
            <div class="checkpoint-kategorie">
                <h4>${kategorie}</h4>
                <div class="checkpoints-liste">
        `;
        
        checkpoints.forEach((checkpoint, index) => {
            html += `
                <div class="checkpoint-item">
                    <input type="text" value="${checkpoint}" 
                           onchange="updateCheckpoint('${kategorie}', ${index}, this.value)">
                    <button class="btn btn-danger btn-sm" 
                            onclick="checkpointLoeschen('${kategorie}', ${index})">Löschen</button>
                </div>
            `;
        });
        
        html += `
                    <button class="btn btn-success btn-sm" 
                            onclick="neuerCheckpoint('${kategorie}')">Checkpoint hinzufügen</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function updateCheckpoint(kategorie, index, neuerText) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    try {
        // Lokalen Zustand aktualisieren
        bewertungsCheckpoints[kategorie][index] = neuerText;
        window.bewertungsCheckpoints[kategorie][index] = neuerText;
        
        // Auch Stärkenformulierungen aktualisieren
        const key = `${kategorie}_${index}`;
        if (staerkenFormulierungen[key]) {
            staerkenFormulierungen[key] = neuerText;
            window.staerkenFormulierungen[key] = neuerText;
        }
        
        // Firebase speichern
        const checkpointsResult = await window.FirebaseClient.save('checkpoints', window.bewertungsCheckpoints, 'bewertungs-checkpoints');
        
        if (staerkenFormulierungen[key]) {
            await window.FirebaseClient.save('briefvorlagen', window.staerkenFormulierungen, 'staerken-formulierungen');
        }
        
        if (!checkpointsResult.success) {
            throw new Error(checkpointsResult.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Checkpoints:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

async function checkpointLoeschen(kategorie, index) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (confirm('Checkpoint wirklich löschen?')) {
        try {
            // Lokalen Zustand aktualisieren
            bewertungsCheckpoints[kategorie].splice(index, 1);
            window.bewertungsCheckpoints[kategorie].splice(index, 1);
            
            // Firebase speichern
            const result = await window.FirebaseClient.save('checkpoints', window.bewertungsCheckpoints, 'bewertungs-checkpoints');
            
            if (result.success) {
                // Auch die Stärkenformulierungen anpassen
                // Schlüssel neu zuordnen (alle nachfolgenden Indizes verschieben)
                const updatedFormulierungen = {};
                Object.keys(staerkenFormulierungen).forEach(key => {
                    const [kat, idx] = key.split('_');
                    const numIdx = parseInt(idx);
                    
                    if (kat === kategorie) {
                        if (numIdx < index) {
                            updatedFormulierungen[key] = staerkenFormulierungen[key];
                        } else if (numIdx > index) {
                            updatedFormulierungen[`${kat}_${numIdx-1}`] = staerkenFormulierungen[key];
                        }
                        // Der gelöschte Index wird nicht übernommen
                    } else {
                        updatedFormulierungen[key] = staerkenFormulierungen[key];
                    }
                });
                
                // Staerkenformulierungen aktualisieren
                window.staerkenFormulierungen = updatedFormulierungen;
                staerkenFormulierungen = updatedFormulierungen;
                
                await window.FirebaseClient.save('briefvorlagen', window.staerkenFormulierungen, 'staerken-formulierungen');
                
                loadCheckpointsVerwaltung();
            } else {
                throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
            }
        } catch (error) {
            console.error('❌ Fehler beim Löschen des Checkpoints:', error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

async function neuerCheckpoint(kategorie) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const text = prompt(`Neuer Checkpoint für ${kategorie}:`);
    if (text && text.trim()) {
        try {
            // Lokalen Zustand aktualisieren
            bewertungsCheckpoints[kategorie].push(text.trim());
            window.bewertungsCheckpoints[kategorie].push(text.trim());
            
            // Stärkenformulierung hinzufügen
            const index = bewertungsCheckpoints[kategorie].length - 1;
            const key = `${kategorie}_${index}`;
            staerkenFormulierungen[key] = text.trim();
            window.staerkenFormulierungen[key] = text.trim();
            
            // Firebase speichern
            const checkpointsResult = await window.FirebaseClient.save('checkpoints', window.bewertungsCheckpoints, 'bewertungs-checkpoints');
            const formulierungenResult = await window.FirebaseClient.save('briefvorlagen', window.staerkenFormulierungen, 'staerken-formulierungen');
            
            if (checkpointsResult.success && formulierungenResult.success) {
                loadCheckpointsVerwaltung();
            } else {
                throw new Error((checkpointsResult.error || formulierungenResult.error) || 'Unbekannter Fehler beim Speichern');
            }
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen des Checkpoints:', error);
            alert(`Fehler beim Speichern: ${error.message}`);
        }
    }
}

// Admin-Funktionen für Fächer
function loadFaecherVerwaltung() {
    if (currentUser.role !== 'admin') return;
    
    const container = document.getElementById('faecherVerwaltung');
    if (!container) return;
    
    if (!window.firebaseInitialized) {
        container.innerHTML = '<h3>Fächer verwalten</h3><div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    let html = '<h3>Fächer verwalten</h3>';
    
    Object.entries(alleFaecherGlobal).forEach(([kuerzel, name]) => {
        html += `
            <div class="fach-item">
                <input type="text" value="${name}" id="fach-${kuerzel}" onchange="updateFachName('${kuerzel}', this.value)">
                <span class="fach-kuerzel">(${kuerzel})</span>
                <button class="btn btn-danger btn-sm" onclick="fachLoeschen('${kuerzel}')">Löschen</button>
            </div>
        `;
    });
    
    html += `
        <div class="neues-fach">
            <h4>Neues Fach hinzufügen</h4>
            <input type="text" id="neuesFachKuerzel" placeholder="Kürzel (z.B. CHE)" maxlength="4">
            <input type="text" id="neuesFachName" placeholder="Fachname (z.B. Chemie)">
            <button class="btn btn-success" onclick="neuesFachHinzufuegen()">Hinzufügen</button>
        </div>
    `;
    
    container.innerHTML = html;
}

async function updateFachName(kuerzel, neuerName) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    try {
        // Lokalen Zustand aktualisieren
        alleFaecherGlobal[kuerzel] = neuerName;
        window.alleFaecherGlobal[kuerzel] = neuerName;
        
        // Firebase speichern
        const settings = {
            alleFaecherGlobal: window.alleFaecherGlobal,
            lastUpdate: new Date().toISOString()
        };
        
        const result = await window.FirebaseClient.save('settings', settings, 'app-settings');
        
        if (result.success) {
            await addNews('Fach umbenannt', `Fach ${kuerzel} wurde in "${neuerName}" umbenannt.`, false, 'Administrator');
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Fachs:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

async function fachLoeschen(kuerzel) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (confirm(`Fach "${alleFaecherGlobal[kuerzel]}" wirklich löschen?`)) {
        try {
            // Prüfen, ob das Fach in Gruppen verwendet wird
            const verwendetInGruppen = gruppen.some(gruppe => 
                gruppe.schueler.some(schueler => schueler.fach === kuerzel)
            );
            
            if (verwendetInGruppen) {
                if (!confirm(`Fach ${kuerzel} wird in mindestens einer Gruppe verwendet. Wirklich löschen?`)) {
                    return;
                }
            }
            
            // Lokalen Zustand aktualisieren
            delete alleFaecherGlobal[kuerzel];
            delete window.alleFaecherGlobal[kuerzel];
            
            // Firebase speichern
            const settings = {
                alleFaecherGlobal: window.alleFaecherGlobal,
                lastUpdate: new Date().toISOString()
            };
            
            const result = await window.FirebaseClient.save('settings', settings, 'app-settings');
            
            if (result.success) {
                await addNews('Fach gelöscht', `Fach ${kuerzel} wurde entfernt.`, false, 'Administrator');
                loadFaecherVerwaltung();
            } else {
                throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
            }
        } catch (error) {
            console.error('❌ Fehler beim Löschen des Fachs:', error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

async function neuesFachHinzufuegen() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const kuerzel = document.getElementById('neuesFachKuerzel').value.trim().toUpperCase();
    const name = document.getElementById('neuesFachName').value.trim();
    
    if (!kuerzel || !name) {
        alert('Bitte füllen Sie beide Felder aus!');
        return;
    }
    
    if (alleFaecherGlobal[kuerzel]) {
        alert('Fach-Kürzel existiert bereits!');
        return;
    }
    
    try {
        // Lokalen Zustand aktualisieren
        alleFaecherGlobal[kuerzel] = name;
        window.alleFaecherGlobal[kuerzel] = name;
        
        // Firebase speichern
        const settings = {
            alleFaecherGlobal: window.alleFaecherGlobal,
            lastUpdate: new Date().toISOString()
        };
        
        const result = await window.FirebaseClient.save('settings', settings, 'app-settings');
        
        if (result.success) {
            document.getElementById('neuesFachKuerzel').value = '';
            document.getElementById('neuesFachName').value = '';
            
            await addNews('Neues Fach', `Fach "${name}" (${kuerzel}) wurde hinzugefügt.`, false, 'Administrator');
            loadFaecherVerwaltung();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Fachs:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

// Lehrer-Verwaltung (erweitert)
function loadLehrer() {
    const liste = document.getElementById('lehrerListe');
    if (!liste) return;
    
    if (!window.firebaseInitialized) {
        liste.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    const lehrer = users.filter(u => u.role === 'lehrer');
    
    if (lehrer.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Lehrer vorhanden.</p></div>';
        return;
    }
    
    let html = '';
    lehrer.forEach((teacher) => {
        html += `<div class="liste-item">
            <div>
                <strong>${teacher.name}</strong><br>
                E-Mail: ${teacher.email}<br>
            </div>
            <div>
                <button class="btn" onclick="lehrerBearbeiten('${teacher.id}')">Bearbeiten</button>
                <button class="btn btn-danger" onclick="lehrerLoeschen('${teacher.id}')">Löschen</button>
            </div>
        </div>`;
    });
    liste.innerHTML = html;
}

async function lehrerHinzufuegen() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const name = document.getElementById('lehrerName').value.trim();
    const email = document.getElementById('lehrerEmail').value.trim();
    const password = document.getElementById('lehrerPasswort').value.trim();
    
    if (!name || !email || !password) {
        alert('Bitte füllen Sie alle Felder aus!');
        return;
    }
    
    if (users.find(u => u.email === email)) {
        alert('Ein Nutzer mit dieser E-Mail existiert bereits!');
        return;
    }
    
    // UI blockieren während des Speichervorgangs
    const createButton = document.querySelector('button[onclick="lehrerHinzufuegen()"]');
    const originalText = createButton.textContent;
    createButton.disabled = true;
    createButton.textContent = 'Erstelle Benutzer...';
    
    try {
        // Neuen Benutzer in Firebase Auth und Firestore erstellen
        const userData = {
            name,
            email,
            role: 'lehrer',
            created: new Date().toISOString()
        };
        
        const result = await window.FirebaseClient.createUser(email, password, userData);
        
        if (result.success) {
            // Felder zurücksetzen
            document.getElementById('lehrerName').value = '';
            document.getElementById('lehrerEmail').value = '';
            document.getElementById('lehrerPasswort').value = 'lehrer123';
            
            if (result.requiresRelogin) {
                // Der Admin muss sich wieder anmelden
                alert(`Lehrer ${name} wurde erfolgreich erstellt. Sie werden zur Anmeldung weitergeleitet.`);
                // Die Seite wird automatisch neu geladen
                return;
            } else {
                // Lokalen Zustand aktualisieren (nur wenn kein Reload erforderlich)
                const neuerLehrer = {
                    ...userData,
                    id: result.uid
                };
                
                users.push(neuerLehrer);
                
                loadLehrer();
                loadSchuelerLehrerAuswahl();
                await addNews('Neuer Lehrer', `${name} wurde als Lehrer angelegt.`);
            }
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Erstellen des Benutzers');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Lehrers:', error);
        alert(`Fehler beim Erstellen: ${error.message}`);
    } finally {
        // UI entsperren (nur wenn die Seite nicht neu geladen wird)
        if (createButton.textContent === 'Erstelle Benutzer...') {
            createButton.disabled = false;
            createButton.textContent = originalText;
        }
    }
}

function lehrerBearbeiten(lehrerId) {
    const lehrer = users.find(u => u.id === lehrerId);
    if (!lehrer) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Lehrer bearbeiten</h3>
            <div class="input-group">
                <label>Name:</label>
                <input type="text" id="editLehrerName" value="${lehrer.name}">
            </div>
            <div class="input-group">
                <label>E-Mail:</label>
                <input type="email" id="editLehrerEmail" value="${lehrer.email}" disabled>
                <small style="width: 100%; color: #666;">Die E-Mail-Adresse kann nicht geändert werden</small>
            </div>
            <div class="input-group">
                <label>Passwort zurücksetzen:</label>
                <input type="text" id="editLehrerPasswort" placeholder="Neues Passwort (leer lassen für keine Änderung)">
            </div>
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="lehrerSpeichern('${lehrerId}')">Speichern</button>
                <button class="btn btn-danger" onclick="this.closest('.modal').remove()">Abbrechen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function lehrerSpeichern(lehrerId) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const name = document.getElementById('editLehrerName').value.trim();
    const password = document.getElementById('editLehrerPasswort').value.trim();
    
    if (!name) {
        alert('Bitte geben Sie einen Namen ein!');
        return;
    }
    
    // UI blockieren während des Speichervorgangs
    const saveButton = document.querySelector('.modal-buttons .btn-success');
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Speichern...';
    
    try {
        const lehrerIndex = users.findIndex(u => u.id === lehrerId);
        if (lehrerIndex === -1) {
            throw new Error('Lehrer nicht gefunden');
        }
        
        // Lehrer-Daten aktualisieren
        const aktualisierterLehrer = {
            ...users[lehrerIndex],
            name,
            lastModified: new Date().toISOString()
        };
        
        // Daten in Firebase speichern
        const updateData = { name };
        if (password) {
            updateData.password = password; // Nur in der Firestore-Datenbank, nicht in Auth
        }
        
        const result = await window.FirebaseClient.save('users', aktualisierterLehrer, lehrerId);
        
        if (result.success) {
            // Lokalen Zustand aktualisieren
            users[lehrerIndex] = aktualisierterLehrer;
            
            await addNews('Lehrer aktualisiert', `Daten von ${name} wurden geändert.`);
            document.querySelector('.modal').remove();
            loadLehrer();
            loadSchuelerLehrerAuswahl();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Lehrers:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

async function lehrerLoeschen(lehrerId) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (confirm('Lehrer wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) {
        try {
            const lehrer = users.find(u => u.id === lehrerId);
            if (!lehrer) {
                alert('Lehrer nicht gefunden');
                return;
            }
            
            // Prüfen, ob der Lehrer in Gruppen verwendet wird
            const verwendetInGruppen = gruppen.some(gruppe => 
                gruppe.schueler.some(schueler => schueler.lehrer === lehrer.name)
            );
            
            if (verwendetInGruppen) {
                if (!confirm(`Lehrer ${lehrer.name} wird in mindestens einer Gruppe verwendet. Wirklich löschen?`)) {
                    return;
                }
            }
            
            // Firebase löschen
            const result = await window.FirebaseClient.delete('users', lehrerId);
            
            if (result.success) {
                const name = lehrer.name;
                
                // Lokalen Zustand aktualisieren
                const index = users.findIndex(u => u.id === lehrerId);
                if (index > -1) {
                    users.splice(index, 1);
                }
                
                await addNews('Lehrer gelöscht', `${name} wurde entfernt.`);
                loadLehrer();
                loadSchuelerLehrerAuswahl();
            } else {
                throw new Error(result.error || 'Unbekannter Fehler beim Löschen');
            }
        } catch (error) {
            console.error('❌ Fehler beim Löschen des Lehrers:', error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

function schuelerHinzufuegen() {
    const container = document.getElementById('schuelerListe');
    const newRow = document.createElement('div');
    newRow.className = 'input-group schueler-row';
    
    const lehrerOptions = users.filter(u => u.role === 'lehrer')
        .map(lehrer => `<option value="${lehrer.name}">${lehrer.name}</option>`)
        .join('');
    
    const fachOptions = Object.entries(alleFaecherGlobal)
        .map(([kuerzel, name]) => `<option value="${kuerzel}">${name}</option>`)
        .join('');
    
    newRow.innerHTML = `
        <input type="text" placeholder="Schülername" class="schueler-name">
        <select class="schueler-lehrer">
            <option value="">Lehrer wählen...</option>
            ${lehrerOptions}
        </select>
        <select class="schueler-fach">
            <option value="">Fach wählen...</option>
            ${fachOptions}
        </select>
        <button type="button" class="btn btn-danger" onclick="schuelerEntfernen(this)">Entfernen</button>
    `;
    
    container.appendChild(newRow);
}

function schuelerEntfernen(button) {
    const rows = document.querySelectorAll('.schueler-row');
    if (rows.length > 1) {
        button.parentElement.remove();
    } else {
        alert('Mindestens ein Schüler muss vorhanden sein!');
    }
}

async function gruppeErstellen() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const thema = document.getElementById('gruppenThema').value.trim();
    if (!thema) {
        alert('Bitte geben Sie ein Thema ein!');
        return;
    }

    const schuelerRows = document.querySelectorAll('.schueler-row');
    const schueler = [];
    
    for (let row of schuelerRows) {
        const name = row.querySelector('.schueler-name').value.trim();
        const lehrer = row.querySelector('.schueler-lehrer').value;
        const fach = row.querySelector('.schueler-fach').value;
        
        if (name && lehrer) {
            schueler.push({ name, lehrer, fach: fach || null });
        } else if (name) {
            alert(`Bitte wählen Sie einen Lehrer für ${name}!`);
            return;
        }
    }

    if (schueler.length === 0) {
        alert('Bitte fügen Sie mindestens einen Schüler hinzu!');
        return;
    }

    // UI blockieren während des Speichervorgangs
    const createButton = document.querySelector('button[onclick="gruppeErstellen()"]');
    const originalText = createButton.textContent;
    createButton.disabled = true;
    createButton.textContent = 'Speichern...';

    try {
        const gruppe = { 
            thema, 
            schueler, 
            id: Date.now().toString(),
            erstellt: new Date().toLocaleDateString('de-DE'),
            ersteller: currentUser.name,
            created: new Date().toISOString()
        };
        
        // Speichern in Firebase
        const result = await window.FirebaseClient.save('gruppen', gruppe);
        
        if (result.success) {
            // Lokalen Zustand aktualisieren
            gruppe.id = result.id; // ID von Firebase
            gruppen.push(gruppe);
            
            // News für jeden betroffenen Lehrer erstellen
            const lehrer = [...new Set(schueler.map(s => s.lehrer))];
            for (const lehrerName of lehrer) {
                const schuelerDesLehrers = schueler.filter(s => s.lehrer === lehrerName).map(s => s.name);
                await addNews(
                    `Neue Bewertung für ${lehrerName}`, 
                    `Gruppe "${thema}" zugewiesen mit Schüler(n): ${schuelerDesLehrers.join(', ')}`,
                    true
                );
            }
            
            // Felder zurücksetzen
            document.getElementById('gruppenThema').value = '';
            document.querySelectorAll('.schueler-name').forEach(input => input.value = '');
            document.querySelectorAll('.schueler-lehrer').forEach(select => select.value = '');
            document.querySelectorAll('.schueler-fach').forEach(select => select.value = '');
            
            // Nur einen Schüler behalten
            const rows = document.querySelectorAll('.schueler-row');
            if (rows.length > 1) {
                for (let i = 1; i < rows.length; i++) {
                    rows[i].remove();
                }
            }
            
            loadGruppen();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Gruppe:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
        // UI entsperren
        createButton.disabled = false;
        createButton.textContent = originalText;
    }
}

function gruppeBearbeiten(gruppeId) {
    const gruppe = gruppen.find(g => g.id === gruppeId);
    if (!gruppe) {
        console.error('Gruppe nicht gefunden:', gruppeId);
        return;
    }
    
    aktuelleGruppeEdit = gruppeId;
    
    // Modal anzeigen
    const modal = document.getElementById('gruppenEditModal');
    if (!modal) {
        console.error('Modal nicht gefunden!');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Thema setzen
    document.getElementById('editGruppenThema').value = gruppe.thema;
    
    // Schüler laden
    const container = document.getElementById('editSchuelerListe');
    container.innerHTML = '';
    
    gruppe.schueler.forEach((schueler, schuelerIndex) => {
        neuerSchuelerInEdit(schueler.name, schueler.lehrer, schueler.fach);
    });
}

function neuerSchuelerInEdit(name = '', lehrer = '', fach = '') {
    const container = document.getElementById('editSchuelerListe');
    const newRow = document.createElement('div');
    newRow.className = 'edit-schueler-item';
    
    const lehrerOptions = users.filter(u => u.role === 'lehrer')
        .map(l => `<option value="${l.name}" ${l.name === lehrer ? 'selected' : ''}>${l.name}</option>`)
        .join('');
    
    const fachOptions = Object.entries(alleFaecherGlobal)
        .map(([kuerzel, fachName]) => `<option value="${kuerzel}" ${kuerzel === fach ? 'selected' : ''}>${fachName}</option>`)
        .join('');
    
    newRow.innerHTML = `
        <input type="text" placeholder="Schülername" class="edit-schueler-name" value="${name}">
        <select class="edit-schueler-lehrer">
            <option value="">Lehrer wählen...</option>
            ${lehrerOptions}
        </select>
        <select class="edit-schueler-fach">
            <option value="">Fach wählen...</option>
            ${fachOptions}
        </select>
        <button type="button" class="btn btn-danger" onclick="editSchuelerEntfernen(this)">Entfernen</button>
    `;
    
    container.appendChild(newRow);
}

function editSchuelerEntfernen(button) {
    const rows = document.querySelectorAll('.edit-schueler-item');
    if (rows.length > 1) {
        button.parentElement.remove();
    } else {
        alert('Mindestens ein Schüler muss vorhanden sein!');
    }
}

async function gruppeEditSpeichern() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (aktuelleGruppeEdit === null) return;
    
    const thema = document.getElementById('editGruppenThema').value.trim();
    if (!thema) {
        alert('Bitte geben Sie ein Thema ein!');
        return;
    }
    
    const schuelerRows = document.querySelectorAll('.edit-schueler-item');
    const schueler = [];
    
    for (let row of schuelerRows) {
        const name = row.querySelector('.edit-schueler-name').value.trim();
        const lehrer = row.querySelector('.edit-schueler-lehrer').value;
        const fach = row.querySelector('.edit-schueler-fach').value;
        
        if (name && lehrer) {
            schueler.push({ name, lehrer, fach: fach || null });
        } else if (name) {
            alert(`Bitte wählen Sie einen Lehrer für ${name}!`);
            return;
        }
    }
    
    if (schueler.length === 0) {
        alert('Bitte fügen Sie mindestens einen Schüler hinzu!');
        return;
    }
    
    // UI blockieren während des Speichervorgangs
    const saveButton = document.querySelector('button[onclick="gruppeEditSpeichern()"]');
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Speichern...';
    
    try {
        // Gruppe finden
        const gruppeIndex = gruppen.findIndex(g => g.id === aktuelleGruppeEdit);
        if (gruppeIndex === -1) {
            throw new Error('Gruppe nicht gefunden');
        }
        
        // Gruppe aktualisieren
        const aktualisierteGruppe = {
            ...gruppen[gruppeIndex],
            thema,
            schueler,
            lastModified: new Date().toISOString()
        };
        
        // Firebase speichern
        const result = await window.FirebaseClient.save('gruppen', aktualisierteGruppe, aktuelleGruppeEdit);
        
        if (result.success) {
            // Lokalen Zustand aktualisieren
            gruppen[gruppeIndex] = aktualisierteGruppe;
            
            // News erstellen
            await addNews('Gruppe bearbeitet', `Die Gruppe "${thema}" wurde aktualisiert.`);
            
            gruppeEditAbbrechen();
            loadGruppen();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Gruppe:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

function gruppeEditAbbrechen() {
    const modal = document.getElementById('gruppenEditModal');
    modal.classList.add('hidden');
    aktuelleGruppeEdit = null;
}

async function gruppeLoeschen(gruppeId) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (confirm('Gruppe wirklich löschen?')) {
        const gruppe = gruppen.find(g => g.id === gruppeId);
        if (!gruppe) {
            alert('Gruppe nicht gefunden');
            return;
        }
        
        try {
            // Firebase löschen
            const result = await window.FirebaseClient.delete('gruppen', gruppeId);
            
            if (result.success) {
                // Lokalen Zustand aktualisieren
                const index = gruppen.findIndex(g => g.id === gruppeId);
                if (index > -1) {
                    gruppen.splice(index, 1);
                }
                
                await addNews('Gruppe gelöscht', `Die Gruppe "${gruppe.thema}" wurde gelöscht.`);
                loadGruppen();
            } else {
                throw new Error(result.error || 'Unbekannter Fehler beim Löschen');
            }
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Gruppe:', error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

// Tab-Navigation
function openTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    
    // event kann undefined sein, wenn die Funktion programmatisch aufgerufen wird
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Suche den Button für diesen Tab und aktiviere ihn
        const button = document.querySelector(`[onclick="openTab('${tabName}')"]`);
        if (button) button.classList.add('active');
    }
    
    // Tab-spezifische Inhalte laden
    try {
        if (tabName === 'news') loadNews();
        if (tabName === 'themen') loadThemen();
        if (tabName === 'gruppen') loadGruppen();
        if (tabName === 'lehrer') loadLehrer();
        if (tabName === 'daten') loadDatenverwaltung();
        if (tabName === 'bewerten') loadBewertungen();
        if (tabName === 'vorlagen') loadVorlagen();
        if (tabName === 'uebersicht') loadUebersicht();
        if (tabName === 'adminvorlagen') loadAdminVorlagen();
    } catch (error) {
        console.error(`❌ Fehler beim Laden von Tab ${tabName}:`, error);
    }
}

// Gruppen-System
function loadGruppen() {
    const liste = document.getElementById('gruppenListe');
    if (!liste) return;
    
    if (!window.firebaseInitialized) {
        liste.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    if (gruppen.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Gruppen vorhanden.</p></div>';
        return;
    }
    
    let html = '';
    gruppen.forEach((gruppe, index) => {
        html += `<div class="liste-item">
            <div>
                <strong>${gruppe.thema}</strong><br>
                <small>Erstellt: ${gruppe.erstellt}</small><br>
                <div style="margin-top: 0.5rem;">`;
        
        gruppe.schueler.forEach(schueler => {
            const fachInfo = schueler.fach ? ` (${getFachNameFromGlobal(schueler.fach)})` : '';
            html += `${schueler.name} → ${schueler.lehrer}${fachInfo}<br>`;
        });
        
        html += `</div>
            </div>
            <div>
                <button class="btn" onclick="gruppeBearbeiten('${gruppe.id}')">Bearbeiten</button>
                <button class="btn btn-danger" onclick="gruppeLoeschen('${gruppe.id}')">Löschen</button>
            </div>
        </div>`;
    });
    liste.innerHTML = html;
}

function getFachNameFromGlobal(fachKuerzel) {
    return alleFaecherGlobal[fachKuerzel] || fachKuerzel;
}

function loadSchuelerLehrerAuswahl() {
    const selects = document.querySelectorAll('.schueler-lehrer');
    const lehrerOptions = users.filter(u => u.role === 'lehrer')
        .map(lehrer => `<option value="${lehrer.name}">${lehrer.name}</option>`)
        .join('');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">Lehrer wählen...</option>' + lehrerOptions;
    });
    
    // Fach-Selects auch laden
    const fachSelects = document.querySelectorAll('.schueler-fach');
    const fachOptions = Object.entries(alleFaecherGlobal)
        .map(([kuerzel, name]) => `<option value="${kuerzel}">${name}</option>`)
        .join('');
    
    fachSelects.forEach(select => {
        select.innerHTML = '<option value="">Fach wählen...</option>' + fachOptions;
    });
}

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

// Globale Variablen für Datenspeicherung - ONLINE-ONLY MODUS
let currentUser = null;

// Daten-Container als leere Arrays/Objekte initialisieren - werden aus Firebase geladen
window.users = [];
window.alleFaecherGlobal = {};
window.bewertungsCheckpoints = {};
window.themen = [];
window.gruppen = [];
window.bewertungen = [];
window.vorlagen = {};
window.news = [];
window.schuljahr = '';
window.briefvorlage = {
    anrede: '',
    schluss: ''
};
window.staerkenFormulierungen = {};

// Lokale Referenzen für Rückwärtskompatibilität
let users = window.users;
let alleFaecherGlobal = window.alleFaecherGlobal;
let bewertungsCheckpoints = window.bewertungsCheckpoints;
let themen = window.themen;
let gruppen = window.gruppen;
let bewertungen = window.bewertungen;
let vorlagen = window.vorlagen;
let news = window.news;
let schuljahr = window.schuljahr;
let briefvorlage = window.briefvorlage;
let staerkenFormulierungen = window.staerkenFormulierungen;

let aktuelleGruppeEdit = null;
