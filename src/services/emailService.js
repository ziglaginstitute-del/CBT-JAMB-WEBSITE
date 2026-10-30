import { getAllSubjects, getEmailSettings, isElectronApp } from '../utils/storage';

/**
 * ============================================================================
 * PREPCBT EMAIL REPORT & BACKEND DISPATCH SERVICE
 * Supports Resend API, EmailJS, and Google Apps Script / Custom Webhook
 * Native Node.js dispatch in Electron (Zero CORS) & fetch in browser
 * ============================================================================
 */

export const generateResultEmailContent = (candidate) => {
  const result = candidate.examResult || {};
  const { 
    totalScore = 0, 
    maxScore = 400, 
    percentage = 0, 
    timeSpentSeconds = 0, 
    subjectScores = {}, 
    answers = {}, 
    examQuestionsBySubject = {} 
  } = result;

  const candidateEmail = candidate.email || 'student@example.com';
  const examType = candidate.examType || 'JAMB UTME';
  const minutesSpent = Math.round(timeSpentSeconds / 60);
  const allSubjects = getAllSubjects();

  // Subject breakdown plain text and HTML
  let subjectBreakdownText = '';
  let subjectRowsHtml = '';

  Object.entries(subjectScores).forEach(([subId, stats]) => {
    const subName = allSubjects.find(s => s.id === subId)?.name || subId.toUpperCase();
    subjectBreakdownText += `  • ${subName}: ${stats.score}% (${stats.correct} / ${stats.total} correct)\n`;

    subjectRowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">${subName}</td>
        <td style="padding: 10px 14px; text-align: center; font-family: monospace; font-weight: bold; color: #0284c7;">${stats.score}%</td>
        <td style="padding: 10px 14px; text-align: center; color: #475569;">${stats.correct} / ${stats.total}</td>
      </tr>
    `;
  });

  // Compile detailed questions review (missed questions)
  let missedQuestionsText = '';
  let missedQuestionsHtml = '';
  let totalMissedCount = 0;

  Object.entries(examQuestionsBySubject).forEach(([subId, qList]) => {
    const subName = allSubjects.find(s => s.id === subId)?.name || subId.toUpperCase();
    const missedInSub = (qList || []).filter(q => answers[q.id] !== q.correctOption);

    if (missedInSub.length > 0) {
      missedQuestionsText += `\n--- ${subName.toUpperCase()} MISSED QUESTIONS (${missedInSub.length}) ---\n`;
      missedQuestionsHtml += `
        <div style="margin-top: 20px; border-left: 4px solid #f43f5e; padding-left: 12px;">
          <h4 style="margin: 0 0 10px 0; color: #be123c; font-size: 14px; text-transform: uppercase;">
            ${subName} (${missedInSub.length} Missed Items)
          </h4>
        </div>
      `;

      missedInSub.forEach((q, idx) => {
        totalMissedCount++;
        const candidateChoice = answers[q.id] ? `Option ${answers[q.id]}` : 'Unanswered';
        const correctChoice = `Option ${q.correctOption}`;
        
        missedQuestionsText += `\n[Q${idx + 1}] ${q.question}\n`;
        let optListHtml = '';
        if (q.options && q.options.length > 0) {
          const optLabels = ['A', 'B', 'C', 'D'];
          q.options.forEach((opt, oIdx) => {
            missedQuestionsText += `    (${optLabels[oIdx]}) ${opt}\n`;
            optListHtml += `<li style="margin-bottom: 4px;"><strong>${optLabels[oIdx]}.</strong> ${opt}</li>`;
          });
        }
        missedQuestionsText += `  > Your Choice: ${candidateChoice} (Incorrect)\n`;
        missedQuestionsText += `  > Correct Choice: ${correctChoice}\n`;
        if (q.explanation) {
          missedQuestionsText += `  > Detailed Explanation: ${q.explanation}\n`;
        }

        missedQuestionsHtml += `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #0f172a; font-size: 13px;">
              Q${idx + 1}. ${q.question}
            </p>
            ${optListHtml ? `<ul style="margin: 0 0 10px 0; padding-left: 20px; font-size: 12px; color: #334155;">${optListHtml}</ul>` : ''}
            <div style="font-size: 12px; margin-bottom: 6px;">
              <span style="display: inline-block; padding: 2px 8px; background-color: #ffe4e6; color: #be123c; border-radius: 4px; font-weight: bold; margin-right: 8px;">
                Your Choice: ${candidateChoice}
              </span>
              <span style="display: inline-block; padding: 2px 8px; background-color: #dcfce7; color: #15803d; border-radius: 4px; font-weight: bold;">
                Correct Choice: ${correctChoice}
              </span>
            </div>
            ${q.explanation ? `
              <div style="background-color: #f1f5f9; padding: 8px 10px; border-radius: 6px; font-size: 11px; color: #475569; margin-top: 6px;">
                <strong>Explanation:</strong> ${q.explanation}
              </div>
            ` : ''}
          </div>
        `;
      });
    }
  });

  if (totalMissedCount === 0) {
    missedQuestionsText = '\nOutstanding performance! No questions were answered incorrectly.\n';
    missedQuestionsHtml = `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; color: #166534; font-weight: bold; font-size: 13px;">
        🎉 Outstanding Performance! Zero questions missed.
      </div>
    `;
  }

  const subject = `Official CBT Result Statement: ${candidate.fullName} (${candidate.username}) - ${examType}`;

  // Plain Text Version
  const body = `=======================================================
PREPCBT ACCREDITED EXAMINATION COUNCIL
OFFICIAL COMPUTER-BASED TEST PERFORMANCE REPORT
=======================================================

CANDIDATE INFORMATION:
• Full Name: ${candidate.fullName}
• Registration Number: ${candidate.username}
• Registered Email: ${candidateEmail}
• Examination Standard: ${examType}
• Center: ${candidate.center || 'PrepCBT Center 01'}
• Board Audit Status: APPROVED & RELEASED
• Time Spent: ${minutesSpent} minutes

-------------------------------------------------------
OFFICIAL SCORES & PERFORMANCE SUMMARY:
-------------------------------------------------------
• Aggregate Score: ${totalScore} / ${maxScore}
• Overall Percentage: ${percentage}%
• Status: AUDITED & CERTIFIED

SUBJECT-BY-SUBJECT BREAKDOWN:
${subjectBreakdownText || '  (No subject scores recorded)'}
-------------------------------------------------------
MISSED QUESTIONS & REVISION GUIDE:
-------------------------------------------------------
${missedQuestionsText}

=======================================================
This is an official automated CBT report issued by PrepCBT.
For official verification, present your docket at the administrator desk.
=======================================================`;

  // Professional HTML Version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #cbd5e1;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">PREPCBT EXAMINATION COUNCIL</h2>
          <p style="margin: 0; font-size: 13px; color: #e0f2fe;">Official Statement of Computer-Based Test Result</p>
        </div>

        <!-- Candidate Particulars Card -->
        <div style="padding: 24px;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 40%;">Candidate Name:</td>
                <td style="padding: 4px 0; font-weight: bold; color: #0f172a;">${candidate.fullName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Registration Number:</td>
                <td style="padding: 4px 0; font-family: monospace; font-weight: bold; color: #0284c7;">${candidate.username}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Examination Type:</td>
                <td style="padding: 4px 0; font-weight: bold; color: #0f172a;">${examType}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Duration Spent:</td>
                <td style="padding: 4px 0; color: #334155;">${minutesSpent} minutes</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Verification Status:</td>
                <td style="padding: 4px 0;"><span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">APPROVED & RELEASED</span></td>
              </tr>
            </table>
          </div>

          <!-- Score Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 20px; color: #ffffff; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">
              Aggregate Final Score
            </div>
            <div style="font-size: 38px; font-weight: 900; font-family: monospace; color: #38bdf8;">
              ${totalScore} <span style="font-size: 18px; color: #64748b; font-weight: 400;">/ ${maxScore}</span>
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #4ade80; margin-top: 4px;">
              ${percentage}% Overall Performance
            </div>
          </div>

          <!-- Subject Breakdown Table -->
          <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; margin: 0 0 10px 0;">
            Subject-by-Subject Score Breakdown
          </h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; font-size: 12px;">
            <thead style="background-color: #f1f5f9; text-transform: uppercase; font-size: 10px; color: #64748b; letter-spacing: 0.5px;">
              <tr>
                <th style="padding: 8px 14px; text-align: left;">Subject</th>
                <th style="padding: 8px 14px; text-align: center;">Score</th>
                <th style="padding: 8px 14px; text-align: center;">Questions Correct</th>
              </tr>
            </thead>
            <tbody>
              ${subjectRowsHtml || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8;">No subject records available</td></tr>'}
            </tbody>
          </table>

          <!-- Missed Questions Section -->
          <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; margin: 0 0 10px 0;">
            Missed Items & Study Revision
          </h3>
          ${missedQuestionsHtml}

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0 0 4px 0;">PrepCBT Official Automated Examination System</p>
            <p style="margin: 0;">This electronic statement serves as an authorized notification of your CBT score.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  return {
    recipient: candidateEmail,
    subject,
    body,
    html,
    totalMissedCount,
    templateParams: {
      candidateName: candidate.fullName,
      candidateReg: candidate.username,
      examType,
      totalScore: `${totalScore} / ${maxScore}`,
      percentage: `${percentage}%`,
      subjectBreakdown: subjectBreakdownText,
      resultText: body
    }
  };
};

/**
 * Dispatches an official result email to a candidate using the configured backend
 */
export const sendResultEmail = async (candidate, configOverride = null) => {
  const emailData = generateResultEmailContent(candidate);
  const settings = configOverride || getEmailSettings();

  const to = candidate.email?.trim() || emailData.recipient;
  if (!to || !to.includes('@')) {
    throw new Error('Candidate has no valid email address registered.');
  }

  // 1. Electron Native Dispatch (Recommended for Windows Desktop - Bypasses CORS)
  if (typeof window !== 'undefined' && window.electronAPI?.sendNativeEmail) {
    const res = await window.electronAPI.sendNativeEmail({
      provider: settings.provider,
      settings,
      to,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.html,
      templateParams: emailData.templateParams
    });

    if (!res.success) {
      throw new Error(res.error || 'Failed to dispatch email via native desktop bridge.');
    }
    return res;
  }

  // 2. Web / Browser Dispatch (via Fetch)
  if (settings.provider === 'resend') {
    const apiKey = settings.resendApiKey?.trim();
    if (!apiKey) {
      throw new Error('Resend API key is not configured. Please open Email Delivery Settings to enter your free Resend key.');
    }

    const payload = {
      from: settings.resendFrom?.trim() || 'PrepCBT <onboarding@resend.dev>',
      to: [to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.body
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `Resend Error: HTTP ${response.status}`);
    }
    return { success: true, provider: 'resend', id: data.id };

  } else if (settings.provider === 'emailjs') {
    const serviceId = settings.emailjsServiceId?.trim();
    const templateId = settings.emailjsTemplateId?.trim();
    const publicKey = settings.emailjsPublicKey?.trim();

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS credentials are incomplete. Please configure Service ID, Template ID, and Public Key.');
    }

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: to,
        to_name: candidate.fullName,
        subject: emailData.subject,
        message: emailData.body,
        html_message: emailData.html,
        ...emailData.templateParams
      }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`EmailJS Error: ${errText || response.statusText}`);
    }
    return { success: true, provider: 'emailjs' };

  } else if (settings.provider === 'webhook') {
    const webhookUrl = settings.webhookUrl?.trim();
    if (!webhookUrl) {
      throw new Error('Webhook / Google Apps Script URL is missing in Email Delivery Settings.');
    }

    const payload = {
      to,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.html,
      templateParams: emailData.templateParams,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Webhook Error: HTTP ${response.status} - ${errText}`);
    }
    return { success: true, provider: 'webhook' };

  } else {
    throw new Error('No valid email provider selected. Please open Email Delivery Settings and select Resend, EmailJS, or Webhook.');
  }
};

