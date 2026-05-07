/**
 * Google Apps Script for Hisab Web App
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this script.
 * 4. Click 'Save' (disk icon) and name the project "Hisab API".
 * 5. Click 'Deploy' > 'New deployment'.
 * 6. Select type: 'Web app'.
 * 7. Set 'Who has access' to 'Anyone'.
 * 8. Click 'Deploy' and copy the 'Web app URL'.
 * 9. Paste that URL into the 'dashboard.js' file in your project.
 */

function doGet() {
  const sheetName = "Sheet1"; // Change if your sheet name is different
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const jsonData = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header.toString().trim()] = row[index];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}
