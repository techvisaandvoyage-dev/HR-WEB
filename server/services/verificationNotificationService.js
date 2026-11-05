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
 * Target: employer.email
 */
const notifyEmployerOnRejection = async (employer, rejectionReason) => {
  try {
    if (!employer?.email) return;

    const companyName = employer.companyName || employer.fullName || 'Company';
    const contactName = employer.fullName || 'Recruiter';
    const reasonText = (rejectionReason && rejectionReason.trim()) || 'Documents provided could not be validated against official registry records.';
    const subject = `⚠️ Action Required: Account Verification Update for ${companyName}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 16px; background: #f8fafc;">
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.04);">
          
          <!-- Banner -->
          <div style="background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 26px 24px; color: white;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
              Action Required
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: white; line-height: 1.3;">
              Verification Documents Need Correction
            </h1>
            <p style="margin: 6px 0 0; font-size: 13.5px; color: #fecaca;">
              Please review the feedback below and re-submit your documents.
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 26px 24px;">
            <p style="font-size: 15px; color: #0f172a; margin-top: 0; line-height: 1.6;">
              Dear <strong>${contactName}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Our compliance team reviewed the business verification documents submitted for <strong>${companyName}</strong>. At this time, we were unable to approve the verification due to the issue noted below.
            </p>

            <!-- Prominent Rejection Reason Box -->
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 12.5px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em;">
                Problem Identified with Document(s):
              </p>
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #7f1d1d; line-height: 1.5;">
                "${reasonText}"
              </p>
            </div>

            <!-- Steps to Fix -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0 0 10px; font-size: 13px; font-weight: 800; color: #334155;">
                How to re-submit your documents:
              </p>
              <ol style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.7;">
                <li>Log in to your <strong>SahiJob Employer Dashboard</strong>.</li>
                <li>Go to the <strong>Verify Account</strong> page.</li>
                <li>Click <strong>Remove</strong> or <strong>Replace</strong> on the flagged document(s).</li>
                <li>Upload clear, valid PDF or image documents strictly under <strong>300 KB</strong>.</li>
                <li>Click <strong>Re-submit for verification</strong> to send for immediate re-review.</li>
              </ol>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 28px 0 14px;">
              <a href="${CLIENT_URL}/employer/verification" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 13px 32px; border-radius: 10px; font-weight: 700; font-size: 14.5px; text-decoration: none; box-shadow: 0 2px 6px rgba(220,38,38,0.3);">
                Update &amp; Re-submit Documents &rarr;
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            Need help? Reply directly to this email or contact our support team.
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
