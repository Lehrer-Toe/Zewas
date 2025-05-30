// Admin Setup Script - Automatische Ersteinrichtung für Firebase
// Diese Datei wird nur einmal beim ersten Admin-Login ausgeführt

let setupCompleted = false;

// Setup beim ersten Admin-Login starten
async function checkAndRunSetup() {
    if (currentUser?.role !== 'admin' || setupCompleted) {
        return;
    }
    
    try {
        console.log('🔧 Prüfe ob Ersteinrichtung nötig ist...');
        
        // Prüfen ob bereits Daten in Firebase vorhanden sind
        const hasExistingData = await checkExistingFirebaseData();
        
        if (!hasExistingData) {
            console.log('🚀 Starte Ersteinrichtung...');
            await runInitialSetup();
            console.log('✅ Ersteinrichtung abgeschlossen!');
            
            // Benutzer informieren
            showSetupCompleteMessage();
        } else {
            console.log('✅ System bereits eingerichtet');
        }
        
        setupCompleted = true;
        
    } catch (error) {
        console.error('❌ Fehler bei der Ersteinrichtung:', error);
        showSetupErrorMessage(error);
    }
}

// Prüfen ob bereits Daten vorhanden sind
async function checkExistingFirebaseData() {
    try {
        if (!window.FirebaseClient || !window.firebaseInitialized) {
            return true; // Lokaler Modus - keine Setup nötig
        }
        
        // Prüfe ob settings bereits existieren
        const settingsResult = await window.FirebaseClient.load('settings');
        const usersResult = await window.FirebaseClient.load('users');
        
        // Wenn settings und mehr als 1 User existieren, ist Setup bereits erfolgt
        return (settingsResult.success && settingsResult.data?.length > 0) ||
               (usersResult.success && usersResult.data?.length > 1);
               
    } catch (error) {
        console.warn('⚠️ Fehler beim Prüfen vorhandener Daten:', error);
        return true; // Im Zweifel kein Setup ausführen
    }
}

// Hauptfunktion für die Ersteinrichtung
async function runInitialSetup() {
    console.log('📊 Erstelle Standard-Daten...');
    
    // 1. App-Einstellungen erstellen
    await createAppSettings();
    
    // 2. Standard-Fächer erstellen
    await createStandardFaecher();
    
    // 3. Bewertungs-Checkpoints erstellen
    await createBewertungsCheckpoints();
    
    // 4. Brief-Vorlagen erstellen
    await createBriefvorlagen();
    
    // 5. Demo-Themen erstellen
    await createDemoThemen();
    
    // 6. Willkommens-News erstellen
    await createWelcomeNews();
    
    // 7. Demo-Lehrer erstellen (optional)
    await createDemoLehrer();
    
    console.log('🎉 Alle Standard-Daten erstellt!');
}

// App-Einstellungen erstellen
async function createAppSettings() {
    const settings = {
        schuljahr: '2025/26',
        appVersion: '1.0.0',
        lastUpdated: new Date().toISOString(),
        setupCompleted: true,
        setupDate: new Date().toISOString()
    };
    
    await window.FirebaseClient.save('settings', settings, 'app-settings');
    console.log('⚙️ App-Einstellungen erstellt');
}

// Standard-Fächer erstellen
async function createStandardFaecher() {
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
    
    await window.FirebaseClient.save('faecher', standardFaecher, 'standard-faecher');
    
    // Lokale Daten auch aktualisieren
    alleFaecherGlobal = standardFaecher;
    
    console.log('📚 Standard-Fächer erstellt');
}

