console.log("--- CHATBOT AI DENGAN GOOGLE GEMINI PRO ---");
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Fungsi untuk call AI
async function callAI(userMessage) {
  try {
    const result = await model.generateContent(userMessage);
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
  console.log("✅ Mode: AI Direct - Chatbot Umum");
  console.log("✅ Menggunakan quota akun Pro Anda");
  console.log("✅ Siap menerima request!");
  console.log("=".repeat(60) + "\n");
});