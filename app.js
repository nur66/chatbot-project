console.log("--- CHATBOT AI DENGAN GOOGLE GEMINI PRO + SQL SERVER ---");
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB, queryDB, getTableSchema, getSampleData } from "./db.js";
import { buildSQLGenerationPrompt, buildAnswerPrompt } from "./prompts.js";
import { findTableMapping, TABLE_MAPPINGS, filterFieldsByAuth } from "./tableMapping.js";

dotenv.config();

const app = express();
const port = 3000;

// Authorized users untuk debug mode
const AUTHORIZED_USERS = {
  'nur iswanto': {
    password: '5553',
    fullName: 'Nur Iswanto'
  },
  'fernando siboro': {
    password: '4106',
    fullName: 'Fernando Siboro'
  },
  'ah muh rojab': {
    password: '4127',
    fullName: 'Ah muh Rojab'
  }
};

// Session storage untuk conversation history (in-memory)
const sessions = new Map();

// Helper function untuk manage session
function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      history: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      authState: 'none', // 'none', 'pending_password', 'authenticated'
      debugMode: false,
      userName: null
    });
  }
  return sessions.get(sessionId);
}

function addToHistory(sessionId, role, content, metadata = {}) {
  const session = getOrCreateSession(sessionId);
  session.history.push({
    role, // 'user' atau 'assistant'
    content,
    timestamp: new Date(),
    ...metadata
  });
  session.lastActivity = new Date();

  // Keep only last 20 messages untuk efisiensi
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }
}

function getConversationContext(sessionId, limit = 5) {
  const session = sessions.get(sessionId);
  if (!session || session.history.length === 0) {
    return '';
  }

  // Ambil N percakapan terakhir untuk konteks
  const recentHistory = session.history.slice(-limit * 2); // user + assistant

  return recentHistory.map(msg => {
    return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
  }).join('\n');
}

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
let employeesSchema = null;
let employeesSample = null;
let obcardSchema = null;
let obcardSample = null;
const tableSchemas = new Map(); // Store all table schemas

try {
  await connectDB();

  // Load schema untuk semua mapped tables
  console.log("📊 Loading table schemas...");

  for (const mapping of TABLE_MAPPINGS) {
    try {
      const schema = await getTableSchema(mapping.tableName);
      const sample = await getSampleData(mapping.tableName, 2);

      if (schema && schema.length > 0) {
        tableSchemas.set(mapping.tableName, {
          schema,
          sample,
          mapping
        });
        console.log(`✅ ${mapping.tableName}: ${schema.length} columns`);
      }
    } catch (err) {
      console.log(`⚠️ ${mapping.tableName}: tidak ditemukan atau error`);
    }
  }

  // Keep legacy variables for backward compatibility
  if (tableSchemas.has('employees')) {
    employeesSchema = tableSchemas.get('employees').schema;
    employeesSample = tableSchemas.get('employees').sample;
  }

  if (tableSchemas.has('RecordOBCard')) {
    obcardSchema = tableSchemas.get('RecordOBCard').schema;
    obcardSample = tableSchemas.get('RecordOBCard').sample;
  }

} catch (error) {
  console.log("⚠️ Server tetap berjalan tanpa koneksi database");
  console.log("⚠️ Mode: AI Only (tanpa database)");
}