// Bewertungs-Checkpoints erstellen
async function createBewertungsCheckpoints() {
    const standardCheckpoints = {
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
    
    await window.FirebaseClient.save('checkpoints', standardCheckpoints, 'bewertungs-checkpoints');
    
    // Lokale Daten aktualisieren
    bewertungsCheckpoints = standardCheckpoints;
    
    console.log('✅ Bewertungs-Checkpoints erstellt');
}

// Brief-Vorlagen erstellen
async function createBriefvorlagen() {
    const standardBriefvorlage = {
        anrede: 'Liebe/r [NAME],\n\nim Rahmen des Projekts "Zeig, was du kannst!" hast du folgende Stärken gezeigt:',
        schluss: 'Wir gratulieren dir zu diesen Leistungen und freuen uns auf weitere erfolgreiche Projekte.\n\nMit freundlichen Grüßen\nDein Lehrerteam',
        version: '1.0',
        lastUpdated: new Date().toISOString()
    };
    
    await window.FirebaseClient.save('briefvorlagen', standardBriefvorlage, 'standard-vorlage');
    
    // Standard-Formulierungen für Stärken
    const standardFormulierungen = {};
    Object.keys(bewertungsCheckpoints).forEach(kategorie => {
        bewertungsCheckpoints[kategorie].forEach((text, index) => {
            const key = `${kategorie}_${index}`;
            standardFormulierungen[key] = text;
        });
    });
    
    await window.FirebaseClient.save('briefvorlagen', standardFormulierungen, 'staerken-formulierungen');
    
    // Lokale Daten aktualisieren
    briefvorlage = standardBriefvorlage;
    staerkenFormulierungen = standardFormulierungen;
    
    console.log('📝 Brief-Vorlagen erstellt');
}

// Demo-Themen erstellen
async function createDemoThemen() {
    const demoThemen = [
        {
            name: 'Klimawandel',
            ersteller: 'System',
            faecher: ['BIO', 'G'],
            beschreibung: 'Untersuchung der Ursachen und Folgen des Klimawandels',
            created: new Date().toISOString()
        },
        {
            name: 'Digitalisierung',
            ersteller: 'System',
            faecher: ['IT', 'ALL'],
            beschreibung: 'Auswirkungen der Digitalisierung auf unsere Gesellschaft',
            created: new Date().toISOString()
        },
        {
            name: 'Nachhaltigkeit',
            ersteller: 'System',
            faecher: ['BIO', 'G', 'WBS'],
            beschreibung: 'Nachhaltige Entwicklung und Umweltschutz',
            created: new Date().toISOString()
        }
    ];
    
    for (const thema of demoThemen) {
        await window.FirebaseClient.save('themen', thema);
    }
    
    // Lokale Daten aktualisieren
    themen = demoThemen;
    
    console.log('🌱 Demo-Themen erstellt');
}

// Willkommens-News erstellen
async function createWelcomeNews() {
    const welcomeNews = [
        {
            titel: 'Willkommen!',
            text: 'Willkommen im Bewertungstool "Zeig, was du kannst!" für das Schuljahr 2025/26. Das System wurde erfolgreich eingerichtet.',
            datum: new Date().toLocaleDateString('de-DE'),
            wichtig: false,
            autor: 'System',
            gelesen: false,
            created: new Date().toISOString()
        },
        {
            titel: 'System bereit',
            text: 'Das Bewertungssystem ist einsatzbereit. Lehrer können jetzt Gruppen erstellen und Schüler bewerten. Als Administrator können Sie Lehrer verwalten und Systemeinstellungen anpassen.',
            datum: new Date().toLocaleDateString('de-DE'),
            wichtig: true,
            autor: 'Administrator',
            gelesen: false,
            created: new Date().toISOString()
        }
    ];
    
    for (const newsItem of welcomeNews) {
        await window.FirebaseClient.save('news', newsItem);
    }
    
    // Lokale Daten aktualisieren
    news = welcomeNews;
    
    console.log('📰 Willkommens-News erstellt');
}

// Demo-Lehrer erstellen (optional)
async function createDemoLehrer() {
    const demoLehrer = [
        {
            name: 'Demo Lehrer',
            email: 'demo@schule.de',
            role: 'lehrer',
            created: new Date().toISOString(),
            isDemo: true
        }
    ];
    
    // Nur erstellen wenn Firebase Auth verfügbar ist
    if (window.firebase && window.firebase.auth()) {
        try {
            for (const lehrer of demoLehrer) {
                // Firebase Auth User erstellen (nur in Development)
                if (window.DEVELOPMENT_MODE?.enabled) {
                    console.log('👨‍🏫 Demo-Lehrer werden in der Produktion manuell erstellt');
                }
                
                // Firestore-Dokument erstellen
                await window.FirebaseClient.save('users', lehrer);
            }
            
            console.log('👨‍🏫 Demo-Lehrer-Daten erstellt');
        } catch (error) {
            console.warn('⚠️ Demo-Lehrer konnten nicht erstellt werden:', error);
        }
    }
}

// Setup-Abschluss-Nachricht anzeigen
function showSetupCompleteMessage() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🎉 Ersteinrichtung abgeschlossen!</h3>
            <p>Das System wurde erfolgreich eingerichtet. Folgende Daten wurden erstellt:</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>✅ Standard-Fächer definiert</li>
                <li>✅ Bewertungs-Checkpoints erstellt</li>
                <li>✅ Brief-Vorlagen konfiguriert</li>
                <li>✅ Demo-Themen hinzugefügt</li>
                <li>✅ Willkommens-Nachrichten erstellt</li>
            </ul>
            <p><strong>Nächste Schritte:</strong></p>
            <ol style="text-align: left; margin: 20px 0;">
                <li>Lehrer-Accounts im Tab "Lehrer verwalten" erstellen</li>
                <li>Eigene Themen im entsprechenden Tab hinzufügen</li>
                <li>Bewertungsvorlagen für Lehrer konfigurieren</li>
            </ol>
            <div class="modal-buttons">
                <button class="btn btn-success" onclick="this.closest('.modal').remove()">Verstanden</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Setup-Fehler-Nachricht anzeigen
function showSetupErrorMessage(error) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>⚠️ Setup-Warnung</h3>
            <p>Bei der automatischen Einrichtung ist ein Problem aufgetreten:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; font-family: monospace; font-size: 0.9rem;">
                ${error.message || error}
            </div>
            <p>Das System funktioniert trotzdem, aber Sie müssen möglicherweise einige Einstellungen manuell vornehmen.</p>
            <p><strong>Empfohlene Aktion:</strong></p>
            <ul style="text-align: left;">
                <li>Prüfen Sie die Browser-Konsole (F12) für Details</li>
                <li>Konfigurieren Sie fehlende Einstellungen manuell</li>
                <li>Bei anhaltenden Problemen: Support kontaktieren</li>
            </ul>
            <div class="modal-buttons">
                <button class="btn btn-danger" onclick="this.closest('.modal').remove()">Verstanden</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Setup automatisch beim Admin-Login ausführen
if (typeof window !== 'undefined') {
    // Event-Listener für Admin-Login
    window.addEventListener('adminLoginSuccess', checkAndRunSetup);
    
    // Fallback: Setup nach kurzer Verzögerung prüfen
    setTimeout(() => {
        if (currentUser?.role === 'admin' && !setupCompleted) {
            checkAndRunSetup();
        }
    }, 2000);
}

console.log('🔧 Admin-Setup-System geladen');

// Export für manuelle Ausführung
window.AdminSetup = {
    checkAndRun: checkAndRunSetup,
    runSetup: runInitialSetup,
    createSettings: createAppSettings,
    createFaecher: createStandardFaecher,
    createCheckpoints: createBewertungsCheckpoints,
    createBriefvorlagen: createBriefvorlagen
};
