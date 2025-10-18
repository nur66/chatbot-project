// ============================================
// SMART CONTEXT-AWARE CONVERSATION SYSTEM
// ============================================
// ChatGPT-like context awareness with unlimited session history
// Version 2.0 - Unlimited Context + Smarter Detection

// ============================================
// FOLLOW-UP QUESTION PATTERNS
// ============================================

export const FOLLOWUP_PATTERNS = [
  // ===== LIST/DETAIL REQUEST =====
  {
    patterns: [
      'apa saja', 'sebutkan', 'tampilkan', 'show me', 'list',
      'siapa saja', 'show details', 'tampilkan detail', 'tolong sebutkan',
      'tampilkan semua', 'show all', 'detailnya', 'the details',
      'yang mana', 'which ones', 'namanya', 'nama-namanya',
      'daftarnya', 'the list', 'listnya',
      // NEW: More flexible patterns
      'minta', 'saya minta', 'tolong', 'tolong tampilkan', 'coba tampilkan',
      'bisa tampilkan', 'dapat tampilkan', 'boleh tampilkan',
      'kasih lihat', 'show', 'display', 'coba', 'coba lihat'
    ],
    type: 'detail_request',
    description: 'User meminta detail/list dari hasil sebelumnya'
  },

  // ===== FILTER REQUEST =====
  {
    patterns: [
      'yang', 'yang mana', 'which', 'dengan', 'with',
      'yang ada', 'yang punya', 'yang memiliki', 'with the',
      'di', 'pada', 'at', 'in the',
      // NEW: More natural language patterns
      'hanya', 'hanya yang', 'hanya dari', 'cuma', 'cuma yang',
      'saja', 'aja', 'filter', 'pilih yang'
    ],
    type: 'filter_request',
    description: 'User menambahkan filter/kondisi'
  },

  // ===== TIME/DATE FILTER =====
  {
    patterns: [
      'tahun', 'year', 'bulan', 'month', 'minggu', 'week',
      'hari ini', 'today', 'kemarin', 'yesterday',
      'bulan ini', 'this month', 'tahun ini', 'this year',
      'yang 2024', 'yang 2025', 'di 2024', 'di 2025'
    ],
    type: 'time_filter',
    description: 'User menambahkan filter waktu'
  },

  // ===== COMPARISON REQUEST =====
  {
    patterns: [
      'bagaimana dengan', 'how about', 'kalau', 'what about',
      'dan', 'bandingkan', 'compare', 'versus', 'vs'
    ],
    type: 'comparison_request',
    description: 'User membandingkan dengan data lain'
  },

  // ===== COUNT/STATISTIC REQUEST =====
  {
    patterns: [
      'berapa', 'how many', 'total', 'jumlah', 'count',
      'ada berapa', 'how much', 'rata-rata', 'average'
    ],
    type: 'statistic_request',
    description: 'User meminta statistik'
  }
];

// ============================================
// ENTITY PATTERNS
// ============================================

