# 🗄️ Panduan Setup SQL Server untuk Chatbot Hybrid

## ✅ Status Saat Ini

- ✅ Package `mssql` sudah terinstall
- ✅ File `db.js` sudah dibuat untuk koneksi database
- ✅ File `.env` sudah dikonfigurasi dengan credentials SQL Server
- ✅ File `app.js` sudah dimodifikasi untuk sistem HYBRID (Database + AI)
- ⚠️ **Koneksi database belum berhasil** - Server tetap running dalam mode "AI Only"

---

## ❌ Error yang Terjadi

```
Error koneksi SQL Server: Failed to connect to CBML-IT026:1433
ECONNREFUSED 127.0.1.1:1433
```

**Artinya:** Node.js tidak bisa connect ke SQL Server di hostname `CBML-IT026`

---

## 🔧 Solusi untuk Fix Koneksi Database

### **1. Cek SQL Server sedang Running**

Buka **SQL Server Configuration Manager** di Windows:
- Pastikan **SQL Server (MSSQLSERVER)** atau instance Anda sedang running
- Restart service jika perlu

### **2. Enable TCP/IP di SQL Server**

SQL Server Configuration Manager → **SQL Server Network Configuration** → **Protocols for MSSQLSERVER**:
- Klik kanan **TCP/IP** → Enable
- Restart SQL Server service

### **3. Cek Port 1433**

SQL Server Configuration Manager → **SQL Server Network Configuration** → **Protocols for MSSQLSERVER** → TCP/IP → **Properties** → **IP Addresses**:
- Scroll ke bawah sampai **IPALL**
- Pastikan **TCP Port** = `1433`
- Kosongkan **TCP Dynamic Ports**
- Restart SQL Server service

### **4. Gunakan IP Address Windows (PENTING untuk WSL)**

Karena Anda menggunakan WSL (Windows Subsystem for Linux), hostname Windows mungkin tidak bisa diresolve dari Linux.

**Cara mendapatkan IP Windows:**

Di **Command Prompt** atau **PowerShell** Windows, jalankan:
```cmd
ipconfig
```

Cari **IPv4 Address** di adapter Ethernet/WiFi, contoh:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Update file `.env` dengan IP tersebut:**
```env
DB_SERVER=192.168.1.100
```

**ATAU gunakan localhost Windows dari WSL:**
```env
DB_SERVER=localhost
```

### **5. Firewall Windows**

Buka **Windows Defender Firewall** → **Advanced Settings** → **Inbound Rules**:
- Buat rule baru untuk port **1433 TCP**
- Allow connection

### **6. SQL Server Authentication**

Pastikan SQL Server menggunakan **Mixed Mode Authentication**:

**SQL Server Management Studio (SSMS)**:
1. Klik kanan Server → **Properties**
2. Pilih **Security**
3. Server authentication → pilih **SQL Server and Windows Authentication mode**
4. Restart SQL Server service

### **7. Cek User Permission**

Di SSMS, pastikan user `nur.iswanto` memiliki akses ke database `global_dashboard`:
- Expand **Security** → **Logins** → `nur.iswanto`
- Klik kanan → **Properties** → **User Mapping**
- Centang database `global_dashboard`
- Beri role: `db_datareader` dan `db_datawriter`

---

## 🧪 Test Koneksi Manual

Setelah melakukan perubahan di atas, test koneksi dengan cara:

### **Dari Windows (menggunakan SSMS):**
```
Server: CBML-IT026,1433
atau
Server: localhost,1433
atau
Server: 192.168.1.100,1433

Authentication: SQL Server Authentication
Login: nur.iswanto
Password: Cladtek@2020
```

### **Dari WSL/Linux (menggunakan Node.js):**

Edit file `.env` sesuai IP yang berhasil di SSMS, lalu restart server:
```bash
npm start
```

**Jika berhasil, Anda akan melihat:**
```
✅ Koneksi SQL Server berhasil!
✅ Database: global_dashboard
```

---

## 📊 Cara Kerja Sistem Hybrid

### **1. User bertanya → Bot cari di database dulu**
```
User: "Berapa jumlah penduduk?"
↓
System: Query ke tabel `penduduk` di SQL Server
↓
System: Kirim hasil + pertanyaan ke Gemini AI
↓
AI: Berikan jawaban dengan konteks dari database
```

### **2. Keyword Detection**
Bot akan otomatis detect keyword dan query tabel yang sesuai:
- **"penduduk"** → Query tabel `penduduk`
- **"berita"** / **"news"** → Query tabel `berita`
- **"data"** / **"informasi"** → Query list semua tabel

### **3. Tambah Query Custom**

Edit file `app.js` di fungsi `searchDatabase()` (baris 33-103):

**Contoh menambahkan query untuk "event":**
```javascript
// CONTOH 4: Query event
if (lowerQuestion.includes('event') || lowerQuestion.includes('acara')) {
  try {
    const eventQuery = `SELECT TOP 10 * FROM events ORDER BY tanggal DESC`;
    const eventData = await queryDB(eventQuery);
    if (eventData && eventData.length > 0) {
      dbResults.push({
        type: 'event_data',
        data: eventData,
        description: 'Data event dari database'
      });
    }
  } catch (err) {
    console.log("⚠️ Tabel events tidak ditemukan:", err.message);
  }
}
```

---

## 🎯 Contoh Penggunaan Setelah Database Connect

### **Pertanyaan User:**
> "Tampilkan data penduduk terbaru"

### **Response Bot:**
> Berdasarkan database internal Cladtek, berikut adalah data penduduk terbaru:
>
> 1. Nama: John Doe, Umur: 25, Alamat: Jakarta
> 2. Nama: Jane Smith, Umur: 30, Alamat: Bandung
> ...
>
> Total data: 10 records dari tabel penduduk

---

## 🚀 Next Steps

1. **Fix koneksi database** dengan mengikuti panduan di atas
2. **Sesuaikan query** di `app.js` sesuai struktur tabel database Anda
3. **Test dengan pertanyaan** yang relevan dengan data Anda
4. **Tambah keyword detection** untuk tabel lain yang ada di database

---

## 📝 File yang Dibuat/Dimodifikasi

| File | Status | Keterangan |
|------|--------|------------|
| `package.json` | ✅ Modified | Ditambahkan `mssql` dependency |
| `.env` | ✅ Modified | Ditambahkan konfigurasi SQL Server |
| `db.js` | ✅ Created | File koneksi database |
| `app.js` | ✅ Modified | Sistem hybrid dengan RAG |
| `DATABASE_SETUP.md` | ✅ Created | Dokumentasi setup (file ini) |

---

## 💡 Tips

- **Jika koneksi database gagal**, server tetap bisa jalan dalam mode "AI Only"
- **Gunakan IP address** bukan hostname untuk koneksi dari WSL
- **Test koneksi** dari SSMS dulu sebelum test dari Node.js
- **Cek log** di console untuk troubleshooting

---

**Last Updated:** 9 Oktober 2025
**Status:** ⚠️ Waiting for database connection
**Mode Saat Ini:** AI Only (Hybrid akan aktif setelah database connected)
