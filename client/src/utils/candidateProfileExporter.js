/**
 * candidateProfileExporter.js (Client / Employer Portal Version)
 * High-performance SahiJob Recruiter Candidate Profile Exporter (PDF & DOC)
 * Generates clean, standardized, professional candidate profile summaries
 * with 100% vector typography, avatar photo, attribution details, work experience,
 * education, skills, and resume preview links.
 * 
 * Strict Privacy & Permission Rules:
 * - Only accessible if employee has applied to the employer's job
 * - Video pitch is only included if candidate's videoVisibility allows it (everyone, or applied for this employer)
 * - Gender, Marital Status, DOB, Category, and Languages Known are omitted
 * - Candidate ID chips are omitted
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
 * Build rich HTML representation matching SahiJob Recruiter Candidate Profile
 */
export const generateIndeedProfileHtml = (candidate, employers = [], isForWord = false, options = {}) => {
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

  // Avatar / Profile photo (supports multiple field names)
  const avatarUrl = candidate.avatar || candidate.profilePhoto || candidate.profilePicture || candidate.photo || candidate.personalDetails?.profilePhoto || '';

  // Resume and media
  const resumeUrl = candidate.resume || candidate.resumeUrl || candidate.documents?.resume || options.resume || '';
  const coverLetterUrl = candidate.coverLetter || candidate.coverLetterUrl || candidate.documents?.coverLetter || options.coverLetter || '';
  const rawIntroVideo = candidate.introVideo || candidate.documents?.introVideo || options.introVideo || '';

  // Video Visibility & Permission Check
  // Video is only shown if candidate shared it:
  // - 'everyone': all employers can watch
  // - 'applied': only employers of jobs candidate applied to can watch
  // - hidden / false / private: omitted
  const videoVis = candidate.videoVisibility || candidate.documents?.videoVisibility || 'everyone';
  const hasApplied = options.hasApplied !== undefined ? options.hasApplied : true;
  const canShowVideo = rawIntroVideo && (videoVis === 'everyone' || (hasApplied && videoVis === 'applied'));
  const introVideoUrl = canShowVideo ? rawIntroVideo : '';

  // Skills
  const rawSkills = candidate.professionalDetails?.skills || candidate.skills;
  const skillsList = typeof rawSkills === 'string'
    ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(rawSkills) ? rawSkills : [];

  // Experience
  const experiences = candidate.experience || [];

  // Education
  const educations = candidate.qualifications || candidate.education || [];

  // Applications
  const applications = candidate.applications || candidate.history || (options.jobTitle ? [{ jobTitle: options.jobTitle, status: options.status || 'Applied', createdAt: options.appliedDate }] : []);

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
      background: #f8fafc;
      padding: 24px;
      line-height: 1.5;
    }
    .header-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .brand-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #059669;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #059669;
      text-transform: uppercase;
    }
    .candidate-header-row {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 14px;
    }
    .candidate-avatar {
      width: 72px;
      height: 72px;
      border-radius: 14px;
      object-fit: cover;
      border: 2px solid #e2e8f0;
      background: #f1f5f9;
      flex-shrink: 0;
    }
    .candidate-name {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .candidate-title {
      font-size: 14.5px;
      font-weight: 600;
      color: #059669;
      margin-top: 3px;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px 18px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }
    .contact-item {
      font-size: 12px;
    }
    .contact-item strong {
      color: #64748b;
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .contact-item span {
      color: #0f172a;
      font-weight: 600;
    }
    .quick-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .chip {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      color: #334155;
    }
    .chip strong {
      color: #059669;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 22px 0 10px 0;
      padding-left: 8px;
      border-left: 3px solid #059669;
    }
    .card-block {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .exp-item, .edu-item {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .exp-item:last-child, .edu-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .exp-item:first-child, .edu-item:first-child {
      padding-top: 0;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .item-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .item-company {
      font-size: 12px;
      color: #059669;
      font-weight: 600;
    }
    .item-date {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .item-desc {
      font-size: 11.5px;
      color: #475569;
      margin-top: 6px;
      line-height: 1.5;
    }
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .skill-tag {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
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
      <span style="font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">Verified Candidate Profile</span>
    </div>

    <div class="candidate-header-row">
      ${avatarUrl ? `
        <img src="${avatarUrl}" alt="${name}" class="candidate-avatar" onerror="this.style.display='none';" />
      ` : ''}
      <div>
        <h1 class="candidate-name">${name}</h1>
        <div class="candidate-title">${designation} • ${currentCompany !== 'N/A' ? currentCompany : 'Job Seeker'}</div>
      </div>
    </div>

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

  <!-- Work Experience -->
  <div class="section-title">Work Experience (${experiences.length})</div>
  <div class="card-block">
    ${experiences.length > 0 ? experiences.map(exp => {
      const company = exp.companyName || exp.company || 'Company';
      const roles = exp.roles && exp.roles.length > 0 ? exp.roles : [{
        jobTitle: exp.designation || exp.jobTitle || 'Role',
        isCurrentCompany: exp.isCurrentCompany || exp.isCurrent,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description || exp.responsibilities || exp.rolesAndResponsibilities
      }];

      return `
        <div class="exp-item">
          <div class="item-company">${company}</div>
          ${roles.map(r => `
            <div style="margin-top: 6px;">
              <div class="item-header">
                <div class="item-title">${r.jobTitle || 'Role'} ${r.isCurrentCompany ? '<span style="font-size: 10px; color: #059669; font-weight: 700; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 4px; margin-left: 6px;">CURRENT</span>' : ''}</div>
                <div class="item-date">${formatExpDate(r.startDate, 'N/A')} – ${r.isCurrentCompany ? 'Present' : formatExpDate(r.endDate, 'N/A')}</div>
              </div>
              ${r.description ? `<div class="item-desc">${r.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }).join('') : `<span style="color: #64748b; font-style: italic;">No professional work experience listed (Fresher).</span>`}
  </div>

  <!-- Education & Qualifications -->
  <div class="section-title">Education & Qualifications (${educations.length})</div>
  <div class="card-block">
    ${educations.length > 0 ? educations.map(edu => {
      const title = edu.course || edu.educationType || edu.degree || 'Degree / Course';
      const inst = edu.university || edu.college || edu.institute || edu.school || 'Institution';
      const yearStr = formatEduYear(edu);
      const scoreStr = formatEduScore(edu);

      return `
        <div class="edu-item">
          <div class="item-header">
            <div class="item-title">${title} ${edu.isPrimary ? '<span style="font-size: 10px; color: #059669; font-weight: 700; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 4px; margin-left: 6px;">PRIMARY</span>' : ''}</div>
            <div class="item-date">${yearStr || 'Completed'}</div>
          </div>
          <div class="item-company" style="color: #475569;">${inst}</div>
          ${scoreStr ? `<div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 3px;">Score: ${scoreStr}</div>` : ''}
        </div>
      `;
    }).join('') : `<span style="color: #64748b; font-style: italic;">No education details listed.</span>`}
  </div>

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

    ${canShowVideo && introVideoUrl ? `
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
    <div class="section-title">Application Details (${applications.length})</div>
    <div class="card-block">
      ${applications.map((app, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: ${idx < applications.length - 1 ? '1px solid #f1f5f9' : 'none'};">
          <div>
            <strong style="font-size: 12px; color: #0f172a;">${app.jobId?.title || app.jobTitle || app.title || 'Job Application'}</strong>
            <div style="font-size: 10.5px; color: #64748b;">Applied: ${app.createdAt || app.appliedDate ? new Date(app.createdAt || app.appliedDate).toLocaleDateString() : 'N/A'}</div>
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
 */
export const exportCandidateAsPdf = (candidate, employers = [], options = {}) => {
  if (!candidate) return;

  const html = generateIndeedProfileHtml(candidate, employers, false, options);
  const printWindow = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
  
  if (!printWindow) {
    alert('Please allow popups for this site to export the PDF profile.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 450);
  };
};

/**
 * Fast Client-Side Word (.doc) File Generation
 */
export const exportCandidateAsDoc = (candidate, employers = [], options = {}) => {
  if (!candidate) return;

  const rawHtml = generateIndeedProfileHtml(candidate, employers, true, options);
  
  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${candidate.name || 'Candidate'} - SahiJob Profile</title>
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

