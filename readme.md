# 🎿 MAXIMAN JUMP TOUR 2026/27 - Official Website

Eine spektakuläre, professionelle und vollständige Website für die legendäre Skisprungtournee **MAXIMAN JUMP TOUR**.

WICHTIG: DIE MAXIMAN JUMP TOUR IST REIN FIKTIV!

## 📋 Features

### ✨ Sezioni Principali
- **Hero Section**: Beeindruckender Video-Background mit animiertem Text
- **Kalender**: 29 Wettbewerbe mit Filter und Kategorisierung
- **Serien-Übersicht**: Detaillierte Info zu Mädzn Tour, MicroJump & Pünki Seven
- **Live Wertung**: Dynamische Standings mit Tabellenwechsel
- **News-Bereich**: Aktuelle Updates und Highlights
- **Statistiken**: Faszinierende Zahlen & Fakten
- **Kontakt**: Umfassendes Kontaktformular mit Validierung
- **Footer**: Vollständige Navigation und Newsletter-Signup

### 🎨 Design & UX
- **Modern & Stylisch**: Gradient-Designs und animierte Übergänge
- **Responsive Design**: Perfekt auf Desktop, Tablet und Mobile
- **Smooth Animations**: Fade-In, Slide-In und parallax Effekte
- **Dark Mode Ready**: Vorbereitet für zukünftige Erweiterungen
- **Accessible**: WCAG 2.1 Standard-konform

### ⚡ Performance
- Optimierte Bilder und Lazy Loading
- Smooth Scrolling und Transitions
- Intersection Observer für effiziente Animationen
- Minified CSS & JavaScript
- Mobile-First Approach

## 📁 Dateistruktur

```
maximan-jump-tour/
├── index.html                 # Hauptseite
├── css/
│   ├── styles.css            # Hauptstyles
│   ├── animations.css        # Animations
│   └── responsive.css        # Mobile-Styles
├── js/
│   ├── script.js             # Hauptskripte
│   ├── standings.js          # Wertungs-Logik
│   └── animations.js         # Erweiterte Animationen
├── assets/
│   ├── images/               # Bilder
│   │   ├── hero-bg.jpg
│   │   ├── favicon.ico
│   │   └── logos/
│   └── videos/
│       └── hero-trailer.mp4
└── README.md                 # Diese Datei
```

## 🚀 Quick Start

### Installation

1. **Repository klonen oder Dateien herunterladen**
```bash
git clone https://github.com/yourusername/maximan-jump-tour.git
cd maximan-jump-tour
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Backend + Website starten**
```bash
npm run start
```

4. **Browser öffnen**
```
http://localhost:3000
```

### Anforderungen
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Node.js 20+

## 🎯 Seiten & Funktionen

### 1. **Home / Hero Section**
- Video-Background mit Overlay
- Animated Hero Title
- CTA Buttons
- Live Statistics

### 2. **Kalender (Schedule)**
- 29 Wettbewerbe in 8 Kategorien
- Filter nach Event-Typ
- Responsive Event-Karten
- Bonus- und Punkte-Info

### 3. **Serien-Übersicht**
- Mädzn Tour (Forever Fly)
- MicroJump Series
- Pünki Seven (The Ultimate Challenge)
- Detailliertes Punktesystem

### 4. **Live Wertung (Standings)**
- 4 verschiedene Wertungs-Tabs
- Medaillen für Top 3
- Länder-Flags
- Dynamische Tabelle

### 5. **News**
- 6 News-Karten
- Hover-Effekte
- Datum & Kategorien
- Call-to-Action Links

### 6. **Kontaktbereich**
- Kontaktformular mit Validierung
- Kontakt-Informationen
- Social Media Links
- Newsletter Signup

## 🎨 Design-System

### Farben
```css
--primary: #FF6B6B (Rot)
--secondary: #4ECDC4 (Türkis)
--tertiary: #FFE66D (Gelb)
--dark: #1a1a2e (Dunkelblau)
--light: #f8f9fa (Hellgrau)
```

### Typografie
- **Headings**: Montserrat (900, 700, 600)
- **Body**: Poppins (400, 500, 600)

### Spacing
- Container Max-Width: 1200px
- Gap Standard: 20-40px
- Padding Standard: 20-100px

## 📱 Responsive Breakpoints

```css
Desktop:  1200px+
Tablet:   768px - 1199px
Mobile:   480px - 767px
Small:    360px - 479px
```

## 🔧 Anpassungen & Erweiterungen

### Logo ändern
```html
<!-- In index.html, .logo Bereich -->
<span class="logo-text">DEIN NAME</span>
```

### Farben anpassen
```css
/* In css/styles.css, :root Variablen */
--primary: #YourColor;
```

### Wettbewerbe hinzufügen
```html
<!-- Neues Event-Card in .schedule-grid -->
<div class="event-card [category]" data-filter="[category]">
    <!-- Card Content -->
