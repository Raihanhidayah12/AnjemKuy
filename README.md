# 🏍️ Anjem Kuy - Antar Jemput Malang

Aplikasi web booking layanan antar-jemput motor (Yamaha Aerox 155cc) untuk pelajar di Malang.

---

## ✨ Fitur Utama

### 🎯 Landing Page (Public)
- **🗺️ Mapbox + OpenStreetMap Integration** - Pencarian alamat akurat dengan Mapbox Search Box API (100k gratis/bulan) + fallback OSM
- **📍 Unified Geocoding System** - Semua input lokasi (jemput/tujuan/GPS/map) menggunakan sistem yang sama
- **Auto Distance Calculation** - Jarak otomatis via OSRM routing  
- **Real-time Duration** - Estimasi waktu akurat berdasarkan jarak
- **Smart Pricing Engine** - Kalkulasi harga otomatis berdasarkan jarak
- **🔄 Auto-Unlock Slots** - Slot otomatis available setelah durasi + buffer selesai
- **Real-time Slot Blocking** - Slot waktu otomatis disabled saat sudah terisi
- **WhatsApp Integration** - Order langsung via WhatsApp dengan link lokasi
- **Dual Payment** - QRIS DANA atau Cash/Tunai
- **Responsive Design** - Mobile-first, dark theme Yamaha Aerox

### 🔐 Admin Dashboard
- **Dashboard Overview** - Statistik hari ini (pending/selesai/batal breakdown, auto-unlock count)
- **🔄 Auto-Unlock System** - Slot otomatis selesai setelah durasi + 20min buffer
- **🚫 Enhanced Cancel System** - Cancel booking dengan alasan, timestamp tracking
- **📊 Advanced Filters** - Semua/Hari Ini/Pending/Selesai/Dibatalkan dengan smart counters
- **Slot Management** - Kunci/unlock slot waktu dengan durasi custom
- **Booking History** - Riwayat lengkap dengan enhanced status management
- **Settings Panel** - Ganti PIN admin & nomor WhatsApp
- **Responsive Layout** - Sidebar collapse di mobile dengan hamburger menu
- **Real-time Sync** - Data langsung update dari Firestore dengan auto-unlock monitoring

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ dan npm
- Firebase account & project

### Installation

1. **Clone/Download project ini**
   ```bash
   cd anjemkuy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Maps API (2 Options)**

   **🏆 Option A: Mapbox (Recommended - More Accurate)**
   
   a. **Create free Mapbox account:**
   - Visit https://account.mapbox.com/auth/signup/
   - Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
   
   b. **Create API token:**
   - Click **"Create a token"**
   - Name: `AnjemKuy-Production`
   - Required scopes: ✅ `styles:read`, ✅ `fonts:read`, ✅ `datasets:read`, ✅ `geocoding:read`, ✅ `search:read`
   - Copy token (starts with `pk.`)
   
   c. **Add to .env:**
   ```bash
   # Mapbox (100k requests/month free)
   REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here
   ```
   
   **📱 Option B: Google Maps (Fallback jika Mapbox tidak mau)**
   
   a. **Google Cloud Console setup:**
   - Open https://console.cloud.google.com
   - Create new project, enable billing ($200 free tier)
   
   b. **Enable APIs:**
   - Places API, Distance Matrix API, Maps JavaScript API
   
   c. **Create API Key & add to .env:**
   ```bash
   # Google Maps (paid after free tier)
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
   ```

   > **💡 Tanpa setup API?** App tetap jalan dengan OpenStreetMap gratis (akurasi lebih rendah)

4. **Setup Firebase**
   - Buka [Firebase Console](https://console.firebase.google.com)
   - Buat project baru atau gunakan existing
   - Register Web App → copy config
   - Edit `src/firebaseConfig.js`:
     ```js
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       // ... dst
     };
     ```

4. **Aktifkan Firestore**
   - Di Firebase Console → Firestore Database
   - Create Database
   - **Lokasi:** `asia-southeast2 (Jakarta)`
   - **Mode:** Start in test mode
   - **Rules:** Ganti dengan:
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

   **Firestore Data Structure:**
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
     
     // Enhanced fields for new features
     autoCompleted: true, // (optional) untuk auto-unlock
     completedAt: "2026-08-13T09:20:00Z", // (optional)
     cancelReason: "Customer tidak datang", // (optional)
     cancelledAt: "2026-08-13T08:30:00Z", // (optional)
     updatedAt: "2026-08-13T08:30:00Z" // (optional)
   }
   ```

