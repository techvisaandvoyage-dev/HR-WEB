const { google } = require('googleapis');

// Extract and format authentication client
const getGoogleAuth = () => {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials missing in .env (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).');
  }

  // Handle both raw multiline keys and escaped newlines (\n)
  privateKey = privateKey.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });
};

/**
 * Ensures Google Drive file permissions are open to link holders
 */
const ensureSheetPermissions = async (drive, spreadsheetId) => {
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      resource: { role: 'writer', type: 'anyone' }
    });
  } catch (_) {}
};

const SHEET_HEADERS = [
  'Application ID',
  'Candidate Name',
  'Job Applied',
  'Email Address',
  'Mobile Number',
  'Primary Qualification',
  'Institute Name',
  'Functional Area',
  'Work Experience',
  'Current Designation',
  'Current Company',
  'Current Salary',
  'Expected Salary',
  'Applied Date',
  'Status',
  'Question 1',
  'Answer 1',
  'Question 2',
  'Answer 2',
  'Question 3',
  'Answer 3',
  'Question 4',
  'Answer 4',
  'Question 5',
  'Answer 5'
];

/**
 * Format salary to prevent double currency symbols and float precision issues
 */
const formatSalary = (val) => {
  if (!val && val !== 0) return 'N/A';
  let s = String(val).trim();
  if (s.toLowerCase() === 'n/a' || !s) return 'N/A';

  // Strip existing ₹, Rs., INR prefixes
  s = s.replace(/^(₹|Rs\.?|INR)\s*/gi, '').trim();

  // Check if string starts with a number (e.g. "12.100000000000001 LPA" or "8.9")
  const match = s.match(/^([\d.]+)(\s*.*)$/);
  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2] ? match[2].trim() : '';
    if (!isNaN(num)) {
      // Clean up floating point precision (e.g. 12.100000000000001 -> 12.1)
      const cleanNum = Number(num.toFixed(2));
      return `₹ ${cleanNum}${suffix ? ' ' + suffix : ''}`;
    }
  }

  return `₹ ${s}`;
};

/**
 * Helper to convert application and candidate into a row array
 */
const formatApplicationRow = (app, candidate = {}) => {
  const cand = candidate || app.employeeId || {};
  const jobTitle = app.jobId?.title || app.title || 'Job Application';
  
  // Experience
  let workExp = cand.totalExperience || 'Fresher';
  if (cand.isFresher) workExp = 'Fresher';

  // Function
  const func = cand.industry || cand.professionalDetails?.functionalArea || 'N/A';

  // Designation
  let desig = cand.designation || cand.professionalDetails?.currentDesignation || 'N/A';
  if (cand.experience && cand.experience.length > 0) {
    const exp0 = cand.experience[0];
    desig = exp0.roles?.[0]?.jobTitle || exp0.title || exp0.role || desig;
  }

  // Company
  let comp = cand.professionalDetails?.currentCompany || 'N/A';
  if (cand.experience && cand.experience.length > 0) {
    comp = cand.experience[0].companyName || cand.experience[0].company || comp;
  }

  // Qualification & Institute
  let qual = 'N/A';
  let institute = 'N/A';
  if (cand.education && cand.education.length > 0) {
    qual = cand.education[0].degree || qual;
    institute = cand.education[0].institution || institute;
  } else if (cand.qualifications && cand.qualifications.length > 0) {
    const q0 = cand.qualifications[0];
    qual = q0.course || q0.educationType || q0.degree || qual;
    institute = q0.university || q0.board || q0.institute || q0.college || institute;
  }

  const currentSalary = formatSalary(cand.professionalDetails?.currentSalary || cand.currentCTC);
  const expectedSalary = formatSalary(cand.professionalDetails?.expectedSalary || cand.expectedCTC);
  
  const appliedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : (app.date || new Date().toLocaleDateString());
  const appIdDisplay = app.applicationNumber ? `#${app.applicationNumber}` : (app.appId ? `#${app.appId}` : `#${app._id}`);

  const qa = app.screeningAnswers || [];
  const q1 = qa[0]?.question || '';
  const a1 = qa[0]?.answer || '';
  const q2 = qa[1]?.question || '';
  const a2 = qa[1]?.answer || '';
  const q3 = qa[2]?.question || '';
  const a3 = qa[2]?.answer || '';
  const q4 = qa[3]?.question || '';
  const a4 = qa[3]?.answer || '';
  const q5 = qa[4]?.question || '';
  const a5 = qa[4]?.answer || '';

  return [
    appIdDisplay,
    cand.name || 'Candidate',
    jobTitle,
    cand.email || '',
    cand.mobile || cand.phone || '',
    qual,
    institute,
    func,
    workExp,
    desig,
    comp,
    currentSalary,
    expectedSalary,
    appliedDate,
    app.status || 'New',
    q1,
    a1,
    q2,
    a2,
    q3,
    a3,
    q4,
    a4,
    q5,
    a5
  ];
};