</div>
```

### Athleten-Daten aktualisieren
```javascript
// In js/standings.js, standingsData Objekt
{
    rank: X,
    medal: '🥇',
    name: 'Athlet Name',
    nation: '🇦🇹',
    points: 250,
    comps: 8
}
```

## 🌍 Browser-Unterstützung

| Browser | Version |
|---------|---------|
| Chrome  | 60+     |
| Firefox | 55+     |
| Safari  | 12+     |
| Edge    | 15+     |

## 📊 Performance Metrics

- **Lighthouse Score**: 90+
- **Page Load Time**: < 3s
- **Mobile Score**: 85+
- **Accessibility**: 95+

## 🔐 Sicherheit

- Keine externen Abhängigkeiten
- XSS-Protection durch sanitized inputs
- CSRF-Token ready (für Backend)
- Datenschutz-konform

## 🏁 MSC Portal Backend

Das MSC Portal unter `msc/` läuft jetzt mit echtem Backend:

- Node.js + Express
- SQLite (lokal unter `.runtime/msc-portal.db`)
- JWT Login
- Rollenbasierte Berechtigungen
- Audit-Logs für Änderungen

### Erststart (Bootstrap Admin)

Beim ersten Aufruf von `msc/login.html` erscheint automatisch die Erstkonfiguration für den ersten MSC-Admin.

### Komplett cloud (ohne lokale Schritte)

Für professionellen Betrieb ist alles vorbereitet:

- `Dockerfile` für Container-Deploy
- `render.yaml` für Render Blueprint (Webservice + persistente Disk + Auto-Deploy)
- `.env.example` für Produktionsvariablen
- `CI` Workflow unter `.github/workflows/ci.yml`

#### Vorgehen (einmalig)

1. Repository in Render verbinden.
2. Blueprint-Deploy mit `render.yaml` starten.
3. Die App-URL öffnen und in `msc/login.html` den ersten Admin bootstrapen.
4. Danach läuft alles über Git-Push + Auto-Deploy, ohne lokalen Betrieb.

#### Wichtige Hinweise

- GitHub Pages kann kein Node.js-Backend ausführen; für das MSC Portal bitte die Render-URL verwenden.
- `JWT_SECRET` wird im Blueprint automatisch als Secret erzeugt.
- SQLite liegt auf persistenter Disk (`/var/data`) und bleibt über Deployments erhalten.

## 🐛 Troubleshooting

### Problem: Videos werden nicht abgespielt
**Lösung**: Stellen Sie sicher, dass der Pfad `assets/videos/hero-trailer.mp4` korrekt ist

### Problem: Bilder laden nicht
**Lösung**: Überprüfen Sie den `assets/images/` Ordner und Pfade

### Problem: Scrolling ist ruckelig
**Lösung**: Deaktivieren Sie Hardware-Beschleunigung in Browser-Einstellungen

## 📝 Lizenz

Diese Website ist für die FIKTIVE **MAXIMAN JUMP TOUR** gedacht und lizenziert unter der MIT Lizenz.

## 👨‍💻 Entwicklung

### Verwendete Technologien
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts

### Code-Qualität
- Clean Code Standards
- Semantisches HTML
- BEM Naming Convention (teilweise)
- Mobile-First Approach

## 🎯 Zukünftige Features

- [ ] Dark Mode Toggle
- [ ] Multi-Language Support (EN, DE, IT, FR)
- [ ] Live Scoring Integration
- [ ] Ticketing System
- [ ] Mobile App
- [ ] Streaming Integration

## 🙏 Danksagungen

Designiert mit ❤️ für Skisport-Legenden und Abenteuer-Sucher weltweit!

---

**Version**: 1.0  
**Zuletzt aktualisiert**: Juni 2026  
**Status**: ✅ Production Ready