export const ENTITY_PATTERNS = [
  {
    keywords: ['department', 'dept', 'divisi', 'departemen'],
    entityType: 'department',
    defaultQuery: 'SELECT DISTINCT department FROM employees',
    detailQuery: (context) => `SELECT DISTINCT department FROM employees ORDER BY department`
  },
  {
    keywords: ['karyawan', 'employee', 'pegawai', 'staff', 'pekerja'],
    entityType: 'employee',
    defaultQuery: 'SELECT * FROM employees',
    detailQuery: (context) => {
      if (context.includes('perempuan') || context.includes('female')) {
        return `SELECT name, department, gender FROM employees WHERE gender = 'Female' ORDER BY name`;
      }
      if (context.includes('laki') || context.includes('male')) {
        return `SELECT name, department, gender FROM employees WHERE gender = 'Male' ORDER BY name`;
      }
      return `SELECT name, department FROM employees ORDER BY name`;
    }
  },
  {
    keywords: ['observation card', 'obcard', 'ob card', 'observasi', 'kartu observasi'],
    entityType: 'obcard',
    defaultQuery: 'SELECT * FROM RecordOBCard',
    detailQuery: (context) => {
      const nameMatch = context.match(/atas nama ([A-Za-z\s]+)|nama ([A-Za-z\s]+)/i);
      if (nameMatch) {
        const name = nameMatch[1] || nameMatch[2];
        return `SELECT TrackingNum, EmpName, Problem, CreatedDate FROM RecordOBCard WHERE EmpName LIKE '%${name}%' ORDER BY CreatedDate DESC`;
      }
      return `SELECT TrackingNum, EmpName, Problem, CreatedDate FROM RecordOBCard ORDER BY CreatedDate DESC`;
    }
  },
  {
    keywords: ['ticket', 'tiket', 'ticketing', 'helpdesk', 'it support'],
    entityType: 'ticket',
    defaultQuery: 'SELECT * FROM V_ITES_Report_Ticketing_Management_System',
    detailQuery: (context) => {
      if (context.includes('high priority') || context.includes('prioritas tinggi')) {
        return `SELECT * FROM V_ITES_Report_Ticketing_Management_System WHERE high_level_tickets > 0 ORDER BY report_date DESC`;
      }
      return `SELECT * FROM V_ITES_Report_Ticketing_Management_System ORDER BY report_date DESC`;
    }
  }
];

// ============================================
// SMART FOLLOW-UP DETECTION
// ============================================

/**
 * IMPROVED: Smarter follow-up detection with flexible patterns
 */
export function detectFollowupQuestion(question) {
  const lowerQuestion = question.toLowerCase().trim();

  // Check each pattern
  for (const pattern of FOLLOWUP_PATTERNS) {
    for (const p of pattern.patterns) {
      // Exact match
      if (lowerQuestion === p || lowerQuestion === p + '?') {
        return {
          type: pattern.type,
          description: pattern.description,
          originalPattern: p
        };
      }

      // Starts with pattern
      if (lowerQuestion.startsWith(p + ' ')) {
        return {
          type: pattern.type,
          description: pattern.description,
          originalPattern: p
        };
      }

      // Contains pattern with word boundaries (for patterns like "minta")
      // Example: "saya minta yang perempuan saja" should match "minta"
      const wordBoundaryPattern = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordBoundaryPattern.test(lowerQuestion)) {
        return {
          type: pattern.type,
          description: pattern.description,
          originalPattern: p
        };
      }
    }
  }

  return null;
}

/**
 * Extract entity type from context
 */
export function extractEntityFromContext(previousContext) {
  const lowerContext = previousContext.toLowerCase();

  for (const entity of ENTITY_PATTERNS) {
    for (const keyword of entity.keywords) {
      if (lowerContext.includes(keyword)) {
        return entity;
      }
    }
  }

  return null;
}

// ============================================
// SMART CONTEXT CHAIN BUILDING (ChatGPT-like)
// ============================================

/**
 * Build comprehensive context chain from ENTIRE session history
 * @param {array} userMessages - All user messages in session
 * @returns {object} - Smart context chain
 */
