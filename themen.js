// Themen-System mit verbesserter Fächer-Auswahl
function loadThemen() {
    const liste = document.getElementById('themenListe');
    const filter = document.getElementById('themenFachFilter').value;
    
    // Themen nach Fach filtern
    let gefilterte = themen;
    if (filter) {
        gefilterte = themen.filter(t => t.faecher && t.faecher.includes(filter));
    }
    
    let html = '';
    gefilterte.forEach((thema, index) => {
        const originalIndex = themen.indexOf(thema);
        const kannLoeschen = thema.ersteller === currentUser.name || currentUser.role === 'admin';
        
        // Fächer-Badges erstellen
        let faecherBadges = '';
        if (thema.faecher && thema.faecher.length > 0) {
            faecherBadges = thema.faecher.map(fach => 
                `<span class="fach-badge">${getFachName(fach)}</span>`
            ).join(' ');
        }
        
        html += `<div class="liste-item thema-item" onclick="themaAuswaehlen('${thema.name}')">
            <div>
                <strong>${thema.name}</strong><br>
                <div style="margin-top: 5px;">
                    ${faecherBadges}
                </div>
            </div>
            ${kannLoeschen ? 
                `<button class="btn btn-danger" onclick="event.stopPropagation(); themaLoeschen(${originalIndex})">Löschen</button>` : 
                ''}
        </div>`;
    });
    liste.innerHTML = html || '<div class="card"><p>Keine Themen vorhanden.</p></div>';
}

function getFachName(fachKuerzel) {
    const faecher = {
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
    return faecher[fachKuerzel] || fachKuerzel;
}

function getAllFaecher() {
    return {
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
}

function filterThemen() {
    loadThemen();
}

let ausgewaehlteFaecher = [];

function themaHinzufuegen() {
    const input = document.getElementById('neuesThema');
    const themaName = input.value.trim();
    
    if (!themaName) {
        alert('Bitte geben Sie einen Thema-Namen ein!');
        return;
    }
    
    if (themen.find(t => t.name === themaName)) {
        alert('Dieses Thema existiert bereits!');
        return;
    }
    
    // Zeige Fächer-Auswahl Modal
    ausgewaehlteFaecher = [];
    zeigeFaecherAuswahlModal(themaName);
}

function zeigeFaecherModal() {
    ausgewaehlteFaecher = [];
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'faecherModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Fächer auswählen</h3>
            <p>Wählen Sie die relevanten Fächer:</p>
            
            <div id="faecherGrid" class="faecher-grid">
                ${createFaecherButtons()}
            </div>
            
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="bestaetigeFaecherAuswahl()">Bestätigen</button>
                <button class="btn btn-danger" onclick="schließeFaecherModal()">Abbrechen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function zeigeFaecherAuswahlModal(themaName) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'faecherAuswahlModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Fächer für Thema "${themaName}" auswählen</h3>
            <p>Klicken Sie auf die Fächer, die zu diesem Thema gehören:</p>
            
            <div id="faecherGrid" class="faecher-grid">
                ${createFaecherButtons()}
            </div>
            
            <div class="ausgewaehlte-faecher" id="ausgewaehlteFaecherAnzeige">
                <strong>Ausgewählte Fächer:</strong> <span id="faecherListe">Keine</span>
            </div>
            
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="speichereThemaMitFaechern('${themaName}')">Thema erstellen</button>
                <button class="btn btn-danger" onclick="schließeFaecherModal()">Abbrechen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function createFaecherButtons() {
    const alleFaecher = getAllFaecher();
    
    let html = '';
    Object.entries(alleFaecher).forEach(([kuerzel, name]) => {
        html += `
            <button class="fach-button" data-fach="${kuerzel}" onclick="toggleFach('${kuerzel}')">
                ${name}
            </button>
        `;
    });
    
    return html;
}

function toggleFach(fachKuerzel) {
    const button = document.querySelector(`[data-fach="${fachKuerzel}"]`);
    
    if (ausgewaehlteFaecher.includes(fachKuerzel)) {
        // Fach entfernen
        ausgewaehlteFaecher = ausgewaehlteFaecher.filter(f => f !== fachKuerzel);
        button.classList.remove('selected');
    } else {
        // Fach hinzufügen
        ausgewaehlteFaecher.push(fachKuerzel);
        button.classList.add('selected');
    }
    
    updateFaecherAnzeige();
}

function updateFaecherAnzeige() {
    const anzeige = document.getElementById('faecherListe');
    if (anzeige) {
        if (ausgewaehlteFaecher.length === 0) {
            anzeige.textContent = 'Keine';
        } else {
            anzeige.textContent = ausgewaehlteFaecher.map(f => getFachName(f)).join(', ');
        }
    }
}

function speichereThemaMitFaechern(themaName) {
    if (ausgewaehlteFaecher.length === 0) {
        alert('Bitte wählen Sie mindestens ein Fach aus!');
        return;
    }
    
    themen.push({ 
        name: themaName, 
        ersteller: currentUser.name,
        faecher: [...ausgewaehlteFaecher]
    });
    
    // Modal schließen
    schließeFaecherModal();
    
    // Eingabefeld leeren
    document.getElementById('neuesThema').value = '';
    
    // Liste neu laden
    loadThemen();
    
    // News erstellen
    const faecherText = ausgewaehlteFaecher.map(f => getFachName(f)).join(', ');
    addNews('Neues Thema', `Das Thema "${themaName}" wurde für die Fächer ${faecherText} hinzugefügt.`);
}

function bestaetigeFaecherAuswahl() {
    // Wird von anderen Funktionen verwendet
    schließeFaecherModal();
}

function schließeFaecherModal() {
    const modal = document.getElementById('faecherModal') || document.getElementById('faecherAuswahlModal');
    if (modal) {
        modal.remove();
    }
    ausgewaehlteFaecher = [];
}

function themaAuswaehlen(thema) {
    document.getElementById('gruppenThema').value = thema;
    openTab('gruppen');
    document.querySelector('[onclick="openTab(\'gruppen\')"]').classList.add('active');
}

function themaLoeschen(index) {
    const thema = themen[index];
    if (confirm(`Thema "${thema.name}" wirklich löschen?`)) {
        themen.splice(index, 1);
        loadThemen();
        addNews('Thema gelöscht', `Das Thema "${thema.name}" wurde entfernt.`);
    }
}