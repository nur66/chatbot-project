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
    'dokumentasi': 'ImageFinding'
  },

  // Deskripsi untuk AI
  description: 'Data observation card (kartu observasi keselamatan kerja)'
};

// Mapping untuk Employees (sudah ada, tapi kita standardize)
export const EMPLOYEES_MAPPING = {
  tableName: 'employees',

  keywords: [
    'karyawan', 'employee', 'pegawai', 'staff',
    'pekerja', 'tenaga kerja', 'SDM'
  ],

  fieldAliases: {
    'nama': 'name',
    'badge': 'badgeId',
    'departemen': 'department',
    'jabatan': 'designation',
    'email': 'email',
    'jenis kelamin': 'gender',
    'status': 'employmentStatus'
  },

  description: 'Data karyawan perusahaan'
};

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
  EMPLOYEES_MAPPING,
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

export default {
  TABLE_MAPPINGS,
  OBCARD_MAPPING,
  EMPLOYEES_MAPPING,
  findTableMapping,
  translateFieldAlias,
  buildWhereClauseWithAlias
};