/**
 * Sends a test verification email to confirm email backend connectivity
 */
export const sendTestEmail = async (targetEmail, configOverride = null) => {
  const dummyCandidate = {
    id: 'test_verify_' + Date.now(),
    fullName: 'Test Candidate',
    username: '2026/TEST/VERIFY',
    email: targetEmail,
    examType: 'JAMB UTME',
    center: 'PrepCBT Accreditation Center',
    examResult: {
      totalScore: 284,
      maxScore: 400,
      percentage: 71,
      timeSpentSeconds: 5400,
      subjectScores: {
        english: { score: 72, correct: 43, total: 60 },
        mathematics: { score: 70, correct: 28, total: 40 },
        physics: { score: 75, correct: 30, total: 40 },
        chemistry: { score: 68, correct: 27, total: 40 }
      },
      answers: { 'q1': 'B' },
      examQuestionsBySubject: {
        english: [
          {
            id: 'q1',
            question: 'Sample question: Which of the following is correct?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctOption: 'C',
            explanation: 'This is a sample revision explanation.'
          }
        ]
      }
    }
  };

  return await sendResultEmail(dummyCandidate, configOverride);
};

/**
 * Fallback: Opens the local desktop mailto client
 */
export const openMailClientForResult = (candidate) => {
  const { recipient, subject, body } = generateResultEmailContent(candidate);
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1500))}`;
  window.location.href = mailtoUrl;
};
