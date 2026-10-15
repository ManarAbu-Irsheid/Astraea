# TerraTwin — Planetary Analog Matching Platform

> **Space-Agency Standard Scientific Web Application** comparing Earth terrestrial analog sites to Lunar and Martian targets with physical fidelity.

---

## 🛰️ 1. Project Overview & Architecture

**TerraTwin** is an interactive, multi-spectral remote-sensing planetary analog matching platform designed according to space agency and laboratory standards (NASA JPL / ESA / JAXA). It screens **421,800 terrestrial candidate cells** against extraterrestrial targets across the Moon and Mars using multi-attribute distance formulations.

### Core Architectural Principles
- **Clean Vanilla Tech Stack**: Pure HTML5, modern CSS3 (CSS Variables, Flexbox/Grid, Glassmorphism, Print Styles), and Modular ES6+ JavaScript. No build step or bundler required.
- **Strict Separation of Code & Data**: All metrics, coordinates, validation scores, and locale dictionaries reside in editable JSON files (`data/cells.json`, `data/targets.json`, `data/validation.json`, `data/locales.json`), backed by an automatic offline-friendly local store fallback (`data/data-store.js`).
- **Full Bidirectional Internationalization (i18n)**: English (LTR, default) and Arabic (RTL) with dynamic instant toggling (`dir="rtl"`, `lang="ar"`), persistent state in `localStorage`, and typographic adaptations (`IBM Plex Sans` & `IBM Plex Sans Arabic`).
- **Dual Visual Themes**: Deep space dark mode (primary) and clean scientific light mode switchable with single-click persistence.

---

## 🧭 2. Page Directory & Features

### Page 1: Home (`index.html`)
- **Objective**: Instantly communicate verified scientific results within 5 seconds without generic clutter.
- **Interactive 3D Planetary Explorer Station**:
  - Three.js WebGL rendering of **Earth (Terra)**, **Mars**, and **The Moon (Luna)**.
  - Side navigation arrow buttons `[ ❮ | ❯ ]` and quick planet switcher tabs.
  - Full 360° drag rotation, zoom, and dynamic celestial bodies with procedural shaders and realistic surface details (continents, cloud layers, Martian canyons, lunar maria, and ray craters).
  - Selectable analog/landing site pins with real-time telemetry cards and direct links to the site finder and comparison matrix.
  - De-cluttered horizontal observatory telemetry strip displaying Equatorial Diameter, Surface Gravity, Atmospheric Pressure, Surface Temp Range, Rotation Period, and Mapped Analogs.
- **Dynamic "Twin Pair" Hero Showcase**:
  - Split visual: Extraterrestrial Target (Left) ↔ Terrestrial Analog Cell (Right).
  - Central animated similarity ring indicator (SVG circular progress) with percentage score and uncertainty bounds.
  - Smooth cycling through 3 real matched pairs (Atacama Desert ↔ Jezero Crater Delta, Lanzarote Lava Tubes ↔ Marius Hills Lava Tube, McMurdo Dry Valleys ↔ Shackleton Crater Rim).
- **Top-Level KPI Counter Bar**:
  - Exactly 3 empirical metrics with animated counter effects:
    1. **Scanned Earth Cells**: `421,800`
    2. **Known Analog Recall Rate**: `94.2%`
    3. **New Validated Candidates**: `38`
- **Tour Steps (3 points)**:
  1. *Twin Pair Ring*
  2. *Three Metric Counters*
  3. *Getting Started*

---

### Page 2: Site Finder (`finder.html`)
- **Layout**: 3-column desktop dashboard, responsive to mobile bottom-sheet.
- **Left Panel (Criteria & Filters)**:
  - Target Selector: `[ All Bodies | Moon | Mars ]`
  - Active Mission Weights readout.
  - Geomorphic Classification toggles: `[ Desert | Volcanic | Polar | Hydrothermal ]`.
  - **Crucial Discovery Switch**: `[ All Sites | New Candidates Only (Golden Stars) | Known Analogs (Circles) ]`.
- **Center Canvas (Interactive Geospatial Map)**:
  - Leaflet.js map with CartoDB Dark Matter tile layers and coordinate telemetry pill.
  - Circular markers for Known Sites with color graduation based on score.
  - Golden Pulsating Star markers (★) for newly discovered candidate sites.
- **Right Panel (Site Detail Card)**:
  - Displays: Site name, similarity score with uncertainty (`Score: 89.2% ± 3.4%`), Confidence Rating (High/Med).
  - Canvas-rendered 5-axis Radar Chart (Slope, Regolith, Thermal, Radiation, Mineralogy).
  - Bulleted *Why It Matches* points and *Scientific Divergences/Why Not*.
  - Action buttons: `[ Compare This Site ]` (transfers site to Page 3 via URL query parameter) and `[ Export Site Brief ]`.
