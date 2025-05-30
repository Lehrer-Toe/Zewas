// Globale Variablen für Datenspeicherung - KORRIGIERT
let currentUser = null;

// Benutzer-Daten mit globalem Zugriff
window.users = [
    { email: 'admin@schule.de', password: 'admin123', role: 'admin', name: 'Administrator' },
    { email: 'riffel@schule.de', password: 'lehrer123', role: 'lehrer', name: 'Riffel' },
    { email: 'kretz@schule.de', password: 'lehrer123', role: 'lehrer', name: 'Kretz' },
    { email: 'toellner@schule.de', password: 'lehrer123', role: 'lehrer', name: 'Töllner' },
    { email: 'schwarz@schule.de', password: 'lehrer123', role: 'lehrer', name: 'Schwarz' },
    { email: 'heiler@schule.de', password: 'lehrer123', role: 'lehrer', name: 'Heiler' }
];

// Alle anderen Daten ebenfalls global verfügbar machen
window.alleFaecherGlobal = {
    'D': 'Deutsch',
    'M': 'Mathematik',
    'E': 'Englisch',
    'FR': 'Französisch',
    'T': 'Technik',
    'AES': 'AES',
    'G': 'Geschichte',
    'GK': 'Gemeinschaftskunde',
    'BIO': 'Biologie',
    'PH': 'Physik',
    'SP': 'Sport',
    'BK': 'Bildende Kunst',
    'IT': 'Informatik',
    'WBS': 'WBS',
    'REL': 'Religion',
    'ETH': 'Ethik',
    'ALL': 'Allgemein'
};

window.bewertungsCheckpoints = {
    'Fachliches Arbeiten': [
        'Du arbeitest konzentriert und ausdauernd',
        'Du sammelst Informationen zielgerichtet',
        'Du setzt dein Wissen sinnvoll ein',
        'Du denkst kreativ und lösungsorientiert',
        'Du strukturierst deine Arbeit logisch und klar',
        'Du zeigst Verantwortungsbewusstsein beim Arbeiten'
    ],
    'Zusammenarbeit': [
        'Du arbeitest konstruktiv im Team',
        'Du übernimmst Verantwortung in der Gruppe',
        'Du hörst anderen zu und respektierst Meinungen',
        'Du unterstützt andere aktiv',
        'Du löst Konflikte fair und eigenständig'
    ],
    'Kommunikation': [
        'Du drückst dich klar und verständlich aus',
        'Du hältst Blickkontakt und sprichst sicher',
        'Du kannst Feedback geben und annehmen',
        'Du nimmst aktiv an Gesprächen teil',
        'Du kannst Inhalte gut präsentieren'
    ],
    'Eigenständigkeit': [
        'Du arbeitest selbstständig und zielgerichtet',
        'Du zeigst Eigeninitiative',
        'Du triffst Entscheidungen und stehst dazu',
        'Du erkennst Probleme und gehst sie an'
    ],
    'Reflexionsfähigkeit': [
        'Du kannst deine Stärken und Schwächen benennen',
        'Du denkst über deinen Lernprozess nach',
        'Du lernst aus Fehlern und verbesserst dich',
        'Du beschreibst, was gut lief und was nicht'
    ],
    'Persönlichkeitsentwicklung': [
        'Du zeigst Mut, neue Wege zu gehen',
        'Du bleibst auch bei Schwierigkeiten dran',
        'Du entwickelst dich im Laufe des Projekts spürbar weiter',
        'Du nutzt Rückmeldungen zur Verbesserung'
    ]
};

window.themen = [
    { name: 'Klimawandel', ersteller: 'System', faecher: ['BIO', 'G'] },
    { name: 'Digitalisierung', ersteller: 'System', faecher: ['IT', 'ALL'] },
    { name: 'Nachhaltigkeit', ersteller: 'System', faecher: ['BIO', 'G', 'WBS'] }
];

window.gruppen = [];
window.bewertungen = [];
window.vorlagen = {};
window.news = [];
window.schuljahr = '2025/26';

