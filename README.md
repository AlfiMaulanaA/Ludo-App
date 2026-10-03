# 🎲 Ludo App - Modern Next.js Game (Offline & Online Multiplayer)

Game **Ludo modern, colorful, dan responsif** dibangun dengan **Next.js (App Router)**, **Tailwind CSS**, dan **Socket.io WebSockets**. Game ini dapat dimainkan secara **Offline** (Pass & Play / VS Bot AI) maupun **Online Multiplayer** (Realtime WebSockets).

---

## 🌟 Fitur Utama

- 🎨 **Tampilan Bright & Colorful:** Desain modern dengan latar putih bersih, tombol candy glossy, papan Ludo responsif, dan font seru (*Fredoka* & *Nunito*).
- 🎮 **Mode Offline Pass & Play:** Bermain 2–4 pemain secara bergantian dalam 1 perangkat.
- 🤖 **Mode VS Bot AI:** Bermain 1 Player lawan 1–3 Bot AI dengan pilihan tingkat kesulitan (*Easy*, *Medium*, *Hard*).
- 🌐 **Online Multiplayer Realtime:**
  - Buat / Gabung Ruangan private menggunakan Kode Room 6 karakter.
  - Server Authoritative (Server memvalidasi semua lemparan dadu dan langkah bidak untuk mencegah kecurangan).
  - Penanganan AFK & Disconnect otomatis oleh Bot AI takeover.
  - Quick Emotes melayang & In-Game Chat.
- 🎵 **Sistem Audio Sintetis & SFX:** Web Audio API sound generator untuk efek dadu, langkah, penangkapan, finish, dan kemenangan.
- 📊 **Statistik & Autosave:** Menyimpan riwayat statistik permainan dan fitur Continue game offline di LocalStorage.

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Server Dev (Next.js + Socket.io Server)
```bash
npm run dev
```
Buka browser di `http://localhost:3000` (atau port yang tampil di terminal).

### 3. Jalankan Testing
```bash
npm test
```

---

## ☁️ Panduan Deploy ke Vercel

Karena platform **Vercel** menggunakan arsitektur Serverless Functions (tidak mendukung koneksi WebSockets persisten lama), arsitektur disesuaikan sebagai berikut:

### Opsi A: Deploy UI ke Vercel + Server Realtime Terpisah (Rekomendasi untuk Online)

1. **Deploy Frontend Next.js di Vercel:**
   - Push repository ke GitHub.
   - Import project di dashboard Vercel.
   - Tambahkan Environment Variable di Vercel:
     ```env
     NEXT_PUBLIC_SOCKET_URL=https://alamat-realtime-server-kamu.onrender.com
     ```

2. **Deploy Server Realtime WebSockets (Render / Railway / Fly.io / VPS):**
   - Jalankan command server realtime:
     ```bash
     npm run realtime
     ```
   - Server realtime berjalan pada file `realtime-server.js` (port default `4000`).
   - Atur environment variable pada host realtime:
     ```env
     PORT=4000
     CORS_ORIGIN=https://ludo-app.vercel.app
     ```

### Opsi B: Deploy ke VPS / Cloud Host Tunggal (Docker / Node Server)
Jika di-deploy ke VPS (Ubuntu / DigitalOcean / AWS EC2), kamu bisa langsung menjalankan server terintegrasi:
```bash
npm run build
npm start
```
Server akan mendengarkan HTTP request Next.js dan WebSocket Socket.io secara bersamaan pada 1 port!

---

## 🛠️ Teknologi yang Digunakan

- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS & Vanilla CSS Animations
- **Realtime Engine:** Socket.io & Socket.io Client
- **Audio:** Web Audio API Sound Synthesizer
- **Icons & Effects:** Lucide React & Canvas Confetti

---

## 📄 Lisensi
MIT License - Dibuat untuk kesenangan bermain bersama teman! 🎲✨
