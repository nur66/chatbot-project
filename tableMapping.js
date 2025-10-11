// ============================================
// TABLE MAPPING CONFIGURATION
// ============================================
// File ini berisi mapping tabel dan field aliases
// untuk memudahkan AI memahami berbagai keyword

// Mapping untuk Observation Card
export const OBCARD_MAPPING = {
  tableName: 'RecordOBCard',

  // Keywords yang trigger tabel ini
  keywords: [
    'observation card', 'ob card', 'obcard', 'observation c',
    'kartu observasi', 'observasi', 'obs card', 'safety card',
    'laporan observasi', 'safety observation'
  ],

  // Field aliases - mapping dari bahasa natural ke column name
  fieldAliases: {
    // ID/Tracking
    'id': 'TrackingNum',
    'id ob card': 'TrackingNum',
    'nomor': 'TrackingNum',
    'nomor tracking': 'TrackingNum',
    'tracking number': 'TrackingNum',

    // Employee info
    'nama': 'EmpName',
    'nama orang': 'EmpName',
    'nama pembuat': 'EmpName',
    'nama yang buat': 'EmpName',
    'nama submit': 'EmpName',
    'nama raise': 'EmpName',
    'nama create': 'EmpName',
    'orang yang submit': 'EmpName',
    'orang yang raise': 'EmpName',
    'orang yang create': 'EmpName',
    'orang yang buat': 'EmpName',
    'pembuat': 'EmpName',
    'creator': 'EmpName',
    'atas nama': 'EmpName',
    'an': 'EmpName',
    'a.n': 'EmpName',
    'a/n': 'EmpName',

    // Employee ID
    'id employee': 'EmpID',
    'id karyawan': 'EmpID',
    'id pembuat': 'EmpID',
    'id orang': 'EmpID',
    'employee id': 'EmpID',
    'badge id': 'EmpID',

    // Evidence/Image
    'evidence': 'ImageFinding',
    'bukti': 'ImageFinding',
    'foto': 'ImageFinding',
    'gambar': 'ImageFinding',
    'gambar obcard': 'ImageFinding',
    'foto obcard': 'ImageFinding',
    'image': 'ImageFinding',
    'picture': 'ImageFinding',
    'dokumentasi': 'ImageFinding',

    // Date/Time fields
    'tahun': 'Year',
    'year': 'Year',
    'bulan': 'Month',
    'month': 'Month',
    'tanggal': 'CreatedDate',
    'date': 'CreatedDate'
  },

  // Field restrictions - field yang boleh ditampilkan untuk user non-debug
  publicFields: [
    'EmpID',            // Employee ID (sensitif)
    'TrackingNum',      // ID/Nomor tracking
    'EmpName',          // Nama pembuat
    'Problem',          // Masalah yang ditemukan
    'BeforeAction',     // Tindakan sebelum observasi
    'Year',             // Tahun
    'Month',            // Bulan
    'last_synced_at'    // Terakhir sinkronisasi
  ],

  // Restricted fields - hanya untuk mode debug
  restrictedFields: [
    'ImageFinding',     // Path/URL gambar (sensitif)
    'ActionTaken',      // Tindakan yang diambil (internal)
    'Status',           // Status internal
    'ApprovedBy',       // Yang approve (internal)
    'ClosedDate'        // Tanggal closed (internal)
  ],

  // Deskripsi untuk AI
  description: 'Data observation card (kartu observasi keselamatan kerja)'
};

// Mapping untuk Employees (sudah ada, tapi kita standardize)
// export const EMPLOYEES_MAPPING = {
//   tableName: 'employees',

//   keywords: [
//     'karyawan', 'employee', 'pegawai', 'staff',
//     'pekerja', 'tenaga kerja', 'SDM'
//   ],

//   fieldAliases: {
//     'nama': 'name',
//     'badge': 'badgeId',
//     'departemen': 'department',
//     'jabatan': 'designation',
//     'email': 'email',
//     'jenis kelamin': 'gender',
//     'status': 'employmentStatus'
//   },

