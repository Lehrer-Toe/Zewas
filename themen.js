// Themen-System mit verbesserter Fächer-Auswahl
function loadThemen() {
    const liste = document.getElementById('themenListe');
    if (!liste) return;
    
    const filter = document.getElementById('themenFachFilter')?.value || '';
    
    if (!window.firebaseInitialized) {
        liste.innerHTML = '<div class="card"><p>Warte auf Firebase-Verbindung...</p></div>';
        return;
    }
    
    // Themen nach Fach filtern
    let gefilterte = themen;
    if (filter) {
        gefilterte = themen.filter(t => t.faecher && t.faecher.includes(filter));
    }
    
    if (gefilterte.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Themen vorhanden.</p></div>';
        return;
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
    liste.innerHTML = html;
}

function getFachName(fachKuerzel) {
    // Prüfe ob alleFaecherGlobal verfügbar ist
    if (!alleFaecherGlobal || typeof alleFaecherGlobal !== 'object') {
        // Fallback zu Standard-Fächern
        const standardFaecher = {
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
        return standardFaecher[fachKuerzel] || fachKuerzel;
    }
    
    return alleFaecherGlobal[fachKuerzel] || fachKuerzel;
}

function getAllFaecher() {
    // Prüfe ob alleFaecherGlobal verfügbar ist
    if (!alleFaecherGlobal || typeof alleFaecherGlobal !== 'object') {
        // Fallback zu Standard-Fächern
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
    
    return alleFaecherGlobal;
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

async function speichereThemaMitFaechern(themaName) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (ausgewaehlteFaecher.length === 0) {
        alert('Bitte wählen Sie mindestens ein Fach aus!');
        return;
    }
    
    // UI blockieren während des Speichervorgangs
    const createButton = document.querySelector('button[onclick*="speichereThemaMitFaechern"]');
    const originalText = createButton.textContent;
    createButton.disabled = true;
    createButton.textContent = 'Speichern...';
    
    try {
        const neuesThema = {
            name: themaName,
            ersteller: currentUser.name,
            faecher: [...ausgewaehlteFaecher],
            created: new Date().toISOString()
        };
        
        // Firebase speichern
        const result = await window.FirebaseClient.save('themen', neuesThema);
        
        if (result.success) {
            // Lokalen Zustand aktualisieren
            neuesThema.id = result.id;
            themen.push(neuesThema);
            
            // Modal schließen
            schließeFaecherModal();
            
            // Eingabefeld leeren
            document.getElementById('neuesThema').value = '';
            
            // Liste neu laden
            loadThemen();
            
            // News erstellen
            const faecherText = ausgewaehlteFaecher.map(f => getFachName(f)).join(', ');
            await addNews('Neues Thema', `Das Thema "${themaName}" wurde für die Fächer ${faecherText} hinzugefügt.`);
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Themas:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
        // UI entsperren
        createButton.disabled = false;
        createButton.textContent = originalText;
    }
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
    const gruppenThemaInput = document.getElementById('gruppenThema');
    if (gruppenThemaInput) {
        gruppenThemaInput.value = thema;
    }
    openTab('gruppen');
    const gruppenTabButton = document.querySelector('[onclick="openTab(\'gruppen\')"]');
    if (gruppenTabButton) {
        gruppenTabButton.classList.add('active');
    }
}

async function themaLoeschen(index) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const thema = themen[index];
    if (!thema) {
        alert('Thema nicht gefunden');
        return;
    }
    
    if (confirm(`Thema "${thema.name}" wirklich löschen?`)) {
        try {
            // Firebase löschen
            if (thema.id) {
                const result = await window.FirebaseClient.delete('themen', thema.id);
                if (!result.success) {
                    throw new Error(result.error || 'Unbekannter Fehler beim Löschen');
                }
            }
            
            // Lokal löschen
            themen.splice(index, 1);
            loadThemen();
            await addNews('Thema gelöscht', `Das Thema "${thema.name}" wurde entfernt.`);
        } catch (error) {
            console.error('❌ Fehler beim Löschen des Themas:', error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

console.log('📋 Themen-System geladen');