// Fungsi untuk generate SQL query menggunakan AI (Text-to-SQL)
async function generateSQLFromQuestion(question, tableName = 'employees') {
  try {
    // Get schema for specified table
    const tableInfo = tableSchemas.get(tableName);

    if (!tableInfo || !tableInfo.schema || tableInfo.schema.length === 0) {
      console.log(`⚠️ Schema untuk ${tableName} tidak tersedia`);
      return null;
    }

    const { schema, sample, mapping } = tableInfo;

    // Buat deskripsi schema dengan field aliases
    const columnDescriptions = schema.map(col => {
      // Find alias for this column
      const aliases = [];
      if (mapping && mapping.fieldAliases) {
        for (const [alias, realCol] of Object.entries(mapping.fieldAliases)) {
          if (realCol === col.columnName) {
            aliases.push(alias);
          }
        }
      }

      const aliasText = aliases.length > 0 ? ` (alias: ${aliases.join(', ')})` : '';
      return `- ${col.columnName}${aliasText} (${col.dataType}${col.maxLength ? `(${col.maxLength})` : ''}): ${col.isNullable === 'YES' ? 'nullable' : 'required'}`;
    }).join('\n');

    // Add table name at the beginning
    const schemaDescription = `Table name: ${tableName}\nColumns:\n${columnDescriptions}`;

    // Sample data untuk konteks
    const sampleDataStr = sample ? JSON.stringify(sample, null, 2) : '';

    // Add table description if available
    const tableDesc = mapping && mapping.description ? `\nTable Description: ${mapping.description}` : '';

    // Gunakan modular prompt system
    const sqlPrompt = buildSQLGenerationPrompt(schemaDescription + tableDesc, sampleDataStr, question);

    const result = await model.generateContent(sqlPrompt);
    const response = await result.response;
    let sqlQuery = response.text().trim();

    // Clean up response (hapus markdown code blocks jika ada)
    sqlQuery = sqlQuery.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();

    console.log("🤖 AI Generated SQL:", sqlQuery);

    return sqlQuery;
  } catch (error) {
    console.error("❌ Error generating SQL:", error.message);
    return null;
  }
}