/**
 * Helper to extract Google Spreadsheet ID from URL or raw ID
 */
const extractSpreadsheetId = (urlOrId) => {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already a clean ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
};

/**
 * 1. Create a new Google Spreadsheet for an employer
 */
const createEmployerSpreadsheet = async (employer, initialApplications = []) => {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const companyTitle = employer.companyName || employer.fullName || 'Employer';
    const spreadsheetTitle = `${companyTitle} - Live Job Applications`;

    // 1. Create Spreadsheet
    const createRes = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: spreadsheetTitle
        },
        sheets: [
          {
            properties: {
              title: 'Applications',
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        ]
      }
    });

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Prepare initial rows
    const dataRows = [SHEET_HEADERS];
    if (initialApplications && initialApplications.length > 0) {
      initialApplications.forEach(app => {
        dataRows.push(formatApplicationRow(app, app.employeeId));
      });
    }

    // 3. Write data to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Applications!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: dataRows
      }
    });

    // 4. Style Header row (Emerald Green `#18a058`, bold, white text)
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.094,   // #18a058 -> r:24/255, g:160/255, b:88/255
                      green: 0.627,
                      blue: 0.345
                    },
                    horizontalAlignment: 'LEFT',
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true,
                      fontSize: 10
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: SHEET_HEADERS.length
                }
              }
            }
          ]
        }
      });
    } catch (styleErr) {
      console.warn('Could not apply sheet styles:', styleErr.message);
    }

    // 5. Set Drive permissions so anyone with the link can view/edit
    try {
      await drive.permissions.create({
        fileId: spreadsheetId,
        resource: {
          role: 'writer',
          type: 'anyone'
        }
      });
    } catch (permErr) {
      console.warn('Drive permission warning:', permErr.message);
    }

    // Also share directly with employer's email if valid
    if (employer.email && employer.email.includes('@')) {
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          sendNotificationEmail: false,
          resource: {
            role: 'writer',
            type: 'user',
            emailAddress: employer.email
          }
        });
      } catch (_) {}
    }

    return {
      spreadsheetId,
      spreadsheetUrl,
      title: spreadsheetTitle
    };
  } catch (error) {
    console.error('Error creating Google Spreadsheet:', error);
    throw error;
  }
};

/**
 * 1.b Connect and initialize an existing Google Spreadsheet provided by the Employer
 */
const connectExistingSpreadsheet = async (sheetUrlOrId, initialApplications = []) => {
  const spreadsheetId = extractSpreadsheetId(sheetUrlOrId);
  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheet URL or ID provided.');
  }

  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Verify access by getting sheet metadata
  let sheetMeta;
  try {
    sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
  } catch (err) {
    if (err.status === 403 || err.code === 403) {
      throw new Error(`Permission Denied. Please open your Google Sheet, click "Share", and add "${process.env.FIREBASE_CLIENT_EMAIL}" as Editor.`);
    }
    if (err.status === 404 || err.code === 404) {
      throw new Error('Google Sheet not found. Please verify the URL.');
    }
    throw err;
  }

  const sheetTitle = sheetMeta.data?.sheets?.[0]?.properties?.title || 'Sheet1';
  const spreadsheetTitle = sheetMeta.data?.properties?.title || 'Google Sheet';

  // Prepare initial rows
  const dataRows = [SHEET_HEADERS];
  if (initialApplications && initialApplications.length > 0) {
    initialApplications.forEach(app => {
      dataRows.push(formatApplicationRow(app, app.employeeId));
    });
  }

  // Clear and Write data
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: dataRows
      }
    });
  } catch (err) {
    // If range with sheetTitle fails, fallback to A1
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: dataRows
      }
    });
  }

  // Format header row style
  try {
    const firstSheetId = sheetMeta.data?.sheets?.[0]?.properties?.sheetId || 0;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: firstSheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.094,
                    green: 0.627,
                    blue: 0.345
                  },
                  horizontalAlignment: 'LEFT',
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }
        ]
      }
    });
  } catch (_) {}

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: spreadsheetTitle
  };
};

