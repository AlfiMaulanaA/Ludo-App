# TASK: Game Ludo Modern - Next.js (Offline & Online Multiplayer)

Buat sebuah game **Ludo modern, responsif, dan komprehensif** berbasis **Next.js** dengan gameplay mengikuti aturan Ludo standar. Game mendukung mode **Offline (Local Multiplayer & VS Bot)** dan **Online Multiplayer (Real-time WebSockets)**, dengan tampilan visual futuristik/glassmorphism, animasi halus, audio sintetis, serta arsitektur kode modular dan authoritative.

---

## 1. Konsep Game

Buat game Ludo untuk 2–4 pemain.

**Warna Pemain:**
- Merah (Red) - Starting offset 0
- Hijau (Green) - Starting offset 13
- Kuning (Yellow) - Starting offset 26
- Biru (Blue) - Starting offset 39

**Setiap pemain memiliki:**
- 4 bidak
- Area Base / Home Yard
- Jalur utama permainan (52 tile global)
- Jalur akhir / Home Path (5 tile warna khusus)
- Area Finish (Pusat papan)

**Tujuan Permainan:**
Menjadi pemain pertama yang berhasil membawa seluruh 4 bidaknya masuk ke area Finish.

---

## 2. Mode Permainan (Offline & Online)

Sediakan mode permainan yang fleksibel untuk offline dan online:

### A. Offline Multiplayer (Local & Bot)

1. **Local Pass & Play (1 Perangkat):**
   - 2 Pemain
   - 3 Pemain
   - 4 Pemain
   - Pemain bergantian menggunakan satu layar/perangkat.

2. **VS Bot (Single Player / Local Mixed):**
   - 1 Player vs 1-3 Bot
   - Kombinasi pemain manusia & bot lokal (contoh: 2 Human + 2 Bot)

3. **Tingkat Kesulitan Bot AI:**
   - **Easy:** Langkah acak, tidak agresif.
   - **Medium:** Menyeimbangkan keamanan bidak, serangan, dan progres finish.
   - **Hard:** Scoring system berbasis matriks risiko (menghitung target kill, safe zone, bahaya serangan balik lawan, serta mengejar victory).

---

### B. Online Multiplayer (Real-time WebSockets)

1. **Custom Room (Private Match):**
   - **Create Room:** Host membuat ruangan baru dan mendapatkan Kode Ruangan unik (6 karakter alfanumerik, contoh: `LUDO7X`).
   - **Join Room:** Pemain lain masuk dengan memasukkan Kode Ruangan atau melalui direct URL link (`/game?room=LUDO7X`).
   - **Host Control:** Host dapat mengatur jumlah slot (2-4 pemain), durasi turn timer, bot filler jika slot tidak terisi, serta mengawali permainan (Start Game).
   - **Lobby Interaktif:** Menampilkan status daftar pemain (Ready/Not Ready, Host status, Avatar, Ping latency).

2. **Public Matchmaking (Quick Match):**
   - Sistem antrean cepat untuk mencocokkan 2 atau 4 pemain secara otomatis.
   - Auto-start setelah room terisi penuh atau timer antrean habis (slot tersisa dapat diisi Bot AI jika diaktifkan).

3. **Fitur Interaktif In-Game Online:**
   - **Quick Emotes & Reactions:** Mengirimkan ekspresi real-time (👍, 🔥, 🏆, 😭, 🎲, 😎, 😡) yang melayang di atas avatar pemain.
   - **In-Game Text Chat:** Obrolan teks ringan antarpemain di dalam room.
   - **Player Status Indicator:** Indikator koneksi real-time (Online, Disconnected, Reconnecting).

4. **Reconnection & AFK Handling:**
   - Jika pemain terputus koneksi (disconnect/refresh), server memberikan *grace period* (misal 30 detik) untuk reconnect otomatis via Token Session / LocalStorage ID.
   - Jika waktu *grace period* habis atau pemain AFK (timeout turn 2x berturut-turut), sistem secara otomatis mengalihkan peran pemain tersebut ke **Bot AI takeover** agar permainan tidak menggantung bagi pemain lain.

---

## 3. Web Architecture & Tech Stack (Next.js)

Game dibangun menggunakan arsitektur web modern **Next.js**:

- **Framework:** Next.js (App Router, React 19 / 18, JSX/JS/TS).
- **Styling:** CSS Modules / Vanilla CSS / Tailwind CSS dengan tema Modern Glassmorphism & Neon Accent.
- **State Management:** Modular React State Engine & Custom Hooks (`useLudoGame`, `useSocketGame`).
- **Real-time Engine (Online):** Socket.io / WebSockets server-authoritative state synchronization.
- **Audio System:** Web Audio API Sound Synthesizer + Custom Sound Effects & Ambient Music.
- **Animations & Visuals:** CSS Transitions, Dynamic Tile Positioning, SVG Board Elements & Canvas Confetti Effect saat menang.

---

## 4. Sistem Dadu (Dice System)

- Dadu menghasilkan angka 1–6.
- Animasi rolling dice 3D/2D yang dinamis.
- Sound effect lemparan dadu.
- Permukaan dadu dikunci selama animasi berlangsung.
- **Aturan Angka 6:**
  - Pemain mendapatkan giliran tambahan (*bonus turn*).
  - Digunakan untuk mengeluarkan bidak dari Base ke starting tile.
  - **Triple Six Rule (Opsional):** Jika mendapat angka 6 sebanyak 3 kali berturut-turut, giliran pemain langsung hangus (*end turn*). (Dapat diatur ON/OFF).

---

