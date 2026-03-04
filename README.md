# KasFlow 💰

Aplikasi manajemen kas kolektif untuk bendahara organisasi, komunitas, dan kelas — dilengkapi dengan **AI Assistant (KasBot)** berbasis Google Gemini.

## 🚀 Fitur

- **Dashboard** — Ringkasan total kas, tagihan aktif, dan anggota
- **Manajemen Grup** — Buat dan kelola grup anggota
- **Tagihan** — Buat tagihan, aktifkan, kirim email otomatis, dan lacak pembayaran
- **KasBot AI** — AI Assistant yang bisa menjawab pertanyaan seputar kas secara natural, menganalisis pola pembayaran, kirim reminder, dan buat tagihan langsung dari chat

---

## ⚙️ Setup Project

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi Environment Variables

Buat file `.env` di root project dan isi variabel berikut:

```env
# Supabase
VITE_SUPABASE_URL=          # URL project Supabase kamu
VITE_SUPABASE_ANON_KEY=     # Anon key Supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=  # Service role key (untuk fungsi admin)

# Mayar (payment gateway)
VITE_MAYAR_API_KEY=         # API Key dari dashboard Mayar.id
VITE_MAYAR_WEBHOOK_SECRET=  # Webhook secret dari Mayar.id

# App
VITE_APP_URL=               # URL aplikasi (contoh: https://kasflow-rho.vercel.app/)

# Google Gemini AI — untuk fitur KasBot AI Assistant
VITE_GEMINI_API_KEY=        # Lihat cara mendapatkan di bawah
```

---

### 🤖 Cara Mendapatkan Gemini API Key (Gratis)

**KasBot AI** membutuhkan API Key dari Google AI Studio.

1. Buka **[aistudio.google.com](https://aistudio.google.com)**
2. Login dengan akun Google
3. Klik **"Get API Key"** → **"Create API key"**
4. Pilih project Google Cloud (atau buat baru)
5. Copy API key yang dihasilkan
6. Paste ke `.env`:
   ```
   VITE_GEMINI_API_KEY=AIza...kunci_kamu...
   ```

**Free Tier Gemini API:**
| Limit | Jumlah |
|-------|--------|
| Request per menit | 15 RPM |
| Request per hari | 1.500 RPD |
| Token per menit | 1.000.000 TPM |

> Model yang digunakan: `gemini-1.5-flash` (cepat dan gratis untuk development)

---

### 3. Jalankan Development Server

```bash
npm run dev
```

---

## 🌐 Deploy ke Vercel

Saat deploy ke Vercel, tambahkan **semua variabel di atas** ke **Vercel Dashboard → Project Settings → Environment Variables**, termasuk `VITE_GEMINI_API_KEY`.

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** Shadcn/ui + Tailwind CSS
- **Backend / DB:** Supabase (PostgreSQL + Auth)
- **Payment:** Mayar.id
- **Email:** Resend
- **AI:** Google Gemini 1.5 Flash (Function Calling)
