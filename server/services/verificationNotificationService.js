const nodemailer = require('nodemailer');

const ADMIN_NOTIFICATION_EMAIL = 'yashrajsingh28359@gmail.com';
const APP_NAME = process.env.APP_NAME || 'SahiJob.com';
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://sahijob.com';
const ADMIN_URL = process.env.ADMIN_URL || 'https://sahijob.com/admin';

// Document display labels
const DOC_TYPE_LABELS = {
  gst_certificate: 'GST Certificate',
  pan_card_company: 'Company PAN Card',
  tan_certificate: 'TAN Certificate',
  itr_acknowledgement: 'ITR Acknowledgement',
  professional_tax_certificate: 'Professional Tax Certificate',
  certificate_of_incorporation: 'Certificate of Incorporation (COI)',
  cin_document: 'CIN / MCA Master Data',
  moa_aoa: 'MOA & AOA',
  partnership_deed: 'Partnership Deed',
  llp_agreement: 'LLP Agreement',
  msme_udyam_certificate: 'MSME / Udyam Certificate',
  shop_establishment_license: 'Shop & Establishment License',
  gumasta_trade_license: 'Gumasta / Trade License',
  address_proof: 'Company Address Proof',
  authorization_letter: 'Board Authorization Letter',
  authorized_person_id: 'Authorized Signatory Govt ID',
  staffing_license: 'Staffing / Recruitment Agency License',
  other: 'Other Supporting Document'
};

/**
 * Configure Nodemailer transporter if SMTP environment variables are set
 */
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user, pass },
  });
};

/**
 * Helper to dispatch email via Resend API with fallback to SMTP
 */
const dispatchEmail = async ({ to, subject, html }) => {
  const toEmails = Array.isArray(to) ? to : [to];
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const primaryFrom = process.env.RESEND_FROM_EMAIL || `${APP_NAME} <noreply@sahijob.com>`;

    const sendResend = async (fromAddress) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: toEmails,
          subject,
          html
        }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || 'Resend API error');
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    };

    try {
      const result = await sendResend(primaryFrom);
      console.log(`[VerificationEmail] Sent via Resend (${primaryFrom}) to:`, toEmails.join(', '));
      return result;
    } catch (err) {
      console.warn(`[VerificationEmail] Resend failed with "${primaryFrom}": ${err.message}`);
      // Retry with verified default sender if domain error
      if (primaryFrom !== `${APP_NAME} <onboarding@resend.dev>`) {
        try {
          const fallbackResult = await sendResend(`${APP_NAME} <onboarding@resend.dev>`);
          console.log(`[VerificationEmail] Sent via Resend fallback (onboarding@resend.dev) to:`, toEmails.join(', '));
          return fallbackResult;
        } catch (fbErr) {
          console.warn('[VerificationEmail] Resend fallback also failed:', fbErr.message);
        }
      }
    }
  }

  // Fallback to Nodemailer SMTP
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
        to: toEmails.join(', '),
        subject,
        html
      });
      console.log(`[VerificationEmail] Sent via SMTP to:`, toEmails.join(', '));
      return info;
    } catch (smtpErr) {
      console.warn('[VerificationEmail] SMTP failed:', smtpErr.message);
    }
  }

  console.log(`[VerificationEmail:DevMode] Mock Email to [${toEmails.join(', ')}] | Subject: "${subject}"`);
  return { mock: true };
};

/**
 * 1. Notify Admin when an employer submits verification documents
 * Target: yashrajsingh28359@gmail.com
 */