5. **Konfigurasi App**
   
   Edit `src/AnjemKuy.jsx` baris 23:
   ```js
   const WA_NUMBER = "6281234567890"; // ← Ganti nomor WhatsApp kamu
   ```

   Edit `src/admin/AdminAuthContext.jsx` baris 23:
   ```js
   const ADMIN_PIN = "1234"; // ← Ganti PIN admin yang aman
   ```

6. **Run Development Server**
   ```bash
   npm start
   ```
   
   App berjalan di `http://localhost:3000`

7. **Build Production**
   ```bash
   npm run build
   ```

---

## 📱 Cara Pakai

### Untuk Customer (Landing Page)

1. Buka `http://localhost:3000`
2. Isi form booking:
   - Nama penumpang
   - **Lokasi jemput** - ketik alamat (Mapbox/OSM), atau klik "Lokasi Saya Saat Ini", atau pilih di peta
   - **Lokasi tujuan** - ketik alamat (Mapbox/OSM) atau pilih di peta
   - Jarak & estimasi waktu **otomatis terhitung** dari routing
   - Pilih jam berangkat (slot yang tersedia - cancelled/completed slots otomatis available)
   - Pilih metode pembayaran (QRIS/Cash)
3. Cek rincian harga otomatis
4. Klik **"Pesan via WhatsApp"**
5. Konfirmasi order lewat WhatsApp (dengan link lokasi)

### Untuk Admin

1. **Login Admin:**
   - Klik link "⚙ admin" di footer landing page
   - Atau langsung ke `http://localhost:3000/admin`
   - Masukkan PIN: `1234` (default)

2. **Monitor Dashboard:**
   - **Enhanced Stats**: Breakdown pending/selesai/batal count
   - **Auto-unlock Monitor**: Lihat berapa slot yang auto-completed
   - **Real-time Counters**: Update otomatis setiap ada perubahan

3. **Kelola Slot:**
   - Sidebar → **"Kelola Slot"**
   - Pilih jam mulai & durasi
   - Klik **"Kunci Slot"**
   - Slot otomatis tersimpan & disabled di form publik
   - **Auto-unlock**: Slot otomatis available setelah durasi + 20min buffer

4. **Kelola Booking:**
   - Sidebar → **"Riwayat Booking"**
   - **Enhanced Filters**: 
     - **Semua** - All bookings
     - **Hari Ini** - Today's bookings
     - **Pending** - Today's active bookings (NEW)
     - **Selesai Hari Ini** - Today's completed (selesai + batal) (NEW)
     - **Dibatalkan** - All cancelled bookings (NEW)
   - **Cancel with Reason**: Klik ❌ → input alasan → confirm
   - **Mark Complete**: Klik ✅ untuk tandai selesai
   - **Status Indicators**: Manual vs Auto completion

5. **Pengaturan:**
   - Sidebar → **"Pengaturan"**
   - Ganti nomor WhatsApp
   - Ganti PIN admin baru
   - Simpan perubahan

---

## 💰 Pricing Engine

### Biaya Jemput (dari rider ke lokasi customer)
| Jarak (KM) | Biaya |
|---|---|
| 0 - 1.5 | Gratis (Rp 0) |
| 1.5 - 4 | Rp 3.000 |
| 4 - 6 | Rp 5.000 |
| 6 - 8 | Rp 7.000 |
| 8 - 10 | Rp 9.000 |
| > 10 | Rp 10.000 + Rp 1.000/km |

### Biaya Tujuan (dari lokasi jemput ke tujuan)
| Jarak (KM) | Biaya |
|---|---|
| 0 - 2 | Rp 6.000 |
| 2 - 4 | Rp 9.000 |
| 4 - 6 | Rp 12.000 |
| 6 - 8 | Rp 15.000 |
| 8 - 10 | Rp 18.000 |
| 10 - 11 | Rp 22.000 |
| 12 - 15 | Rp 28.000 |
| > 15 | Rp 28.000 + Rp 2.000/km |

**Formula:** `Total = Biaya Jemput + Biaya Tujuan`

**Estimasi Durasi:** `(Jarak Jemput + Jarak Tujuan) × 2.5 menit`

---

## ⏰ Smart Slot Management

### **Auto-Unlock System (NEW)**
- **Auto-check**: Setiap 2 menit system cek slot yang expired
- **Buffer time**: Slot + durasi + 20 menit buffer baru di-unlock  
- **Status update**: `pending` → `selesai` dengan flag `autoCompleted: true`
- **Console logging**: Track semua auto-completion di browser console