/**
 * 2. Real-time Append new application row to existing Google Spreadsheet
 */
const appendApplicationToSpreadsheet = async (spreadsheetId, application, candidate = null) => {
  if (!spreadsheetId) return;

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const rowData = formatApplicationRow(application, candidate || application.employeeId);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Applications!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    });

    console.log(`[GoogleSheet] Successfully appended Application #${application.applicationNumber || application._id} to sheet ${spreadsheetId}`);
  } catch (error) {
    console.error(`[GoogleSheet] Failed to append row to spreadsheet ${spreadsheetId}:`, error.message);
  }
};

/**
 * 3. Re-sync all applications to an existing sheet
 */
const syncAllApplicationsToSpreadsheet = async (spreadsheetId, applications = []) => {
  if (!spreadsheetId) return;

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const dataRows = [SHEET_HEADERS];
    applications.forEach(app => {
      dataRows.push(formatApplicationRow(app, app.employeeId));
    });

    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Applications!A1:Z1000'
    });

    // Update with fresh data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Applications!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: dataRows
      }
    });

    return { success: true, count: applications.length };
  } catch (error) {
    console.error(`[GoogleSheet] Failed to sync applications to sheet ${spreadsheetId}:`, error);
    throw error;
  }
};

const CANDIDATE_SHEET_HEADERS = [
  'Candidate ID',
  'Candidate Name',
  'Email Address',
  'Mobile Number',
  'Current Location',
  'Preferred Location',
  'Highest Qualification',
  'Institute / College',
  'Functional Area / Industry',
  'Total Work Experience',
  'Current Designation',
  'Current Company',
  'Current Salary',
  'Expected Salary',
  'Notice Period',
  'Key Skills',
  'Total Jobs Applied',
  'Resume Link',
  'Registered Date',
  'Last Profile Update'
];

const EMPLOYER_SHEET_HEADERS = [
  'Employer ID',
  'Company / Business Name',
  'Account Type',
  'Recruiter Name',
  'Recruiter Designation',
  'Email Address',
  'Mobile Number',
  'Industry',
  'Location',
  'Company Size',
  'Website',
  'Total Jobs Posted',
  'Active Jobs',
  'Closed Jobs',
  'Applications Received',
  'Registered Date',
  'Last Profile Update'
];

/**
 * Format single Candidate into row array
 */
const formatCandidateRow = (cand, appCount = 0) => {
  let workExp = cand.totalExperience || 'Fresher';
  if (cand.isFresher) workExp = 'Fresher';

  const func = cand.industry || cand.functionalArea || cand.function || cand.professionalDetails?.functionalArea || 'N/A';

  let desig = cand.currentDesignation || cand.designation || cand.professionalDetails?.currentDesignation || 'N/A';
  if (cand.experience && cand.experience.length > 0) {
    const exp0 = cand.experience[0];
    desig = exp0.roles?.[0]?.jobTitle || exp0.title || exp0.role || desig;
  }

  let comp = cand.currentCompany || cand.professionalDetails?.currentCompany || 'N/A';
  if (cand.experience && cand.experience.length > 0) {
    comp = cand.experience[0].companyName || cand.experience[0].company || comp;
  }

  let qual = cand.primaryQualification || 'N/A';
  let institute = 'N/A';
  if (cand.education && cand.education.length > 0) {
    qual = cand.education[0].degree || cand.education[0].course || qual;
    institute = cand.education[0].institution || cand.education[0].university || institute;
  } else if (cand.qualifications && cand.qualifications.length > 0) {
    const q0 = cand.qualifications[0];
    qual = q0.course || q0.educationType || q0.degree || qual;
    institute = q0.university || q0.board || q0.institute || q0.college || institute;
  }

  const currentSalary = formatSalary(cand.professionalDetails?.currentSalary || cand.currentCTC);
  const expectedSalary = formatSalary(cand.professionalDetails?.expectedSalary || cand.expectedCTC);
  const noticePeriod = cand.noticePeriod || cand.professionalDetails?.noticePeriod || 'N/A';

  const rawSkills = cand.professionalDetails?.skills || cand.skills || [];
  const skillsStr = Array.isArray(rawSkills) ? rawSkills.join(', ') : String(rawSkills || '');

  const regDate = cand.createdAt ? new Date(cand.createdAt).toLocaleDateString() : 'N/A';
  const lastUpdate = cand.updatedAt ? new Date(cand.updatedAt).toLocaleDateString() : (cand.lastLogin ? new Date(cand.lastLogin).toLocaleDateString() : regDate);

  const resumeUrl = cand.resume || cand.resumeUrl || cand.documents?.resume || '';
  const resumeDisplay = resumeUrl ? `=HYPERLINK("${resumeUrl}", "Open Resume")` : 'No Resume';

  const candIdDisplay = cand.candidateId ? String(cand.candidateId) : String(cand._id || cand.id || '');

  return [
    candIdDisplay,
    cand.name || 'N/A',
    cand.email || 'N/A',
    cand.mobile || cand.phone || 'N/A',
    cand.location || 'N/A',
    cand.preferredLocation || cand.location || 'N/A',
    qual,
    institute,
    func,
    workExp,
    desig,
    comp,
    currentSalary,
    expectedSalary,
    noticePeriod,
    skillsStr,
    String(appCount || 0),
    resumeDisplay,
    regDate,
    lastUpdate
  ];
};

