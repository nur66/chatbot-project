# 🤖 AI Chatbot dengan Google Gemini 2.5 Flash

## 📋 Deskripsi Project

Project ini adalah aplikasi **chatbot berbasis web** yang menggunakan **Google Gemini 2.5 Flash API** untuk memberikan respons AI yang cerdas dan natural. Chatbot dapat menjawab berbagai pertanyaan umum tentang teknologi, programming, pengetahuan umum, dan topik lainnya.

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Node.js** | Latest | Runtime JavaScript |
| **Express.js** | ^5.1.0 | Web framework untuk API |
| **Google Generative AI** | ^0.24.1 | SDK untuk Gemini API |
| **dotenv** | ^17.2.3 | Environment variable management |
| **HTML/CSS/JavaScript** | - | Frontend chatbot interface |

---

## 📁 Struktur Project

```
project/
├── app.js              # Server backend dengan Express.js
├── index.html          # Frontend chatbot interface
├── .env                # Environment variables (API Key)
├── package.json        # Dependencies dan scripts
├── Claude.md           # Dokumentasi project
└── data/               # Folder untuk data JSON (opsional)
    ├── databerita.json
    ├── dataevent.json
    ├── datapenduduk.json
    ├── datafasilitas.json
    └── dataekonomi.json
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Dapatkan API Key Google Gemini

1. Buka: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Login dengan akun Google Anda
3. Klik **"Create API Key"**
4. Copy API key yang dihasilkan

### 3. Konfigurasi Environment Variable

Buat file `.env` di root project:

```env
GEMINI_API_KEY=your_api_key_here
```

**Contoh:**
```env
GEMINI_API_KEY=AIzaSyCDwbZuYxaZBbIX-_XI3RdulXy_nITkISY
```

### 4. Jalankan Server

```bash
npm start
```

Server akan berjalan di: **http://localhost:3000**

---

## 🔄 Flow Diagram (Mermaid.js)

### Alur Sistem Chatbot

```mermaid
flowchart TD
    Start([User Membuka Browser]) --> OpenURL[Akses http://localhost:3000]
    OpenURL --> LoadHTML[Load index.html]
    LoadHTML --> ShowUI[Tampilkan Chat Interface]
    ShowUI --> UserInput{User Mengetik Pertanyaan}

    UserInput --> SendRequest[POST /api/chat]
    SendRequest --> Backend[Express.js Backend]

    Backend --> ValidateKey{API Key Valid?}
    ValidateKey -->|No| ErrorKey[Return Error: API Key Invalid]
    ValidateKey -->|Yes| CallGemini[Call Google Gemini API]

    CallGemini --> GeminiAPI[(Google Gemini 2.5 Flash API)]
    GeminiAPI --> ProcessAI[AI Memproses Pertanyaan]
    ProcessAI --> GenerateAnswer[Generate Jawaban]

    GenerateAnswer --> ReturnJSON[Return JSON Response]
    ReturnJSON --> Frontend[Frontend Menerima Response]
    Frontend --> DisplayAnswer[Tampilkan Jawaban di Chat]

    DisplayAnswer --> UserInput

    ErrorKey --> Frontend

    style Start fill:#e1f5e1
    style GeminiAPI fill:#fff3cd
    style DisplayAnswer fill:#d1ecf1
    style ErrorKey fill:#f8d7da
```

### Detail Proses Backend

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Express
    participant Gemini API

    User->>Browser: Ketik pertanyaan
    Browser->>Express: POST /api/chat {question}

    Express->>Express: Validasi request
    Express->>Express: Load API Key dari .env

    alt API Key tidak ada
        Express->>Browser: Error 500
        Browser->>User: Tampilkan error
    else API Key valid
        Express->>Gemini API: generateContent(question)
        Gemini API->>Gemini API: Proses dengan AI Model
        Gemini API->>Express: Return AI Response
        Express->>Browser: JSON {answer}
        Browser->>User: Tampilkan jawaban
    end
```

### Arsitektur Sistem

```mermaid
graph TB
    subgraph "Frontend"
        HTML[index.html]
        CSS[Styling]
        JS[JavaScript Client]
    end

    subgraph "Backend - Node.js"
        Express[Express Server :3000]
        EnvConfig[dotenv Config]
        GenAI[GoogleGenerativeAI SDK]
    end

    subgraph "External API"
        Gemini[Google Gemini 2.5 Flash]
    end

    HTML --> JS
    CSS --> HTML
    JS -->|POST /api/chat| Express
    Express --> EnvConfig
    EnvConfig -->|GEMINI_API_KEY| GenAI
    GenAI -->|API Request| Gemini
    Gemini -->|AI Response| GenAI
    GenAI --> Express
    Express -->|JSON Response| JS
    JS --> HTML

    style Frontend fill:#e3f2fd
    style Backend fill:#fff3e0
    style External fill:#f3e5f5
```

---

## 💡 Cara Penggunaan

1. **Buka browser** dan akses `http://localhost:3000`
2. **Ketik pertanyaan** di input box
3. **Klik "Kirim"** atau tekan Enter
4. **AI akan menjawab** pertanyaan Anda dalam beberapa detik

### Contoh Pertanyaan:

- "Apa itu AI?"
- "Jelaskan tentang machine learning"
- "Cara belajar programming untuk pemula?"
- "Buatkan puisi tentang teknologi"
- "Perbedaan Python dan JavaScript"

---

## 🔧 Konfigurasi

### File: `app.js`

```javascript
// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
```

**Model yang tersedia:**
- `gemini-2.5-flash` (Recommended - Terbaru)
- `gemini-2.0-flash`
- `gemini-2.5-flash-lite`

### Port Configuration

Default port: `3000`

Untuk mengubah port, edit di `app.js`:

```javascript
const port = 3000; // Ganti dengan port yang diinginkan
```

---

## 🐛 Troubleshooting

### 1. Error: API Key tidak ditemukan

**Solusi:**
- Pastikan file `.env` ada di root project
- Pastikan format: `GEMINI_API_KEY=your_key_here`
- Restart server setelah menambahkan API key

### 2. Error: Model not found (404)

**Solusi:**
- Pastikan menggunakan model yang valid: `gemini-2.5-flash`
- Update library: `npm install @google/generative-ai@latest`

### 3. Error: Rate Limited (429)

**Solusi:**
- Tunggu beberapa menit
- Gunakan API key Pro untuk quota lebih besar
- Atau ganti model ke yang kurang populer

### 4. Server tidak bisa diakses

**Solusi:**
- Pastikan server sudah running (`npm start`)
- Cek console untuk error messages
- Pastikan port 3000 tidak digunakan aplikasi lain

---

## 📊 API Endpoints

### 1. GET `/`

Menampilkan halaman chatbot interface

**Response:** HTML page

---

### 2. POST `/api/chat`

Mengirim pertanyaan ke AI dan mendapatkan jawaban

**Request Body:**
```json
{
  "question": "Apa itu AI?"
}
```

**Response:**
```json
{
  "answer": "AI adalah kecerdasan buatan yang..."
}
```

**Error Response:**
```json
{
  "error": "Maaf, terjadi kesalahan saat memproses permintaan Anda."
}
```

---

## 🔐 Keamanan

⚠️ **PENTING:**

1. **Jangan commit file `.env`** ke repository
2. Tambahkan `.env` ke `.gitignore`
3. Jangan share API key secara publik
4. Gunakan environment variables untuk production

**.gitignore:**
```
node_modules/
.env
package-lock.json
```

---

## 📈 Upgrade ke Production

### Menggunakan PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start app.js --name "chatbot-ai"

# Auto restart on server reboot
pm2 startup
pm2 save
```

### Environment Variables di Production

```bash
# Jangan gunakan file .env di production
# Set environment variable langsung di server:
export GEMINI_API_KEY=your_api_key_here
```

---

## 🎯 Features

✅ **AI Chatbot Real-time** - Respon cepat dan akurat
✅ **Google Gemini 2.5 Flash** - Model AI terbaru dari Google
✅ **Simple UI** - Interface yang clean dan user-friendly
✅ **RESTful API** - Easy to integrate
✅ **Error Handling** - Proper error messages
✅ **Environment Config** - Secure API key management

---

## 📝 Changelog

### v1.0.0 (2025-10-09)

✨ **Initial Release**
- Integrasi dengan Google Gemini 2.5 Flash API
- Chatbot interface dengan HTML/CSS/JavaScript
- Express.js backend server
- Environment variable configuration
- Error handling dan validation
- Full documentation

**Bug Fixes:**
- ✅ Fix model name dari `gemini-1.5-flash` → `gemini-2.5-flash`
- ✅ Fix library compatibility issues
- ✅ Proper API key validation

---

## 🤝 Kontributor

- **Developer:** Claude (AI Assistant)
- **Project Owner:** [Your Name]

---

## 📄 License

MIT License - Free to use and modify

---

## 🔗 Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/)

---

## 💬 Support

Untuk pertanyaan atau masalah, silakan:
1. Baca dokumentasi ini terlebih dahulu
2. Cek section Troubleshooting
3. Review console logs untuk error details

---

**Last Updated:** 9 Oktober 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