- **Tour Steps (3 points)**:
  1. *Criteria Filters*
  2. *Discovery Map*
  3. *Site Card & Comparison*

---

### Page 3: Compare Sites (`compare.html`)
- **Core View**: Side-by-side scientific benchmarking matrix comparing two Earth sites against the same extraterrestrial target.
- **Two Permanent Analytical Panels**:
  1. **"What Earth Cannot Simulate"**: Rigid physical divergences (0.16G/0.38G gravity, galactic cosmic radiation, atmospheric vacuum, terrestrial biogenic contamination).
  2. **"What Can Be Tested Here"**: Mission-specific validity based on selected profile (rover wheel abrasion, fine dust adhesion, subterranean cave LiDAR SLAM, cryo-regolith excavation).
- **Interactive Selectors**: Dynamic dropdowns for Extraterrestrial Target, Benchmark Site A, and Candidate Site B.
- **Physical Property Divergence Matrix**: Topographic slope, grain size, bulk density, thermal inertia, dielectric constant, and water equivalent hydrogen (WEH), with calculated Divergence Index (Δ).
- **Standardized PDF Executive Summary**: Prominent `[ Export Report (PDF) ]` button triggering `@media print` layout styled as an official 1-page committee brief.
- **Tour Steps (3 points)**:
  1. *Dual Scientific Panels*
  2. *Side-by-Side Evaluation*
  3. *Export Engine*

---

### Page 4: Evidence & Method (`evidence.html`)
Structured in 3 vertical linear sections:
- **Section 1: Video Demonstration (Top)**:
  - Dedicated 16:9 container with HTML5 `<video id="demoVideo" controls poster="assets/poster.svg">`.
  - Closed caption / subtitle track support (`.vtt` in English & Arabic).
  - Fallback toggle for embedded URL (YouTube / Vimeo) with custom URL input.
  - Sub-label: Concise demo pitch (Max 2:30 min).
- **Section 2: Data Dashboard (Middle Grid)**:
  - 4 KPI cards: `Recall@10% (91.4%)`, `ROC-AUC Score (0.964)`, `Known Sites Validated (46/49)`, `New Candidates Discovered (38)`.
  - **Validation Rank Plot**: Interactive bar chart displaying 13 known analog site rankings with classified failure-case annotations (Rio Tinto mining runoff & Pilbara tectonic shear) and physical justification tags.
  - **Methodology & Sensitivity Matrix**: Multi-attribute Mahalanobis distance formula description and rank stability under `±25%` weight perturbations.
  - **Comprehensive Data Catalog Table**: 8 space agency datasets (LRO LOLA/Diviner, MRO CRISM/HiRISE, Copernicus Sentinel-2, NASADEM, ASTER GEDv4), live searchable and sortable by clicking column headers.
- **Section 3: Future Vision & Strategic Roadmap (Bottom)**:
  - 4 development phases from baseline data fusion to field robotics telemetry, automated weight learning, and collaborative agency cloud.
- **Tour Steps (3 points)**:
  1. *Demo Video*
  2. *Data & Validation Grid*
  3. *Roadmap*

---

## 🛠️ 3. Persistent Global Components

1. **Navigation Header**:
   - Brand mark with orbital SVG telemetry icon.
   - 4-page active navigation links.
   - **Mission Profile Selector (Badge/Dropdown)**:
     - Options: Rover Testing (`rover`), Human Base (`base`), ISRU (`isru`), Lava Tube Shelters (`caves`).
     - Clicking badge reveals internal weight sliders (Slope, Ice/Moisture, Regolith, Volcanic) editable exclusively inside this badge.
     - Sliders dynamically recalculate similarity scores across cards, maps, and comparisons in real time.
   - **Language Switcher `[ EN | AR ]`**: Toggles document direction (`dir="rtl"` / `dir="ltr"`), language, and translates all strings.
   - **Theme Toggle `[ ☀️ / 🌙 ]`**: Space dark mode / light mode.
   - **Tour Guide Button `[ ? Page Tour ]`**: Launches the 3-step walkthrough.

2. **Interactive 3-Step Guided Tour Walkthrough**:
   - Automatically opens on first visit to any page (persisted in `localStorage`).
   - Darkened backdrop spotlight with highlighted target DOM element and tooltip card (`Step X/3`, `Next`, `Back`, `Skip`).

