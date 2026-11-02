/**
 * candidateProfileExporter.js
 * High-performance Indeed-style Candidate Profile Exporter (PDF & DOC)
 * Generates clean, standardized, professional candidate profile summaries
 * with 100% vector typography, attribution details, work experience,
 * education, skills, and resume preview links.
 */

// Helper functions for candidate data extraction
export const getCandidateDesignation = (emp) => {
  if (!emp) return 'N/A';
  if (emp.currentDesignation) return emp.currentDesignation;
  if (emp.designation) return emp.designation;
  const exps = emp.experience || [];
  if (Array.isArray(exps)) {
    const currentRole = exps.find(e => e.roles?.some(r => r.currentCompany))?.roles?.find(r => r.currentCompany);
    if (currentRole?.jobTitle) return currentRole.jobTitle;
    if (exps[0]?.roles?.[0]?.jobTitle) return exps[0].roles[0].jobTitle;
    if (exps[0]?.designation) return exps[0].designation;
  }
  return 'Job Seeker';
};

export const getCandidateCompany = (emp) => {
  if (!emp) return 'N/A';
  if (emp.currentCompany) return emp.currentCompany;
  const exps = emp.experience || [];
  if (Array.isArray(exps)) {
    const currentExp = exps.find(e => e.roles?.some(r => r.currentCompany)) || exps[0];
    if (currentExp?.companyName) return currentExp.companyName;
  }
  return emp.professionalDetails?.currentCompany || 'N/A';
};

export const getCandidateExperience = (emp) => {
  if (!emp) return 'Fresher';
  if (emp.professionalDetails?.totalExperience) return emp.professionalDetails.totalExperience;
  if (emp.totalExperience) return emp.totalExperience;
  if (emp.workExp || emp.experienceYears) return emp.workExp || emp.experienceYears;
  if (emp.isFresher) return 'Fresher';
  if (Array.isArray(emp.experience) && emp.experience.length > 0) return `${emp.experience.length} Year(s)`;
  return 'Fresher';
};

export const getCandidatePrimaryQualification = (emp) => {
  if (!emp) return 'N/A';
  if (emp.primaryQualification) return emp.primaryQualification;
  const quals = emp.qualifications || emp.education || [];
  if (!Array.isArray(quals) || quals.length === 0) return 'N/A';
  const primary = quals.find(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)) || quals[0];
  return primary?.course || primary?.educationType || primary?.degree || primary?.university || 'N/A';
};

export const formatExpDate = (value, fallback = '') => {
  if (!value) return fallback;
  const match = String(value).match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return String(value);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = Number(match[2]) - 1;
  return `${monthNames[monthIdx] || match[2]} ${match[1]}`;
};

export const formatEduYear = (qual) => {
  if (!qual) return '';
  const start = qual.startYear || qual.startingYear;
  const end = qual.endYear || qual.yearOfPassing || qual.passingYear || qual.graduationYear || qual.passingOutYear || qual.year;
  if (start && end) return `${start} – ${end}`;
  if (end) return String(end);
  if (start) return `${start} – Present`;
  return '';
};

export const formatEduScore = (qual) => {
  if (!qual) return '';
  const raw = qual.percentage ?? qual.cgpa ?? qual.score ?? qual.grade;
  if (raw === undefined || raw === null || raw === '') return '';
  const scoreStr = String(raw).trim();
  if (!scoreStr) return '';
  if (scoreStr.includes('%') || scoreStr.toLowerCase().includes('cgpa') || scoreStr.toLowerCase().includes('grade')) {
    return scoreStr;
  }
  const system = (qual.gradingSystem || '').toLowerCase();
  if (system.includes('percent')) return `${scoreStr}%`;
  if (system.includes('4')) return `${scoreStr} / 4 CGPA`;
  if (system.includes('10') || system.includes('cgpa')) return `${scoreStr} CGPA`;
  if (system.includes('grade')) return `Grade ${scoreStr}`;
  const num = parseFloat(scoreStr);
  if (!isNaN(num)) {
    return num > 10 ? `${scoreStr}%` : `${scoreStr} CGPA`;
  }
  return scoreStr;
};

/**
 * Build rich HTML representation matching Indeed Recruiter Candidate Profile
 */
