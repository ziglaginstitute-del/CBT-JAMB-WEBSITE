import { supabase } from '../supabaseClient';

/**
 * ============================================================================
 * SUPABASE SERVICE FOR PREPCBT
 * Clean CRUD operations for Candidates, Questions, Exams, and History.
 * Each operation maps to Supabase tables with Row Level Security (RLS).
 * ============================================================================
 */

// Helper to check if current user is logged in via Supabase Auth
export const getCurrentUserId = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (err) {
    console.warn('Could not retrieve Supabase session:', err);
    return null;
  }
};

// ============================================================================
// 1. CANDIDATES CRUD
// Table: 'candidates'
// ============================================================================

// Helper to test if Supabase table is reachable without writing any dummy data
export const checkSupabaseStatus = async () => {
  try {
    // Pure read-only query: checks connectivity without creating any test rows
    const { error } = await supabase.from('candidates').select('id').limit(1);

    if (error) {
      console.warn('Supabase status check notice:', error);
      return {
        connected: false,
        code: error.code,
        message: error.message,
        isRlsBlocked: error.code === '42501' || error.message?.toLowerCase().includes('row-level security')
      };
    }

    return { connected: true, isRlsBlocked: false, message: 'Connected & Writable' };
  } catch (err) {
    console.warn('Supabase connection check error:', err);
    return { connected: false, message: err.message || 'Network error' };
  }
};

/**
 * Load all candidates belonging to the authenticated user
 */
export const fetchCandidates = async () => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchCandidates notice:', error.message);
      return null;
    }

    // Map database snake_case fields to application camelCase and ignore any ping test rows
    return (data || [])
      .filter(row => !row.full_name?.toLowerCase().includes('ping') && !row.username?.toLowerCase().includes('ping'))
      .map(row => ({
        id: row.id,
        fullName: row.full_name,
        examType: row.exam_type,
        category: row.category,
        username: row.username,
        password: row.password,
        registeredSubjects: row.registered_subjects || [],
        center: row.center,
        seatNumber: row.seat_number,
        scheduledExamId: row.scheduled_exam_id,
        status: row.status,
        examResult: row.exam_result,
        registeredAt: row.created_at
      }));
  } catch (err) {
    console.warn('Supabase network error in fetchCandidates:', err);
  }
};

/**
 * Create a new candidate in Supabase
 */
export const createCandidate = async (candidate) => {
  try {
    const row = {
      id: candidate.id,
      full_name: candidate.fullName,
      exam_type: candidate.examType || 'JAMB UTME',
      category: candidate.category || 'Science',
      username: candidate.username,
      password: candidate.password,
      registered_subjects: candidate.registeredSubjects || [],
      center: candidate.center || 'PrepCBT Center 01',
      seat_number: candidate.seatNumber || 'Seat 01',
      scheduled_exam_id: candidate.scheduledExamId || null,
      status: candidate.status || 'Pending',
      exam_result: candidate.examResult || null
    };

    const { data, error } = await supabase
      .from('candidates')
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createCandidate notice:', error.message, error.code);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase network error in createCandidate:', err);
    return { success: false, error: err };
  }
};

/**
 * Push all local candidates to Supabase in bulk
 */
export const pushAllCandidatesToSupabase = async (candidatesList) => {
  try {
    if (!candidatesList || candidatesList.length === 0) {
      return { success: true, count: 0 };
    }

    const rows = candidatesList.map(c => ({
      id: c.id,
      full_name: c.fullName,
      exam_type: c.examType || 'JAMB UTME',
      category: c.category || 'Science',
      username: c.username,
      password: c.password,
      registered_subjects: c.registeredSubjects || [],
      center: c.center || 'PrepCBT Center 01',
      seat_number: c.seatNumber || 'Seat 01',
      scheduled_exam_id: c.scheduledExamId || null,
      status: c.status || 'Pending',
      exam_result: c.examResult || null
    }));

    const { data, error } = await supabase
      .from('candidates')
      .upsert(rows);

    if (error) {
      console.warn('Supabase pushAllCandidatesToSupabase error:', error.message);
      return { success: false, error };
    }
    return { success: true, count: rows.length };
  } catch (err) {
    console.warn('Supabase pushAllCandidatesToSupabase network error:', err);
    return { success: false, error: err };
  }
};