function buildSmartContextChain(userMessages) {
  const chain = {
    baseQuestion: null,
    filters: [],
    entity: null,
    fullContext: null,
    conversationTopic: null,  // Overall topic being discussed
    allRelevantQuestions: []  // All questions related to current topic
  };

  let validMessages = [];

  // Collect ALL valid messages (NO LIMIT - use entire session!)
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const msg = userMessages[i];

    // Skip auth/password messages only
    if (msg.content === '****' ||
        (msg.content.toLowerCase().startsWith('saya ') && msg.content.toLowerCase().includes(' iswanto')) ||
        (msg.content.toLowerCase().startsWith('saya ') && msg.content.toLowerCase().includes(' fernando')) ||
        msg.content.length <= 3) {
      continue;
    }

    validMessages.push(msg.content);
  }

  if (validMessages.length === 0) {
    return chain;
  }

  console.log(`🔗 [SMART CONTEXT] Building from ${validMessages.length} messages (UNLIMITED)`);

  // NEW: Identify conversation topic and base question smartly
  let foundBaseQuestion = false;

  for (let i = 0; i < validMessages.length; i++) {
    const question = validMessages[i];
    const lowerQ = question.toLowerCase();

    // Check if this is a filter/modifier question
    const isFilter = lowerQ.startsWith('yang ') ||
                     lowerQ.startsWith('which ') ||
                     lowerQ.startsWith('with ') ||
                     lowerQ.startsWith('di ') ||
                     lowerQ.startsWith('hanya ') ||
                     lowerQ.startsWith('cuma ') ||
                     lowerQ.startsWith('kalau ') ||  // Comparison/substitution
                     lowerQ.startsWith('bagaimana ') ||  // "bagaimana dengan..."
                     lowerQ.match(/^(tahun|bulan|year|month)\s+/i) ||
                     lowerQ.match(/\bsaja\b/) ||  // Contains "saja" anywhere
                     lowerQ.match(/\baja\b/);      // Contains "aja" anywhere

    // Check if this is a detail request (might have context words before pattern)
    const isDetailRequest = lowerQ.match(/\b(tampilkan|sebutkan|list|show|minta|tolong|coba)\b/);

    if (isFilter && !isDetailRequest) {
      console.log(`  🔧 Filter: "${question}"`);
      chain.filters.push(question);
      chain.allRelevantQuestions.push(question);
    } else if (isDetailRequest && foundBaseQuestion) {
      // This is a detail request, not a base question
      console.log(`  📋 Detail request: "${question}"`);
      chain.allRelevantQuestions.push(question);
    } else {
      // This is likely a base question
      if (!foundBaseQuestion) {
        console.log(`  📍 Base question: "${question}"`);
        chain.baseQuestion = question;
        foundBaseQuestion = true;

        // Extract entity and topic
        const entity = extractEntityFromContext(question);
        if (entity) {
          chain.entity = entity;
          chain.conversationTopic = entity.entityType;
          console.log(`  📌 Topic: ${entity.entityType}`);
        }

        chain.allRelevantQuestions.push(question);
      }
    }

    // Continue collecting ALL related questions (no stop condition!)
  }

  // If still no base question, use most recent substantive message
  if (!chain.baseQuestion && validMessages.length > 0) {
    chain.baseQuestion = validMessages[0];
    const entity = extractEntityFromContext(validMessages[0]);
    if (entity) {
      chain.entity = entity;
      chain.conversationTopic = entity.entityType;
    }
  }

  // Build comprehensive full context
  if (chain.baseQuestion) {
    chain.fullContext = chain.baseQuestion;
    if (chain.filters.length > 0) {
      chain.fullContext += ' ' + chain.filters.join(' ');
    }
  }

  console.log(`  ✅ Built context with ${chain.filters.length} filters`);

  return chain;
}

// ============================================
// SMART REWRITING RULES
// ============================================

/**
 * Smart question rewriter that understands natural language better
 */
