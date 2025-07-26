# Google Apps Script Integration for Lead Tracker

This integration allows you to sync your leads directly to Google Sheets for easy collaboration and reporting.

## Setup Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Lead Tracker Data"

### 2. Set Up the Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy all the code from `Code.gs` in this folder
4. Paste it into the Apps Script editor
5. Click **Save** (Ctrl+S or Cmd+S)

### 3. Deploy as Web App

1. In the Apps Script editor, click **Deploy > New Deployment**
2. Click the gear icon and select **Web app**
3. Configure the deployment:
   - **Description**: Lead Tracker Integration v1
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** - you'll need this for the Lead Tracker app

### 4. Configure Lead Tracker

1. In the Lead Tracker app, click the **Settings** button (gear icon)
2. Paste the Web App URL into the **Google Apps Script URL** field
3. Click **Save**

### 5. Test the Connection

1. In Lead Tracker, click **Sync Sheets** button
2. Click **Test Connection**
3. If successful, you'll see a green confirmation message

## Using the Integration

### Manual Sync

1. Click the **Sync Sheets** button in Lead Tracker
2. Choose sync options:
   - **Sync all leads**: Syncs your entire lead database
   - **Only sync new leads**: Syncs only leads not previously synced
   - **Update existing leads**: Updates leads that already exist in the sheet
3. Click **Sync X Leads** to start the sync

### What Gets Synced

The following lead information is synced to Google Sheets:

- Lead ID (for tracking)
- Instagram Handle
- Company Name
- Service Type
- City
- Phone
- Instagram URL
- Website
- Lead Source
- Running Ads status
- Ad Copy
- Price Info
- Notes
- Close CRM ID (if exported)
- Date Added
- Last Updated
- Status

### Sheet Structure

The script automatically creates two sheets:

1. **Leads**: Contains all your lead data
2. **Import Log**: Tracks sync history and any issues

### Troubleshooting

#### "Cannot connect" error

1. Make sure the Web App is deployed with "Anyone" access
2. Check that the URL is correct (should start with `https://script.google.com/macros/s/`)
3. Try redeploying the Web App

#### CORS errors

This is normal - the script uses "no-cors" mode for security. The sync should still work.

#### Missing data

1. Check the Import Log sheet for any errors
2. Ensure all required fields are filled in Lead Tracker
3. Try syncing in smaller batches

## Advanced Features

### Automatic Updates

The sync will automatically detect duplicates based on Lead ID and skip them (unless "Update existing" is checked).

### Batch Processing

Large sync operations are automatically split into batches to prevent timeouts.

### Error Handling

Failed syncs are logged in the Import Log sheet with details about what went wrong.

## Security Note

The Web App runs under your Google account permissions. Only share the Web App URL with trusted team members who should have access to your lead data.