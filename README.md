# 🏍️ Anjem Kuy — Antar Jemput Malang

Aplikasi web booking layanan antar-jemput motor (Yamaha Aerox 155cc) untuk pelajar di Malang.

---

## ✨ Fitur

### Halaman Publik
- Pencarian alamat akurat via **Mapbox + OpenStreetMap** (jemput & tujuan pakai sistem yang sama)
- Tombol **"Lokasi Saya Saat Ini"** via GPS
- Pilih lokasi lewat **peta interaktif** (klik atau geser marker)
- Kalkulasi jarak & harga **otomatis**
- Slot waktu **otomatis terkunci/terbuka** sesuai status
- Pembayaran **QRIS DANA** atau **Cash / Tunai**
- Kirim pesanan langsung via **WhatsApp**

### Admin Dashboard
- Statistik hari ini — pending / selesai / batal
- **Auto-unlock slot** setelah durasi + 20 menit buffer habis
- **Cancel booking** dengan catatan alasan
- Filter riwayat: Semua · Hari Ini · Pending · Selesai · Dibatalkan
- Kelola slot manual (kunci/hapus)
- Ganti nomor WhatsApp & PIN admin
- Sidebar responsif (collapse di mobile)

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Mapbox (opsional, untuk akurasi alamat lebih baik)

Daftar gratis di [account.mapbox.com](https://account.mapbox.com/auth/signup/), buat token dengan scope `search:read`, lalu tambahkan ke `.env`:

```env
REACT_APP_MAPBOX_TOKEN=pk.your-token-here
```

> Tanpa token, app tetap jalan dengan OpenStreetMap sebagai fallback.

### 3. Setup Firebase

- Buat project di [Firebase Console](https://console.firebase.google.com)
- Register Web App, copy config ke `src/firebaseConfig.js`
- Aktifkan **Firestore Database** (lokasi: `asia-southeast2`)
- Set Firestore Rules:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /booked_slots/{docId} {
      allow read, write: if true;
    }
  }
}
```

### 4. Konfigurasi awal

Edit `src/AnjemKuy.jsx`:
```js
const WA_NUMBER = "628xxxxxxxxxx"; // nomor WhatsApp kamu
```

Edit `src/admin/AdminAuthContext.jsx`:
```js
const ADMIN_PIN = "1234"; // ganti PIN yang aman
```

### 5. Jalankan
```bash
npm start        # development → http://localhost:3000
npm run build    # production build
```

---

## 💰 Tarif

### Biaya Jemput (rider → lokasi customer)
| Jarak | Biaya |
|---|---|
| 0 – 1,5 km | Gratis |
| 1,5 – 4 km | Rp 3.000 |
| 4 – 6 km | Rp 5.000 |
| 6 – 8 km | Rp 7.000 |
| 8 – 10 km | Rp 9.000 |
| > 10 km | Rp 10.000 + Rp 1.000/km |

### Biaya Tujuan (lokasi jemput → tujuan)
| Jarak | Biaya |
|---|---|
| 0 – 2 km | Rp 6.000 |
| 2 – 4 km | Rp 9.000 |
| 4 – 6 km | Rp 12.000 |
| 6 – 8 km | Rp 15.000 |
| 8 – 10 km | Rp 18.000 |
| 10 – 12 km | Rp 22.000 |
| 12 – 15 km | Rp 28.000 |
| > 15 km | Rp 28.000 + Rp 2.000/km |

**Total = Biaya Jemput + Biaya Tujuan**

---

## ⏰ Sistem Slot

- Operasional 24 jam, interval 10 menit
- Buffer 20 menit setelah durasi selesai
- Slot dengan status `pending` = terkunci
- Slot `selesai` atau `batal` = langsung tersedia lagi
- **Auto-unlock**: sistem cek setiap 2 menit, slot otomatis jadi `selesai` setelah waktu habis

---

## 🗂️ Struktur Firestore

```js
// Collection: booked_slots
{
  tanggal: "2026-08-13",
  jamMulai: "08:00",
  durasiMenit: 60,
  status: "pending", // "pending" | "selesai" | "batal"
  nama: "John Doe",
  lokasiJemput: "Jl. Veteran No.1",
  lokasiTujuan: "Universitas Brawijaya",
  totalHarga: 15000,
  createdAt: "2026-08-13T08:00:00Z",

  // Field tambahan (opsional)
  autoCompleted: true,
  completedAt: "2026-08-13T09:20:00Z",
  cancelReason: "Customer tidak datang",
  cancelledAt: "2026-08-13T08:30:00Z",
  updatedAt: "2026-08-13T08:30:00Z"
}
```

---

## 🎨 Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 19 + React Router |
| UI | Bootstrap 5 + Bootstrap Icons |
| Database | Firebase Firestore |
| Maps | Mapbox Search Box API + Leaflet + OSM + OSRM |
| Styling | Inline styles (dark theme) |
| Integrasi | WhatsApp Web API |

---

## 📂 Struktur Folder

```
anjemkuy/
├── public/
│   ├── index.html
│   └── Qris.jpeg              # Gambar QRIS untuk pembayaran
├── src/
│   ├── admin/
│   │   ├── AdminAuthContext.jsx
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   ├── components/
│   │   ├── PlacesAutocomplete.jsx  # Mapbox + OSM hybrid
│   │   └── MapPicker.jsx           # Peta interaktif + routing
│   ├── hooks/
│   │   └── useDistanceMatrix.js
│   ├── AnjemKuy.jsx
│   ├── App.js
│   ├── firebaseConfig.js
│   └── index.js
├── .env                       # Mapbox token (tidak di-commit)
├── .env.example               # Template .env
├── MAPBOX_SETUP.md
└── README.md
```

---

## 🔒 Checklist Produksi

- [ ] Ganti PIN admin dari default `1234`
- [ ] Update nomor WhatsApp di settings
- [ ] Batasi Firestore Rules (require auth untuk write)
- [ ] Tambahkan domain restriction di Mapbox token
- [ ] Enable HTTPS di hosting

---

## 🌐 Deploy ke Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public dir: build, SPA: yes
npm run build
firebase deploy --only hosting
```

---

## 🐛 Troubleshooting

**Autocomplete tidak muncul**
→ Cek koneksi internet, minimal 3 karakter, verifikasi Mapbox token di `.env`

**Gambar QRIS tidak muncul**
→ Pastikan `Qris.jpeg` ada di folder `public/`

**Auto-unlock tidak berjalan**
→ Cek console browser untuk log, pastikan koneksi Firebase stabil

**Slot tidak update real-time**
→ Cek koneksi Firestore, lihat error di console browser

**Admin PIN ditolak**
→ Clear cache browser, cek `sessionStorage` di DevTools

---

## 📄 License

MIT — bebas digunakan untuk keperluan personal maupun komersial.
