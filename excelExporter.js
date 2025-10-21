// ============================================
// EXCEL EXPORTER MODULE
// ============================================
// Module untuk generate file Excel dari data database

import XLSX from 'xlsx';
import { queryDB } from './db.js';

/**
 * Generate Excel file dari data array
 * @param {Array} data - Array of objects dari database
 * @param {String} sheetName - Nama sheet (optional)
 * @returns {Buffer} - Excel file buffer
 */
export function generateExcelFromData(data, sheetName = 'Sheet1') {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = [];
  if (data.length > 0) {
    Object.keys(data[0]).forEach(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      colWidths.push({ wch: Math.min(maxLength + 2, 50) }); // Max 50 chars
    });
    worksheet['!cols'] = colWidths;
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate buffer
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  });

  return buffer;
}

/**
 * Generate Excel dari SQL query langsung
 * @param {String} sqlQuery - SQL query
 * @param {String} sheetName - Nama sheet (optional)
 * @returns {Buffer} - Excel file buffer
 */
export async function generateExcelFromQuery(sqlQuery, sheetName = 'Data') {
  try {
    // Execute query
    const data = await queryDB(sqlQuery);

    if (!data || data.length === 0) {
      throw new Error('No data found');
    }

    // Generate Excel
    return generateExcelFromData(data, sheetName);
  } catch (error) {
    console.error('❌ Error generating Excel from query:', error.message);
    throw error;
  }
}

/**
 * Generate Excel dengan multiple sheets
 * @param {Array} sheets - Array of {name, data}
 * @returns {Buffer} - Excel file buffer
 */
export function generateExcelMultipleSheets(sheets) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    if (!sheet.data || sheet.data.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(sheet.data);

    // Auto-size columns
    const colWidths = [];
    Object.keys(sheet.data[0]).forEach(key => {
      const maxLength = Math.max(
        key.length,
        ...sheet.data.map(row => String(row[key] || '').length)
      );
      colWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name || 'Sheet');
  });

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  });

  return buffer;
}

/**
 * Format nama file Excel dengan timestamp
 * @param {String} baseName - Base name untuk file
 * @returns {String} - Formatted filename
 */
export function formatExcelFilename(baseName) {
  const timestamp = new Date().toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .split('.')[0];

  return `${baseName}_${timestamp}.xlsx`;
}

export default {
  generateExcelFromData,
  generateExcelFromQuery,
  generateExcelMultipleSheets,
  formatExcelFilename
};
