# 🚀 Setup-Anleitung: "Zeig, was du kannst!"

## 📋 Übersicht
Diese Anleitung führt dich durch die komplette Einrichtung der App von der Firebase-Konfiguration bis zur Benutzer-Registrierung.

---

## 1. 🔥 Firebase Setup (bereits erledigt ✅)

### 1.1 Firestore Collections erstellen
Gehe in die Firebase Console → Firestore Database und erstelle folgende Collections:

```
📁 users/           (Benutzer-Accounts)
📁 themen/          (Themenvorschläge)  
📁 gruppen/         (Schülergruppen)
📁 bewertungen/     (Bewertungen)
📁 vorlagen/        (Bewertungsvorlagen)
📁 news/            (News/Nachrichten)
📁 settings/        (App-Einstellungen)
📁 checkpoints/     (Bewertungs-Checkpoints)
📁 faecher/         (Fächer-Definitionen)
📁 briefvorlagen/   (Brief-Templates)
```

---

## 2. 🌐 Netlify Setup

### 2.1 Environment Variables setzen
Gehe zu deiner Netlify-Site → Site Settings → Environment Variables und füge hinzu:

```bash
FIREBASE_API_KEY=dein-api-key-hier
FIREBASE_AUTH_DOMAIN=dein-projekt.firebaseapp.com
FIREBASE_PROJECT_ID=dein-projekt-id
FIREBASE_STORAGE_BUCKET=dein-projekt.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop
FIREBASE_DATABASE_URL=https://dein-projekt-default-rtdb.europe-west1.firebasedatabase.app/
```

### 2.2 netlify.toml hochladen
Die `netlify.toml` Datei muss im Root-Verzeichnis deines Repositories liegen.

---

## 3. 👥 Benutzer-Registrierung

### 3.1 Admin-Account erstellen (ZUERST!)

**Methode 1: Firebase Console (empfohlen)**
1. Gehe zu Firebase Console → Authentication → Users
2. Klicke "Add user"
3. E-Mail: `admin@schule.de` (oder deine gewünschte Admin-E-Mail)
4. Passwort: `admin123` (später ändern!)
5. Klicke "Add user"

**Dann Firestore-Dokument erstellen:**
1. Gehe zu Firestore Database → users Collection
2. Klicke "Add document"
3. Document ID: Die UID des gerade erstellten Users (findest du in Authentication)
4. Felder hinzufügen:
```json
{
  "name": "Administrator",
  "email": "admin@schule.de", 
  "role": "admin",
  "created": "2025-01-XX"
}
```

### 3.2 Lehrer-Accounts erstellen

**Option A: Über Firebase Console (wie Admin)**
Für jeden Lehrer:
1. Authentication → Add user
2. Firestore → users → Add document mit Lehrer-Daten

**Option B: Über die App (nachdem Admin-Login funktioniert)**
1. Als Admin anmelden
2. Tab "Lehrer verwalten" 
3. "Neuen Lehrer anlegen" - das erstellt automatisch Firebase-Accounts

---

## 4. 🔧 Initiale Daten einrichten

### 4.1 App-Einstellungen (als Admin)
Nach dem ersten Admin-Login werden automatisch Standard-Daten erstellt:
- Fächer-Definitionen
- Bewertungs-Checkpoints  
- Brief-Vorlagen
- Demo-Themen

### 4.2 Manuelle Firestore-Setup (falls Probleme)
Falls die automatische Erstellung nicht funktioniert, erstelle manuell:

**settings/app-settings Dokument:**
```json
{
  "schuljahr": "2025/26",
  "alleFaecherGlobal": {
    "D": "Deutsch",
    "M": "Mathematik",
    "E": "Englisch"
    // ... weitere Fächer
  },
  "bewertungsCheckpoints": {
    "Fachliches Arbeiten": [
      "Du arbeitest konzentriert und ausdauernd",
      // ... weitere Checkpoints
    ]
  }
}
```

---

## 5. 🧪 Testing & Debugging

### 5.1 Test-Accounts (Demo-Daten)
Die App erstellt automatisch Demo-Accounts:
- **Admin:** admin@schule.de / admin123
- **Lehrer:** riffel@schule.de / lehrer123

### 5.2 Browser-Konsole checken
Öffne die Entwicklertools (F12) und prüfe:
- ✅ "🔥 Firebase vollständig initialisiert"  
- ✅ "📊 X Einträge aus users geladen"
- ❌ Keine Fehler-Meldungen

### 5.3 Offline-Test
- Gehe offline (Flugmodus)
- App sollte weiterhin funktionieren mit lokalen Daten
- Online gehen → Daten sollten synchronisiert werden

---

## 6. 🔒 Security Best Practices

### 6.1 Passwörter ändern
Nach dem Setup **sofort** alle Standard-Passwörter ändern:
1. Admin-Account → Firebase Console → Authentication
2. Lehrer-Accounts → über App oder Firebase Console

### 6.2 Security Rules überprüfen
Firestore Rules sollten etwa so aussehen:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Nur authentifizierte Nutzer
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Admin-only Collections
    match /settings/{document} {
      allow read, write: if request.auth.token.role == "admin";
    }
  }
}
```

---

## 7. 📱 Produktive Nutzung

### 7.1 Domain konfigurieren (optional)
- Netlify → Domain settings → Custom domain
- Firebase → Authentication → Authorized domains → deine-domain.de hinzufügen

### 7.2 Backups einrichten
- Firebase → Firestore → Backup automatisch aktivieren
- Netlify → Deploy-History ist automatisches Backup des Codes

---

## 8. 🆘 Troubleshooting

### Problem: "Firebase not initialized"
**Lösung:** 
- Environment Variables in Netlify überprüfen
- Browser-Cache leeren
- Netlify neu deployen

### Problem: "Login funktioniert nicht"
**Lösung:**
- User in Firebase Authentication vorhanden?
- Firestore-Dokument in users/ Collection erstellt?
- Passwort korrekt?

### Problem: "Daten werden nicht gespeichert"
**Lösung:**
- Internet-Verbindung prüfen
- Firestore Security Rules prüfen
- Browser-Konsole auf Fehler checken

### Problem: "Lehrer sieht Admin-Tabs"
**Lösung:**
- Browser-Cache leeren
- Neu anmelden
- Firestore user-Dokument → role: "lehrer" prüfen

---

## 9. 📞 Support

Bei Problemen:
1. **Browser-Konsole** (F12) auf Fehler prüfen
2. **Netlify Deploy Log** checken
3. **Firebase Console** → Logs prüfen
4. **GitHub Issues** erstellen mit Fehlerbeschreibung

---

## 🎉 Fertig!

Nach diesen Schritten sollte deine App vollständig funktionieren:
- ✅ Admin kann sich anmelden und alles verwalten
- ✅ Lehrer können sich anmelden und bewerten
- ✅ Daten werden in Firebase gespeichert
- ✅ App funktioniert online und offline
- ✅ PDF-Generierung funktioniert

**Viel Erfolg mit "Zeig, was du kannst!"** 🚀