//   // Field restrictions - field yang boleh ditampilkan untuk user non-debug
//   publicFields: [
//     'name',             // Nama karyawan
//     'department',       // Department
//     'designation',      // Jabatan
//     'gender',           // Jenis kelamin
//     'employmentStatus'  // Status employment
//   ],

//   // Restricted fields - hanya untuk mode debug
//   restrictedFields: [
//     'badgeId',          // Badge ID (sensitif)
//     'email',            // Email (sensitif)
//     'phone',            // Telepon (sensitif)
//     'address',          // Alamat (sensitif)
//     'salary',           // Gaji (sangat sensitif)
//     'bankAccount',      // Rekening bank (sangat sensitif)
//     'employeeId',       // Employee ID (sensitif)
//     'nik'               // NIK (sangat sensitif)
//   ],

//   description: 'Data karyawan perusahaan'
// };

// CONTOH: Mapping untuk tabel lain (tinggal copy paste dan sesuaikan)
export const CUSTOM_TABLE_MAPPING = {
  tableName: 'YourTableName',

  keywords: [
    'keyword1', 'keyword2', 'keyword3'
  ],

  fieldAliases: {
    'alias1': 'RealColumnName1',
    'alias2': 'RealColumnName2'
  },

  description: 'Deskripsi tabel ini'
};

// Export all mappings
export const TABLE_MAPPINGS = [
  OBCARD_MAPPING,
  // EMPLOYEES_MAPPING,
  // CUSTOM_TABLE_MAPPING, // Uncomment jika mau pakai
];

// Helper function untuk find mapping by keyword
export function findTableMapping(question) {
  const lowerQuestion = question.toLowerCase();

  for (const mapping of TABLE_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return mapping;
      }
    }
  }

  return null;
}

// Helper function untuk translate field alias ke real column name
export function translateFieldAlias(mapping, fieldAlias) {
  const lowerAlias = fieldAlias.toLowerCase();

  if (mapping.fieldAliases[lowerAlias]) {
    return mapping.fieldAliases[lowerAlias];
  }

  return fieldAlias; // Return original jika tidak ada mapping
}

// Helper function untuk generate WHERE clause dengan alias
export function buildWhereClauseWithAlias(mapping, conditions) {
  const whereClauses = [];

  for (const [alias, value] of Object.entries(conditions)) {
    const realColumn = translateFieldAlias(mapping, alias);
    whereClauses.push(`${realColumn} = '${value}'`);
  }

  return whereClauses.join(' AND ');
}

// Helper function untuk filter fields berdasarkan auth status
export function filterFieldsByAuth(mapping, dataRows, isAuthenticated = false) {
  // Jika authenticated (debug mode), tampilkan semua field
  if (isAuthenticated) {
    return dataRows;
  }

  // Jika tidak ada publicFields defined, tampilkan semua (backward compatibility)
  if (!mapping.publicFields || mapping.publicFields.length === 0) {
    return dataRows;
  }

  // Filter: hanya tampilkan publicFields
  return dataRows.map(row => {
    const filteredRow = {};
    for (const field of mapping.publicFields) {
      if (row.hasOwnProperty(field)) {
        filteredRow[field] = row[field];
      }
    }
    return filteredRow;
  });
}

// Helper function untuk mendapatkan daftar fields yang difilter
export function getFilteredFieldsList(mapping, isAuthenticated = false) {
  if (isAuthenticated) {
    return 'ALL FIELDS (Debug Mode Active)';
  }

  if (!mapping.publicFields || mapping.publicFields.length === 0) {
    return 'All available fields';
  }

  return mapping.publicFields.join(', ');
}

export default {
  TABLE_MAPPINGS,
  OBCARD_MAPPING,
  // EMPLOYEES_MAPPING,
  findTableMapping,
  translateFieldAlias,
  buildWhereClauseWithAlias,
  filterFieldsByAuth,
  getFilteredFieldsList
};