**Example Auto-Unlock:**
```
Booking: 08:00 - Durasi 60 menit
Auto-unlock time: 08:00 + 60 + 20 = 09:20
Status: Otomatis jadi "selesai" pada 09:20
Result: Slot 08:00-09:20 tersedia lagi untuk booking baru
```

### **Manual Slot Blocking**
- **Jam Operasional:** 24 JAM NON-STOP (00:00 - 23:59 WIB)
- **Interval Slot:** 10 menit (00:00, 00:10, 00:20, dst.)
- **Buffer Operasional:** 20 menit setelah slot selesai
- **Real-time Sync:** Slot update otomatis via Firestore

### **Enhanced Slot Availability**
- **Available**: Slot kosong atau status "selesai"/"batal"
- **Blocked**: Hanya slot dengan status "pending"
- **Auto-Recovery**: Cancelled/completed slots langsung available
- **Smart Filtering**: System otomatis filter slot yang masih aktif

**Contoh:**
Admin kunci slot `08:00` dengan durasi `60 menit`:
- Slot disabled: `08:00` s/d `09:20` (60 + 20 buffer)  
- Customer tidak bisa pilih slot di range tersebut
- Auto-unlock: 09:20 → slot available lagi
- Update langsung tanpa refresh

---

## 🎨 Tech Stack

- **Frontend:** React 19 + React Router
- **UI Framework:** Bootstrap 5 + Bootstrap Icons
- **Database:** Firebase Firestore (real-time) dengan enhanced data structure
- **Maps:** Mapbox Search Box API + OpenStreetMap (Leaflet) + OSRM routing + GPS integration
- **Auto-System:** Auto-unlock slots, real-time monitoring, smart availability  
- **Styling:** Inline styles (dark theme Yamaha Aerox)
- **Integration:** WhatsApp Web API dengan location links

---

## 📂 Struktur Folder

```
anjemkuy/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── admin/
│   │   ├── AdminAuthContext.jsx   # Context auth admin
│   │   ├── AdminLogin.jsx          # Halaman login PIN  
│   │   └── AdminDashboard.jsx      # Dashboard + auto-unlock + cancel system
│   ├── components/
│   │   ├── PlacesAutocomplete.jsx  # Mapbox + OSM hybrid autocomplete
│   │   └── MapPicker.jsx           # Interactive map picker + routing
│   ├── hooks/
│   │   └── useDistanceMatrix.js    # OSRM routing hook
│   ├── AnjemKuy.jsx                # Landing page publik
│   ├── App.js                      # Root router
│   ├── firebaseConfig.js           # Firebase init
│   ├── googleMapsConfig.js         # Google Maps config
│   ├── index.css                   # Global CSS
│   └── index.js                    # Entry point
├── .env                            # Environment variables (API keys)
├── .env.example                    # Template env file
├── package.json
└── README.md
```

---

## 🔒 Security Notes

### Production Checklist:
1. **Ganti PIN admin** dari default `1234`
2. **Update Firestore Rules** untuk validasi yang lebih ketat:
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /booked_slots/{docId} {
         allow read: if true;
         allow write: if request.auth != null; // Requires Firebase Auth
       }
     }
   }
   ```
3. **Protect admin routes** dengan Firebase Authentication
4. **Gunakan environment variables** untuk Firebase config
5. **Enable HTTPS** untuk production deployment

---

## 🌐 Deployment

### Deploy ke Firebase Hosting:

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login Firebase**
   ```bash
   firebase login
   ```

3. **Init Hosting**
   ```bash
   firebase init hosting
   ```
   - Pilih Firebase project kamu
   - Public directory: `build`
   - Single-page app: `Yes`
   - Setup automatic builds: `No`

4. **Build & Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. **Custom Domain** (Opsional)
   - Firebase Console → Hosting → Add custom domain
   - Follow DNS setup instructions

---

## 📝 Customization

### Ganti Warna Theme:
Edit `src/AnjemKuy.jsx` & `src/admin/AdminDashboard.jsx` di bagian `S` (styles object):
- **Primary:** `#ffc107` (Gold Yamaha Aerox)
- **Background:** `#0f1114` (Dark)
- **Card:** `#1e2227`
- **Border:** `#2d3139`

### Ganti Pricing:
Edit `src/AnjemKuy.jsx` fungsi `calcPickupFee()` dan `calcDestFee()`

### Ganti QRIS Image:
Edit `src/AnjemKuy.jsx` baris ~500:
```jsx
<img
  src="https://your-qris-image-url.com/qris.png"
  alt="QRIS DANA"
  style={S.qrisImg}
/>
```

---

## 🐛 Troubleshooting