window.briefvorlage = {
    anrede: 'Liebe/r [NAME],\n\nim Rahmen des Projekts "Zeig, was du kannst!" hast du folgende Stärken gezeigt:',
    schluss: 'Wir gratulieren dir zu diesen Leistungen und freuen uns auf weitere erfolgreiche Projekte.\n\nMit freundlichen Grüßen\nDein Lehrerteam'
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

// App-Initialisierung - VERBESSERT
function initializeApp() {
    console.log('🚀 Initialisiere App...');
    
    try {
        loadNews();
        loadThemen();
        loadSchuelerLehrerAuswahl();
        initializeDemoData();
        
        // Warte auf Firebase falls verfügbar
        if (window.firebaseInitialized) {
            console.log('🔥 Firebase bereits initialisiert');
            syncWithFirebase();
        } else {
            // Event-Listener für Firebase
            window.addEventListener('firebaseReady', () => {
                console.log('🔥 Firebase ready - synchronisiere Daten');
                syncWithFirebase();
            });
        }
        
        console.log('✅ App erfolgreich initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei App-Initialisierung:', error);
    }
}

// Firebase-Synchronisation
async function syncWithFirebase() {
    if (!window.FirebaseClient || !window.firebaseInitialized) {
        return;
    }
    
    try {
        console.log('🔄 Synchronisiere mit Firebase...');
        
        // Lade App-Einstellungen falls Admin
        if (currentUser && currentUser.role === 'admin') {
            const settingsResult = await window.FirebaseClient.load('settings');
            if (settingsResult.success && settingsResult.data.length > 0) {
                const settings = settingsResult.data[0];
                if (settings.alleFaecherGlobal) {
                    window.alleFaecherGlobal = settings.alleFaecherGlobal;
                    alleFaecherGlobal = settings.alleFaecherGlobal;
                }
                if (settings.bewertungsCheckpoints) {
                    window.bewertungsCheckpoints = settings.bewertungsCheckpoints;
                    bewertungsCheckpoints = settings.bewertungsCheckpoints;
                }
                console.log('⚙️ App-Einstellungen aus Firebase geladen');
            }
        }
        
        console.log('✅ Firebase-Synchronisation abgeschlossen');
    } catch (error) {
        console.warn('⚠️ Firebase-Synchronisation fehlgeschlagen:', error);
    }
}

// Tab-Navigation
function openTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
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
                <button class="btn" onclick="gruppeBearbeiten(${index})">Bearbeiten</button>
                <button class="btn btn-danger" onclick="gruppeLoeschen(${index})">Löschen</button>
            </div>
        </div>`;
    });
    liste.innerHTML = html || '<div class="card"><p>Keine Gruppen vorhanden.</p></div>';
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

function gruppeErstellen() {
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

    const gruppe = { 
        thema, 
        schueler, 
        id: Date.now(),
        erstellt: new Date().toLocaleDateString('de-DE')
    };
    gruppen.push(gruppe);
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        window.FirebaseClient.save('gruppen', gruppe);
    }
    
    // News für jeden betroffenen Lehrer erstellen
    const lehrer = [...new Set(schueler.map(s => s.lehrer))];
    lehrer.forEach(lehrerName => {
        const schuelerDesLehrers = schueler.filter(s => s.lehrer === lehrerName).map(s => s.name);
        addNews(`Neue Bewertung für ${lehrerName}`, 
               `Gruppe "${thema}" zugewiesen mit Schüler(n): ${schuelerDesLehrers.join(', ')}`, true);
    });
    
    // Felder zurücksetzen
    document.getElementById('gruppenThema').value = '';
    document.querySelectorAll('.schueler-name').forEach(input => input.value = '');
    document.querySelectorAll('.schueler-lehrer').forEach(select => select.value = '');
    document.querySelectorAll('.schueler-fach').forEach(select => select.value = '');
    
    loadGruppen();
}

function gruppeBearbeiten(index) {
    aktuelleGruppeEdit = index;
    const gruppe = gruppen[index];
    
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

function gruppeEditSpeichern() {
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
    
    // Gruppe aktualisieren
    gruppen[aktuelleGruppeEdit].thema = thema;
    gruppen[aktuelleGruppeEdit].schueler = schueler;
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        window.FirebaseClient.save('gruppen', gruppen[aktuelleGruppeEdit], gruppen[aktuelleGruppeEdit].id);
    }
    
    addNews('Gruppe bearbeitet', `Die Gruppe "${thema}" wurde aktualisiert.`);
    
    gruppeEditAbbrechen();
    loadGruppen();
}

function gruppeEditAbbrechen() {
    const modal = document.getElementById('gruppenEditModal');
    modal.classList.add('hidden');
    aktuelleGruppeEdit = null;
}

function gruppeLoeschen(index) {
    if (confirm('Gruppe wirklich löschen?')) {
        const gruppe = gruppen[index];
        gruppen.splice(index, 1);
        
        // Firebase aktualisieren falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            // In einer echten Implementation würde hier das spezifische Dokument gelöscht
            window.FirebaseClient.save('gruppen', gruppen);
        }
        
        addNews('Gruppe gelöscht', `Die Gruppe "${gruppe.thema}" wurde gelöscht.`);
        loadGruppen();
    }
}

// Lehrer-Verwaltung (erweitert)
function loadLehrer() {
    const liste = document.getElementById('lehrerListe');
    const lehrer = users.filter(u => u.role === 'lehrer');
    
    let html = '';
    lehrer.forEach((teacher, index) => {
        html += `<div class="liste-item">
            <div>
                <strong>${teacher.name}</strong><br>
                E-Mail: ${teacher.email}<br>
                <small>Passwort: ${teacher.password}</small>
            </div>
            <div>
                <button class="btn" onclick="lehrerBearbeiten('${teacher.email}')">Bearbeiten</button>
                <button class="btn btn-danger" onclick="lehrerLoeschen('${teacher.email}')">Löschen</button>
            </div>
        </div>`;
    });
    liste.innerHTML = html || '<div class="card"><p>Keine Lehrer vorhanden.</p></div>';
}

function lehrerHinzufuegen() {
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
    
    const neuerLehrer = {
        email,
        password,
        role: 'lehrer',
        name
    };
    
    users.push(neuerLehrer);
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        window.FirebaseClient.save('users', neuerLehrer);
    }
    
    // Felder zurücksetzen
    document.getElementById('lehrerName').value = '';
    document.getElementById('lehrerEmail').value = '';
    document.getElementById('lehrerPasswort').value = 'lehrer123';
    
    loadLehrer();
    loadSchuelerLehrerAuswahl();
    addNews('Neuer Lehrer', `${name} wurde als Lehrer angelegt.`);
}

function lehrerBearbeiten(email) {
    const lehrer = users.find(u => u.email === email);
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
                <input type="email" id="editLehrerEmail" value="${lehrer.email}">
            </div>
            <div class="input-group">
                <label>Passwort:</label>
                <input type="text" id="editLehrerPasswort" value="${lehrer.password}">
            </div>
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="lehrerSpeichern('${email}')">Speichern</button>
                <button class="btn btn-danger" onclick="this.closest('.modal').remove()">Abbrechen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function lehrerSpeichern(alterEmail) {
    const name = document.getElementById('editLehrerName').value.trim();
    const email = document.getElementById('editLehrerEmail').value.trim();
    const password = document.getElementById('editLehrerPasswort').value.trim();
    
    if (!name || !email || !password) {
        alert('Bitte füllen Sie alle Felder aus!');
        return;
    }
    
    // Prüfe ob neue E-Mail bereits existiert (außer bei gleichem Lehrer)
    if (email !== alterEmail && users.find(u => u.email === email)) {
        alert('Ein Nutzer mit dieser E-Mail existiert bereits!');
        return;
    }
    
    const lehrerIndex = users.findIndex(u => u.email === alterEmail);
    if (lehrerIndex > -1) {
        users[lehrerIndex].name = name;
        users[lehrerIndex].email = email;
        users[lehrerIndex].password = password;
        
        // Firebase speichern falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            window.FirebaseClient.save('users', users[lehrerIndex]);
        }
        
        addNews('Lehrer aktualisiert', `Daten von ${name} wurden geändert.`);
        document.querySelector('.modal').remove();
        loadLehrer();
        loadSchuelerLehrerAuswahl();
    }
}

function lehrerLoeschen(email) {
    if (confirm('Lehrer wirklich löschen?')) {
        const index = users.findIndex(u => u.email === email);
        if (index > -1) {
            const name = users[index].name;
            users.splice(index, 1);
            
            // Firebase aktualisieren falls verfügbar
            if (window.FirebaseClient && window.firebaseInitialized) {
                window.FirebaseClient.save('users', users);
            }
            
            loadLehrer();
            loadSchuelerLehrerAuswahl();
            addNews('Lehrer gelöscht', `${name} wurde entfernt.`);
        }
    }
}

// Admin-Funktionen für Fächer
function loadFaecherVerwaltung() {
    if (currentUser.role !== 'admin') return;
    
    const container = document.getElementById('faecherVerwaltung');
    if (!container) return;
    
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

function updateFachName(kuerzel, neuerName) {
    alleFaecherGlobal[kuerzel] = neuerName;
    window.alleFaecherGlobal[kuerzel] = neuerName;
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        const settings = {
            alleFaecherGlobal: window.alleFaecherGlobal,
            lastUpdate: new Date().toISOString()
        };
        window.FirebaseClient.save('settings', settings, 'app-settings');
    }
    
    addNews('Fach umbenannt', `Fach ${kuerzel} wurde in "${neuerName}" umbenannt.`, false, 'Administrator');
}

function fachLoeschen(kuerzel) {
    if (confirm(`Fach "${alleFaecherGlobal[kuerzel]}" wirklich löschen?`)) {
        delete alleFaecherGlobal[kuerzel];
        delete window.alleFaecherGlobal[kuerzel];
        
        // Firebase speichern falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            const settings = {
                alleFaecherGlobal: window.alleFaecherGlobal,
                lastUpdate: new Date().toISOString()
            };
            window.FirebaseClient.save('settings', settings, 'app-settings');
        }
        
        loadFaecherVerwaltung();
        addNews('Fach gelöscht', `Fach ${kuerzel} wurde entfernt.`, false, 'Administrator');
    }
}

function neuesFachHinzufuegen() {
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
    
    alleFaecherGlobal[kuerzel] = name;
    window.alleFaecherGlobal[kuerzel] = name;
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        const settings = {
            alleFaecherGlobal: window.alleFaecherGlobal,
            lastUpdate: new Date().toISOString()
        };
        window.FirebaseClient.save('settings', settings, 'app-settings');
    }
    
    document.getElementById('neuesFachKuerzel').value = '';
    document.getElementById('neuesFachName').value = '';
    
    loadFaecherVerwaltung();
    addNews('Neues Fach', `Fach "${name}" (${kuerzel}) wurde hinzugefügt.`, false, 'Administrator');
}

// Admin-Funktionen für Bewertungs-Checkpoints
function loadCheckpointsVerwaltung() {
    if (currentUser.role !== 'admin') return;
    
    const container = document.getElementById('checkpointsVerwaltung');
    if (!container) return;
    
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

function updateCheckpoint(kategorie, index, neuerText) {
    bewertungsCheckpoints[kategorie][index] = neuerText;
    window.bewertungsCheckpoints[kategorie][index] = neuerText;
    
    // Auch Stärkenformulierungen aktualisieren
    const key = `${kategorie}_${index}`;
    if (staerkenFormulierungen[key]) {
        staerkenFormulierungen[key] = neuerText;
        window.staerkenFormulierungen[key] = neuerText;
    }
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        const settings = {
            bewertungsCheckpoints: window.bewertungsCheckpoints,
            staerkenFormulierungen: window.staerkenFormulierungen,
            lastUpdate: new Date().toISOString()
        };
        window.FirebaseClient.save('settings', settings, 'app-settings');
    }
}

function checkpointLoeschen(kategorie, index) {
    if (confirm('Checkpoint wirklich löschen?')) {
        bewertungsCheckpoints[kategorie].splice(index, 1);
        window.bewertungsCheckpoints[kategorie].splice(index, 1);
        
        // Firebase speichern falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            const settings = {
                bewertungsCheckpoints: window.bewertungsCheckpoints,
                lastUpdate: new Date().toISOString()
            };
            window.FirebaseClient.save('settings', settings, 'app-settings');
        }
        
        loadCheckpointsVerwaltung();
    }
}

function neuerCheckpoint(kategorie) {
    const text = prompt(`Neuer Checkpoint für ${kategorie}:`);
    if (text && text.trim()) {
        bewertungsCheckpoints[kategorie].push(text.trim());
        window.bewertungsCheckpoints[kategorie].push(text.trim());
        
        // Stärkenformulierung hinzufügen
        const index = bewertungsCheckpoints[kategorie].length - 1;
        const key = `${kategorie}_${index}`;
        staerkenFormulierungen[key] = text.trim();
        window.staerkenFormulierungen[key] = text.trim();
        
        // Firebase speichern falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            const settings = {
                bewertungsCheckpoints: window.bewertungsCheckpoints,
                staerkenFormulierungen: window.staerkenFormulierungen,
                lastUpdate: new Date().toISOString()
            };
            window.FirebaseClient.save('settings', settings, 'app-settings');
        }
        
        loadCheckpointsVerwaltung();
    }
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
    document.getElementById('briefAnrede').value = briefvorlage.anrede;
    document.getElementById('briefSchluss').value = briefvorlage.schluss;
}

function updateStaerkenFormulierung(key, value) {
    staerkenFormulierungen[key] = value;
    window.staerkenFormulierungen[key] = value;
}

function staerkenFormulierungenSpeichern() {
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        const settings = {
            staerkenFormulierungen: window.staerkenFormulierungen,
            lastUpdate: new Date().toISOString()
        };
        window.FirebaseClient.save('settings', settings, 'app-settings');
    }
    
    addNews('Vorlagen aktualisiert', 'Die Standardformulierungen wurden gespeichert.', false, 'Administrator');
    alert('Formulierungen gespeichert!');
}

function briefvorlageSpeichern() {
    briefvorlage.anrede = document.getElementById('briefAnrede').value;
    briefvorlage.schluss = document.getElementById('briefSchluss').value;
    
    window.briefvorlage = briefvorlage;
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        const settings = {
            briefvorlage: window.briefvorlage,
            lastUpdate: new Date().toISOString()
        };
        window.FirebaseClient.save('settings', settings, 'app-settings');
    }
    
    addNews('Briefvorlage aktualisiert', 'Die Briefvorlage wurde angepasst.', false, 'Administrator');
    alert('Briefvorlage gespeichert!');
}

// Übersicht-Tab mit Filter
let uebersichtFilter = {
    sortierung: 'name-az',
    lehrer: 'alle',
    status: 'alle'
};

function loadUebersicht() {
    loadLehrerStatistiken();
    loadMeineSchueler();
}

function loadLehrerStatistiken() {
    const statistikDiv = document.getElementById('lehrerStatistiken');
    
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
            <strong>Noch nicht bewertet:</strong> ${nichtBewertet}
        </div>
    `;
}

