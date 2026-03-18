# 🌍 T2T — Travel to Tell

> *"Il mondo è un libro, e chi non viaggia ne legge solo una pagina."* — Sant'Agostino

## 🎯 Vision

Un social network **verticale sui viaggi** dove ogni utente racconta le proprie avventure attraverso un **diario di viaggio interattivo**. Non solo foto e video, ma storie strutturate, consigli pratici e itinerari navigabili su mappa.

**Differenziazione**: A differenza di Instagram (generico) o TripAdvisor (recensioni), T2T combina il **formato narrativo di un diario** con la **scoperta sociale** e la **pianificazione intelligente**.

---

## ✅ Decisioni Confermate

| Tema | Decisione |
|------|----------|
| **Nome** | T2T — Travel to Tell |
| **Piattaforma** | Mobile nativa (React Native/Expo), web in futuro |
| **Lingua** | Multilingua EN/IT per MVP, poi espansione |
| **Moderazione** | Community-based (like/commenti verificati) |
| **Privacy diari** | Granulare (pubblico, amici, link, privato) |
| **Target geografico** | Globale fin da subito |
| **Video** | Granulare: lunghi nel diario, max 1 min nel feed |
| **Integrazioni** | Google Maps per MVP, poi aggregatore viaggi completo |
| **Social extra** | Condivisione itinerari con tappe dettagliate |

---

## ✨ Core Features (Confermate)

### 📖 1. Travel Diary (MVP Core) ✅
- Creazione diario per ogni viaggio (titolo, date, copertina, destinazioni)
- Giorni/capitoli strutturati giorno per giorno
- Rich content editor con testo, foto, video, audio
- Mood tracker giornaliero (emoji/stati d'animo)
- Tag di luoghi con geolocalizzazione automatica
- Draft/Pubblicato/Privato — privacy granulare

### 🗺️ 2. Interactive Map ✅
- Mappa personale con tutti i luoghi visitati (scratch map)
- Mappa del diario con percorso visualizzato
- Tap su punto → apre il capitolo corrispondente
- Heatmap globale della community

### 💡 3. Tips & Consigli ✅
- Consigli strutturati: 🏨 Alloggi | 🍽️ Ristoranti | 🚌 Trasporti | 🎭 Attività | ⚠️ Avvertenze
- Rating e voti della community
- Budget tracker con conversione valuta

### 👥 4. Social Layer ✅
- Follow, Like, Commenti, Salva
- Condivisione capitoli e diari interi
- **Condivisione itinerari con tappe dettagliate** *(aggiunto)*
- Tag compagni di viaggio (co-autori)
- Travel buddy matching

### 🔍 5. Discovery & Explore ✅
- Feed personalizzato per interessi e stile
- Cerca per destinazione
- Filtri: budget, durata, tipo, stagione
- Trending destinations
- "Ispirami" — suggerimento random

### 🎒 6. Trip Planner (Fase 2) ✅
- Crea itinerario da diari della community
- Fork/clona itinerari
- Checklist viaggio, meteo, stima budget

---

## 🎮 Gamification ✅ | 💰 Monetizzazione Freemium ✅

Entrambe le sezioni **confermate integralmente** dal brainstorming.

---

## 🛠️ Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| **Mobile** | React Native + Expo |
| **Backend** | Supabase (Auth, DB, Storage, Realtime) |
| **Database** | PostgreSQL + PostGIS |
| **Maps** | Google Maps (MVP) |
| **Storage** | Supabase Storage + CDN |
