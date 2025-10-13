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

// Mapping untuk Ticketing Management System
export const TICKETING_MAPPING = {
  tableName: 'V_ITES_Report_Ticketing_Management_System',

  // Keywords yang trigger tabel ini
  keywords: [
    'ticket', 'ticketing', 'tiket',
    'it support', 'it help', 'helpdesk', 'help desk',
    'ites', 'it service', 'layanan it',
    'case', 'kasus',
    'ticket management', 'manajemen tiket',
    'ticketing system', 'sistem tiket'
  ],

  // Field aliases - mapping dari bahasa natural ke column name
  fieldAliases: {
    // ID & Dates
    'id': 'id',
    'tanggal laporan': 'report_date',
    'report date': 'report_date',
    'tanggal': 'report_date',
    'periode mulai': 'period_start',
    'period start': 'period_start',
    'periode akhir': 'period_end',
    'period end': 'period_end',
    'periode': 'period_start',

    // Tickets Created
    'tiket dibuat': 'tickets_created_in_period',
    'tiket baru': 'tickets_created_in_period',
    'tickets created': 'tickets_created_in_period',
    'new tickets': 'tickets_created_in_period',
    'jumlah tiket baru': 'tickets_created_in_period',

    // Open Tickets
    'tiket terbuka': 'open_tickets_from_period',
    'open tickets': 'open_tickets_from_period',
    'tiket belum selesai': 'open_tickets_from_period',
    'unresolved tickets': 'open_tickets_from_period',
    'tiket pending': 'open_tickets_from_period',

    // Resolved Tickets
    'tiket diselesaikan': 'resolved_tickets_from_period',
    'resolved tickets': 'resolved_tickets_from_period',
    'tiket selesai': 'resolved_tickets_from_period',
    'tiket closed': 'resolved_tickets_from_period',
    'tiket terselesaikan': 'resolved_tickets_from_period',

    // Resolution Rate
    'tingkat penyelesaian': 'period_resolution_rate',
    'resolution rate': 'period_resolution_rate',
    'persentase selesai': 'period_resolution_rate',
    'rate penyelesaian': 'period_resolution_rate',

    // Total Resolved
    'total diselesaikan': 'total_resolved_in_period',
    'total resolved': 'total_resolved_in_period',
    'jumlah selesai': 'total_resolved_in_period',

    // Older Tickets
    'tiket lama diselesaikan': 'resolved_older_tickets',
    'resolved older': 'resolved_older_tickets',
    'tiket lama': 'resolved_older_tickets',

    // Previous Period
    'tiket periode sebelumnya': 'open_tickets_previous_period',
    'previous period': 'open_tickets_previous_period',
    'periode lalu': 'open_tickets_previous_period',

    // Efficiency
    'skor efisiensi': 'period_efficiency_score',
    'efficiency score': 'period_efficiency_score',
    'efisiensi': 'period_efficiency_score',

    // Response Time
    'rata-rata response': 'avg_response_hours_period',
    'average response': 'avg_response_hours_period',
    'response time': 'avg_response_hours_period',
    'waktu response': 'avg_response_hours_period',
    'rata-rata respon': 'avg_response_hours_period',

    // Resolution Time
    'rata-rata penyelesaian': 'avg_resolution_hours_period',
    'average resolution': 'avg_resolution_hours_period',
    'resolution time': 'avg_resolution_hours_period',
    'waktu penyelesaian': 'avg_resolution_hours_period',
    'rata-rata resolve': 'avg_resolution_hours_period',

    // KPI Status
    'status kpi': 'period_kpi_status',
    'kpi status': 'period_kpi_status',
    'status': 'period_kpi_status',

    // Priority Levels
    'high level': 'high_level_tickets',
    'tiket high': 'high_level_tickets',
    'prioritas tinggi': 'high_level_tickets',
    'medium level': 'medium_level_tickets',
    'tiket medium': 'medium_level_tickets',
    'prioritas sedang': 'medium_level_tickets',
    'low level': 'low_level_tickets',
    'tiket low': 'low_level_tickets',
    'prioritas rendah': 'low_level_tickets',

    // Case Type & Category
    'tipe case': 'case_type',
    'case type': 'case_type',
    'jenis case': 'case_type',
    'kategori': 'category',
    'category': 'category',
    'category name': 'category',

    // Company
    'company': 'CompanyID',
    'company id': 'CompanyID',
    'perusahaan': 'CompanyID'
  },

  // Field restrictions - field yang boleh ditampilkan untuk user non-debug
  publicFields: [
    'id',
    'report_date',
    'period_start',
    'period_end',
    'tickets_created_in_period',
    'open_tickets_from_period',
    'resolved_tickets_from_period',
    'period_resolution_rate',
    'total_resolved_in_period',
    'period_efficiency_score',
    'avg_response_hours_period',
    'avg_resolution_hours_period',
    'period_kpi_status',
    'high_level_tickets',
    'medium_level_tickets',
    'low_level_tickets',
    'case_type',
    'total_resolved_by_case_type',
    'category',
    'total_resolved_by_category',
    'CompanyID'                       // Company identifier (sensitive)
  ],

  // Restricted fields - hanya untuk mode debug
  restrictedFields: [
    'resolved_older_tickets',        // Internal metric
    'open_tickets_previous_period',  // Internal tracking
  ],

  // Deskripsi untuk AI
  description: 'Data laporan ticketing management system IT (weekly reports)'
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
  TICKETING_MAPPING,
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
  TICKETING_MAPPING,
  // EMPLOYEES_MAPPING,
  findTableMapping,
  translateFieldAlias,
  buildWhereClauseWithAlias,
  filterFieldsByAuth,
  getFilteredFieldsList
};