function loadMeineSchueler() {
    const liste = document.getElementById('meineSchuelerListe');
    
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
                `<button class="pdf-btn" onclick="generatePDF('${schueler.schuelerId}')">PDF</button>` : 
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

// Export-Funktionen
function meineSchuelerExportieren() {
    alert('Export-Funktion wird implementiert...');
}

function druckansichtÖffnen() {
    window.print();
}

function generatePDF(schuelerId) {
    // Diese Funktion wird jetzt in pdf.js behandelt
    if (typeof createPDF === 'function') {
        createPDF(schuelerId);
    } else {
        alert('PDF-System wird geladen...');
    }
}

// Datenverwaltung
function loadDatenverwaltung() {
    document.getElementById('schuljahr').value = schuljahr;
    
    const statistiken = document.getElementById('statistiken');
    statistiken.innerHTML = `
        <div class="statistik-card">
            <strong>Schuljahr:</strong> ${schuljahr}<br>
            <strong>Anzahl Gruppen:</strong> ${gruppen.length}<br>
            <strong>Anzahl Bewertungen:</strong> ${bewertungen.length}<br>
            <strong>Anzahl Lehrer:</strong> ${users.filter(u => u.role === 'lehrer').length}
        </div>
    `;
}

function schuljahrSpeichern() {
    schuljahr = document.getElementById('schuljahr').value;
    window.schuljahr = schuljahr;
    
    // Firebase speichern falls verfügbar
    if (window.FirebaseClient && window.firebaseInitialized) {
        const settings = {
            schuljahr: window.schuljahr,
            lastUpdate: new Date().toISOString()
        };
        window.FirebaseClient.save('settings', settings, 'app-settings');
    }
    
    addNews('Schuljahr geändert', `Das Schuljahr wurde auf ${schuljahr} gesetzt.`);
    loadDatenverwaltung();
}

function datenExportieren(typ) {
    alert(`Export von ${typ} wird implementiert...`);
}

function datenLoeschen(typ) {
    const nachricht = {
        'bewertungen': 'Alle Bewertungen',
        'gruppen': 'Alle Gruppen',
        'news': 'Alle News',
        'alle': 'ALLE DATEN'
    };
    
    if (confirm(`Wirklich ${nachricht[typ]} löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
        switch(typ) {
            case 'bewertungen':
                bewertungen = [];
                window.bewertungen = [];
                break;
            case 'gruppen':
                gruppen = [];
                window.gruppen = [];
                break;
            case 'news':
                news = [];
                window.news = [];
                break;
            case 'alle':
                bewertungen = [];
                gruppen = [];
                news = [];
                window.bewertungen = [];
                window.gruppen = [];
                window.news = [];
                themen = [
                    { name: 'Klimawandel', ersteller: 'System', faecher: ['BIO', 'G'] },
                    { name: 'Digitalisierung', ersteller: 'System', faecher: ['IT', 'ALL'] },
                    { name: 'Nachhaltigkeit', ersteller: 'System', faecher: ['BIO', 'G', 'WBS'] }
                ];
                window.themen = themen;
                break;
        }
        
        // Firebase aktualisieren falls verfügbar
        if (window.FirebaseClient && window.firebaseInitialized) {
            switch(typ) {
                case 'bewertungen':
                    window.FirebaseClient.save('bewertungen', []);
                    break;
                case 'gruppen':
                    window.FirebaseClient.save('gruppen', []);
                    break;
                case 'news':
                    window.FirebaseClient.save('news', []);
                    break;
                case 'alle':
                    window.FirebaseClient.save('bewertungen', []);
                    window.FirebaseClient.save('gruppen', []);
                    window.FirebaseClient.save('news', []);
                    window.FirebaseClient.save('themen', window.themen);
                    break;
            }
        }
        
        addNews('Daten gelöscht', `${nachricht[typ]} wurden gelöscht.`, true);
        loadDatenverwaltung();
    }
}

// Demo-Daten initialisieren
function initializeDemoData() {
    console.log('🎯 Initialisiere Demo-Daten...');
    
    try {
        // Demo-Vorlagen erstellen
        vorlagen['riffel@schule.de'] = [
            {
                name: 'Geschichte Standard',
                kategorien: [
                    { name: 'Reflexion', gewichtung: 30 },
                    { name: 'Inhalt', gewichtung: 40 },
                    { name: 'Präsentation', gewichtung: 30 }
                ]
            }
        ];
        
        vorlagen['kretz@schule.de'] = [
            {
                name: 'Sport Handball',
                kategorien: [
                    { name: 'Reflexion', gewichtung: 30 },
                    { name: 'Technik', gewichtung: 35 },
                    { name: 'Taktik', gewichtung: 35 }
                ]
            }
        ];
        
        vorlagen['toellner@schule.de'] = [
            {
                name: 'Mathematik',
                kategorien: [
                    { name: 'Reflexion', gewichtung: 30 },
                    { name: 'Rechnung', gewichtung: 70 }
                ]
            }
        ];
        
        window.vorlagen = vorlagen;
        
        // Demo-News nur wenn noch keine vorhanden
        if (news.length === 0) {
            addNews('Willkommen', 'Willkommen im Bewertungstool "Zeig, was du kannst!" für das Schuljahr 2025/26', false, 'System');
            addNews('System bereit', 'Das Bewertungssystem ist einsatzbereit. Lehrer können Gruppen erstellen und Schüler bewerten.', true, 'Administrator');
        }
        
        // Demo-Gruppe erstellen (nur wenn noch keine vorhanden)
        if (gruppen.length === 0) {
            gruppen.push({
                thema: 'Klimawandel und Nachhaltigkeit',
                schueler: [
                    { name: 'Max Mustermann', lehrer: 'Riffel', fach: 'G' },
                    { name: 'Anna Schmidt', lehrer: 'Kretz', fach: 'SP' },
                    { name: 'Tom Weber', lehrer: 'Riffel', fach: 'G' },
                    { name: 'Lisa Müller', lehrer: 'Töllner', fach: 'M' }
                ],
                id: 1000,
                erstellt: new Date().toLocaleDateString('de-DE')
            });
            
            window.gruppen = gruppen;
        }
        
        // Demo-Bewertung (nur wenn noch keine vorhanden)
        if (bewertungen.length === 0) {
            bewertungen.push({
                schuelerId: '1000-Max-Mustermann',
                schuelerName: 'Max Mustermann',
                thema: 'Klimawandel und Nachhaltigkeit',
                lehrer: 'Riffel',
                vorlage: 'Geschichte Standard',
                noten: [2.0, 1.5, 2.5],
                endnote: 2.0,
                datum: new Date().toLocaleDateString('de-DE'),
                staerken: {
                    'Fachliches Arbeiten': [0, 2],
                    'Zusammenarbeit': [1],
                    'Kommunikation': [0, 4],
                    'Eigenständigkeit': [1, 3],
                    'Reflexionsfähigkeit': [0, 1],
                    'Persönlichkeitsentwicklung': [2]
                },
                freitext: 'Max zeigt sehr gute analytische Fähigkeiten.'
            });
            
            window.bewertungen = bewertungen;
        }
        
        // Demo-Stärkenformulierungen initialisieren (ohne automatische Namens-Einfügung)
        if (Object.keys(staerkenFormulierungen).length === 0) {
            Object.keys(bewertungsCheckpoints).forEach(kategorie => {
                bewertungsCheckpoints[kategorie].forEach((text, index) => {
                    const key = `${kategorie}_${index}`;
                    staerkenFormulierungen[key] = text;
                });
            });
            
            window.staerkenFormulierungen = staerkenFormulierungen;
        }
        
        console.log('✅ Demo-Daten erfolgreich initialisiert');
    } catch (error) {
        console.error('❌ Fehler bei Demo-Daten-Initialisierung:', error);
    }
}

// Globale currentUser für andere Module verfügbar machen
window.getCurrentUser = () => currentUser;

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM geladen - starte App-Initialisierung');
    
    // Warte kurz falls andere Scripte noch laden
    setTimeout(() => {
        initializeApp();
    }, 100);
});

// Auch beim window.load Event sicherheitshalber
window.addEventListener('load', function() {
    if (!window.appInitialized) {
        console.log('🔄 Backup-Initialisierung gestartet');
        initializeApp();
        window.appInitialized = true;
    }
});

console.log('🚀 Main.js geladen und bereit');
