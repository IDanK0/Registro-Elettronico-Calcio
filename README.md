# 📋 Registro Elettronico Calcio

> **Sistema completo di gestione per squadre di calcio**  
> Un'applicazione web moderna per la gestione di giocatori, allenamenti, partite e statistiche.

![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.0.0-purple.svg)

## 🚀 Caratteristiche Principali

### 📊 Gestione Completa
- **Gestione Giocatori**: Anagrafica completa con documenti allegati
- **Allenamenti**: Registro presenze e statistiche di partecipazione
- **Partite**: Gestione completa con cronometro in tempo reale
- **Statistiche Avanzate**: Analisi dettagliate di performance individuali e di squadra

### ⚽ Funzionalità Match Management
- **Timer in Tempo Reale**: Cronometro con gestione periodi personalizzabili
- **Eventi Live**: Registrazione goal, cartellini, sostituzioni in diretta
- **Formazioni**: Gestione lineup con numeri di maglia
- **Statistiche Partita**: Analisi immediate durante e dopo il match

### 📈 Dashboard e Analitiche
- **Capocannonieri**: Classifica marcatori automatica
- **Fair Play**: Tracciamento cartellini e disciplina
- **Statistiche per Ruolo**: Performance analizzate per posizione
- **Grafici Interattivi**: Visualizzazione dati con Chart.js

### 👥 Sistema di Autorizzazioni
- **Gestione Utenti**: Sistema di login con ruoli differenziati
- **Gruppi e Permessi**: Controllo granulare degli accessi
- **Sicurezza**: Autenticazione persistente e gestione sessioni

### 📱 Design Responsive
- **Mobile-First**: Interfaccia ottimizzata per tutti i dispositivi
- **UI Moderna**: Design con Tailwind CSS e Lucide Icons
- **PWA Ready**: Supporto per installazione come app nativa

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** - Framework UI con hooks moderni
- **TypeScript** - Type safety e development experience
- **Tailwind CSS** - Styling utilitario e responsive design
- **Vite** - Build tool veloce e moderno

### Database e Storage
- **SQL.js** - Database SQLite client-side
- **LocalStorage** - Persistenza dati locale
- **IndexedDB** - Storage avanzato per documenti

### Charts e Visualizzazioni
- **Chart.js** - Grafici interattivi
- **React-ChartJS-2** - Integrazione React per Chart.js

### Export e Documenti
- **jsPDF** - Generazione PDF per report
- **XLSX** - Export dati in formato Excel
- **CSV Utils** - Esportazione dati tabulari

### UI/UX
- **Lucide React** - Icone moderne e consistenti
- **React Tooltip** - Tooltip informativi
- **PostCSS & Autoprefixer** - Compatibilità CSS cross-browser

## 📦 Installazione

### Prerequisiti
- Node.js (versione 18 o superiore)
- npm o yarn

### Setup del Progetto

1. **Clone del repository**
   ```bash
   git clone https://github.com/IDanK0/Registro-Elettronico-Calcio.git
   cd Registro-Elettronico-Calcio
   ```

2. **Installazione dipendenze**
   ```bash
   npm install
   ```

3. **Avvio sviluppo**
   ```bash
   npm run dev
   ```

4. **Build produzione**
   ```bash
   npm run build
   ```

5. **Preview build**
   ```bash
   npm run preview
   ```

## 🎯 Utilizzo

### Primo Accesso
1. Avvia l'applicazione
2. Crea il primo utente amministratore
3. Configura gruppi e permessi
4. Inizia ad aggiungere giocatori

### Gestione Giocatori
- **Aggiungi Giocatori**: Anagrafica completa con contatti
- **Documenti**: Upload certificati medici e documenti
- **Stato**: Gestione giocatori attivi/inattivi

### Gestione Allenamenti
- **Pianificazione**: Crea allenamenti con data e ora
- **Presenze**: Registra partecipazione giocatori
- **Statistiche**: Visualizza trend di partecipazione

### Gestione Partite
- **Creazione Match**: Programma partite con dettagli completi
- **Live Management**: Gestisci partita in tempo reale
- **Formazioni**: Imposta lineup e sostituzioni
- **Eventi**: Registra goal, cartellini, e altri eventi

### Reports e Export
- **PDF**: Genera report statistiche complete
- **Excel/CSV**: Esporta dati per analisi esterne
- **Grafici**: Visualizza trend e performance

## 📊 Struttura Database

### Tabelle Principali
- **players**: Anagrafica giocatori
- **trainings**: Allenamenti e presenze
- **matches**: Partite e dettagli
- **match_events**: Eventi durante le partite
- **substitutions**: Sostituzioni effettuate
- **users**: Utenti del sistema
- **groups**: Gruppi e permessi

## 🔧 Configurazione

### Personalizzazione
- **Periodi Partita**: Configurabili in `src/utils/periodColors.ts`
- **Ruoli Giocatori**: Modificabili nei componenti form
- **Permessi**: Gestibili tramite interfaccia admin

### Build e Deploy
```bash
# Lint del codice
npm run lint

# Build ottimizzata
npm run build

# Serve build locale
npm run preview
```

## 🤝 Contributi

I contributi sono benvenuti! Per contribuire:

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## ‍💻 Autori

- **LCAMedia2025** - *Sviluppo iniziale*
- **IDanK0** - *Repository maintainer*

## 🙏 Ringraziamenti

- **ASD Pietra Ligure Calcio** - Per l'ispirazione e i requisiti del progetto
- **React Community** - Per l'eccellente ecosistema
- **Tailwind CSS** - Per il fantastico framework CSS
- **Chart.js** - Per le potenti capacità di visualizzazione

---

**Registro Elettronico Calcio** - Modernizza la gestione della tua squadra! ⚽