### Maps tidak muncul atau pencarian tidak akurat
- **Mapbox**: Cek `REACT_APP_MAPBOX_TOKEN` di `.env` sudah benar
- **Quota**: Mapbox 100k/month, cek usage di [dashboard](https://account.mapbox.com/)
- **Fallback**: Jika Mapbox error, otomatis pakai OpenStreetMap
- Clear cache & restart dev server
- Lihat console browser untuk error message

### Autocomplete tidak muncul suggestions
- Cek koneksi internet
- Pastikan minimal 3 karakter diketik
- Jika pakai Mapbox, cek token valid di dashboard
- Fallback ke Nominatim (OSM) jika Mapbox gagal

### Distance calculation error
- Pastikan kedua lokasi (jemput + tujuan) sudah dipilih
- Cek koneksi internet untuk OSRM routing
- Kedua lokasi harus dipilih dari dropdown autocomplete

### Auto-unlock tidak berfungsi
- Cek console browser untuk log auto-unlock activity
- Pastikan Firebase connection stable
- Auto-check interval: 2 menit (normal behavior)
- Slot auto-unlock setelah durasi + 20 menit buffer

### Cancel booking error
- Pastikan admin sudah login dengan PIN yang benar
- Cek koneksi Firestore untuk update operations
- Cancel reason bersifat opsional (bisa kosong)

### Filter tidak menampilkan data yang benar
- Refresh halaman admin dashboard
- Cek filter date logic di console browser
- Pastikan status field di Firestore konsisten

### Firestore error: "Missing or insufficient permissions"
- Cek Firestore Rules sudah di-publish
- Pastikan collection name `booked_slots` sesuai

### Slot tidak update real-time
- Cek koneksi Firebase
- Lihat console browser untuk error Firestore

### Admin PIN tidak diterima
- Clear cache browser
- Cek `sessionStorage` di DevTools

### Mobile sidebar tidak muncul
- Pastikan viewport width benar
- Cek responsive styles di browser DevTools

---

## 📄 License

MIT License - Bebas digunakan untuk personal/commercial

---

## 👨‍💻 Developer

Dibuat dengan ❤️ untuk layanan Anjem Kuy Malang

**Support:**
- WhatsApp: 0812-3456-7890 (ganti dengan nomor asli)
- Email: anjemkuy@gmail.com (ganti)

---

## 🎯 Roadmap & New Features (2026)

### ✅ **Recently Added**
- [x] **Mapbox Integration** - Enhanced address accuracy with 100k free requests/month
- [x] **Auto-Unlock Slots** - Automatic slot availability after duration + buffer ends
- [x] **Enhanced Cancel System** - Cancel bookings with reason tracking & timestamps  
- [x] **Advanced Admin Filters** - Pending/Completed/Cancelled filtering with smart counters
- [x] **Unified Geocoding** - All location inputs use same Mapbox+OSM hybrid system
- [x] **Real-time Monitoring** - Dashboard stats with auto-unlock activity tracking

### 🚀 **Future Enhancements**
- [ ] Firebase Authentication untuk admin (replace PIN system)
- [ ] Export booking history ke Excel/PDF dengan filter options
- [ ] Push notification untuk booking baru & auto-completed slots
- [ ] Customer review & rating system dengan feedback tracking
- [ ] Multi-rider management dengan slot allocation per rider
- [ ] Payment gateway integration (Midtrans/Xendit) untuk online payment
- [ ] GPS tracking real-time untuk live location sharing
- [ ] Bulk operations (multi-select cancel, bulk slot management)
- [ ] Advanced analytics dashboard (cancel rates, peak hours, revenue)
- [ ] Customer mobile app dengan booking history & notifications

---

**Happy coding! 🚀**

## 📋 **Quick Reference**

### **Key Features:**
✅ Mapbox + OSM hybrid geocoding  
✅ Auto-unlock slots after duration  
✅ Enhanced cancel system with reasons  
✅ Advanced admin filters & monitoring  
✅ Unified location input system  
✅ Real-time dashboard statistics  

### **Quick Commands:**
```bash
npm start          # Start development server
npm run build      # Build for production
firebase deploy    # Deploy to Firebase Hosting
```

### **Important Files:**
- `MAPBOX_SETUP.md` - Mapbox integration guide
- `CANCEL_AUTOLOCK_FEATURES.md` - New features documentation  
- `.env` - Environment variables (Mapbox token)
- `src/admin/AdminDashboard.jsx` - Enhanced admin system

### **Support:**
- **WhatsApp**: Update nomor di admin settings
- **Email**: Update di footer landing page  
- **Documentation**: Lihat file MD di root project

---#   A n j e m K u y  
 