const notifyAdminOnDocumentSubmission = async (employer) => {
  try {
    const companyName = employer.companyName || employer.fullName || 'Company';
    const contactName = employer.fullName || 'Recruiter';
    const employerEmail = employer.email || 'N/A';
    const mobile = employer.mobile || 'Not provided';
    const accType = employer.isConsultant ? 'Consultant / Staffing Agency' : 'Direct Employer';
    const documents = Array.isArray(employer.verification?.documents) ? employer.verification.documents : [];
    const submittedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const docItemsHtml = documents.length > 0
      ? documents.map(d => {
          const label = DOC_TYPE_LABELS[d.docType] || d.docType || 'Document';
          const sizeKb = d.fileSize ? `${Math.ceil(d.fileSize / 1024)} KB` : '';
          return `<li style="margin-bottom: 6px; color: #1e293b;">
            <strong>${label}</strong>: ${d.fileName || 'Attached file'} ${sizeKb ? `(${sizeKb})` : ''}
          </li>`;
        }).join('')
      : '<li style="color: #64748b;">No document details found</li>';

    const subject = `📄 New Verification Submitted: ${companyName} (${contactName})`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px 20px; background: #f8fafc;">
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.04);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #15803d, #16a34a); padding: 24px; color: white;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
              Admin Alert · Action Needed
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: white; line-height: 1.3;">
              New Verification Submission Received
            </h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #dcfce7;">
              An employer has submitted business documents for verification review.
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13.5px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 140px;">Company Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Contact Person:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${contactName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Recruiter Email:</td>
                <td style="padding: 8px 0; color: #0f172a;">
                  <a href="mailto:${employerEmail}" style="color: #16a34a; text-decoration: none; font-weight: 600;">${employerEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Phone Number:</td>
                <td style="padding: 8px 0; color: #0f172a;">${mobile}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Account Type:</td>
                <td style="padding: 8px 0; color: #0f172a;">${accType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Submitted At:</td>
                <td style="padding: 8px 0; color: #0f172a;">${submittedDate} IST</td>
              </tr>
            </table>

            <!-- Documents Box -->
            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; font-size: 12.5px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">
                Submitted Documents (${documents.length}):
              </p>
              <ul style="margin: 0; padding-left: 18px; font-size: 13.5px;">
                ${docItemsHtml}
              </ul>
            </div>

            <!-- Admin CTA Button -->
            <div style="text-align: center; margin-top: 10px; margin-bottom: 10px;">
              <a href="${ADMIN_URL}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 2px 6px rgba(22,163,74,0.3);">
                Review Documents in Admin Panel &rarr;
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            This is an automated notification from SahiJob Compliance & Admin System.
          </div>
        </div>
      </div>
    `;

    await dispatchEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html
    });
  } catch (err) {
    console.warn('[VerificationNotification] notifyAdminOnDocumentSubmission error:', err.message);
  }
};

/**
 * 2. Notify Employer when their verification is APPROVED
 * Target: employer.email
 */
const notifyEmployerOnApproval = async (employer) => {
  try {
    if (!employer?.email) return;

    const companyName = employer.companyName || employer.fullName || 'Company';
    const contactName = employer.fullName || 'Recruiter';
    const subject = `🎉 Congratulations! Your SahiJob Account Verification is Approved - ${companyName}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 16px; background: #f8fafc;">
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.04);">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #15803d, #16a34a); padding: 26px 24px; color: white; text-align: center;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.2); display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 12px;">
              ✓
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: white;">
              Account Verified Successfully!
            </h1>
            <p style="margin: 6px 0 0; font-size: 14px; color: #dcfce7;">
              Welcome to the SahiJob Verified Employers Network
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 26px 24px;">
            <p style="font-size: 15px; color: #0f172a; margin-top: 0; line-height: 1.6;">
              Dear <strong>${contactName}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              We are pleased to inform you that your business verification for <strong>${companyName}</strong> has been thoroughly reviewed and <strong>approved</strong> by our compliance team.
            </p>

            <!-- Perks Card -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 12px; font-size: 13.5px; font-weight: 800; color: #166534;">
                Active privileges now enabled for your account:
              </p>
              <div style="margin-bottom: 8px; font-size: 13.5px; color: #15803d;">
                ✓ <strong>Green Verified Employer Badge:</strong> Displayed prominently on your company profile and all job cards.
              </div>
              <div style="margin-bottom: 8px; font-size: 13.5px; color: #15803d;">
                ✓ <strong>Full Job Visibility:</strong> Your posted jobs are now immediately visible to active candidates across India.
              </div>
              <div style="font-size: 13.5px; color: #15803d;">
                ✓ <strong>Direct Application Links:</strong> Create and share custom application tracking links with full analytics.
              </div>
            </div>

            <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
              You can now manage your active job listings and view incoming applications directly from your dashboard.
            </p>

            <!-- CTA -->
            <div style="text-align: center; margin: 28px 0 14px;">
              <a href="${CLIENT_URL}/employer" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14.5px; text-decoration: none; box-shadow: 0 2px 6px rgba(22,163,74,0.3);">
                Open Employer Dashboard &rarr;
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            Thank you for hiring on SahiJob.com · Building trust in recruitment.
          </div>
        </div>
      </div>
    `;

    await dispatchEmail({
      to: employer.email,
      subject,
      html
    });
  } catch (err) {
    console.warn('[VerificationNotification] notifyEmployerOnApproval error:', err.message);
  }
};

/**
 * 3. Notify Employer when verification is REJECTED
 * Includes the exact text written in the Admin rejection textbox!
 * Uses the exact sleek SahiJob responsive design template requested by user.
 * Target: employer.email
 */
const notifyEmployerOnRejection = async (employer, rejectionReason) => {
  try {
    if (!employer?.email) return;

    const companyName = employer.companyName || employer.fullName || 'your company';
    const contactName = employer.fullName || employer.companyName || 'Employer';
    const reasonText = (rejectionReason && rejectionReason.trim()) || 'The documents provided could not be verified. Please upload a clear and valid copy.';
    const verificationUrl = `${CLIENT_URL}/employer/verification`;
    const refCode = 'VER-' + String(employer._id || employer.id || employer.employerId || '400204').slice(-6).toUpperCase();
    const reviewDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const currentYear = new Date().getFullYear();
    const subject = `Action needed on your SahiJob verification - ${companyName}`;

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Action needed on your SahiJob verification</title></head>
<body style="margin:0;padding:0;background:#f3f6f4;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">We could not approve your documents yet. Here is what to fix. It takes about 2 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f4;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <tr><td style="padding:0 4px 18px;font-size:22px;font-weight:800;letter-spacing:-.3px;color:#0f172a;">sahijob<span style="color:#1f9d4c;">.com</span></td></tr>
  <tr><td style="background:#ffffff;border:1px solid #e5eae7;border-radius:16px;overflow:hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="height:4px;background:#1f9d4c;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 36px 8px;">
        <div style="display:inline-block;background:#fff4e5;color:#9a5b00;font-size:12px;font-weight:700;padding:5px 12px;border-radius:99px;">Verification update</div>
        <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.3;font-weight:800;letter-spacing:-.4px;">We need one more change to verify ${companyName}</h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#5b6b62;">Hi ${contactName}, thank you for submitting your documents. Our review team could not approve them yet. Nothing is lost: you can fix this and submit again.</p>
      </td></tr>
      <tr><td style="padding:20px 36px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfa;border:1px solid #e5eae7;border-radius:12px;">
          <tr><td style="padding:18px 20px;">
            <div style="font-size:13px;font-weight:700;color:#5b6b62;margin-bottom:6px;">Feedback from our review team</div>
            <div style="font-size:16px;line-height:1.55;font-weight:600;color:#0f172a;white-space:pre-line;">${reasonText}</div>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-size:16px;font-weight:700;margin-bottom:12px;">How to fix it</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td width="32" valign="top" style="padding:0 0 12px;"><div style="width:24px;height:24px;border-radius:50%;background:#e4f6ea;color:#14753a;font-size:13px;font-weight:700;text-align:center;line-height:24px;">1</div></td><td style="padding:2px 0 12px;font-size:15px;line-height:1.5;color:#2b3a32;">Log in to your SahiJob employer dashboard.</td></tr><tr><td width="32" valign="top" style="padding:0 0 12px;"><div style="width:24px;height:24px;border-radius:50%;background:#e4f6ea;color:#14753a;font-size:13px;font-weight:700;text-align:center;line-height:24px;">2</div></td><td style="padding:2px 0 12px;font-size:15px;line-height:1.5;color:#2b3a32;">Open <b>Verify Account</b> from the top bar.</td></tr><tr><td width="32" valign="top" style="padding:0 0 12px;"><div style="width:24px;height:24px;border-radius:50%;background:#e4f6ea;color:#14753a;font-size:13px;font-weight:700;text-align:center;line-height:24px;">3</div></td><td style="padding:2px 0 12px;font-size:15px;line-height:1.5;color:#2b3a32;">Remove the flagged document and upload a clear, valid copy (PDF, JPG or PNG).</td></tr><tr><td width="32" valign="top" style="padding:0 0 12px;"><div style="width:24px;height:24px;border-radius:50%;background:#e4f6ea;color:#14753a;font-size:13px;font-weight:700;text-align:center;line-height:24px;">4</div></td><td style="padding:2px 0 12px;font-size:15px;line-height:1.5;color:#2b3a32;">Select <b>Submit for verification</b>. We will review it again.</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:8px 36px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#1f9d4c;border-radius:10px;">
          <a href="${verificationUrl}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Update documents</a>
        </td></tr></table>
        <div style="font-size:12.5px;color:#5b6b62;margin-top:12px;">Button not working? Open <a href="${verificationUrl}" style="color:#14753a;">${verificationUrl}</a></div>
      </td></tr>
      <tr><td style="padding:24px 36px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2fbf5;border-radius:12px;">
          <tr><td style="padding:14px 18px;font-size:13.5px;line-height:1.55;color:#24523a;"><b>Your account is safe.</b> SahiJob will never ask for your password, OTP or payment by email. Your jobs stay hidden from candidates until verification is approved.</td></tr>
        </table>
      </td></tr>
      <tr><td style="border-top:1px solid #e5eae7;padding:18px 36px;font-size:13px;line-height:1.6;color:#5b6b62;">
        Questions? Reply to this email or write to <a href="mailto:support@sahijob.com" style="color:#14753a;">support@sahijob.com</a>.<br>
        Reference: <b style="color:#0f172a;">${refCode}</b> &nbsp;|&nbsp; Reviewed on ${reviewDate}
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:20px 12px 0;font-size:12px;line-height:1.6;color:#8a988f;">You received this email because you registered ${companyName} on SahiJob.com.<br>&copy; ${currentYear} SahiJob.com. All rights reserved.</td></tr>
</table></td></tr></table></body></html>`;

    await dispatchEmail({
      to: employer.email,
      subject,
      html
    });
  } catch (err) {
    console.warn('[VerificationNotification] notifyEmployerOnRejection error:', err.message);
  }
};

module.exports = {
  notifyAdminOnDocumentSubmission,
  notifyEmployerOnApproval,
  notifyEmployerOnRejection,
  // Backwards compatibility export
  sendVerificationStatusEmail: async ({ to, name, companyName, status, reason }) => {
    const dummyEmp = { email: to, fullName: name, companyName };
    if (status === 'verified') {
      return notifyEmployerOnApproval(dummyEmp);
    }
    return notifyEmployerOnRejection(dummyEmp, reason);
  }
};