/**
 * Update candidate in Supabase (e.g. password reset, status, or exam result)
 */
export const updateCandidateRecord = async (id, fields) => {
  try {
    const updates = {};
    if (fields.fullName !== undefined) updates.full_name = fields.fullName;
    if (fields.examType !== undefined) updates.exam_type = fields.examType;
    if (fields.category !== undefined) updates.category = fields.category;
    if (fields.username !== undefined) updates.username = fields.username;
    if (fields.password !== undefined) updates.password = fields.password;
    if (fields.registeredSubjects !== undefined) updates.registered_subjects = fields.registeredSubjects;
    if (fields.center !== undefined) updates.center = fields.center;
    if (fields.seatNumber !== undefined) updates.seat_number = fields.seatNumber;
    if (fields.scheduledExamId !== undefined) updates.scheduled_exam_id = fields.scheduledExamId;
    if (fields.status !== undefined) updates.status = fields.status;
    if (fields.examResult !== undefined) updates.exam_result = fields.examResult;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateCandidateRecord notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase network error in updateCandidateRecord:', err);
    return null;
  }
};

/**
 * Delete a candidate from Supabase
 */
export const deleteCandidateRecord = async (id) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteCandidateRecord notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase network error in deleteCandidateRecord:', err);
    return false;
  }
};

// ============================================================================
// 2. QUESTION BANK CRUD
// Table: 'questions'
// ============================================================================

/**
 * Load all questions from Supabase grouped into subjects
 */
export const fetchQuestions = async () => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchQuestions notice:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    // Group rows by subject
    const bank = {};
    data.forEach(row => {
      const sub = (row.subject || 'english').toLowerCase();
      if (!bank[sub]) bank[sub] = [];
      bank[sub].push({
        id: row.id,
        subject: row.subject,
        topic: row.topic,
        difficulty: row.difficulty,
        question: row.question_text,
        passage: row.passage,
        options: row.options || [],
        correctOption: row.correct_option,
        hint: row.hint,
        explanation: row.explanation,
        year: row.year
      });
    });

    return bank;
  } catch (err) {
    console.warn('Supabase network error in fetchQuestions:', err);
    return null;
  }
};

/**
 * Create a new question in Supabase
 */
export const createQuestion = async (q) => {
  try {
    const row = {
      id: q.id,
      subject: (q.subject || 'english').toLowerCase(),
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'Intermediate',
      question_text: q.question,
      passage: q.passage || null,
      options: q.options || [],
      correct_option: q.correctOption,
      hint: q.hint || null,
      explanation: q.explanation || null,
      year: q.year || 2026
    };

    const { data, error } = await supabase
      .from('questions')
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createQuestion notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase network error in createQuestion:', err);
    return null;
  }
};

/**
 * Update an existing question
 */
export const updateQuestionRecord = async (id, fields) => {
  try {
    const updates = {};
    if (fields.subject !== undefined) updates.subject = fields.subject.toLowerCase();
    if (fields.topic !== undefined) updates.topic = fields.topic;
    if (fields.difficulty !== undefined) updates.difficulty = fields.difficulty;
    if (fields.question !== undefined) updates.question_text = fields.question;
    if (fields.passage !== undefined) updates.passage = fields.passage;
    if (fields.options !== undefined) updates.options = fields.options;
    if (fields.correctOption !== undefined) updates.correct_option = fields.correctOption;
    if (fields.hint !== undefined) updates.hint = fields.hint;
    if (fields.explanation !== undefined) updates.explanation = fields.explanation;
    if (fields.year !== undefined) updates.year = fields.year;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateQuestionRecord notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase network error in updateQuestionRecord:', err);
    return null;
  }
};

/**
 * Delete a question from Supabase
 */
export const deleteQuestionRecord = async (id) => {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteQuestionRecord notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase network error in deleteQuestionRecord:', err);
    return false;
  }
};

// ============================================================================
// 3. SCHEDULED EXAMS CRUD
// Table: 'scheduled_exams'
// ============================================================================

/**
 * Load all scheduled exams from Supabase
 */
