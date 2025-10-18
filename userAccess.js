// ============================================
// AUTHORIZED USERS (Debug Mode Access)
// ============================================

export const AUTHORIZED_USERS = {
  'nur iswanto': {
    password: '5553',
    fullName: 'Nur Iswanto',
    email: 'nur.iswanto@cladtek.com',
    role: 'Admin'
  },
  'fernando siboro': {
    password: '4106',
    fullName: 'Fernando Siboro',
    email: 'fernando.siboro@cladtek.com',
    role: 'Manager'
  },
  'ah muh rojab': {
    password: '4127',
    fullName: 'Ah muh Rojab',
    email: 'rojab@cladtek.com',
    role: 'Staff'
  }
};

// ============================================
// EMPLOYEE TABLE ACCESS CONTROL
// ============================================
export const EMPLOYEE_ACCESS_USERS = [
  'Nur Iswanto',
  'Fernando Siboro'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user has access to employee table
 * @param {string} fullName - User's full name
 * @returns {boolean} Has access
 */
export function hasEmployeeAccess(fullName) {
  if (!fullName) return false;
  return EMPLOYEE_ACCESS_USERS.includes(fullName);
}

/**
 * Check if user has access to employee table by session
 * @param {Object} session - Session object
 * @returns {boolean} Has access
 */
export function checkEmployeeAccessBySession(session) {
  if (!session) return false;

  // Check authentication status
  if (session.authState !== 'authenticated') return false;

  // Check if user in allowed list
  return hasEmployeeAccess(session.userName);
}

/**
 * Get user info by username
 * @param {string} username - Username (lowercase)
 * @returns {Object|null} User object or null
 */
export function getUserInfo(username) {
  if (!username) return null;
  return AUTHORIZED_USERS[username.toLowerCase()] || null;
}

/**
 * Get all users with employee access
 * @returns {Array} Array of full names
 */
export function getEmployeeAccessUsers() {
  return [...EMPLOYEE_ACCESS_USERS];
}

/**
 * Get all authorized users (for admin purposes)
 * @returns {Array} Array of user objects
 */
export function getAllAuthorizedUsers() {
  return Object.entries(AUTHORIZED_USERS).map(([username, data]) => ({
    username,
    ...data,
    password: '****' // Mask password
  }));
}

/**
 * Validate user credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Object|null} User object if valid, null otherwise
 */
export function validateCredentials(username, password) {
  const user = getUserInfo(username);
  if (!user) return null;

  if (user.password === password) {
    return {
      username: username.toLowerCase(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      hasEmployeeAccess: hasEmployeeAccess(user.fullName)
    };
  }

  return null;
}

// ============================================
// TABLE ACCESS PERMISSIONS
// ============================================

/**
 * Define which tables require special access
 */
export const TABLE_ACCESS_RULES = {
  'employees': {
    requiresAuth: true,
    checkAccess: checkEmployeeAccessBySession,
    accessDeniedMessage: 'Anda tidak memiliki akses untuk melihat data karyawan. Hanya user tertentu yang dapat mengakses informasi ini.'
  },

  // Tambahkan tabel lain yang perlu access control di sini:
  // 'salary': {
  //   requiresAuth: true,
  //   checkAccess: (session) => session.role === 'Admin',
  //   accessDeniedMessage: 'Akses ditolak. Hanya admin yang dapat melihat data gaji.'
  // }
};

/**
 * Check if user has access to a specific table
 * @param {string} tableName - Table name
 * @param {Object} session - Session object
 * @returns {Object} { hasAccess: boolean, message: string }
 */
export function checkTableAccess(tableName, session) {
  const rule = TABLE_ACCESS_RULES[tableName];

  // If no rule, allow access by default
  if (!rule) {
    return { hasAccess: true, message: null };
  }

  // If rule exists but doesn't require auth, allow
  if (!rule.requiresAuth) {
    return { hasAccess: true, message: null };
  }

  // Check access using the rule's check function
  if (rule.checkAccess && typeof rule.checkAccess === 'function') {
    const hasAccess = rule.checkAccess(session);

    if (!hasAccess) {
      return {
        hasAccess: false,
        message: rule.accessDeniedMessage || 'Anda tidak memiliki akses untuk tabel ini.'
      };
    }
  }

  return { hasAccess: true, message: null };
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  AUTHORIZED_USERS,
  EMPLOYEE_ACCESS_USERS,
  TABLE_ACCESS_RULES,
  hasEmployeeAccess,
  checkEmployeeAccessBySession,
  getUserInfo,
  getEmployeeAccessUsers,
  getAllAuthorizedUsers,
  validateCredentials,
  checkTableAccess
};