/**
 * Format single Employer into row array
 */
const formatEmployerRow = (empr, stats = {}) => {
  const isConsultant = empr?.hiringFor === 'consultant' || empr?.isConsultant || empr?.accountType === 'individual' || empr?.accountType?.toLowerCase()?.includes('consultant');
  const accType = isConsultant ? 'Consultant' : 'Company';

  const regDate = empr.createdAt ? new Date(empr.createdAt).toLocaleDateString() : 'N/A';
  const lastUpdate = empr.updatedAt ? new Date(empr.updatedAt).toLocaleDateString() : (empr.lastLogin ? new Date(empr.lastLogin).toLocaleDateString() : regDate);

  const totalJobs = stats.totalJobs !== undefined ? stats.totalJobs : (empr.totalJobs || 0);
  const activeJobs = stats.activeJobs !== undefined ? stats.activeJobs : (empr.activeJobs || 0);
  const closedJobs = stats.closedJobs !== undefined ? stats.closedJobs : (empr.closedJobs || 0);
  const applicationsCount = stats.totalApplications !== undefined ? stats.totalApplications : (empr.totalApplicationsReceived || 0);

  const emprIdDisplay = empr.employerId ? String(empr.employerId) : String(empr._id || empr.id || '');

  return [
    emprIdDisplay,
    empr.companyName || empr.fullName || 'N/A',
    accType,
    empr.fullName || 'N/A',
    empr.designation || 'Recruiter',
    empr.email || 'N/A',
    empr.mobile || 'N/A',
    empr.industry || 'General',
    empr.location || 'N/A',
    empr.employees || 'Team',
    empr.website || '',
    String(totalJobs),
    String(activeJobs),
    String(closedJobs),
    String(applicationsCount),
    regDate,
    lastUpdate
  ];
};

/**
 * Sync all Candidates to Google Spreadsheet
 */