3. **Contextual Scientific Chatbot (Floating Widget)**:
   - Bottom-right floating icon with live status dot.
   - 3 page-tailored quick-prompts in English and Arabic.
   - Deterministic responses powered by local JSON datasets.
   - Unsupported queries deterministically receive:
     *"Information not available in current run / لا تتوفر هذه المعلومة في نتائج التحليل الحالية"* with pointers to relevant pages.

4. **Global Professional Scientific Footer**:
   - **Project Team**: Developed by the **Astraea Team** and the **Astraea Planetary Science Lab**.
   - **Contact & Links**: Includes project contact email (`contact@astraea.space`), project repository, and documentation links.
   - **Official Planetary Data Sources**: Detailed citations for NASA Planetary Data System (LRO LOLA/Diviner, MRO CRISM/HiRISE), ESA Copernicus Programme (Sentinel-2), and USGS / NASA JPL (SRTM, NASADEM, ASTER GEDv4).
   - **Sub-Bar**: Open Access CC-BY 4.0 Scientific License and copyright notice across all 4 pages.

---

## 📁 4. Project Directory Structure

```
Astraea/
├── index.html                 # Page 1: Home (3D Explorer + Twin Pair + KPI Counters)
├── finder.html                # Page 2: Site Finder (Interactive Map + Filters + Radar Chart)
├── compare.html               # Page 3: Compare Sites (Benchmarking Matrix + 1-Page PDF Brief)
├── evidence.html              # Page 4: Evidence & Method (Video + Catalog + Sensitivity + Roadmap)
├── README.md                  # Comprehensive Documentation & Reference Manual
├── css/
│   ├── main.css               # Global tokens, typography, nav, profile dropdown, 4-col footer, chatbot
│   ├── home.css               # Page 1 3D explorer station, telemetry strip, SVG ring, KPI counters
│   ├── finder.css             # Page 2 3-column dashboard, Leaflet map, radar chart, mobile sheet
│   ├── compare.css            # Page 3 comparison matrix, analytical panels, print PDF brief
│   └── evidence.css           # Page 4 video container, rank bar chart, sensitivity, catalog table
├── js/
│   ├── app.js                 # App coordinator, theme persistence, data fetcher
│   ├── i18n.js                # Full bidirectional EN/AR i18n engine with localStorage
│   ├── profile.js             # Mission Profile Manager & internal weights sliders
│   ├── tour.js                # Guided 3-step walkthrough spotlight engine
│   ├── chatbot.js             # Contextual scientific assistant with deterministic fallback
│   ├── planet3d.js            # Three.js 3D planetary explorer (Earth, Mars, Moon, rotation, pins)
│   ├── home.js                # Page 1 hero cycling and numerical counter animations
│   ├── finder.js              # Page 2 Leaflet map, custom markers, filters, radar canvas
│   ├── compare.js             # Page 3 site benchmark selectors, matrix, window.print()
│   └── evidence.js            # Page 4 video switch, validation plot, catalog search/sort
├── data/
│   ├── cells.json             # Earth analog cells (Known Analogs & New Candidates)
│   ├── targets.json           # Extraterrestrial targets (Moon & Mars) & Hero twin pairs
│   ├── validation.json        # Empirical validation results, sensitivity matrix, catalog, roadmap
│   ├── locales.json           # Comprehensive English & Arabic translation dictionaries
│   └── data-store.js          # Offline-friendly local data registry fallback
└── assets/
    ├── poster.svg             # High-resolution video poster artwork
    ├── poster.jpg             # Compatible video poster fallback
    ├── demo_video.mp4         # Local video demonstration placeholder slot
    ├── subtitles-en.vtt       # Closed captions track (English)
    └── subtitles-ar.vtt       # Closed captions track (Arabic)
```

---

## 🚀 5. How to Run Locally

You can run the platform using any static file server or directly in your browser:

### Option A: Using Node.js
```bash
npx serve .
# or
node -e "const http = require('http'), fs = require('fs'), path = require('path'); http.createServer((q,s)=>{let f='.'+q.url.split('?')[0];if(f==='./')f='./index.html';let e=path.extname(f);fs.readFile(f,(r,c)=>{if(r){s.writeHead(404);s.end('Not found');}else{s.writeHead(200);s.end(c);}});}).listen(8080,()=>console.log('Serving at http://localhost:8080'));"
```

### Option B: Using Python
```bash
python -m http.server 8080
```

### Option C: Direct File Opening
Double-click `index.html` in your file explorer. The embedded `data/data-store.js` ensures that all features, datasets, maps, radar charts, and language switches function properly even under local `file:///` protocols without network dependencies.
