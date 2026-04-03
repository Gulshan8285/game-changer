/**
 * ─────────────────────────────────────────────────────
 *  BitPay Wallet — Google Sheet Integration Script
 * ─────────────────────────────────────────────────────
 *
 *  SETUP INSTRUCTIONS:
 *  1. Open your Google Sheet
 *  2. Go to Extensions → Apps Script
 *  3. DELETE everything in the editor
 *  4. Paste this ENTIRE code
 *  5. Click Deploy → New Deployment → Web App
 *  6. Set "Execute as: Me" and "Who has access: Anyone"
 *  7. Click Deploy → Copy the URL
 *  8. Replace GOOGLE_SCRIPT_URL in /api/track/route.ts with your new URL
 *
 *  Your sheet will auto-create these columns:
 *  A: Timestamp | B: Date | C: Time | D: Action | E: User ID
 *  F: User Name | G: User Email | H: User Phone | I: Plan Name
 *  J: Amount | K: Method | L: Device
 * ─────────────────────────────────────────────────────
 */

// Sheet name where data will be stored
const SHEET_NAME = 'User Data';

// Get or create the tracking sheet
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // Create new sheet with headers
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Date', 'Time', 'Action', 'User ID',
      'User Name', 'User Email', 'User Phone', 'Plan Name',
      'Amount (₹)', 'Method', 'Device'
    ]);

    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, 12);
    headerRange
      .setBackground('#1a1a2e')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center');

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= 12; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

// Handle GET requests (from our app's /api/track)
function doGet(e) {
  try {
    const params = e.parameter;
    const sheet = getSheet_();

    // Add a new row with all the data
    sheet.appendRow([
      params.timestamp || new Date().toLocaleString('en-IN'),
      params.date || new Date().toLocaleDateString('en-IN'),
      params.time || new Date().toLocaleTimeString('en-IN'),
      params.action || '',
      params.userId || '',
      params.userName || '',
      params.userEmail || '',
      params.userPhone || '',
      params.planName || '',
      params.amount || '',
      params.method || '',
      params.device || ''
    ]);

    // Auto-resize all columns to fit content
    for (let i = 1; i <= 12; i++) {
      sheet.autoResizeColumn(i);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests (alternative method)
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = getSheet_();

    sheet.appendRow([
      body.timestamp || new Date().toLocaleString('en-IN'),
      body.date || new Date().toLocaleDateString('en-IN'),
      body.time || new Date().toLocaleTimeString('en-IN'),
      body.action || '',
      body.userId || '',
      body.userName || '',
      body.userEmail || '',
      body.userPhone || '',
      body.planName || '',
      body.amount || '',
      body.method || '',
      body.device || ''
    ]);

    for (let i = 1; i <= 12; i++) {
      sheet.autoResizeColumn(i);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
