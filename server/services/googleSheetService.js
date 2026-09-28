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

  const currentSalary = cand.professionalDetails?.currentSalary ? `₹ ${cand.professionalDetails.currentSalary}` : (cand.currentCTC || 'N/A');
  const expectedSalary = cand.professionalDetails?.expectedSalary ? `₹ ${cand.professionalDetails.expectedSalary}` : (cand.expectedCTC || 'N/A');
  
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

module.exports = {
  createEmployerSpreadsheet,
  connectExistingSpreadsheet,
  extractSpreadsheetId,
  appendApplicationToSpreadsheet,
  syncAllApplicationsToSpreadsheet,
  SHEET_HEADERS,
  formatApplicationRow
};