function smartRewriteQuestion(currentQuestion, contextChain) {
  const lowerQuestion = currentQuestion.toLowerCase().trim();

  // Pattern 1: Simple detail requests like "apa saja?", "siapa saja?"
  if (lowerQuestion.match(/^(apa saja|siapa saja|sebutkan|tampilkan|show|list|daftarnya)[\s\?]*$/i)) {
    if (contextChain.entity) {
      let query = `tampilkan daftar ${contextChain.entity.entityType}`;
      if (contextChain.filters.length > 0) {
        query += ' ' + contextChain.filters.join(' ');
      }
      console.log(`🔄 [SMART REWRITE] "${currentQuestion}" → "${query}"`);
      return query;
    }
  }

  // Pattern 2: "saya minta yang [filter]" or "tolong tampilkan yang [filter]"
  const requestPattern = lowerQuestion.match(/(saya minta|tolong|coba|minta|kasih lihat)\s+(yang\s+)?(.+)/i);
  if (requestPattern && contextChain.entity) {
    const requestedFilter = requestPattern[3];
    let query = `tampilkan ${contextChain.entity.entityType} ${requestedFilter}`;

    // If there were previous filters, combine them
    if (contextChain.filters.length > 0) {
      // Check if new filter is different from existing
      const existingFilterStr = contextChain.filters.join(' ').toLowerCase();
      if (!existingFilterStr.includes(requestedFilter.toLowerCase())) {
        query = `tampilkan ${contextChain.entity.entityType} ${contextChain.filters.join(' ')} ${requestedFilter}`;
      }
    }

    console.log(`🔄 [SMART REWRITE] "${currentQuestion}" → "${query}"`);
    return query;
  }

  // Pattern 3: Just "yang [filter]" - add to existing context
  const filterPattern = lowerQuestion.match(/^yang\s+(.+)$/i);
  if (filterPattern && contextChain.entity) {
    const filter = filterPattern[1];
    let query = `${contextChain.entity.entityType} ${filter}`;

    console.log(`🔄 [SMART REWRITE] "${currentQuestion}" → "${query}"`);
    return query;
  }

  // Pattern 4: "kalau [filter]" - comparison/substitution
  const kalauPattern = lowerQuestion.match(/^kalau\s+(.+)$/i);
  if (kalauPattern && contextChain.entity) {
    const filter = kalauPattern[1];
    let query = `${contextChain.entity.entityType} ${filter}`;

    console.log(`🔄 [SMART REWRITE] "${currentQuestion}" → "${query}"`);
    return query;
  }

  // Pattern 5: "bagaimana dengan [filter]" or similar
  const bagaimanaPattern = lowerQuestion.match(/^(bagaimana dengan|bagaimana|how about|what about)\s+(.+)$/i);
  if (bagaimanaPattern && contextChain.entity) {
    const filter = bagaimanaPattern[2];
    let query = `${contextChain.entity.entityType} ${filter}`;

    console.log(`🔄 [SMART REWRITE] "${currentQuestion}" → "${query}"`);
    return query;
  }

  return null;
}

// ============================================
// MAIN CONTEXT-AWARE QUERY BUILDER
// ============================================

/**
 * Build context-aware query (MAIN FUNCTION)
 */
export function buildContextAwareQuery(currentQuestion, conversationHistory = []) {
  // First check if this looks like a follow-up
  const followupDetection = detectFollowupQuestion(currentQuestion);

  if (!followupDetection) {
    return currentQuestion; // Not a follow-up
  }

  console.log(`🔍 [CONTEXT] Detected: ${followupDetection.type} ("${followupDetection.originalPattern}")`);

  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  console.log(`🔎 [CONTEXT] Session history: ${userMessages.length} messages`);

  // Build SMART context chain (unlimited depth!)
  const contextChain = buildSmartContextChain(userMessages);

  if (!contextChain.baseQuestion) {
    console.log(`⚠️ [CONTEXT] No base question found`);
    return currentQuestion;
  }

  console.log(`📝 [CONTEXT] Base: "${contextChain.baseQuestion}"`);
  if (contextChain.filters.length > 0) {
    console.log(`🔧 [CONTEXT] Filters: [${contextChain.filters.join(', ')}]`);
  }

  // Try smart rewrite
  const rewritten = smartRewriteQuestion(currentQuestion, contextChain);

  if (rewritten) {
    return rewritten;
  }

  // Fallback
  if (contextChain.entity) {
    console.log(`📌 [CONTEXT] Using topic: ${contextChain.conversationTopic}`);

    if (currentQuestion.toLowerCase().match(/^(apa saja|siapa saja|sebutkan|tampilkan|show|list)[\s\?]*$/i)) {
      let query = `tampilkan daftar ${contextChain.entity.entityType}`;

      if (contextChain.filters.length > 0) {
        query += ' ' + contextChain.filters.join(' ');
      }

      console.log(`🔄 [CONTEXT] Fallback: "${query}"`);
      return query;
    }
  }

  return currentQuestion;
}

// ============================================
// EXPORTS
// ============================================

export default {
  FOLLOWUP_PATTERNS,
  ENTITY_PATTERNS,
  detectFollowupQuestion,
  extractEntityFromContext,
  buildContextAwareQuery
};
