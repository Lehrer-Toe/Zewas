// Bewertungs-System
let aktuelleBewertung = null;
let aktuelleVorlage = null;

// Bewertungs-Tab Navigation
function openBewertungTab(tabName) {
    const contents = document.querySelectorAll('.bewertung-tab-content');
    const buttons = document.querySelectorAll('.bewertung-tab-btn');
    
    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function loadBewertungen() {
    const liste = document.getElementById('bewertungsListe');
    
    // Sammle alle Schüler des aktuellen Lehrers
    const meineSchueler = [];
    gruppen.forEach(gruppe => {
        gruppe.schueler.forEach(schueler => {
            if (schueler.lehrer === currentUser.name) {
                const fachInfo = schueler.fach ? ` (${getFachNameFromGlobal(schueler.fach)})` : '';
                meineSchueler.push({
                    name: schueler.name,
                    thema: gruppe.thema,
                    gruppenId: gruppe.id,
                    schuelerId: `${gruppe.id}-${schueler.name.replace(/\s/g, '-')}`,
                    fach: schueler.fach,
                    fachInfo: fachInfo
                });
            }
        });
    });
    
    if (meineSchueler.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Schüler zugewiesen.</p></div>';
        return;
    }

    let html = '';
    meineSchueler.forEach(schueler => {
        const bewertung = bewertungen.find(b => b.schuelerId === schueler.schuelerId);
        const status = bewertung ? 'bewertet' : 'nicht-bewertet';
        
        // PDF-Button Status bestimmen
        const pdfVerfuegbar = bewertung && bewertung.endnote && bewertung.staerken && Object.keys(bewertung.staerken).length > 0;
        const pdfButtonClass = pdfVerfuegbar ? 'pdf-btn-enabled' : 'pdf-btn-disabled';
        const pdfButtonDisabled = pdfVerfuegbar ? '' : 'disabled';
        
        html += `<div class="bewertung-liste-item" data-status="${status}" data-name="${schueler.name}">
            <div class="bewertung-header">
                <div class="bewertung-info">
                    <strong>${schueler.name}</strong>${schueler.fachInfo}<br>
                    Thema: ${schueler.thema}<br>
                    Status: <span class="status-badge ${status}">${bewertung ? 'Bewertet' : 'Noch nicht bewertet'}</span>
                    ${bewertung ? `<br>Note: ${bewertung.endnote}` : ''}
                </div>
                <div class="bewertung-actions">
                    <select class="vorlage-select" id="vorlage-${schueler.schuelerId}">
                        <option value="">Bewertungsvorlage wählen...</option>
                        ${loadVorlagenOptionsForSchueler(bewertung?.vorlage)}
                    </select>
                    <button class="btn" onclick="bewertungStarten('${schueler.schuelerId}', '${schueler.name}', '${schueler.thema}')">
                        ${bewertung ? 'Bewertung bearbeiten' : 'Bewerten'}
                    </button>
                    <button class="btn ${pdfButtonClass}" 
                            onclick="generatePDF('${schueler.schuelerId}')" 
                            ${pdfButtonDisabled}>
                        PDF
                    </button>
                </div>
            </div>
        </div>`;
    });
    liste.innerHTML = html;
    
    // Filter anwenden
    filterBewertungen();
}

function loadVorlagenOptionsForSchueler(selectedVorlage) {
    let options = '';
    if (vorlagen[currentUser.email]) {
        vorlagen[currentUser.email].forEach(vorlage => {
            const selected = vorlage.name === selectedVorlage ? 'selected' : '';
            options += `<option value="${vorlage.name}" ${selected}>${vorlage.name}</option>`;
        });
    }
    return options;
}

function filterBewertungen() {
    const statusFilter = document.getElementById('bewertungsFilter').value;
    const namenSort = document.getElementById('namenSortierung').value;
    const items = Array.from(document.querySelectorAll('.bewertung-liste-item'));
    
    // Sortierung anwenden
    items.sort((a, b) => {
        const nameA = a.getAttribute('data-name');
        const nameB = b.getAttribute('data-name');
        
        if (namenSort === 'za') {
            return nameB.localeCompare(nameA);
        } else {
            return nameA.localeCompare(nameB);
        }
    });
    
    // Elemente neu anordnen
    const container = document.getElementById('bewertungsListe');
    items.forEach(item => {
        container.appendChild(item);
    });
    
    // Filter anwenden
    items.forEach(item => {
        const status = item.getAttribute('data-status');
        if (statusFilter === 'alle' || statusFilter === status) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function bewertungStarten(schuelerId, schuelerName, thema) {
    const vorlageSelect = document.getElementById(`vorlage-${schuelerId}`);
    const vorlage = vorlageSelect.value;
    
    if (!vorlage) {
        alert('Bitte wählen Sie eine Bewertungsvorlage aus!');
        return;
    }
    
    const vorlageData = vorlagen[currentUser.email]?.find(v => v.name === vorlage);
    if (!vorlageData) {
        alert('Bewertungsvorlage nicht gefunden!');
        return;
    }
    
    aktuelleBewertung = { schuelerId, schuelerName, thema };
    aktuelleVorlage = vorlageData;
    showBewertungsRaster();
}

function showBewertungsRaster() {
    document.getElementById('bewertungsListe').classList.add('hidden');
    const raster = document.getElementById('bewertungsRaster');
    raster.classList.remove('hidden');
    
    // Vorhandene Bewertung laden
    const vorhandeneBewertung = bewertungen.find(b => b.schuelerId === aktuelleBewertung.schuelerId);
    
    // Bewertungsraster aufbauen
    loadBewertungsTab(vorhandeneBewertung);
    loadStaerkenTab(vorhandeneBewertung);
    
    // Durchschnitt initial berechnen
    if (vorhandeneBewertung) {
        aktuelleBewertung.noten = [...vorhandeneBewertung.noten];
        aktuelleBewertung.staerken = vorhandeneBewertung.staerken || {};
        aktuelleBewertung.freitext = vorhandeneBewertung.freitext || '';
        berechneDurchschnitt();
    } else {
        aktuelleBewertung.noten = new Array(aktuelleVorlage.kategorien.length);
        aktuelleBewertung.staerken = {};
        aktuelleBewertung.freitext = '';
    }
}

function loadBewertungsTab(vorhandeneBewertung) {
    const container = document.getElementById('bewertungsRasterContent');
    
    let html = `
        <div class="vorlage-titel">Bewertungsvorlage: ${aktuelleVorlage.name}</div>
        <h3>Bewertung: ${aktuelleBewertung.schuelerName}</h3>
        <p>Thema: ${aktuelleBewertung.thema}</p>
        
        <div class="endnote-section">
            <span>Endnote:</span>
            <input type="number" id="endnote" class="endnote-input" min="1" max="6" step="0.1" 
                   value="${vorhandeneBewertung ? vorhandeneBewertung.endnote : ''}"
                   onchange="endnoteGeaendert()">
            <button class="btn" onclick="durchschnittUebernehmen()">Durchschnitt übernehmen</button>
        </div>
    `;
    
    aktuelleVorlage.kategorien.forEach((kategorie, index) => {
        const vorhandeneNote = vorhandeneBewertung?.noten[index];
        html += `
            <div class="kategorie">
                <div class="kategorie-titel">${kategorie.name} (${kategorie.gewichtung}%)</div>
                <div class="noten-buttons">
                    ${generateNotenButtons(index, vorhandeneNote)}
                    <button class="nicht-bewertet-btn ${vorhandeneNote === undefined ? 'selected' : ''}" 
                            onclick="noteSetzen(${index}, undefined)">–</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadStaerkenTab(vorhandeneBewertung) {
    const container = document.getElementById('staerkenCheckliste');
    
    // Prüfe ob bewertungsCheckpoints existiert und ein Object ist
    if (!bewertungsCheckpoints || typeof bewertungsCheckpoints !== 'object') {
        container.innerHTML = '<h3>Stärken bewerten</h3><div class="card"><p>Bewertungs-Checkpoints werden geladen...</p></div>';
        return;
    }
    
    let html = '<h3>Stärken bewerten</h3>';
    
    try {
        Object.keys(bewertungsCheckpoints).forEach(kategorie => {
            // Ignoriere Firebase-Metadaten
            if (kategorie === 'id' || kategorie === 'lastModified') {
                return;
            }
            
            const checkpoints = bewertungsCheckpoints[kategorie];
            
            // Sicherheitsprüfung: Stelle sicher, dass checkpoints ein Array ist
            if (!Array.isArray(checkpoints)) {
                console.warn(`⚠️ Checkpoints für ${kategorie} ist kein Array:`, checkpoints);
                return;
            }
            
            const aktivierte = vorhandeneBewertung?.staerken?.[kategorie] || [];
            
            html += `
                <div class="staerken-kategorie">
                    <div class="staerken-kategorie-titel">
                        ${getKategorieIconForBewertung(kategorie)} ${kategorie}
                    </div>
                    <div class="staerken-liste">
            `;
            
            checkpoints.forEach((text, index) => {
                const checked = aktivierte.includes(index) ? 'checked' : '';
                const itemClass = aktivierte.includes(index) ? 'checked' : '';
                
                html += `
                    <div class="staerken-item ${itemClass}">
                        <input type="checkbox" class="staerken-checkbox" 
                               ${checked}
                               onchange="staerkeToggle('${kategorie}', ${index}, this)">
                        <span class="staerken-text" onclick="toggleCheckbox('${kategorie}', ${index})">${text}</span>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += `
            <div class="freitext-bereich">
                <label><strong>📝 Weitere Beobachtungen oder individuelle Stärken:</strong></label>
                <textarea class="freitext-textarea" 
                          placeholder="Hier können Sie weitere Beobachtungen eintragen..."
                          onchange="freitextChanged(this)">${vorhandeneBewertung?.freitext || ''}</textarea>
            </div>
        `;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Stärken-Checkliste:', error);
        html = '<h3>Stärken bewerten</h3><div class="card"><p>Fehler beim Laden der Stärken. Bitte laden Sie die Seite neu.</p></div>';
    }
    
    container.innerHTML = html;
}

function getStaerkenTexteForBewertung() {
    return bewertungsCheckpoints;
}

function getKategorieIconForBewertung(kategorie) {
    const icons = {
        'Fachliches Arbeiten': '🧠',
        'Zusammenarbeit': '🤝',
        'Kommunikation': '🗣️',
        'Eigenständigkeit': '🎯',
        'Reflexionsfähigkeit': '🔁',
        'Persönlichkeitsentwicklung': '🌱'
    };
    return icons[kategorie] || '📋';
}

function getStaerkenTexte() {
    return bewertungsCheckpoints;
}

function getKategorieIcon(kategorie) {
    const icons = {
        'Fachliches Arbeiten': '🧠',
        'Zusammenarbeit': '🤝',
        'Kommunikation': '🗣️',
        'Eigenständigkeit': '🎯',
        'Reflexionsfähigkeit': '🔁',
        'Persönlichkeitsentwicklung': '🌱'
    };
    return icons[kategorie] || '📋';
}

function staerkeToggle(kategorie, index, checkbox) {
    if (!aktuelleBewertung.staerken[kategorie]) {
        aktuelleBewertung.staerken[kategorie] = [];
    }
    
    if (checkbox.checked) {
        if (!aktuelleBewertung.staerken[kategorie].includes(index)) {
            aktuelleBewertung.staerken[kategorie].push(index);
        }
        checkbox.parentElement.classList.add('checked');
    } else {
        aktuelleBewertung.staerken[kategorie] = aktuelleBewertung.staerken[kategorie].filter(i => i !== index);
        checkbox.parentElement.classList.remove('checked');
    }
    
    // Automatisch speichern
    autosaveStaerken();
}

function toggleCheckbox(kategorie, index) {
    const checkbox = document.querySelector(`.staerken-item input[onchange*="${kategorie}"][onchange*="${index}"]`);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        staerkeToggle(kategorie, index, checkbox);
    }
}

function freitextChanged(textarea) {
    aktuelleBewertung.freitext = textarea.value;
    autosaveStaerken();
}

function autosaveStaerken() {
    // Stärken automatisch speichern
    const existingIndex = bewertungen.findIndex(b => b.schuelerId === aktuelleBewertung.schuelerId);
    
    if (existingIndex >= 0) {
        bewertungen[existingIndex].staerken = { ...aktuelleBewertung.staerken };
        bewertungen[existingIndex].freitext = aktuelleBewertung.freitext;
        
        // PDF-Button Status aktualisieren
        updatePDFButtonStatus(aktuelleBewertung.schuelerId);
    }
}

function generateNotenButtons(kategorieIndex, vorhandeneNote) {
    const noten = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];
    let html = '';
    
    noten.forEach(note => {
        const noteStr = note.toString().replace('.', '-');
        const isSelected = vorhandeneNote === note ? 'selected' : '';
        html += `<button class="note-btn note-${noteStr} ${isSelected}" 
                       onclick="noteSetzen(${kategorieIndex}, ${note})">${note}</button>`;
    });
    
    return html;
}

function noteSetzen(kategorieIndex, note) {
    // Alle Buttons der Kategorie zurücksetzen
    const kategorie = document.querySelectorAll('.kategorie')[kategorieIndex];
    kategorie.querySelectorAll('.note-btn, .nicht-bewertet-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Neuen Button markieren
    if (note === undefined) {
        kategorie.querySelector('.nicht-bewertet-btn').classList.add('selected');
    } else {
        const noteStr = note.toString().replace('.', '-');
        kategorie.querySelector(`.note-${noteStr}`).classList.add('selected');
    }
    
    // Note speichern und Durchschnitt berechnen
    aktuelleBewertung.noten[kategorieIndex] = note;
    berechneDurchschnitt();
}

function berechneDurchschnitt() {
    const noten = aktuelleBewertung.noten.filter(n => n !== undefined);
    if (noten.length === 0) {
        document.getElementById('durchschnittAnzeige').textContent = '-';
        return;
    }
    
    // Gewichteter Durchschnitt
    let summe = 0;
    let gewichtungSumme = 0;
    
    aktuelleBewertung.noten.forEach((note, index) => {
        if (note !== undefined) {
            const gewichtung = aktuelleVorlage.kategorien[index].gewichtung;
            summe += note * gewichtung;
            gewichtungSumme += gewichtung;
        }
    });
    
    const durchschnitt = gewichtungSumme > 0 ? summe / gewichtungSumme : 0;
    document.getElementById('durchschnittAnzeige').textContent = durchschnitt.toFixed(1);
    
    // Endnote automatisch setzen wenn leer
    const endnoteInput = document.getElementById('endnote');
    if (!endnoteInput.value) {
        endnoteInput.value = durchschnitt.toFixed(1);
    }
}

function durchschnittUebernehmen() {
    const durchschnitt = document.getElementById('durchschnittAnzeige').textContent;
    if (durchschnitt !== '-') {
        document.getElementById('endnote').value = durchschnitt;
    }
}

function endnoteGeaendert() {
    // Validation könnte hier hinzugefügt werden
}

async function bewertungSpeichern() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    const endnote = parseFloat(document.getElementById('endnote').value);
    if (!endnote || endnote < 1 || endnote > 6) {
        alert('Bitte geben Sie eine gültige Endnote (1.0-6.0) ein!');
        return;
    }
    
    // UI blockieren während des Speichervorgangs
    const saveButton = document.querySelector('button[onclick="bewertungSpeichern()"]');
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Speichern...';
    
    try {
        // Vorhandene Bewertung aktualisieren oder neue erstellen
        const existingIndex = bewertungen.findIndex(b => b.schuelerId === aktuelleBewertung.schuelerId);
        const bewertungData = {
            schuelerId: aktuelleBewertung.schuelerId,
            schuelerName: aktuelleBewertung.schuelerName,
            thema: aktuelleBewertung.thema,
            lehrer: currentUser.name,
            vorlage: aktuelleVorlage.name,
            noten: [...aktuelleBewertung.noten],
            endnote: endnote,
            datum: new Date().toLocaleDateString('de-DE'),
            staerken: { ...aktuelleBewertung.staerken },
            freitext: aktuelleBewertung.freitext,
            created: new Date().toISOString()
        };
        
        // Firebase speichern
        let result;
        if (existingIndex >= 0) {
            // Update existing
            const existingId = bewertungen[existingIndex].id;
            result = await window.FirebaseClient.save('bewertungen', bewertungData, existingId);
            if (result.success) {
                bewertungen[existingIndex] = { ...bewertungData, id: existingId };
            }
        } else {
            // Create new
            result = await window.FirebaseClient.save('bewertungen', bewertungData);
            if (result.success) {
                bewertungData.id = result.id;
                bewertungen.push(bewertungData);
            }
        }
        
        if (result.success) {
            await addNews('Bewertung gespeichert', `${aktuelleBewertung.schuelerName} wurde mit ${endnote} bewertet.`);
            bewertungAbbrechen();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Bewertung:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

function bewertungAbbrechen() {
    document.getElementById('bewertungsRaster').classList.add('hidden');
    document.getElementById('bewertungsListe').classList.remove('hidden');
    aktuelleBewertung = null;
    aktuelleVorlage = null;
    loadBewertungen(); // Neu laden um PDF-Button Status zu aktualisieren
}

// Vorlagen-System mit Reflexion-Regel
function loadVorlagen() {
    if (!vorlagen[currentUser.email]) {
        vorlagen[currentUser.email] = [];
    }
    
    const liste = document.getElementById('vorlagenListe');
    const userVorlagen = vorlagen[currentUser.email];
    
    if (userVorlagen.length === 0) {
        liste.innerHTML = '<div class="card"><p>Keine Vorlagen vorhanden.</p></div>';
        return;
    }
    
    let html = '';
    userVorlagen.forEach((vorlage, index) => {
        html += `<div class="liste-item">
            <div>
                <strong>${vorlage.name}</strong><br>
                Kategorien: ${vorlage.kategorien.length}
            </div>
            <div>
                <button class="btn" onclick="vorlageBearbeiten(${index})">Bearbeiten</button>
                <button class="btn btn-danger" onclick="vorlageLoeschen(${index})">Löschen</button>
            </div>
        </div>`;
    });
    liste.innerHTML = html;
}

function neueVorlageErstellen() {
    const name = document.getElementById('vorlagenName').value.trim();
    if (!name) {
        alert('Bitte geben Sie einen Namen für die Vorlage ein!');
        return;
    }
    
    // Neue Vorlage immer mit Reflexion (30%) starten
    aktuelleVorlage = { 
        name, 
        kategorien: [
            { name: 'Reflexion', gewichtung: 30 }
        ]
    };
    document.getElementById('vorlagenEditor').classList.remove('hidden');
    document.getElementById('vorlagenTitel').textContent = `Vorlage: ${name}`;
    document.getElementById('vorlagenName').value = '';
    updateKategorienListe();
    updateGewichtungStatus();
}

function kategorieHinzufuegen() {
    const name = document.getElementById('kategorieName').value.trim();
    const gewichtung = parseInt(document.getElementById('kategorieGewichtung').value);
    
    if (!name || !gewichtung || gewichtung < 1 || gewichtung > 70) {
        alert('Bitte geben Sie einen Namen und eine Gewichtung (1-70%) ein!');
        return;
    }
    
    // Prüfe Gesamtgewichtung (30% Reflexion + neue Kategorien dürfen nicht über 100% gehen)
    const aktuelleGewichtung = aktuelleVorlage.kategorien
        .filter(k => k.name !== 'Reflexion')
        .reduce((sum, k) => sum + k.gewichtung, 0);
    
    if (aktuelleGewichtung + gewichtung > 70) {
        alert(`Maximale Gewichtung für zusätzliche Kategorien ist 70%. Aktuell verwendet: ${aktuelleGewichtung}%`);
        return;
    }
    
    aktuelleVorlage.kategorien.push({ name, gewichtung });
    document.getElementById('kategorieName').value = '';
    document.getElementById('kategorieGewichtung').value = '';
    
    updateKategorienListe();
    updateGewichtungStatus();
}

function updateKategorienListe() {
    const liste = document.getElementById('kategorienListe');
    let html = '<h4>Kategorien:</h4>';
    
    aktuelleVorlage.kategorien.forEach((kategorie, index) => {
        const istReflexion = kategorie.name === 'Reflexion';
        
        html += `<div class="liste-item">
            <span>${kategorie.name} (${kategorie.gewichtung}%) ${istReflexion ? '(fest)' : ''}</span>
            ${istReflexion ? '' : `<button class="btn btn-danger" onclick="kategorieEntfernen(${index})">Entfernen</button>`}
        </div>`;
    });
    
    liste.innerHTML = html;
}

function updateGewichtungStatus() {
    const gesamtGewichtung = aktuelleVorlage.kategorien.reduce((sum, k) => sum + k.gewichtung, 0);
    const statusElement = document.getElementById('aktuelleGewichtung');
    const container = document.getElementById('gewichtungStatus');
    
    statusElement.textContent = `${gesamtGewichtung}%`;
    
    if (gesamtGewichtung > 100) {
        container.classList.add('gewichtung-warnung');
        container.classList.remove('gewichtung-anzeige');
    } else {
        container.classList.add('gewichtung-anzeige');
        container.classList.remove('gewichtung-warnung');
    }
}

function kategorieEntfernen(index) {
    const kategorie = aktuelleVorlage.kategorien[index];
    if (kategorie.name === 'Reflexion') {
        alert('Die Kategorie "Reflexion" kann nicht entfernt werden.');
        return;
    }
    
    aktuelleVorlage.kategorien.splice(index, 1);
    updateKategorienListe();
    updateGewichtungStatus();
}

async function vorlageSpeichern() {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (aktuelleVorlage.kategorien.length === 0) {
        alert('Bitte fügen Sie mindestens eine Kategorie hinzu!');
        return;
    }
    
    const gesamtGewichtung = aktuelleVorlage.kategorien.reduce((sum, k) => sum + k.gewichtung, 0);
    if (gesamtGewichtung !== 100) {
        alert(`Die Gesamtgewichtung muss 100% betragen. Aktuell: ${gesamtGewichtung}%`);
        return;
    }
    
    if (!vorlagen[currentUser.email]) {
        vorlagen[currentUser.email] = [];
    }
    
    // UI blockieren während des Speichervorgangs
    const saveButton = document.querySelector('button[onclick="vorlageSpeichern()"]');
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.textContent = 'Speichern...';
    
    try {
        // Prüfe ob bearbeitet oder neu erstellt wird
        const existingIndex = vorlagen[currentUser.email].findIndex(v => v.name === aktuelleVorlage.name);
        
        const vorlageData = {
            ...aktuelleVorlage,
            owner: currentUser.email,
            created: new Date().toISOString()
        };
        
        // Firebase speichern
        let result;
        if (existingIndex >= 0) {
            // Update existing
            const existingId = vorlagen[currentUser.email][existingIndex].id;
            result = await window.FirebaseClient.save('vorlagen', vorlageData, existingId);
            if (result.success) {
                vorlageData.id = existingId;
                vorlagen[currentUser.email][existingIndex] = vorlageData;
            }
        } else {
            // Create new
            result = await window.FirebaseClient.save('vorlagen', vorlageData);
            if (result.success) {
                vorlageData.id = result.id;
                vorlagen[currentUser.email].push(vorlageData);
            }
        }
        
        if (result.success) {
            vorlagenEditorSchließen();
            loadVorlagen();
        } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Speichern');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Vorlage:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
        // UI entsperren
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

function vorlagenEditorSchließen() {
    document.getElementById('vorlagenEditor').classList.add('hidden');
    document.getElementById('kategorienListe').innerHTML = '';
    document.getElementById('vorlagenTitel').textContent = '';
    aktuelleVorlage = null;
}

async function vorlageLoeschen(index) {
    if (!window.firebaseInitialized) {
        alert('Bitte warten Sie, bis die Verbindung zu Firebase hergestellt ist.');
        return;
    }
    
    if (confirm('Vorlage wirklich löschen?')) {
        try {
            const vorlage = vorlagen[currentUser.email][index];
            
            // Firebase löschen
            if (vorlage.id) {
                const result = await window.FirebaseClient.delete('vorlagen', vorlage.id);
                if (!result.success) {
                    throw new Error(result.error || 'Unbekannter Fehler beim Löschen');
                }
            }
            
            // Lokal löschen
            vorlagen[currentUser.email].splice(index, 1);
            loadVorlagen();
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Vorlage:', error);
            alert(`Fehler beim Löschen: ${error.message}`);
        }
    }
}

function vorlageBearbeiten(index) {
    const vorlage = vorlagen[currentUser.email][index];
    aktuelleVorlage = JSON.parse(JSON.stringify(vorlage)); // Deep copy
    
    document.getElementById('vorlagenEditor').classList.remove('hidden');
    document.getElementById('vorlagenTitel').textContent = `Vorlage bearbeiten: ${vorlage.name}`;
    
    updateKategorienListe();
    updateGewichtungStatus();
}

// Hilfsfunktion für PDF-Button-Status
function updatePDFButtonStatus(schuelerId) {
    const bewertung = bewertungen.find(b => b.schuelerId === schuelerId);
    const button = document.querySelector(`[onclick*="${schuelerId}"]`);
    
    if (button && button.textContent === 'PDF') {
        const verfuegbar = bewertung && bewertung.endnote && bewertung.staerken && Object.keys(bewertung.staerken).length > 0;
        
        if (verfuegbar) {
            button.className = button.className.replace('pdf-btn-disabled', 'pdf-btn-enabled');
            button.removeAttribute('disabled');
        } else {
            button.className = button.className.replace('pdf-btn-enabled', 'pdf-btn-disabled');
            button.setAttribute('disabled', 'true');
        }
    }
}

console.log('✅ Bewertungs-System geladen');

// GLOBALE Registrierung der loadBewertungen Funktion
window.loadBewertungen = loadBewertungen;