const syncCandidatesSheet = async (customUrl = null) => {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  const Employee = require('../employee/models/Employee');
  const Application = require('../models/Application');
  const SiteSettings = require('../models/SiteSettings');

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  const envCandidateSheet = process.env.CANDIDATES_SHEET_ID || process.env.EMPLOYEE_SHEET_ID || process.env.CANDIDATE_SHEET_URL || process.env.EMPLOYEE_SHEET_URL;
  let spreadsheetId = customUrl ? extractSpreadsheetId(customUrl) : (settings.candidatesSheetId || (envCandidateSheet ? extractSpreadsheetId(envCandidateSheet) : null));

  if (!spreadsheetId) {
    try {
      const createRes = await sheets.spreadsheets.create({
        resource: {
          properties: {
            title: 'SahiJob - Candidates & Job Seekers Directory'
          },
          sheets: [
            {
              properties: {
                title: 'Candidates',
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            }
          ]
        }
      });

      spreadsheetId = createRes.data.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          resource: { role: 'writer', type: 'anyone' }
        });
      } catch (_) {}

      settings.candidatesSheetId = spreadsheetId;
      settings.candidatesSheetUrl = spreadsheetUrl;
    } catch (createErr) {
      console.error('[GoogleSheet] Auto-create candidate sheet failed:', createErr.message);
      const email = process.env.FIREBASE_CLIENT_EMAIL || 'your service account email';
      throw new Error(`Google Sheet not connected. Please create a Google Sheet at sheets.new, share it with "${email}" as Editor, and paste the URL.`);
    }
  } else {
    settings.candidatesSheetId = spreadsheetId;
    if (customUrl) {
      settings.candidatesSheetUrl = customUrl;
    }
  }

  await ensureSheetPermissions(drive, spreadsheetId);

  const candidates = await Employee.find().sort({ createdAt: -1 }).lean();
  const applications = await Application.find().lean();
  const appCounts = {};
  applications.forEach(a => {
    const id = String(a.employeeId);
    appCounts[id] = (appCounts[id] || 0) + 1;
  });

  const dataRows = [CANDIDATE_SHEET_HEADERS];
  candidates.forEach(cand => {
    dataRows.push(formatCandidateRow(cand, appCounts[String(cand._id)] || 0));
  });

  let sheetTitle = 'Candidates';
  let tabSheetId = 0;
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    if (meta.data?.sheets && meta.data.sheets.length > 0) {
      sheetTitle = meta.data.sheets[0].properties?.title || 'Candidates';
      tabSheetId = meta.data.sheets[0].properties?.sheetId || 0;
    }
  } catch (err) {
    console.warn('[GoogleSheet] Error reading candidate sheet meta:', err.message);
  }

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetTitle}'!A1:Z10000`
    });
  } catch (_) {}

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: dataRows }
  });

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: tabSheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.094, green: 0.627, blue: 0.345 },
                  horizontalAlignment: 'LEFT',
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId: tabSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: CANDIDATE_SHEET_HEADERS.length }
            }
          }
        ]
      }
    });
  } catch (_) {}

  settings.candidatesSheetUrl = settings.candidatesSheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  settings.candidatesSheetLastSynced = new Date();
  await settings.save();

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl: settings.candidatesSheetUrl,
    lastSynced: settings.candidatesSheetLastSynced,
    count: candidates.length
  };
};

/**
 * Sync all Employers to Google Spreadsheet
 */
const syncEmployersSheet = async (customUrl = null) => {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  const Employer = require('../employer/models/Employer');
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const SiteSettings = require('../models/SiteSettings');

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  const envEmployerSheet = process.env.EMPLOYERS_SHEET_ID || process.env.EMPLOYER_SHEET_ID || process.env.EMPLOYERS_SHEET_URL || process.env.EMPLOYER_SHEET_URL;
  let spreadsheetId = customUrl ? extractSpreadsheetId(customUrl) : (settings.employersSheetId || (envEmployerSheet ? extractSpreadsheetId(envEmployerSheet) : null));

  if (!spreadsheetId) {
    try {
      const createRes = await sheets.spreadsheets.create({
        resource: {
          properties: {
            title: 'SahiJob - Employers & Recruiters Directory'
          },
          sheets: [
            {
              properties: {
                title: 'Employers',
                gridProperties: {
                  frozenRowCount: 1
                }
              }
            }
          ]
        }
      });

      spreadsheetId = createRes.data.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          resource: { role: 'writer', type: 'anyone' }
        });
      } catch (_) {}

      settings.employersSheetId = spreadsheetId;
      settings.employersSheetUrl = spreadsheetUrl;
    } catch (createErr) {
      console.error('[GoogleSheet] Auto-create employer sheet failed:', createErr.message);
      const email = process.env.FIREBASE_CLIENT_EMAIL || 'your service account email';
      throw new Error(`Google Sheet not connected. Please create a Google Sheet at sheets.new, share it with "${email}" as Editor, and paste the URL.`);
    }
  } else {
    settings.employersSheetId = spreadsheetId;
    if (customUrl) {
      settings.employersSheetUrl = customUrl;
    }
  }

  await ensureSheetPermissions(drive, spreadsheetId);

  const employers = await Employer.find().sort({ createdAt: -1 }).lean();
  const employerIds = employers.map(e => e._id);
  const jobs = await Job.find({ employerId: { $in: employerIds } }).lean();
  const applications = await Application.find({ employerId: { $in: employerIds } }).lean();

  const jobStatsMap = {};
  jobs.forEach(job => {
    const empIdStr = String(job.employerId);
    if (!jobStatsMap[empIdStr]) {
      jobStatsMap[empIdStr] = { totalJobs: 0, activeJobs: 0, closedJobs: 0, totalApplications: 0 };
    }
    jobStatsMap[empIdStr].totalJobs += 1;
    const s = (job.status || '').toLowerCase();
    if (s === 'active') jobStatsMap[empIdStr].activeJobs += 1;
    if (s === 'closed') jobStatsMap[empIdStr].closedJobs += 1;
  });

  applications.forEach(app => {
    const empIdStr = String(app.employerId);
    if (!jobStatsMap[empIdStr]) {
      jobStatsMap[empIdStr] = { totalJobs: 0, activeJobs: 0, closedJobs: 0, totalApplications: 0 };
    }
    jobStatsMap[empIdStr].totalApplications += 1;
  });

  const dataRows = [EMPLOYER_SHEET_HEADERS];
  employers.forEach(empr => {
    const stats = jobStatsMap[String(empr._id)] || { totalJobs: 0, activeJobs: 0, closedJobs: 0, totalApplications: 0 };
    dataRows.push(formatEmployerRow(empr, stats));
  });

  let sheetTitle = 'Employers';
  let tabSheetId = 0;
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    if (meta.data?.sheets && meta.data.sheets.length > 0) {
      sheetTitle = meta.data.sheets[0].properties?.title || 'Employers';
      tabSheetId = meta.data.sheets[0].properties?.sheetId || 0;
    }
  } catch (err) {
    console.warn('[GoogleSheet] Error reading employer sheet meta:', err.message);
  }

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetTitle}'!A1:Z10000`
    });
  } catch (_) {}

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: dataRows }
  });

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: tabSheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.094, green: 0.627, blue: 0.345 },
                  horizontalAlignment: 'LEFT',
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId: tabSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: EMPLOYER_SHEET_HEADERS.length }
            }
          }
        ]
      }
    });
  } catch (_) {}

  settings.employersSheetUrl = settings.employersSheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  settings.employersSheetLastSynced = new Date();
  await settings.save();

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl: settings.employersSheetUrl,
    lastSynced: settings.employersSheetLastSynced,
    count: employers.length
  };
};

