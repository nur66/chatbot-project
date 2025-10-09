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

// Fungsi untuk mendapatkan schema tabel (struktur kolom)
export async function getTableSchema(tableName) {
  try {
    const schemaQuery = `
      SELECT
        COLUMN_NAME as columnName,
        DATA_TYPE as dataType,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        IS_NULLABLE as isNullable,
        COLUMN_DEFAULT as defaultValue
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `;

    const schema = await queryDB(schemaQuery);
    return schema;
  } catch (error) {
    console.error(`❌ Error getting schema for ${tableName}:`, error.message);
    return [];
  }
}

// Fungsi untuk mendapatkan sample data dari tabel
export async function getSampleData(tableName, limit = 3) {
  try {
    const sampleQuery = `SELECT TOP ${limit} * FROM ${tableName}`;
    const sample = await queryDB(sampleQuery);
    return sample;
  } catch (error) {
    console.error(`❌ Error getting sample from ${tableName}:`, error.message);
    return [];
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
