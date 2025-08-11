import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeServiceType } from '@/utils/service-type-normalization';

export async function GET() {
  const supabase = await createClient();
  
  // Fetch ALL leads with service_type
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, service_type')
    .not('service_type', 'is', null);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!leads || leads.length === 0) {
    return NextResponse.json({ message: 'No leads found' });
  }
  
  // Update each lead with normalized service type
  let updated = 0;
  const errors = [];
  
  for (const lead of leads) {
    const normalized = normalizeServiceType(lead.service_type);
    
    const { error: updateError } = await supabase
      .from('leads')
      .update({ normalized_service_type: normalized })
      .eq('id', lead.id);
      
    if (updateError) {
      errors.push({ id: lead.id, error: updateError.message });
    } else {
      updated++;
    }
  }
  
  return NextResponse.json({ 
    message: `Updated ${updated} of ${leads.length} leads`,
    errors: errors.length > 0 ? errors : undefined
  });
}