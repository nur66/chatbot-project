import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Konfigurasi database dari .env
const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection pool
let pool = null;

// Fungsi untuk connect ke database
export async function connectDB() {
  try {
    if (pool) {
      return pool;
    }

    pool = await sql.connect(config);
    console.log("✅ Koneksi SQL Server berhasil!");
    console.log(`✅ Database: ${process.env.DB_DATABASE}`);
    return pool;
  } catch (error) {
    console.error("❌ Error koneksi SQL Server:", error.message);
    throw error;
  }
}

// Fungsi untuk query database
export async function queryDB(sqlQuery, params = {}) {
  try {
    const dbPool = await connectDB();
    const request = dbPool.request();

    // Add parameters jika ada
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (error) {
    console.error("❌ Error query database:", error.message);
    throw error;
  }
}

// Fungsi untuk close connection
export async function closeDB() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log("✅ Koneksi database ditutup");
    }
  } catch (error) {
    console.error("❌ Error menutup koneksi:", error.message);
  }
}

// Handle app termination
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

export default { connectDB, queryDB, closeDB };
