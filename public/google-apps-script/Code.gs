/**
 * Google Apps Script for Lead Tracker Integration
 * This script should be deployed as a Web App to receive leads from the Lead Tracker app
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheets document
 * 2. Go to Extensions > Apps Script
 * 3. Copy this code into the script editor
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL and add it to your Lead Tracker settings
 */

// Configuration
const SHEET_NAME = 'Leads'; // Name of the sheet to store leads
const LOG_SHEET_NAME = 'Import Log'; // Name of the sheet for logging

/**
 * Handles POST requests from Lead Tracker
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Validate the request
    if (!data.action) {
      return createResponse(false, 'Missing action parameter');
    }
    
    // Route to appropriate handler
    switch (data.action) {
      case 'addLeads':
        return handleAddLeads(data.leads);
      case 'updateLead':
        return handleUpdateLead(data.lead);
      case 'getStats':
        return handleGetStats();
      case 'setup':
        return handleSetup();
      default:
        return createResponse(false, 'Unknown action: ' + data.action);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Lead Tracker Google Sheets Integration is running',
    version: '1.0.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Set up the spreadsheet with required sheets and headers
 */
function handleSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get the Leads sheet
  let leadSheet = ss.getSheetByName(SHEET_NAME);
  if (!leadSheet) {
    leadSheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Set up headers for the Leads sheet
  const headers = [
    'ID', 'Handle', 'Company Name', 'Service Type', 'City', 'Phone',
    'Instagram URL', 'Website', 'Lead Source', 'Running Ads',
    'Ad Copy', 'Price Info', 'Notes', 'Close CRM ID',
    'Date Added', 'Last Updated', 'Status'
  ];
  
  leadSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  leadSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  leadSheet.setFrozenRows(1);
  
  // Create or get the Import Log sheet
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
  }
  
  // Set up headers for the Log sheet
  const logHeaders = ['Timestamp', 'Action', 'Count', 'Status', 'Details'];
  logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
  logSheet.getRange(1, 1, 1, logHeaders.length).setFontWeight('bold');
  logSheet.setFrozenRows(1);
  
  return createResponse(true, 'Setup completed successfully', {
    spreadsheetUrl: ss.getUrl(),
    leadSheetId: leadSheet.getSheetId(),
    logSheetId: logSheet.getSheetId()
  });
}

/**
 * Add multiple leads to the spreadsheet
 */
function handleAddLeads(leads) {
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return createResponse(false, 'No leads provided');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Leads sheet not found. Please run setup first.');
  }
  
  // Get existing IDs to check for duplicates
  const lastRow = sheet.getLastRow();
  const existingIds = lastRow > 1 
    ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(id => id)
    : [];
  
  // Prepare data for insertion
  const rows = [];
  const duplicates = [];
  const timestamp = new Date();
  
  leads.forEach(lead => {
    if (existingIds.includes(lead.id)) {
      duplicates.push(lead.id);
    } else {
      rows.push([
        lead.id,
        lead.handle || '',
        lead.company_name || '',
        lead.service_type || '',
        lead.city || '',
        lead.phone || '',
        lead.instagram_url || '',
        lead.website || '',
        lead.lead_source || '',
        lead.running_ads ? 'Yes' : 'No',
        lead.ad_copy || '',
        lead.price_info || '',
        lead.notes || '',
        lead.close_crm_id || '',
        timestamp,
        timestamp,
        'Active'
      ]);
    }
  });
  
  // Add new rows if any
  if (rows.length > 0) {
    const startRow = lastRow + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  // Log the import
  logImport('addLeads', leads.length, rows.length, duplicates.length);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 17);
  
  return createResponse(true, 'Leads processed successfully', {
    added: rows.length,
    duplicates: duplicates.length,
    duplicateIds: duplicates,
    totalRows: sheet.getLastRow() - 1
  });
}

/**
 * Update a single lead
 */
function handleUpdateLead(lead) {
  if (!lead || !lead.id) {
    return createResponse(false, 'Invalid lead data');
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return createResponse(false, 'Leads sheet not found. Please run setup first.');
  }
  
  // Find the lead by ID
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowIndex = ids.indexOf(lead.id);
  
  if (rowIndex === -1) {
    return createResponse(false, 'Lead not found: ' + lead.id);
  }
  
  const actualRow = rowIndex + 2; // +2 because array is 0-indexed and we skip header
  
  // Update the lead data
  const updateData = [
    lead.id,
    lead.handle || '',
    lead.company_name || '',
    lead.service_type || '',
    lead.city || '',
    lead.phone || '',
    lead.instagram_url || '',
    lead.website || '',
    lead.lead_source || '',
    lead.running_ads ? 'Yes' : 'No',
    lead.ad_copy || '',
    lead.price_info || '',
    lead.notes || '',
    lead.close_crm_id || '',
    sheet.getRange(actualRow, 15).getValue(), // Keep original date added
    new Date(), // Update timestamp
    'Active'
  ];
  
  sheet.getRange(actualRow, 1, 1, updateData.length).setValues([updateData]);
  
  // Log the update
  logImport('updateLead', 1, 1, 0);
  
  return createResponse(true, 'Lead updated successfully', {
    leadId: lead.id,
    row: actualRow
  });
}

/**
 * Get statistics about the leads
 */
function handleGetStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return createResponse(true, 'No data available', {
      totalLeads: 0,
      bySource: {},
      byService: {},
      withPhone: 0,
      withAds: 0,
      exported: 0
    });
  }
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 17).getValues();
  
  const stats = {
    totalLeads: data.length,
    bySource: {},
    byService: {},
    withPhone: 0,
    withAds: 0,
    exported: 0
  };
  
  data.forEach(row => {
    // Count by source
    const source = row[8] || 'Unknown';
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    
    // Count by service
    const service = row[3] || 'Unknown';
    stats.byService[service] = (stats.byService[service] || 0) + 1;
    
    // Count with phone
    if (row[5]) stats.withPhone++;
    
    // Count running ads
    if (row[9] === 'Yes') stats.withAds++;
    
    // Count exported to Close
    if (row[13]) stats.exported++;
  });
  
  return createResponse(true, 'Stats retrieved successfully', stats);
}

/**
 * Log import activities
 */
function logImport(action, total, added, duplicates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    
    if (!logSheet) return;
    
    const logEntry = [
      new Date(),
      action,
      total,
      'Success',
      `Added: ${added}, Duplicates: ${duplicates}`
    ];
    
    logSheet.appendRow(logEntry);
  } catch (error) {
    console.error('Error logging import:', error);
  }
}

/**
 * Create a standardized JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function for development
 */
function testAddLeads() {
  const testData = {
    action: 'addLeads',
    leads: [
      {
        id: 'test-' + new Date().getTime(),
        company_name: 'Test Company',
        service_type: 'Landscaping',
        city: 'Phoenix',
        phone: '(602) 555-1234',
        lead_source: 'Instagram Manual',
        running_ads: true,
        notes: 'Test lead from Apps Script'
      }
    ]
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  console.log(result.getContent());
}