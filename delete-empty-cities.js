// Script to delete leads with empty cities
// Run this in your browser console

const store = JSON.parse(localStorage.getItem('lead-tracker-store'));
const leads = store.state.leads;

console.log(`Total leads: ${leads.length}`);

// Find leads with empty cities
const leadsWithEmptyCities = leads.filter(lead => !lead.city || lead.city === '');
console.log(`Leads with empty cities: ${leadsWithEmptyCities.length}`);

// Show a sample of what will be deleted
console.log('Sample of leads to be deleted:', leadsWithEmptyCities.slice(0, 5).map(l => ({
  name: l.company_name,
  city: l.city,
  source: l.lead_source,
  created: l.created_at
})));

// Filter out leads with empty cities
const cleanedLeads = leads.filter(lead => lead.city && lead.city !== '');
console.log(`Leads to keep: ${cleanedLeads.length}`);

// Save the cleaned list
store.state.leads = cleanedLeads;
localStorage.setItem('lead-tracker-store', JSON.stringify(store));

console.log('Done! Reloading page...');
location.reload();