import { Lead } from '@/types';

export function exportToGoogleSheets(leads: Lead[]): boolean {
  const headers = [
    'ID', 'Handle', 'Company Name', 'Service Type', 'City', 'Phone', 
    'Instagram URL', 'Website', 'Lead Source', 'Running Ads', 
    'Ad Start Date', 'Ad Copy', 'Ad Platform', 'Score', 'Notes',
    'Close CRM ID', 'Created At', 'Updated At'
  ];
  
  const rows = leads.map(lead => [
    lead.id,
    lead.handle || '',
    lead.company_name,
    lead.service_type || '',
    lead.city || '',
    lead.phone || '',
    lead.instagram_url || '',
    lead.website || '',
    lead.lead_source || '',
    lead.running_ads ? 'Yes' : 'No',
    lead.ad_start_date || '',
    lead.ad_copy || '',
    lead.ad_platform || '',
    lead.score || '',
    lead.notes || '',
    lead.close_crm_id || '',
    new Date(lead.created_at).toLocaleString(),
    new Date(lead.updated_at).toLocaleString()
  ]);
  
  // Create tab-separated values for better Google Sheets compatibility
  const tsv = [headers, ...rows]
    .map(row => row.map(cell => {
      // Escape tabs and newlines in cell content
      const cellStr = String(cell).replace(/\t/g, ' ').replace(/\n/g, ' ');
      // Wrap in quotes if contains comma, quote, or newline
      return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
        ? `"${cellStr.replace(/"/g, '""')}"` 
        : cellStr;
    }).join('\t'))
    .join('\n');
    
  const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lead-tracker-export-${new Date().toISOString().split('T')[0]}.tsv`;
  a.click();
  URL.revokeObjectURL(url);
  
  return true;
}

export function exportToCSV(leads: Lead[]) {
  // Define headers
  const headers = [
    'Company Name',
    'Instagram Handle',
    'Service Type',
    'City',
    'State',
    'Phone',
    'Email',
    'Email 2',
    'Email 3',
    'Website',
    'Instagram URL',
    'Facebook URL',
    'LinkedIn URL',
    'Twitter URL',
    'Google Maps URL',
    'Address',
    'Full Address',
    'Search Query',
    'Rating',
    'Review Count',
    'Lead Source',
    'Running Ads',
    'Ad Copy',
    'Score',
    'Notes',
    'Created Date'
  ];

  // Convert leads to CSV rows
  const rows = leads.map(lead => [
    lead.company_name || '',
    lead.handle || '',
    lead.service_type || '',
    lead.city || '',
    lead.state || '',
    lead.phone || '',
    lead.email || '',
    lead.email2 || '',
    lead.email3 || '',
    lead.website || '',
    lead.instagram_url || '',
    lead.facebook_url || '',
    lead.linkedin_url || '',
    lead.twitter_url || '',
    lead.google_maps_url || '',
    lead.address || '',
    lead.full_address || '',
    lead.search_query || '',
    lead.rating || '',
    lead.review_count || '',
    lead.lead_source || '',
    lead.running_ads ? 'Yes' : 'No',
    lead.ad_copy || '',
    lead.score || '',
    lead.notes || '',
    new Date(lead.created_at).toLocaleDateString()
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell || ''}"`).join(','))
    .join('\n');
    
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportForClose(leads: Lead[]) {
  const closeReady = leads.filter(lead => lead.phone && !lead.close_crm_id);
  
  if (closeReady.length === 0) {
    alert('No new leads with phone numbers to export');
    return;
  }
  
  const headers = [
    'Company Name', 'Phone', 'Lead Status', 'Lead Source', 
    'Service Type', 'City', 'Score', 'Website', 'Notes'
  ];
  
  const rows = closeReady.map(lead => [
    lead.company_name,
    lead.phone,
    'New - Not Contacted',
    lead.lead_source,
    lead.service_type,
    lead.city,
    lead.score,
    lead.website,
    `${lead.notes || ''} | Running Ads: ${lead.running_ads ? 'Yes' : 'No'}`
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell || ''}"`).join(','))
    .join('\n');
    
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `close-import-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert(`Exported ${closeReady.length} new leads for Close CRM import`);
}