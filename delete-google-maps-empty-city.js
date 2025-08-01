// Delete Google Maps leads with empty cities
// Run this in browser console

const store = JSON.parse(localStorage.getItem('lead-tracker-store'));
const leads = store.state.leads;

console.log(`Total leads: ${leads.length}`);

// Find Google Maps leads with empty cities
const googleMapsEmptyCity = leads.filter(lead => 
  lead.lead_source === 'Google Maps' && (!lead.city || lead.city === '')
);

console.log(`Google Maps leads with empty cities: ${googleMapsEmptyCity.length}`);

// Show sample
console.log('Sample of leads to delete:', googleMapsEmptyCity.slice(0, 5).map(l => ({
  name: l.company_name,
  city: l.city || '(empty)',
  source: l.lead_source,
  phone: l.phone
})));

// Confirm deletion
if (confirm(`Delete ${googleMapsEmptyCity.length} Google Maps leads with empty cities?`)) {
  // Keep all other leads
  const cleanedLeads = leads.filter(lead => 
    !(lead.lead_source === 'Google Maps' && (!lead.city || lead.city === ''))
  );
  
  store.state.leads = cleanedLeads;
  localStorage.setItem('lead-tracker-store', JSON.stringify(store));
  
  console.log(`Deleted ${googleMapsEmptyCity.length} leads. Reloading...`);
  location.reload();
} else {
  console.log('Deletion cancelled');
}