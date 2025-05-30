// PDF-Generierung System mit verbesserter Platzhalter-Logik
function createPDF(schuelerId) {
    const bewertung = bewertungen.find(b => b.schuelerId === schuelerId);
    if (!bewertung || !bewertung.staerken) {
        alert('Keine vollständige Bewertung für PDF vorhanden.');
        return;
    }
    
    // PDF-Inhalt generieren
    const pdfContent = generatePDFContent(bewertung);
    
    // PDF anzeigen (in der realen Anwendung würde hier eine echte PDF-Bibliothek verwendet)
    displayPDF(pdfContent, bewertung.schuelerName);
}

function generatePDFContent(bewertung) {
    // Platzhalter in Briefvorlage ersetzen
    const anrede = ersetzePlatzhalter(briefvorlage.anrede, bewertung.schuelerName);
    const schluss = ersetzePlatzhalter(briefvorlage.schluss, bewertung.schuelerName);
    
    let inhalt = anrede + '\n\n';
    
    // Stärken aus Checkliste zusammenstellen - NEUE LOGIK
    const staerkenSaetze = [];
    
    Object.keys(bewertung.staerken).forEach(kategorie => {
        const aktivierte = bewertung.staerken[kategorie];
        if (aktivierte && aktivierte.length > 0) {
            aktivierte.forEach(index => {
                const key = `${kategorie}_${index}`;
                let formulierung = staerkenFormulierungen[key];
                
                // Fallback falls Formulierung nicht existiert
                if (!formulierung && bewertungsCheckpoints[kategorie] && bewertungsCheckpoints[kategorie][index]) {
                    formulierung = bewertungsCheckpoints[kategorie][index];
                }
                
                if (formulierung) {
                    // NEUE LOGIK: Nur Platzhalter ersetzen, KEINE automatische Namens-Einfügung
                    let finalerSatz = ersetzePlatzhalter(formulierung, bewertung.schuelerName);
                    
                    // Satz formatieren (Punkt hinzufügen falls nicht vorhanden)
                    if (!finalerSatz.endsWith('.') && !finalerSatz.endsWith('!') && !finalerSatz.endsWith('?')) {
                        finalerSatz += '.';
                    }
                    
                    staerkenSaetze.push(finalerSatz);
                }
            });
        }
    });
    
    if (staerkenSaetze.length > 0) {
        inhalt += staerkenSaetze.join('\n') + '\n\n';
    }
    
    // Freitext hinzufügen
    if (bewertung.freitext) {
        const formatierterFreitext = ersetzePlatzhalter(bewertung.freitext, bewertung.schuelerName);
        inhalt += 'Weitere Beobachtungen:\n' + formatierterFreitext + '\n\n';
    }
    
    // Note hinzufügen
    inhalt += `Gesamtnote: ${bewertung.endnote}\n\n`;
    
    inhalt += schluss;
    
    return {
        titel: `Bewertung ${bewertung.schuelerName}`,
        inhalt: inhalt,
        datum: new Date().toLocaleDateString('de-DE'),
        schueler: bewertung.schuelerName,
        thema: bewertung.thema,
        lehrer: bewertung.lehrer
    };
}

function ersetzePlatzhalter(text, schuelerName) {
    if (!text) return '';
    
    // Alle Varianten von [NAME] ersetzen
    return text
        .replace(/\[NAME\]/g, schuelerName)
        .replace(/\[name\]/g, schuelerName)
        .replace(/\[Name\]/g, schuelerName);
}