// Fungsi untuk mencari data dari database berdasarkan pertanyaan
async function searchDatabase(question) {
  try {
    console.log("🔎 [DEBUG] searchDatabase called with:", question);
    const lowerQuestion = question.toLowerCase();
    let dbResults = [];

    // PRIORITAS 1: Check if question matches any table mapping
    const tableMapping = findTableMapping(question);
    console.log("🔎 [DEBUG] findTableMapping result:", tableMapping ? tableMapping.tableName : 'null');

    if (tableMapping) {
      console.log(`🎯 Detected table: ${tableMapping.tableName}`);
      console.log("🧠 Menggunakan AI untuk generate SQL query...");

      const aiGeneratedSQL = await generateSQLFromQuestion(question, tableMapping.tableName);
      console.log("🔎 [DEBUG] AI generated SQL:", aiGeneratedSQL);

      if (aiGeneratedSQL) {
        try {
          console.log("🔎 [DEBUG] Executing SQL query...");
          const aiResults = await queryDB(aiGeneratedSQL);
          console.log("🔎 [DEBUG] Query results count:", aiResults ? aiResults.length : 0);

          // Check if this is a COUNT(*) query with 0 results
          const isCountQuery = aiGeneratedSQL.toUpperCase().includes('COUNT(');
          let hasResults = aiResults && aiResults.length > 0;

          if (isCountQuery && hasResults) {
            // For COUNT queries, check the actual count value
            const firstRow = aiResults[0];
            const countValue = Object.values(firstRow)[0]; // Get first column value
            console.log("🔎 [DEBUG] COUNT query result value:", countValue);
            hasResults = countValue > 0;
          }

          if (hasResults) {
            dbResults.push({
              type: 'ai_generated_query',
              data: aiResults,
              description: tableMapping.description,
              sql_query: aiGeneratedSQL,
              query_method: 'AI Text-to-SQL',
              table_name: tableMapping.tableName
            });

            console.log(`✅ AI query berhasil: ${aiResults.length} rows`);

            // Return langsung jika AI query berhasil
            return dbResults;
          } else {
            console.log("🔎 [DEBUG] Query returned 0 results (checking count value)");

            // If query returned 0 results and it's a name-based search, try to find similar names
            if (aiGeneratedSQL.includes('LIKE') && aiGeneratedSQL.includes('EmpName')) {
              console.log("🔍 Searching for similar names...");

              // Extract the name from the question
              const nameMatch = question.match(/atas nama\s+([A-Za-z\s]+)/i) ||
                               question.match(/nama\s+([A-Za-z\s]+)/i) ||
                               question.match(/([A-Za-z]+\s+[A-Za-z]+)/);

              if (nameMatch && nameMatch[1]) {
                const searchName = nameMatch[1].trim();
                const nameParts = searchName.split(/\s+/);

                try {
                  // Search for partial matches in EmpName
                  const conditions = nameParts.map(part => `EmpName LIKE '%${part}%'`);
                  const fuzzyQuery = `
                    SELECT DISTINCT TOP 5 EmpName
                    FROM ${tableMapping.tableName}
                    WHERE ${conditions.join(' OR ')}
                    ORDER BY EmpName`;

                  console.log("🔎 Fuzzy search SQL:", fuzzyQuery);
                  const suggestions = await queryDB(fuzzyQuery);

                  if (suggestions && suggestions.length > 0) {
                    dbResults.push({
                      type: 'name_suggestions',
                      data: suggestions,
                      searched_name: searchName,
                      description: `Nama "${searchName}" tidak ditemukan. Berikut adalah nama yang mirip:`,
                      sql_query: fuzzyQuery,
                      query_method: 'Fuzzy Name Matching'
                    });
                    console.log(`✅ Found ${suggestions.length} similar names`);
                    return dbResults;
                  }
                } catch (fuzzyError) {
                  console.log("⚠️ Fuzzy search error:", fuzzyError.message);
                }
              }
            }

            console.log("🔎 [DEBUG] Continuing to fallback queries...");
          }
        } catch (sqlError) {
          console.log("⚠️ AI-generated SQL error, fallback ke hardcoded queries");
          console.log("SQL:", aiGeneratedSQL);
          console.log("Error:", sqlError.message);
          // Lanjut ke hardcoded queries sebagai fallback
        }
      } else {
        console.log("🔎 [DEBUG] AI generated SQL is null/empty");
      }
    } else {
      console.log("🔎 [DEBUG] No table mapping found, using fallback queries");
    }

    // FALLBACK: Hardcoded queries (jika AI query gagal atau tidak applicable)

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
          description: 'Daftar tabel yang tersedia di database',
          query_method: 'Hardcoded'
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
async function callAI(userMessage, sessionId = 'default', mode = 'internal') {
  try {
    console.log(`🔄 Mode: ${mode}`);

    const session = getOrCreateSession(sessionId);
    let dbResults = [];
    let sqlQuery = null;
    let tableName = null;
    let mappingInfo = null;

    // === AUTHENTICATION CHECK ===
    // Check if user says "saya [nama authorized user]"
    const lowerMessage = userMessage.toLowerCase();
    let detectedUser = null;

    for (const [userName, userData] of Object.entries(AUTHORIZED_USERS)) {
      if (lowerMessage.includes(`saya ${userName}`)) {
        detectedUser = { userName, ...userData };
        break;
      }
    }

    if (detectedUser) {
      console.log(`🔐 Auth request detected from ${detectedUser.fullName}`);
      session.authState = 'pending_password';
      session.userName = detectedUser.fullName;
      session.userKey = detectedUser.userName;

      const answer = `Halo Bapak ${detectedUser.fullName}! 👋\n\nUntuk mengaktifkan **Debug Mode**, silakan masukkan password Anda.\n\n🔑 Ketik password untuk melanjutkan.`;

      addToHistory(sessionId, 'user', userMessage);
      addToHistory(sessionId, 'assistant', answer);

      return answer;
    }

    // Check if waiting for password
    if (session.authState === 'pending_password') {
      const userConfig = AUTHORIZED_USERS[session.userKey];

      if (userConfig && userMessage.trim() === userConfig.password) {
        console.log(`✅ Password correct - Debug mode activated for ${session.userName}`);
        session.authState = 'authenticated';
        session.debugMode = true;

        const answer = `✅ **Password Benar!**\n\n**Debug Mode AKTIF** untuk ${session.userName}\n\n` +
          `Sekarang setiap pertanyaan Anda akan menampilkan:\n` +
          `📊 **Datasource** - Tabel yang digunakan\n` +
          `🔍 **SQL Query** - Query yang dijalankan\n` +
          `🗺️ **Mapping Info** - Lokasi mapping prompt\n` +
          `🔒 **Field Access** - Akses ke SEMUA field (termasuk yang sensitif)\n\n` +
          `Silakan bertanya sesuatu untuk melihat detail teknisnya!`;

        // Mask password in history
        addToHistory(sessionId, 'user', '****');
        addToHistory(sessionId, 'assistant', answer);

        return answer;
      } else {
        console.log("❌ Wrong password");
        session.authState = 'none';

        const answer = `❌ **Password Salah!**\n\nDebug mode tidak diaktifkan. Silakan coba lagi dengan mengatakan:\n"saya ${session.userName}"`;

        // Mask wrong password in history
        addToHistory(sessionId, 'user', '****');
        addToHistory(sessionId, 'assistant', answer);

        return answer;
      }
    }

    // === NORMAL FLOW ===
    // 1. Cari data dari database hanya jika mode internal
    if (mode === 'internal') {
      console.log("🔍 Mencari data dari database...");

      // === DETECT FOLLOW-UP QUESTIONS FOR DETAIL DATA ===
      const isDetailRequest = /^(siapa saja|tampilkan (daftarnya|namanya|semua|semuanya)|show (me )?(the )?(list|names|all)|who are they)\??$/i.test(userMessage.trim());

      if (isDetailRequest && session.history.length >= 2) {
        console.log("🔄 Detected detail request - extracting context from previous query");

        // Look for previous SQL query in history
        for (let i = session.history.length - 1; i >= Math.max(0, session.history.length - 6); i--) {
          const msg = session.history[i];
          if (msg.sql_query) {
            const previousSQL = msg.sql_query;
            console.log("📝 Found previous SQL:", previousSQL);

            // Extract WHERE clause from previous query
            const whereMatch = previousSQL.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|$)/i);
            const tableMatch = previousSQL.match(/FROM\s+(\w+)/i);

            if (whereMatch && tableMatch) {
              const whereClause = whereMatch[1].trim();
              const fromTable = tableMatch[1];

              // Generate new query to get detail data
              const detailQuery = `SELECT TOP 50 * FROM ${fromTable} WHERE ${whereClause} ORDER BY name`;
              console.log("🔄 Re-querying with details:", detailQuery);

              try {
                const detailResults = await queryDB(detailQuery);
                if (detailResults && detailResults.length > 0) {
                  // Get mapping info for this table
                  const tableMapping = TABLE_MAPPINGS.find(m => m.tableName === fromTable);

                  // Apply field filtering based on authentication status
                  const isAuthenticated = session.authState === 'authenticated' && session.debugMode;
                  const filteredData = tableMapping ?
                    filterFieldsByAuth(tableMapping, detailResults, isAuthenticated) :
                    detailResults;

                  console.log(`🔒 Field filtering applied - Authenticated: ${isAuthenticated}`);
                  if (!isAuthenticated && tableMapping && tableMapping.publicFields) {
                    console.log(`   Visible fields: ${tableMapping.publicFields.join(', ')}`);
                  }

                  dbResults = [{
                    type: 'ai_generated_query',
                    data: filteredData,
                    description: `Detail data from previous query`,
                    sql_query: detailQuery,
                    query_method: 'Follow-up Detail Query',
                    table_name: fromTable
                  }];
                  sqlQuery = detailQuery;
                  tableName = fromTable;

                  if (tableMapping) {
                    mappingInfo = {
                      file: 'tableMapping.js',
                      tableName: tableMapping.tableName,
                      keywords: tableMapping.keywords,
                      description: tableMapping.description,
                      fieldAliases: tableMapping.fieldAliases
                    };
                  }

                  console.log(`✅ Detail query successful: ${detailResults.length} rows`);
                  // Skip normal searchDatabase since we already have results
                  mode = 'skip_search';
                }
              } catch (err) {
                console.log("⚠️ Detail query failed:", err.message);
              }
              break;
            }
          }
        }
      }

      if (mode !== 'skip_search') {
        // Get table mapping info for debug mode
        const tableMapping = findTableMapping(userMessage);
        if (tableMapping) {
          tableName = tableMapping.tableName;
          mappingInfo = {
            file: 'tableMapping.js',
            tableName: tableMapping.tableName,
            keywords: tableMapping.keywords,
            description: tableMapping.description,
            fieldAliases: tableMapping.fieldAliases
          };
        }

        dbResults = await searchDatabase(userMessage);

        // Apply field filtering based on authentication status
        if (dbResults.length > 0 && tableMapping) {
          const isAuthenticated = session.authState === 'authenticated' && session.debugMode;

          // Filter data in each result
          dbResults = dbResults.map(result => {
            if (result.type === 'ai_generated_query' && result.data && Array.isArray(result.data)) {
              const filteredData = filterFieldsByAuth(tableMapping, result.data, isAuthenticated);
              return { ...result, data: filteredData };
            }
            return result;
          });

          console.log(`🔒 Field filtering applied - Authenticated: ${isAuthenticated}`);
          if (!isAuthenticated && tableMapping.publicFields) {
            console.log(`   Visible fields: ${tableMapping.publicFields.join(', ')}`);
          }
        }
      }

      // Extract SQL query from dbResults if available
      if (dbResults.length > 0) {
        console.log(`✅ Ditemukan ${dbResults.length} hasil dari database`);

        const aiResult = dbResults.find(r => r.type === 'ai_generated_query');
        if (aiResult) {
          sqlQuery = aiResult.sql_query;
        }
      } else {
        console.log("ℹ️ Tidak ada data relevan dari database");
      }
    } else {
      console.log("🌐 Mode External: Skip database search");
    }

    // 2. Ambil conversation context dari session
    const conversationContext = getConversationContext(sessionId, 3);

    // 3. Buat prompt menggunakan modular system (dengan mode parameter)
    const originalMode = mode === 'skip_search' ? 'internal' : mode; // Restore original mode for prompt
    const contextPrompt = buildAnswerPrompt(userMessage, dbResults, conversationContext, originalMode);

    if (conversationContext) {
      console.log("💭 Menggunakan conversation history untuk konteks");
    }

    // 4. Kirim ke Gemini AI
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    let answer = response.text();

    // 5. Add debug info if authenticated
    if (session.debugMode && session.authState === 'authenticated') {
      console.log("🐛 Adding debug info to response");

      let debugInfo = '\n\n---\n**🔧 DEBUG INFO (Nur Iswanto)**\n\n';

      debugInfo += `📊 **Datasource:**\n`;
      if (tableName) {
        debugInfo += `- Table: \`${tableName}\`\n`;
        debugInfo += `- Database: \`global_dashboard\` (SQL Server)\n`;
      } else {
        debugInfo += `- Mode External (Tidak mengakses database)\n`;
      }

      debugInfo += `\n🔍 **SQL Query:**\n`;
      if (sqlQuery) {
        debugInfo += `\`\`\`sql\n${sqlQuery}\n\`\`\`\n`;
      } else {
        debugInfo += `- Tidak ada query (mode external atau tidak ada keyword)\n`;
      }

      debugInfo += `\n🗺️ **Mapping Info:**\n`;
      if (mappingInfo) {
        debugInfo += `- File: \`${mappingInfo.file}\`\n`;
        debugInfo += `- Keywords: ${mappingInfo.keywords.join(', ')}\n`;
        debugInfo += `- Description: ${mappingInfo.description}\n`;
        if (mappingInfo.fieldAliases) {
          debugInfo += `- Field Aliases:\n`;
          for (const [alias, field] of Object.entries(mappingInfo.fieldAliases)) {
            debugInfo += `  - "${alias}" → ${field}\n`;
          }
        }
      } else {
        debugInfo += `- Tidak ada mapping (mode external atau keyword tidak ditemukan)\n`;
      }

      debugInfo += `\n📝 **Prompt Location:**\n`;
      debugInfo += `- File: \`prompts.js\`\n`;
      debugInfo += `- Function: \`buildAnswerPrompt()\`\n`;
      debugInfo += `- System Prompt: \`SYSTEM_PROMPT\` variable\n`;

      answer += debugInfo;
    }

    // 6. Simpan ke history with SQL query metadata
    addToHistory(sessionId, 'user', userMessage);
    addToHistory(sessionId, 'assistant', answer, { sql_query: sqlQuery, table_name: tableName });

    return answer;

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
  const { question, sessionId, mode } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  // Generate sessionId jika tidak ada (untuk backward compatibility)
  const session = sessionId || 'default';
  const chatMode = mode || 'internal'; // Default ke internal

  try {
    console.log(`\n💬 User [${session}] [Mode: ${chatMode}]:`, question);
    const answer = await callAI(question, session, chatMode);
    console.log("🤖 AI:", answer.substring(0, 100) + "...\n");
    res.json({ answer, sessionId: session });
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