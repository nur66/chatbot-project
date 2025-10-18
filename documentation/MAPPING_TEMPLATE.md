# 📋 Template Mapping Tabel Database

Panduan lengkap untuk menambahkan mapping tabel baru dengan mudah.

---

## 🎯 Template Dasar

Copy template ini ke `tableMapping.js` dan sesuaikan:

```javascript
export const NAMA_TABEL_MAPPING = {
  tableName: 'nama_tabel_di_database',

  // Keywords yang trigger mapping ini
  keywords: [
    'keyword1', 'keyword2', 'keyword3'
  ],

  // Field aliases (opsional)
  fieldAliases: {
    'alias_natural': 'column_name_asli',
    'nama': 'name',
    'tanggal': 'date'
  },

  // Public fields (fields yang visible tanpa auth)
  publicFields: [
    'id',
    'name',
    'date'
  ],

  // Restricted fields (hanya untuk debug mode)
  restrictedFields: [
    'sensitive_field',
    'internal_field'
  ],

  // Jika butuh special access
  requiresSpecialAccess: false,  // true jika perlu auth

  // Deskripsi untuk AI
  description: 'Deskripsi singkat tentang data ini'
};
```

---

## 📊 Template untuk Aggregation Queries

### 1. COUNT DISTINCT (Total Unique Values)

**Contoh: Berapa total department unik?**

```javascript
export const DEPARTMENT_MAPPING = {
  tableName: 'employees',

  keywords: [
    'total department', 'jumlah department', 'berapa department',
    'list department', 'daftar department'
  ],

  fieldAliases: {
    'department': 'department',
    'departemen': 'department'
  },

  publicFields: ['department'],
  requiresSpecialAccess: true,

  // PENTING: Tambahkan hint untuk DISTINCT di description
  description: 'Data department unik dari employees table (use COUNT DISTINCT for totals)'
};
```

**Query yang dihasilkan:** `SELECT COUNT(DISTINCT department) FROM employees`

---

### 2. AVG (Rata-rata)

**Contoh: Berapa rata-rata salary?**

```javascript
export const SALARY_AVG_MAPPING = {
  tableName: 'employees',

  keywords: [
    'rata-rata salary', 'average salary', 'rata-rata gaji',
    'mean salary', 'salary rata-rata'
  ],

  fieldAliases: {
    'salary': 'salary',
    'gaji': 'salary'
  },

  publicFields: ['salary'],
  requiresSpecialAccess: true,

  description: 'Average salary calculation from employees table (use AVG function)'
};
```

**Query yang dihasilkan:** `SELECT AVG(salary) FROM employees`

---

### 3. SUM (Total Penjumlahan)

**Contoh: Berapa total revenue?**

```javascript
export const REVENUE_SUM_MAPPING = {
  tableName: 'sales',

  keywords: [
    'total revenue', 'total penjualan', 'jumlah revenue',
    'sum revenue', 'total omzet'
  ],

  fieldAliases: {
    'revenue': 'total_amount',
    'penjualan': 'total_amount',
    'omzet': 'total_amount'
  },

  publicFields: ['total_amount', 'date'],

  description: 'Total revenue/sales calculation (use SUM function)'
};
```

**Query yang dihasilkan:** `SELECT SUM(total_amount) FROM sales`

---

### 4. MIN/MAX (Data Terkecil/Terbesar)

**Contoh: Tanggal join paling awal?**

```javascript
export const EARLIEST_JOIN_MAPPING = {
  tableName: 'employees',

  keywords: [
    'tanggal join paling awal', 'earliest join date', 'first employee',
    'karyawan pertama join', 'join date terlama'
  ],

  fieldAliases: {
    'join date': 'joinDate',
    'tanggal join': 'joinDate'
  },

  publicFields: ['joinDate', 'name'],
  requiresSpecialAccess: true,

  description: 'Earliest employee join date (use MIN function)'
};
```

**Query yang dihasilkan:** `SELECT MIN(joinDate) FROM employees`

---

### 5. TOP N (Data Teratas/Terbawah)

**Contoh: 10 observation card terbaru?**

```javascript
export const LATEST_OBCARD_MAPPING = {
  tableName: 'RecordOBCard',

  keywords: [
    'obcard terbaru', 'latest observation card', '10 obcard terakhir',
    'obcard paling baru', 'recent observation card'
  ],

  fieldAliases: {
    'tanggal': 'CreatedDate',
    'nama': 'EmpName'
  },

  publicFields: ['TrackingNum', 'EmpName', 'CreatedDate', 'Problem'],

  // HINT: Tambahkan ORDER BY di description
  description: 'Latest observation cards (ORDER BY CreatedDate DESC with TOP 10)'
};
```

**Query yang dihasilkan:** `SELECT TOP 10 * FROM RecordOBCard ORDER BY CreatedDate DESC`