export const generateIndeedProfileHtml = (candidate, employers = [], isForWord = false) => {
  if (!candidate) return '';

  const name = candidate.name || 'Candidate Profile';
  const designation = getCandidateDesignation(candidate);
  const email = candidate.email || 'N/A';
  const mobile = candidate.mobile || candidate.phone || 'N/A';
  const location = candidate.location || 'N/A';
  const preferredLocation = candidate.preferredLocation || location;
  const totalExp = getCandidateExperience(candidate);
  const primaryQual = getCandidatePrimaryQualification(candidate);
  const currentCompany = getCandidateCompany(candidate);
  const currentSalary = candidate.professionalDetails?.currentSalary || candidate.currentCTC || 'N/A';
  const expectedSalary = candidate.professionalDetails?.expectedSalary || candidate.expectedCTC || 'N/A';
  const noticePeriod = candidate.noticePeriod || candidate.professionalDetails?.noticePeriod || 'Immediate / N/A';
  const gender = candidate.gender || candidate.personalDetails?.gender || '';
  const dob = candidate.dob || candidate.personalDetails?.dob || '';
  const candidateId = candidate._id || candidate.id || 'N/A';
  const regDate = candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A';

  // Acquisition / Referral Context
  const acq = candidate.acquisition || {};
  const isJobLink = (candidate.sourceType || acq.sourceType) === 'job_link';
  const firstTouchJob = candidate.firstTouchJob || acq.jobSnapshot;
  const employer = candidate.employer || candidate.firstTouchEmployer;
  const landedAt = acq.landedAt ? new Date(acq.landedAt).toLocaleString() : '';
  const registeredAt = (acq.registeredAt || candidate.createdAt) ? new Date(acq.registeredAt || candidate.createdAt).toLocaleString() : '';

  // Resume and media
  const resumeUrl = candidate.resume || candidate.resumeUrl || candidate.documents?.resume || '';
  const coverLetterUrl = candidate.coverLetter || candidate.coverLetterUrl || candidate.documents?.coverLetter || '';
  const introVideoUrl = candidate.introVideo || candidate.documents?.introVideo || '';

  // Skills
  const rawSkills = candidate.professionalDetails?.skills || candidate.skills;
  const skillsList = typeof rawSkills === 'string'
    ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(rawSkills) ? rawSkills : [];

  // Languages
  const languagesList = Array.isArray(candidate.languages) ? candidate.languages : [];

  // Experience
  const experiences = candidate.experience || [];

  // Education
  const educations = candidate.qualifications || candidate.education || [];

  // Applications
  const applications = candidate.applications || [];

  const summary = candidate.brief || candidate.summary || candidate.bio || candidate.professionalDetails?.about || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name} - SahiJob Candidate Profile</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      padding: 24px;
    }
    @page {
      size: A4;
      margin: 14mm 12mm 14mm 12mm;
    }
    @media print {
      body { padding: 0; font-size: 12px; }
      .no-print { display: none !important; }
      .page-break-inside-avoid { page-break-inside: avoid; }
      a { text-decoration: none; color: inherit; }
    }
    .header-card {
      border-bottom: 2px solid #059669;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 11px;
      font-weight: 800;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .badge-indeed {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .candidate-name {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .candidate-title {
      font-size: 15px;
      font-weight: 700;
      color: #059669;
      margin-top: 4px;
      margin-bottom: 12px;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
      font-size: 11.5px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .contact-item strong {
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .contact-item span, .contact-item a {
      color: #0f172a;
      font-weight: 600;
      text-decoration: none;
    }
    .quick-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      color: #334155;
    }
    .chip strong {
      color: #0f172a;
      font-weight: 700;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #059669;
      border-radius: 2px;
    }
    .card-block {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .timeline-item {
      border-left: 2px solid #059669;
      padding-left: 14px;
      margin-left: 6px;
      margin-bottom: 14px;
      position: relative;
      page-break-inside: avoid;
    }
    .timeline-dot {
      position: absolute;
      left: -6px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #059669;
      border: 2px solid #ffffff;
    }
    .timeline-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .timeline-sub {
      font-size: 11.5px;
      font-weight: 600;
      color: #059669;
      margin-top: 2px;
    }
    .timeline-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      margin-bottom: 6px;
    }
    .timeline-desc {
      font-size: 11.5px;
      color: #334155;
      line-height: 1.5;
    }
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .skill-tag {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }
    .resume-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .btn-action {
      background: #059669;
      color: #ffffff !important;
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      display: inline-block;
    }
    .footer-note {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <!-- Top Brand & Header -->
  <div class="header-card">
    <div class="brand-bar">
      <span class="brand-title">SahiJob • Recruiter Format</span>
      <span class="badge-indeed">Candidate Profile</span>
    </div>

    <h1 class="candidate-name">${name}</h1>
    <div class="candidate-title">${designation} • ${currentCompany !== 'N/A' ? currentCompany : 'Job Seeker'}</div>

    <!-- Contact & Overview Grid -->
    <div class="contact-grid">
      <div class="contact-item">
        <strong>Email</strong>
        <span>${email}</span>
      </div>
      <div class="contact-item">
        <strong>Mobile / Phone</strong>
        <span>${mobile}</span>
      </div>
      <div class="contact-item">
        <strong>Location</strong>
        <span>${location}</span>
      </div>
      <div class="contact-item">
        <strong>Preferred Location</strong>
        <span>${preferredLocation}</span>
      </div>
      <div class="contact-item">
        <strong>Total Experience</strong>
        <span>${totalExp}</span>
      </div>
      <div class="contact-item">
        <strong>Highest Qualification</strong>
        <span>${primaryQual}</span>
      </div>
    </div>

    <!-- Quick Compensation & Status Badges -->
    <div class="quick-chips">
      <div class="chip">Current CTC: <strong>${currentSalary !== 'N/A' ? `₹${currentSalary}` : 'Not Disclosed'}</strong></div>
      <div class="chip">Expected CTC: <strong>${expectedSalary !== 'N/A' ? `₹${expectedSalary}` : 'Negotiable'}</strong></div>
      <div class="chip">Notice Period: <strong>${noticePeriod}</strong></div>
    </div>
  </div>

  <!-- Professional Summary / Bio -->
  ${summary ? `
    <div class="section-title">Professional Summary</div>
    <div class="card-block">
      <p style="color: #334155; line-height: 1.6; font-size: 12px;">${summary}</p>
    </div>
  ` : ''}

  <!-- Registration Source & Attribution -->
  <div class="section-title">Registration Source & Job Referral</div>
  <div class="card-block">
    <div class="grid-2">
      <div>
        <div class="info-label">Source Type</div>
        <div class="info-value">${isJobLink ? 'Job Link Referral' : 'Direct / Organic Registration'}</div>
      </div>
      <div>
        <div class="info-label">Registered At</div>
        <div class="info-value">${registeredAt || regDate}</div>
      </div>
      ${landedAt ? `
        <div>
          <div class="info-label">Landing Timestamp</div>
          <div class="info-value">${landedAt}</div>
        </div>
      ` : ''}
      ${firstTouchJob?.title ? `
        <div style="grid-column: span 2;">
          <div class="info-label">Referred Job</div>
          <div class="info-value" style="color: #059669; font-weight: 700;">
            ${firstTouchJob.title}
            ${firstTouchJob.company ? ` • ${firstTouchJob.company}` : ''}
            ${firstTouchJob.location ? ` (${firstTouchJob.location})` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  </div>

  <!-- Work Experience Timeline -->
  <div class="section-title">Work Experience History (${experiences.length > 0 ? `${experiences.length} records` : 'Fresher'})</div>
  ${experiences.length > 0 ? experiences.map((exp, i) => {
    const isCurrent = Boolean(
      exp.currentCompany || exp.currentJob ||
      (Array.isArray(exp.roles) && exp.roles.some(r => r.currentCompany || r.currentJob || String(r.leavingDate || '').toLowerCase() === 'present')) ||
      (i === 0 && currentCompany !== 'N/A' && (exp.company || exp.companyName || '').toLowerCase() === currentCompany.toLowerCase())
    );
    const roles = (exp.roles && exp.roles.length > 0) ? exp.roles : [exp];

    return roles.map(role => {
      const roleTitle = role.jobTitle || role.title || role.role || exp.title || exp.designation || 'Position';
      const companyName = exp.company || exp.companyName || role.companyName || 'Company';
      const startDate = formatExpDate(role.joiningDate || role.startDate || exp.joiningDate || exp.startDate, 'Start');
      const endDate = (isCurrent || role.currentCompany || role.currentJob || exp.currentCompany || exp.currentJob)
        ? 'Present'
        : formatExpDate(role.leavingDate || role.endDate || exp.leavingDate || exp.endDate, 'End');
      const desc = role.roleDescription || role.description || exp.roleDescription || exp.description || '';
      const empType = role.employmentType || exp.employmentType || '';

      return `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-title">${roleTitle}</div>
          <div class="timeline-sub">${companyName} ${isCurrent ? '<span style="font-size: 10px; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">CURRENT</span>' : ''}</div>
          <div class="timeline-meta">${startDate} – ${endDate} ${empType ? `• ${empType}` : ''}</div>
          ${desc ? `<div class="timeline-desc">${desc}</div>` : ''}
        </div>
      `;
    }).join('');
  }).join('') : `
    <div class="card-block" style="color: #64748b; font-style: italic;">
      No prior professional work experience recorded (Fresher).
    </div>
  `}

  <!-- Education & Qualifications -->
  <div class="section-title">Education & Qualifications (${educations.length > 0 ? educations.length : '0'})</div>
  ${educations.length > 0 ? educations.map((qual, i) => {
    const isPrimary = Boolean(qual.isPrimary === true || qual.isPrimary === 'true' || qual.isPrimary === 1 || i === 0);
    const degree = qual.degree || qual.course || qual.educationType || 'Degree';
    const field = qual.fieldOfStudy || qual.specialization ? ` in ${qual.fieldOfStudy || qual.specialization}` : '';
    const institute = qual.institution || qual.college || qual.university || qual.board || 'Institution / Board';
    const yearStr = formatEduYear(qual);
    const scoreStr = formatEduScore(qual);

    return `
      <div class="timeline-item">
        <div class="timeline-dot" style="background: #2563eb;"></div>
        <div class="timeline-title">${degree}${field} ${isPrimary ? '<span style="font-size: 10px; background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">PRIMARY</span>' : ''}</div>
        <div class="timeline-sub" style="color: #3b82f6;">${institute}</div>
        <div class="timeline-meta">
          ${yearStr} ${yearStr && scoreStr ? '• ' : ''} ${scoreStr} ${qual.courseType ? `• ${qual.courseType}` : ''}
        </div>
      </div>
    `;
  }).join('') : `
    <div class="card-block" style="color: #64748b; font-style: italic;">
      No formal education details listed.
    </div>
  `}

  <!-- Key Skills -->
  <div class="section-title">Key Skills & Competencies</div>
  <div class="card-block">
    ${skillsList.length > 0 ? `
      <div class="skills-container">
        ${skillsList.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
    ` : `<span style="color: #64748b; font-style: italic;">No key skills specified.</span>`}
  </div>

  <!-- Documents & Resume Attachment -->
  <div class="section-title">Candidate Attachments & Resume</div>
  <div class="card-block">
    ${resumeUrl ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px;">
        <tr>
          <td style="vertical-align: middle;">
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">Candidate Resume / CV File</strong>
            <span style="font-size: 11px; color: #64748b;">Official candidate resume uploaded on portal</span>
          </td>
          <td align="right" style="vertical-align: middle; white-space: nowrap; width: 100px;">
            <a href="${resumeUrl}" target="_blank" rel="noopener noreferrer" style="background: #059669; color: #ffffff !important; text-decoration: none; padding: 7px 18px; border-radius: 6px; font-size: 11.5px; font-weight: 700; display: inline-block;">
              View
            </a>
          </td>
        </tr>
      </table>
    ` : `
      <p style="color: #64748b; font-style: italic; margin-bottom: 6px;">No resume document uploaded.</p>
    `}

    ${coverLetterUrl ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px;">
        <tr>
          <td style="vertical-align: middle;">
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">Candidate Cover Letter</strong>
            <span style="font-size: 11px; color: #64748b;">Official candidate cover letter uploaded on portal</span>
          </td>
          <td align="right" style="vertical-align: middle; white-space: nowrap; width: 100px;">
            <a href="${coverLetterUrl}" target="_blank" rel="noopener noreferrer" style="background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 7px 18px; border-radius: 6px; font-size: 11.5px; font-weight: 700; display: inline-block;">
              View
            </a>
          </td>
        </tr>
      </table>
    ` : ''}

    ${introVideoUrl ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 12px 14px;">
        <tr>
          <td style="vertical-align: middle;">
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">Introductory Video Pitch</strong>
            <span style="font-size: 11px; color: #64748b;">Candidate video introduction presentation</span>
          </td>
          <td align="right" style="vertical-align: middle; white-space: nowrap; width: 100px;">
            <a href="${introVideoUrl.startsWith('http') ? introVideoUrl : `https://stream.mux.com/${introVideoUrl}.m3u8`}" target="_blank" rel="noopener noreferrer" style="background: #9333ea; color: #ffffff !important; text-decoration: none; padding: 7px 18px; border-radius: 6px; font-size: 11.5px; font-weight: 700; display: inline-block;">
              View
            </a>
          </td>
        </tr>
      </table>
    ` : ''}
  </div>

  <!-- Applications History -->
  ${applications.length > 0 ? `
    <div class="section-title">Application History (${applications.length})</div>
    <div class="card-block">
      ${applications.map((app, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: ${idx < applications.length - 1 ? '1px solid #f1f5f9' : 'none'};">
          <div>
            <strong style="font-size: 12px; color: #0f172a;">${app.jobId?.title || app.jobTitle || 'Job Application'}</strong>
            <div style="font-size: 10.5px; color: #64748b;">${app.jobId?.company || app.employerId?.companyName || 'Company'} • ${app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</div>
          </div>
          <span style="font-size: 10px; font-weight: 700; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">
            ${app.status || 'Applied'}
          </span>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer-note">
    <span>Generated by SahiJob HR Portal Candidate System • SahiJob Recruiter Format</span>
    <span>Exported: ${new Date().toLocaleString()}</span>
  </div>

</body>
</html>
  `;
};

/**
 * Fast Client-Side PDF Generation / Print View
 * Instantly opens print dialog with vector-crisp typography
 */
export const exportCandidateAsPdf = (candidate, employers = []) => {
  if (!candidate) return;

  const html = generateIndeedProfileHtml(candidate, employers, false);
  const printWindow = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
  
  if (!printWindow) {
    alert('Please allow popups for this site to export the PDF profile.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait a tick for styles to settle then invoke print
  printWindow.focus();
  setTimeout(() => {
    try {
      printWindow.print();
    } catch (e) {
      console.error('Print error:', e);
    }
  }, 250);
};

/**
 * Fast Client-Side Word DOC Download
 * Instant download of candidate profile formatted for Microsoft Word / Google Docs
 */
export const exportCandidateAsDoc = (candidate, employers = []) => {
  if (!candidate) return;

  const rawHtml = generateIndeedProfileHtml(candidate, employers, true);
  
  // Wrap with Word HTML header for perfect Office compatibility
  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${candidate.name || 'Candidate'} - Profile</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        h1 { font-size: 20pt; color: #0f172a; margin-bottom: 4pt; }
        .candidate-title { font-size: 13pt; color: #059669; font-weight: bold; margin-bottom: 12pt; }
        .section-title { font-size: 12pt; font-weight: bold; color: #0f172a; border-bottom: 2pt solid #059669; padding-bottom: 3pt; margin-top: 16pt; margin-bottom: 8pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
        th, td { border: 1px solid #cbd5e1; padding: 6pt 8pt; font-size: 10pt; vertical-align: top; }
        th { background-color: #f1f5f9; text-align: left; }
        .chip { display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2pt 6pt; border-radius: 4pt; margin: 2pt; font-size: 9pt; color: #065f46; }
      </style>
    </head>
    <body>
      ${rawHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordContent], {
    type: 'application/msword;charset=utf-8'
  });

  const safeFileName = `${(candidate.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_')}_SahiJob_Profile.doc`;
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = safeFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

export const exportCandidateProfileAsPdf = exportCandidateAsPdf;
export const exportCandidateProfileAsDoc = exportCandidateAsDoc;
