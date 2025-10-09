console.log("--- CHATBOT AI DENGAN GOOGLE GEMINI PRO + SQL SERVER ---");
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB, queryDB } from "./db.js";

dotenv.config();

const app = express();
const port = 3000;

// Validasi API key
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY || API_KEY === "") {
  console.error("❌ GEMINI_API_KEY tidak ditemukan di .env file");
  console.error("Silakan daftar di https://aistudio.google.com/app/apikey");
  console.error("Tambahkan di .env: GEMINI_API_KEY=your_key_here");
  process.exit(1);
}

console.log("✅ API Key ditemukan");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Connect ke database saat startup (dengan graceful error handling)
try {
  await connectDB();
} catch (error) {
  console.log("⚠️ Server tetap berjalan tanpa koneksi database");
  console.log("⚠️ Mode: AI Only (tanpa database)");
}

// Fungsi untuk mencari data dari database berdasarkan pertanyaan
async function searchDatabase(question) {
  try {
    const lowerQuestion = question.toLowerCase();
    let dbResults = [];

    // Deteksi keywords untuk query yang tepat
    // Contoh: cari tabel berdasarkan keyword

    // CONTOH 1: Jika tanya tentang "data" atau "informasi"
    if (lowerQuestion.includes('data') || lowerQuestion.includes('informasi') ||
        lowerQuestion.includes('jumlah') || lowerQuestion.includes('berapa')) {

      // Query untuk mendapatkan list tabel yang tersedia
      const tablesQuery = `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;
      const tables = await queryDB(tablesQuery);

      if (tables && tables.length > 0) {
        dbResults.push({
          type: 'tables_available',
          data: tables.map(t => t.TABLE_NAME),
          description: 'Daftar tabel yang tersedia di database'
        });
      }
    }

    // CONTOH 2: Tambahkan query spesifik sesuai kebutuhan
    // Misalnya jika ada keyword "penduduk"
    if (lowerQuestion.includes('penduduk')) {
      try {
        const pendudukQuery = `SELECT TOP 10 * FROM penduduk ORDER BY id DESC`;
        const pendudukData = await queryDB(pendudukQuery);
        if (pendudukData && pendudukData.length > 0) {
          dbResults.push({
            type: 'penduduk_data',
            data: pendudukData,
            description: 'Data penduduk dari database'
          });
        }
      } catch (err) {
        console.log("⚠️ Tabel penduduk tidak ditemukan atau error:", err.message);
      }
    }

    // CONTOH 3: Query berita
    if (lowerQuestion.includes('berita') || lowerQuestion.includes('news')) {
      try {
        const beritaQuery = `SELECT TOP 10 * FROM berita ORDER BY id DESC`;
        const beritaData = await queryDB(beritaQuery);
        if (beritaData && beritaData.length > 0) {
          dbResults.push({
            type: 'berita_data',
            data: beritaData,
            description: 'Data berita dari database'
          });
        }
      } catch (err) {
        console.log("⚠️ Tabel berita tidak ditemukan atau error:", err.message);
      }
    }

    // CONTOH 4: Query employees (karyawan)
    if (lowerQuestion.includes('karyawan') || lowerQuestion.includes('employee') ||
        lowerQuestion.includes('pegawai') || lowerQuestion.includes('staff')) {
      try {
        // Query dasar untuk semua karyawan
        let employeeQuery = `SELECT TOP 50 * FROM employees ORDER BY last_updated DESC`;

        // Query spesifik berdasarkan keyword
        if (lowerQuestion.includes('department') || lowerQuestion.includes('departemen')) {
          employeeQuery = `
            SELECT department, COUNT(*) as jumlah
            FROM employees
            WHERE department IS NOT NULL
            GROUP BY department
            ORDER BY jumlah DESC
          `;
        } else if (lowerQuestion.includes('status')) {
          employeeQuery = `
            SELECT employmentStatus, COUNT(*) as jumlah
            FROM employees
            WHERE employmentStatus IS NOT NULL
            GROUP BY employmentStatus
          `;
        } else if (lowerQuestion.includes('gender') || lowerQuestion.includes('jenis kelamin')) {
          employeeQuery = `
            SELECT gender, COUNT(*) as jumlah
            FROM employees
            WHERE gender IS NOT NULL
            GROUP BY gender
          `;
        } else if (lowerQuestion.includes('total') || lowerQuestion.includes('jumlah')) {
          employeeQuery = `
            SELECT
              COUNT(*) as total_karyawan,
              COUNT(CASE WHEN gender = 'Male' THEN 1 END) as pria,
              COUNT(CASE WHEN gender = 'Female' THEN 1 END) as wanita,
              COUNT(DISTINCT department) as total_department,
              COUNT(DISTINCT [section]) as total_section
            FROM employees
          `;
        }

        const employeeData = await queryDB(employeeQuery);
        if (employeeData && employeeData.length > 0) {
          dbResults.push({
            type: 'employee_data',
            data: employeeData,
            description: 'Data karyawan dari database Cladtek',
            query_type: lowerQuestion.includes('department') ? 'department' :
                       lowerQuestion.includes('status') ? 'status' :
                       lowerQuestion.includes('gender') ? 'gender' :
                       lowerQuestion.includes('total') ? 'summary' : 'list'
          });
        }
      } catch (err) {
        console.log("⚠️ Error query tabel employees:", err.message);
      }
    }

    // CONTOH 5: Query spesifik by name atau badge ID
    if (lowerQuestion.includes('cari') || lowerQuestion.includes('search') ||
        lowerQuestion.includes('nama') || lowerQuestion.includes('badge')) {
      try {
        // Extract nama atau badge dari pertanyaan
        // Contoh: "Cari karyawan nama John" atau "Badge 12345"
        const words = lowerQuestion.split(' ');
        const nameOrBadge = words[words.length - 1]; // ambil kata terakhir sebagai keyword

        if (nameOrBadge.length > 2) { // minimal 3 karakter
          const searchQuery = `
            SELECT TOP 10 *
            FROM employees
            WHERE name LIKE '%${nameOrBadge}%'
               OR badgeId LIKE '%${nameOrBadge}%'
               OR email LIKE '%${nameOrBadge}%'
            ORDER BY last_updated DESC
          `;
          const searchData = await queryDB(searchQuery);
          if (searchData && searchData.length > 0) {
            dbResults.push({
              type: 'employee_search',
              data: searchData,
              description: `Hasil pencarian karyawan dengan keyword: ${nameOrBadge}`
            });
          }
        }
      } catch (err) {
        console.log("⚠️ Error pencarian employees:", err.message);
      }
    }

    return dbResults;
  } catch (error) {
    console.error("❌ Error searching database:", error.message);
    return [];
  }
}

// Fungsi untuk call AI dengan konteks dari database (HYBRID SYSTEM)
async function callAI(userMessage) {
  try {
    // 1. Cari data dari database terlebih dahulu
    console.log("🔍 Mencari data dari database...");
    const dbResults = await searchDatabase(userMessage);

    // 2. Buat prompt dengan konteks database
    let contextPrompt = userMessage;

    if (dbResults.length > 0) {
      console.log(`✅ Ditemukan ${dbResults.length} hasil dari database`);

      // Tambahkan konteks database ke prompt
      contextPrompt = `
Kamu adalah AI assistant dari Cladtek yang memiliki akses ke database lokal.

Pertanyaan user: ${userMessage}

Data dari database yang relevan:
${JSON.stringify(dbResults, null, 2)}

Instruksi:
1. Gunakan data dari database di atas untuk menjawab pertanyaan user
2. Jika data tidak mencukupi, gunakan pengetahuan umummu
3. Berikan jawaban yang informatif dan mudah dipahami
4. Jika ada data dalam bentuk tabel/array, ringkas menjadi informasi yang mudah dibaca
5. Selalu sebutkan bahwa data berasal dari database internal Cladtek

Jawab dengan bahasa Indonesia yang natural dan profesional:
`;
    } else {
      console.log("ℹ️ Tidak ada data relevan dari database, menggunakan AI saja");
      contextPrompt = `Kamu adalah AI assistant dari Cladtek. ${userMessage}`;
    }

    // 3. Kirim ke Gemini AI
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Error calling Gemini:", error.message);
    throw error;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    console.log("\n💬 User:", question);
    const answer = await callAI(question);
    console.log("🤖 AI:", answer.substring(0, 100) + "...\n");
    res.json({ answer });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Maaf, terjadi kesalahan saat memproses permintaan Anda." });
  }
});

app.listen(port, () => {
  console.log("=".repeat(60));
  console.log("✅ Server berjalan di http://localhost:3000");
  console.log("✅ AI Model: Google Gemini 2.5 Flash (Direct API)");
  console.log("✅ Mode: HYBRID - Database + AI");
  console.log(`✅ Database: SQL Server - ${process.env.DB_DATABASE}`);
  console.log("✅ Sistem RAG (Retrieval Augmented Generation) Aktif");
  console.log("✅ Siap menerima request!");
  console.log("=".repeat(60) + "\n");
});