---

### 6. GROUP BY dengan COUNT

**Contoh: Jumlah karyawan per department?**

```javascript
export const EMPLOYEES_BY_DEPT_MAPPING = {
  tableName: 'employees',

  keywords: [
    'karyawan per department', 'employees per department',
    'breakdown department', 'group by department',
    'jumlah karyawan setiap department'
  ],

  fieldAliases: {
    'department': 'department',
    'jumlah': 'COUNT(*)'
  },

  publicFields: ['department'],
  requiresSpecialAccess: true,

  description: 'Employee count grouped by department (use GROUP BY with COUNT)'
};
```

**Query yang dihasilkan:**
```sql
SELECT department, COUNT(*) as jumlah
FROM employees
GROUP BY department
```

---

## 🔧 Tips & Best Practices

### 1. **Keyword Strategy**
- Gunakan keyword **spesifik** untuk menghindari konflik
- Kombinasikan action word + entity (contoh: "total department", "list karyawan")
- Tambahkan variasi bahasa (Indonesia + English)

### 2. **Description Hints**
Tambahkan hint di description untuk membantu AI generate SQL yang tepat:

| Kebutuhan | Hint di Description |
|-----------|---------------------|
| COUNT DISTINCT | `(use COUNT DISTINCT for totals)` |
| AVG | `(use AVG function)` |
| SUM | `(use SUM function)` |
| MIN/MAX | `(use MIN/MAX function)` |
| TOP N | `(ORDER BY ... DESC with TOP N)` |
| GROUP BY | `(use GROUP BY with COUNT)` |

### 3. **Testing Mapping Baru**

Setelah menambahkan mapping:

1. **Restart server:**
   ```bash
   lsof -ti:3000 | xargs kill -9 2>/dev/null
   npm start
   ```

2. **Test query:**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"question":"berapa total department?","sessionId":"test","mode":"internal"}'
   ```

3. **Check logs untuk SQL yang di-generate:**
   ```bash
   cat startup.log | grep "AI Generated SQL"
   ```

---

## 📝 Langkah-langkah Menambah Mapping Baru

1. **Copy template** dari section di atas sesuai kebutuhan
2. **Edit values:**
   - `tableName`: Nama tabel di database
   - `keywords`: List keyword yang trigger mapping
   - `fieldAliases`: Mapping natural language ke column name
   - `publicFields`: Fields yang visible tanpa auth
   - `description`: Deskripsi + hint untuk SQL generation
3. **Export mapping** di `tableMapping.js`:
   ```javascript
   export const TABLE_MAPPINGS = [
     OBCARD_MAPPING,
     TICKETING_MAPPING,
     EMPLOYEES_MAPPING,
     NAMA_MAPPING_BARU,  // ← Tambahkan di sini
   ];
   ```
4. **Restart server** dan test!

---

## 🎓 Contoh Lengkap: Mapping Sales Report

```javascript
export const SALES_REPORT_MAPPING = {
  tableName: 'sales_transactions',

  keywords: [
    'sales report', 'laporan penjualan', 'data sales',
    'total penjualan', 'revenue sales'
  ],

  fieldAliases: {
    'tanggal': 'transaction_date',
    'total': 'amount',
    'customer': 'customer_name',
    'produk': 'product_name'
  },

  publicFields: [
    'transaction_date',
    'amount',
    'customer_name',
    'product_name',
    'quantity'
  ],

  restrictedFields: [
    'customer_email',
    'customer_phone',
    'profit_margin'
  ],

  requiresSpecialAccess: false,

  description: 'Sales transaction data with revenue calculations (supports SUM, AVG, COUNT)'
};

// Jangan lupa tambahkan ke TABLE_MAPPINGS!
```

---

## ⚡ Quick Reference

| Kebutuhan | Keywords Pattern | Hint di Description |
|-----------|-----------------|---------------------|
| Total records | `total X`, `jumlah X`, `berapa X` | - |
| Total unique | `total distinct X`, `berapa unik X` | `(use COUNT DISTINCT)` |
| Average | `rata-rata X`, `average X` | `(use AVG)` |
| Sum | `total nilai X`, `sum X`, `jumlah X` | `(use SUM)` |
| Latest N | `X terbaru`, `latest X`, `N terakhir` | `(ORDER BY date DESC TOP N)` |
| Oldest N | `X terlama`, `oldest X`, `N pertama` | `(ORDER BY date ASC TOP N)` |
| Group by | `X per Y`, `breakdown by Y` | `(use GROUP BY)` |

---

**Last Updated:** 2025-10-18
**Maintainer:** Nur Iswanto
**File Location:** `/mnt/c/xampp/htdocs/chat-bot/MAPPING_TEMPLATE.md`