let candidateSyncTimeout = null;
const triggerLiveCandidateSync = () => {
  if (candidateSyncTimeout) clearTimeout(candidateSyncTimeout);
  candidateSyncTimeout = setTimeout(async () => {
    try {
      await syncCandidatesSheet();
      console.log('[GoogleSheet] Live Candidate sheet sync completed.');
    } catch (err) {
      console.error('[GoogleSheet] Live Candidate sheet sync error:', err.message);
    }
  }, 2500);
};

let employerSyncTimeout = null;
const triggerLiveEmployerSync = () => {
  if (employerSyncTimeout) clearTimeout(employerSyncTimeout);
  employerSyncTimeout = setTimeout(async () => {
    try {
      await syncEmployersSheet();
      console.log('[GoogleSheet] Live Employer sheet sync completed.');
    } catch (err) {
      console.error('[GoogleSheet] Live Employer sheet sync error:', err.message);
    }
  }, 2500);
};

/**
 * Start background automatic sync scheduler
 * - Runs sync on startup
 * - Runs periodic sync every 2 minutes automatically
 */
const startAutoSyncScheduler = () => {
  // Initial sync after 3 seconds of server start
  setTimeout(async () => {
    try {
      console.log('[GoogleSheet AutoSync] Running initial startup auto-sync...');
      await syncCandidatesSheet();
      await syncEmployersSheet();
      console.log('[GoogleSheet AutoSync] Startup auto-sync completed!');
    } catch (err) {
      console.warn('[GoogleSheet AutoSync] Startup sync warning:', err.message);
    }
  }, 3000);

  // Auto-sync every 2 minutes in background
  setInterval(async () => {
    try {
      await syncCandidatesSheet();
      await syncEmployersSheet();
    } catch (err) {
      console.warn('[GoogleSheet AutoSync] Periodic background sync warning:', err.message);
    }
  }, 2 * 60 * 1000);
};

module.exports = {
  createEmployerSpreadsheet,
  connectExistingSpreadsheet,
  extractSpreadsheetId,
  appendApplicationToSpreadsheet,
  syncAllApplicationsToSpreadsheet,
  syncCandidatesSheet,
  syncEmployersSheet,
  triggerLiveCandidateSync,
  triggerLiveEmployerSync,
  startAutoSyncScheduler,
  CANDIDATE_SHEET_HEADERS,
  EMPLOYER_SHEET_HEADERS,
  SHEET_HEADERS,
  formatApplicationRow,
  formatCandidateRow,
  formatEmployerRow
};