export const fetchScheduledExams = async () => {
  try {
    const { data, error } = await supabase
      .from('scheduled_exams')
      .select('*')
      .order('starts_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchScheduledExams notice:', error.message);
      return null;
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      accessCode: row.access_code,
      examType: row.exam_type,
      subjectIds: row.subject_ids || [],
      durationMinutes: row.duration_minutes,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      questionsBySubject: row.questions_by_subject || {},
      submissions: row.submissions || [],
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('Supabase network error in fetchScheduledExams:', err);
    return null;
  }
};

/**
 * Create a new scheduled exam in Supabase
 */
export const createScheduledExam = async (exam) => {
  try {
    const row = {
      id: exam.id,
      title: exam.title,
      access_code: exam.accessCode,
      exam_type: exam.examType || 'jamb',
      subject_ids: exam.subjectIds || [],
      duration_minutes: exam.durationMinutes || 120,
      starts_at: exam.startsAt,
      ends_at: exam.endsAt,
      questions_by_subject: exam.questionsBySubject || {},
      submissions: exam.submissions || []
    };

    const { data, error } = await supabase
      .from('scheduled_exams')
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createScheduledExam notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase network error in createScheduledExam:', err);
    return null;
  }
};

/**
 * Update scheduled exam (e.g. adding submissions)
 */
export const updateScheduledExamRecord = async (id, fields) => {
  try {
    const updates = {};
    if (fields.title !== undefined) updates.title = fields.title;
    if (fields.accessCode !== undefined) updates.access_code = fields.accessCode;
    if (fields.durationMinutes !== undefined) updates.duration_minutes = fields.durationMinutes;
    if (fields.startsAt !== undefined) updates.starts_at = fields.startsAt;
    if (fields.endsAt !== undefined) updates.ends_at = fields.endsAt;
    if (fields.questionsBySubject !== undefined) updates.questions_by_subject = fields.questionsBySubject;
    if (fields.submissions !== undefined) updates.submissions = fields.submissions;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('scheduled_exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateScheduledExamRecord notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase network error in updateScheduledExamRecord:', err);
    return null;
  }
};

/**
 * Delete a scheduled exam from Supabase
 */
export const deleteScheduledExamRecord = async (id) => {
  try {
    const { error } = await supabase
      .from('scheduled_exams')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase deleteScheduledExamRecord notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase network error in deleteScheduledExamRecord:', err);
    return false;
  }
};

// ============================================================================
// 4. EXAM HISTORY / RESULTS CRUD
// Table: 'exam_history'
// ============================================================================

/**
 * Load user's exam attempt history from Supabase
 */
export const fetchExamHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('exam_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Supabase fetchExamHistory notice:', error.message);
      return null;
    }

    return (data || []).map(row => ({
      id: row.id,
      timestamp: row.created_at,
      score: row.score,
      maxScore: row.max_score,
      percentage: row.percentage,
      timeSpentSeconds: row.time_spent_seconds,
      examConfig: row.exam_config,
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      scheduledExamId: row.scheduled_exam_id
    }));
  } catch (err) {
    console.warn('Supabase network error in fetchExamHistory:', err);
    return null;
  }
};

/**
 * Save exam result to Supabase
 */
export const createExamHistoryRecord = async (record) => {
  try {
    const row = {
      id: record.id || `hist-${Date.now()}`,
      candidate_id: record.examConfig?.candidateId || record.candidateId || null,
      candidate_name: record.examConfig?.candidateName || record.candidateName || 'Candidate',
      candidate_reg: record.examConfig?.candidateReg || null,
      scheduled_exam_id: record.examConfig?.scheduledExamId || null,
      exam_type: record.examConfig?.examType || 'JAMB UTME',
      score: record.score,
      max_score: record.maxScore || 400,
      percentage: record.percentage,
      time_spent_seconds: record.timeSpentSeconds || 0,
      exam_config: record.examConfig || {},
      subject_scores: record.examConfig?.subjectScores || {}
    };

    const { data, error } = await supabase
      .from('exam_history')
      .upsert(row)
      .select()
      .single();

    if (error) {
      console.warn('Supabase createExamHistoryRecord notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase network error in createExamHistoryRecord:', err);
    return null;
  }
};