function displayPDF(content, schuelerName) {
    // Erstelle ein neues Fenster für die PDF-Vorschau
    const popup = window.open('', '_blank', 'width=800,height=1000');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <title>${content.titel}</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                    line-height: 1.6;
                    background: white;
                }
                .briefkopf {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    position: relative;
                }
                .briefkopf-logo {
                    width: 100%;
                    max-width: 600px;
                    height: auto;
                    margin-bottom: 20px;
                }
                .briefkopf h1 {
                    color: #2c3e50;
                    margin: 0;
                    font-size: 24px;
                }
                .briefkopf h2 {
                    color: #667eea;
                    margin: 10px 0 0 0;
                    font-size: 18px;
                    font-weight: normal;
                }
                .briefkopf-info {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                }
                .briefkopf-fallback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                .briefkopf-logo-fallback {
                    width: 80px;
                    height: 80px;
                    background: #667eea;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 20px;
                }
                .briefkopf-logo-fallback span {
                    font-size: 30px;
                    color: white;
                }
                .briefkopf-text {
                    text-align: left;
                }
                .datum {
                    text-align: right;
                    margin-bottom: 30px;
                    color: #666;
                }
                .inhalt {
                    margin-bottom: 40px;
                    text-align: justify;
                }
                .inhalt p {
                    margin-bottom: 15px;
                }
                .stärken-liste {
                    margin: 20px 0;
                    padding-left: 0;
                }
                .stärken-liste li {
                    list-style: none;
                    margin-bottom: 8px;
                    padding-left: 20px;
                    position: relative;
                }
                .stärken-liste li:before {
                    content: "✓";
                    color: #27ae60;
                    font-weight: bold;
                    position: absolute;
                    left: 0;
                }
                .note-bereich {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #667eea;
                    margin: 20px 0;
                }
                .unterschrift {
                    margin-top: 60px;
                    border-top: 1px solid #333;
                    padding-top: 10px;
                    width: 200px;
                }
                .print-btn {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    z-index: 1000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }
                .print-btn:hover {
                    background: #5a6fd8;
                }
                .schuljahr-info {
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .thema-info {
                    background: #e3f2fd;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    text-align: center;
                    font-weight: bold;
                }
                .footer-info {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                .name-highlight {
                    font-weight: bold;
                    color: #2c3e50;
                }
                @media print {
                    .print-btn { display: none; }
                    body { padding: 20px; }
                    .briefkopf { 
                        page-break-after: avoid; 
                    }
                    @page {
                        margin: 2cm;
                    }
                }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">🖨️ Drucken</button>
            
            <div class="briefkopf">
                <!-- Briefkopf mit Fallback-Design -->
                <div class="briefkopf-fallback">
                    <div class="briefkopf-logo-fallback">
                        <span>🎺</span>
                    </div>
                    <div class="briefkopf-text">
                        <h1 style="margin: 0; color: #2c3e50;">Realschule Bad Schönborn</h1>
                        <div class="briefkopf-info">
                            Schulstraße 12 • 76669 Bad Schönborn<br>
                            Tel: 07253/12345 • info@rs-badschoenborn.de
                        </div>
                    </div>
                </div>
                <h2>Zeig, was du kannst! - Projektbewertung</h2>
            </div>
            
            <div class="schuljahr-info">
                Schuljahr ${schuljahr}
            </div>
            
            <div class="thema-info">
                Projektthema: ${content.thema}
            </div>
            
            <div class="datum">
                ${content.datum}
            </div>
            
            <div class="inhalt">
                ${formatPDFContent(content.inhalt, content.schueler)}
            </div>
            
            <div class="unterschrift">
                ${content.lehrer}<br>
                <small>Projektbetreuung</small>
            </div>
            
            <div class="footer-info">
                Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}<br>
                <em>Generiert mit "Zeig, was du kannst!" Bewertungssystem</em>
            </div>
        </body>
        </html>
    `;
    
    popup.document.write(htmlContent);
    popup.document.close();
    
    // Nach dem Laden versuchen, das Briefkopf-Bild zu laden (falls verfügbar)
    popup.onload = function() {
        tryLoadBriefkopfImage(popup.document);
    };
}

function tryLoadBriefkopfImage(doc) {
    // Versuche das Briefkopf-Bild zu laden
    // In einer echten Implementierung würde hier das hochgeladene Bild verwendet werden
    
    const testImg = new Image();
    testImg.onload = function() {
        // Wenn das Bild verfügbar ist, ersetze den Fallback-Briefkopf
        const briefkopfDiv = doc.querySelector('.briefkopf');
        if (briefkopfDiv) {
            const existingContent = briefkopfDiv.querySelector('h2').outerHTML;
            briefkopfDiv.innerHTML = `
                <img src="Briefkopf.png" alt="Schullogo" class="briefkopf-logo">
                ${existingContent}
            `;
        }
    };
    testImg.onerror = function() {
        // Fallback bleibt bestehen
        console.log('Briefkopf-Bild nicht verfügbar, verwende Fallback-Design');
    };
    
    // Versuche das Bild zu laden (in der realen Anwendung wäre hier der korrekte Pfad)
    testImg.src = 'Briefkopf.png';
}

function formatPDFContent(text, schuelerName) {
    // Text formatieren für bessere Darstellung
    const paragraphs = text.split('\n\n');
    let formatted = '';
    
    paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
            if (paragraph.includes('Du ') && !paragraph.includes('Gesamtnote:')) {
                // Stärken als Liste formatieren
                const saetze = paragraph.split('\n').filter(s => s.trim());
                if (saetze.length > 1) {
                    formatted += '<ul class="stärken-liste">';
                    saetze.forEach(satz => {
                        if (satz.trim()) {
                            // Namen hervorheben
                            const hervorgehobenerSatz = satz.replace(
                                new RegExp(`\\b${schuelerName}\\b`, 'gi'), 
                                `<span class="name-highlight">${schuelerName}</span>`
                            );
                            formatted += `<li>${hervorgehobenerSatz}</li>`;
                        }
                    });
                    formatted += '</ul>';
                } else {
                    const hervorgehobenerText = paragraph.replace(
                        new RegExp(`\\b${schuelerName}\\b`, 'gi'), 
                        `<span class="name-highlight">${schuelerName}</span>`
                    );
                    formatted += `<p>${hervorgehobenerText}</p>`;
                }
            } else if (paragraph.includes('Gesamtnote:')) {
                formatted += `<div class="note-bereich"><strong>${paragraph}</strong></div>`;
            } else {
                // Namen in normalem Text hervorheben
                const hervorgehobenerText = paragraph.replace(
                    new RegExp(`\\b${schuelerName}\\b`, 'gi'), 
                    `<span class="name-highlight">${schuelerName}</span>`
                );
                formatted += `<p>${hervorgehobenerText}</p>`;
            }
        }
    });
    
    return formatted;
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

// Erweiterte PDF-Export-Funktion mit Briefkopf-Unterstützung
function exportPDFWithBriefkopf(schuelerId, includeBriefkopf = true) {
    const bewertung = bewertungen.find(b => b.schuelerId === schuelerId);
    if (!bewertung) {
        alert('Bewertung nicht gefunden.');
        return;
    }
    
    console.log(`Exportiere PDF für ${bewertung.schuelerName} ${includeBriefkopf ? 'mit' : 'ohne'} Briefkopf`);
    
    // Standard-PDF-Erstellung aufrufen
    createPDF(schuelerId);
}

// Batch-PDF-Export für mehrere Schüler
function exportMultiplePDFs(schuelerIds) {
    if (!schuelerIds || schuelerIds.length === 0) {
        alert('Keine Schüler für Export ausgewählt.');
        return;
    }
    
    let exportCount = 0;
    const totalCount = schuelerIds.length;
    
    schuelerIds.forEach((schuelerId, index) => {
        setTimeout(() => {
            const bewertung = bewertungen.find(b => b.schuelerId === schuelerId);
            if (bewertung && bewertung.staerken && bewertung.endnote) {
                createPDF(schuelerId);
                exportCount++;
                
                if (exportCount === totalCount) {
                    console.log(`${exportCount} PDFs erfolgreich exportiert.`);
                }
            }
        }, index * 1500); // Etwas längere Verzögerung für bessere Performance
    });
}

// PDF-Vorschau-Funktion
function previewPDF(schuelerId) {
    const bewertung = bewertungen.find(b => b.schuelerId === schuelerId);
    if (!bewertung) {
        alert('Bewertung nicht gefunden.');
        return;
    }
    
    // Zeige Vorschau-Modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <h3>PDF-Vorschau: ${bewertung.schuelerName}</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4>Briefinhalt:</h4>
                <div style="white-space: pre-line; line-height: 1.6;">
                    ${generatePDFContent(bewertung).inhalt}
                </div>
            </div>
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="createPDF('${schuelerId}'); this.closest('.modal').remove();">PDF erstellen</button>
                <button class="btn btn-danger" onclick="this.closest('.modal').remove()">Schließen</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// PDF-Template laden (simuliert das Laden der Briefkopf-PNG)
function loadPDFTemplate() {
    try {
        // Simuliere das Laden der Briefkopf-PNG
        console.log('Versuche Briefkopf-Bild zu laden: Briefkopf.png');
        
        // In der realen Implementierung würde hier überprüft werden,
        // ob die Briefkopf.png verfügbar ist
        
        return {
            success: true,
            briefkopf: 'Realschule Bad Schönborn',
            layout: 'mit Briefkopf-Bild',
            hasImage: false, // Wird auf true gesetzt wenn Bild verfügbar
            platzhalterUnterstuetzung: true
        };
    } catch (error) {
        console.error('Fehler beim Laden der PDF-Vorlage:', error);
        return {
            success: false,
            error: 'Vorlage konnte nicht geladen werden'
        };
    }
}

// Platzhalter-Validation für Admin
function validatePlatzhalter(text) {
    const unterstuetztePlatzhalter = ['[NAME]', '[name]', '[Name]'];
    const gefundenePlatzhalter = [];
    
    unterstuetztePlatzhalter.forEach(platzhalter => {
        if (text.includes(platzhalter)) {
            gefundenePlatzhalter.push(platzhalter);
        }
    });
    
    return {
        valid: true,
        platzhalter: gefundenePlatzhalter,
        hinweis: gefundenePlatzhalter.length > 0 ? 
            `Gefundene Platzhalter: ${gefundenePlatzhalter.join(', ')}` : 
            'Keine Platzhalter gefunden'
    };
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    // PDF-Template laden
    const template = loadPDFTemplate();
    if (template.success) {
        console.log('PDF-Vorlage erfolgreich geladen');
        if (template.hasImage) {
            console.log('Briefkopf-Bild verfügbar');
        } else {
            console.log('Verwende Fallback-Briefkopf');
        }
        if (template.platzhalterUnterstuetzung) {
            console.log('Platzhalter-System aktiv ([NAME] wird unterstützt)');
        }
    } else {
        console.warn('PDF-Vorlage konnte nicht geladen werden, verwende Standard-Layout');
    }
});