## 5. Sistem Bidak & Pergerakan (Logical Board System)

- Setiap pemain memiliki 4 bidak dengan status:
  - `BASE` (Belum keluar)
  - `ACTIVE` (Di jalur utama 52 tile)
  - `HOME_PATH` (Di jalur aman khusus warna pemain)
  - `FINISHED` (Telah mencapai titik akhir center finish)
- Bidak di Base hanya keluar dengan angka dadu 6.
- Indikator visual highlight/glow untuk bidak yang valid diklik.
- Safe auto-move opsional jika hanya ada 1 langkah valid.
- System menggunakan progress internal ($0 \dots 56$) terpisah dari rendering CSS/DOM untuk menjamin *separation of concerns*.

---

## 6. Safe Zone, Capture, & Block Rules

1. **Safe Zone:**
   - Tile bintang aman (index 8, 21, 34, 47) + Starting Tiles.
   - Bidak di Safe Tile tidak dapat ditangkap lawan.
2. **Capture / Kill System:**
   - Bidak lawan di tile non-safe yang dihinggapi bidak aktif akan ditangkap dan kembali ke `BASE`.
   - Animasi & SFX penangkapan.
   - Bonus turn saat berhasil menangkap lawan (konfigurasi ON/OFF).
3. **Block System (Opsional):**
   - 2 Bidak sewarna di tile sama membentuk benteng/block yang tidak bisa dilewati atau dihinggapi lawan (konfigurasi ON/OFF).

---

## 7. Turn System & State Machine

Game dijalankan dengan State Machine yang ketat:
- `WAITING_FOR_ROLL`: Menunggu pemain aktif melempar dadu.
- `ROLLING_DICE`: Animasi melempar dadu.
- `SELECTING_PIECE`: Menunggu pemain memilih bidak valid.
- `MOVING_PIECE`: Animasi pergerakan bidak tile-by-tile.
- `RESOLVING_CAPTURE`: Evaluasi penangkapan bidak lawan.
- `CHECKING_WINNER`: Evaluasi pemain selesai / menang.
- `TURN_END`: Peralihan giliran ke pemain berikutnya.
- `GAME_OVER`: Permainan selesai dan menampilkan peringkat.

---

## 8. Authoritative Server & Anti-Cheat (Versi Online)

Untuk Online Multiplayer:
- **Server-Authoritative:** Server yang menentukan hasil acak dadu (`crypto.getRandomValues`) dan memvalidasi setiap perintah langkah bidak. Client hanya mengirim intent `ROLL_DICE` dan `MOVE_PIECE(pieceId)`.
- **State Broadcast:** Server membroadcast snapshot `GameState` terbaru ke semua client terhubung di room yang sama.
- **Anti-Manipulation:** Client tidak dapat mengubah posisi bidak, menipu dadu, atau memintas giliran.

---

## 9. UI/UX Design & Responsive Layout

- **Modern Glassmorphism UI:** Panel semi-transparan, efek backdrop blur, aksen warna neon per pemain.
- **Full Responsive:** Berjalan lancar di Desktop, Tablet, dan Smartphone (Portrait & Landscape).
- **Sound & Audio Controls:** Pengaturan independen untuk SFX Volume, Music Volume, dan Mute.
- **Statistics & Achievements:** Riwayat permainan, win rate, total capture, fastest win, dan piala pencapaian tersimpan di LocalStorage / Profile.

---

## 10. Prioritas Implementasi

1. **Core Board & Logical Engine:** Modular board mapping, state machine, dan rule engine (bisa dijalankan offline & server online).
2. **Next.js UI & Layout App:** Setup App Router, Tailwind CSS, Ludo Board Component, Animated Dice Component, Player Panels.
3. **Offline Playability:** Pass & Play mode dan Bot AI (Easy, Medium, Hard).
4. **Real-time Socket Server & Online Mode:** Room Manager, Create/Join Room, Socket events, Matchmaking, Reconnect & Bot Takeover.
5. **Interactive Online Extras:** Quick Emotes, Chat, Copy Link Room.
6. **Audio, Animations & Polish:** Sound synthesis, particle/confetti victory, smooth tile-by-tile move transitions.
## 47. Multiplayer Online dan Offline (ditambahkan)

Versi ini mendukung dua transport room dengan protokol aksi yang sama:

- **Offline antar-tab/perangkat lokal:** memakai `BroadcastChannel`, sehingga beberapa pemain dapat membuka room yang sama di browser yang sama tanpa server.
- **Online:** memakai WebSocket relay. Atur URL WebSocket di konfigurasi deployment; relay hanya meneruskan pesan room dan tidak memutuskan aturan.
- **Host authoritative:** host menjalankan `RuleEngine` yang sama untuk memvalidasi `ROLL_DICE` dan `MOVE_PIECE`, lalu menyiarkan snapshot `GameState` ke semua klien.
- **Client command:** klien hanya mengirim command `HELLO`, `ACTION`, dan menerima `STATE`; klien tidak dapat mengubah state lokal secara sah tanpa validasi host.
- **Reconnect/resume:** state tersimpan melalui autosave; room dapat dibuat ulang dengan kode room yang sama. Snapshot dikirim saat klien baru bergabung.
- **Keamanan untuk online lanjutan:** relay produksi perlu ditambah autentikasi room, rate limit, validasi ukuran payload, server-side RNG, dan otoritas server penuh sebelum dirilis publik.

Implementasi transport berada di `src/network.js`. Command game tetap melewati fungsi `dispatch()` sehingga mode lokal, bot, dan multiplayer memakai aturan yang identik.
