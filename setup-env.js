#!/usr/bin/env node

// setup-env.js - Environment Variables Setup für Netlify
// Dieses Script wird während des Build-Prozesses ausgeführt

const fs = require('fs');
const path = require('path');

console.log('🔧 Setup Environment Variables für Firebase...');

// Environment Variables aus Netlify lesen
const envVars = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL
};

// Prüfen ob Environment Variables verfügbar sind
const hasEnvVars = Object.values(envVars).some(value => value && value !== '');

if (hasEnvVars) {
    console.log('✅ Firebase Environment Variables gefunden');
    
    // Erstelle env-config.js für den Browser
    const envConfigContent = `
// Environment Variables - Auto-generiert von setup-env.js
// NICHT MANUELL BEARBEITEN

window._env = ${JSON.stringify(envVars, null, 2)};

console.log('🔥 Environment Variables geladen für Projekt:', window._env.FIREBASE_PROJECT_ID || 'demo');
`;

    fs.writeFileSync('env-config.js', envConfigContent);
    console.log('✅ env-config.js erstellt');
    
    // Prüfe ob alle wichtigen Variables vorhanden sind
    const requiredVars = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID'];
    const missingVars = requiredVars.filter(varName => !envVars[varName]);
    
    if (missingVars.length > 0) {
        console.warn('⚠️  Fehlende Variables:', missingVars.join(', '));
        console.warn('⚠️  Firebase läuft im Demo-Modus');
    } else {
        console.log('✅ Alle notwendigen Firebase Variables konfiguriert');
    }
    
} else {
    console.log('⚡ Keine Firebase Environment Variables gefunden - Demo-Modus');
    
    // Erstelle Demo env-config.js
    const demoConfigContent = `
// Demo Environment Variables - Kein Firebase konfiguriert

window._env = {
    FIREBASE_API_KEY: "demo-mode",
    FIREBASE_AUTH_DOMAIN: "demo-mode",
    FIREBASE_PROJECT_ID: "demo-mode",
    FIREBASE_STORAGE_BUCKET: "demo-mode",
    FIREBASE_MESSAGING_SENDER_ID: "demo-mode",
    FIREBASE_APP_ID: "demo-mode",
    FIREBASE_DATABASE_URL: "demo-mode"
};

console.log('⚡ Demo-Modus: Verwende lokale Daten');
`;

    fs.writeFileSync('env-config.js', demoConfigContent);
    console.log('✅ Demo env-config.js erstellt');
}

// Erstelle Backup der Originaldateien falls noch nicht vorhanden
const filesToBackup = ['index.html'];

filesToBackup.forEach(filename => {
    const backupName = `${filename}.backup`;
    if (!fs.existsSync(backupName) && fs.existsSync(filename)) {
        fs.copyFileSync(filename, backupName);
        console.log(`📁 Backup erstellt: ${backupName}`);
    }
});

// Modifiziere index.html um env-config.js zu laden
if (fs.existsSync('index.html')) {
    let indexContent = fs.readFileSync('index.html', 'utf8');
    
    // Prüfe ob env-config.js bereits eingebunden ist
    if (!indexContent.includes('env-config.js')) {
        // Füge env-config.js vor fireconfig.js ein
        indexContent = indexContent.replace(
            '<script src="fireconfig.js"></script>',
            '<script src="env-config.js"></script>\n    <script src="fireconfig.js"></script>'
        );
        
        fs.writeFileSync('index.html', indexContent);
        console.log('✅ index.html aktualisiert - env-config.js eingebunden');
    } else {
        console.log('✅ env-config.js bereits in index.html eingebunden');
    }
}

// Erstelle README für Firebase Setup
const readmeContent = `# Firebase Konfiguration

## Environment Variables in Netlify setzen

Gehen Sie zu Ihrem Netlify-Dashboard → Site Settings → Environment Variables und fügen Sie hinzu:

\`\`\`
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.europe-west1.firebasedatabase.app/
\`\`\`

## Firebase-Projekt einrichten

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes
3. Aktivieren Sie Authentication (E-Mail/Password)
4. Aktivieren Sie Firestore Database
5. Aktivieren Sie Storage (optional)
6. Kopieren Sie die Konfigurationswerte zu Netlify

## Lokale Entwicklung

Ohne Firebase Environment Variables läuft die App im Demo-Modus mit lokalen Daten.

## Status prüfen

Die App zeigt in der Browser-Konsole an:
- ✅ Firebase konfiguriert und verbunden
- ⚡ Demo-Modus (lokale Daten)
- ❌ Konfigurationsfehler

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync('FIREBASE_SETUP.md', readmeContent);
console.log('✅ FIREBASE_SETUP.md erstellt');

console.log('\n🎉 Environment Setup abgeschlossen!\n');

// Deployment-Informationen ausgeben
if (hasEnvVars) {
    console.log('📊 Status: Firebase-Modus aktiviert');
    console.log('🔥 Projekt:', envVars.FIREBASE_PROJECT_ID);
} else {
    console.log('📊 Status: Demo-Modus (lokale Daten)');
    console.log('💡 Tipp: Firebase Environment Variables in Netlify konfigurieren');
}

console.log('\n🚀 Ready for deployment!\n');
