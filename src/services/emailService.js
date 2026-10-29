import { getAllSubjects } from '../utils/storage';

/**
 * ============================================================================
 * PREPCBT EMAIL REPORT SERVICE
 * Generates official score transcripts, subject breakdowns, and detailed
 * question-by-question reviews for delivery to candidate email addresses.
 * ============================================================================
 */

export const generateResultEmailContent = (candidate) => {
  const result = candidate.examResult || {};
  const { totalScore = 0, maxScore = 400, percentage = 0, timeSpentSeconds = 0, subjectScores = {}, answers = {}, examQuestionsBySubject = {} } = result;

  const candidateEmail = candidate.email || 'student@example.com';
  const examType = candidate.examType || 'JAMB UTME';
  const minutesSpent = Math.round(timeSpentSeconds / 60);
  const allSubjects = getAllSubjects();

  // Subject breakdown text
  let subjectBreakdownText = '';
  Object.entries(subjectScores).forEach(([subId, stats]) => {
    const subName = allSubjects.find(s => s.id === subId)?.name || subId.toUpperCase();
    subjectBreakdownText += `  • ${subName}: ${stats.score}% (${stats.correct} / ${stats.total} correct)\n`;
  });

  // Compile detailed questions review (all questions + missed questions)
  let missedQuestionsText = '';
  let totalMissedCount = 0;

  Object.entries(examQuestionsBySubject).forEach(([subId, qList]) => {
    const subName = allSubjects.find(s => s.id === subId)?.name || subId.toUpperCase();
    const missedInSub = (qList || []).filter(q => answers[q.id] !== q.correctOption);

    if (missedInSub.length > 0) {
      missedQuestionsText += `\n--- ${subName.toUpperCase()} MISSED QUESTIONS (${missedInSub.length}) ---\n`;
      missedInSub.forEach((q, idx) => {
        totalMissedCount++;
        const candidateChoice = answers[q.id] ? `Option ${answers[q.id]}` : 'Unanswered';
        const correctChoice = `Option ${q.correctOption}`;
        
        missedQuestionsText += `\n[Q${idx + 1}] ${q.question}\n`;
        if (q.options && q.options.length > 0) {
          const optLabels = ['A', 'B', 'C', 'D'];
          q.options.forEach((opt, oIdx) => {
            missedQuestionsText += `    (${optLabels[oIdx]}) ${opt}\n`;
          });
        }
        missedQuestionsText += `  > Your Choice: ${candidateChoice} (Incorrect)\n`;
        missedQuestionsText += `  > Correct Choice: ${correctChoice}\n`;
        if (q.explanation) {
          missedQuestionsText += `  > Detailed Explanation: ${q.explanation}\n`;
        }
      });
    }
  });

  if (totalMissedCount === 0) {
    missedQuestionsText = '\nOutstanding performance! No questions were answered incorrectly.\n';
  }

  const subject = `Official CBT Result Docket: ${candidate.fullName} (${candidate.username}) - ${examType}`;

  const body = `=======================================================
PREPCBT ACCREDITED EXAMINATION COUNCIL
OFFICIAL COMPUTER-BASED TEST PERFORMANCE REPORT
=======================================================

CANDIDATE INFORMATION:
• Full Name: ${candidate.fullName}
• Registration Number: ${candidate.username}
• Email: ${candidateEmail}
• Examination Type: ${examType}
• Allocated Center: ${candidate.center || 'PrepCBT Center 01'}
• Examination Status: Verified & Approved by Board
• Time Spent: ${minutesSpent} minutes

-------------------------------------------------------
OFFICIAL SCORES & PERFORMANCE SUMMARY:
-------------------------------------------------------
• Aggregate Score: ${totalScore} / ${maxScore}
• Overall Percentage: ${percentage}%
• Result Decision: RELEASED & AUDITED

SUBJECT-BY-SUBJECT BREAKDOWN:
${subjectBreakdownText || '  (No subject scores recorded)'}
-------------------------------------------------------
QUESTION-BY-QUESTION REVIEW & MISSED ITEMS:
-------------------------------------------------------
${missedQuestionsText}

=======================================================
This is an official automated CBT report issued by PrepCBT.
For official verification or queries, please present your docket at the Center Administrator Office.
=======================================================`;

  return {
    recipient: candidateEmail,
    subject,
    body,
    totalMissedCount
  };
};

/**
 * Creates a mailto link so the user or administrator can dispatch directly via their email client
 */
export const openMailClientForResult = (candidate) => {
  const { recipient, subject, body } = generateResultEmailContent(candidate);
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
};
