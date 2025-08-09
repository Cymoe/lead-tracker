import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeServiceType } from '@/utils/service-type-normalization';

export async function POST() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Starting batch normalization of service types...');
    
    // Fetch all leads that have a service_type but no normalized_service_type
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, service_type')
      .not('service_type', 'is', null)
      .is('normalized_service_type', null);
    
    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!leads || leads.length === 0) {
      console.log('No leads need normalization');
      return NextResponse.json({ success: true, normalized: 0, message: 'No leads need normalization' });
    }
    
    console.log(`Found ${leads.length} leads to normalize`);
    
    // Prepare batch updates
    const updates = leads.map(lead => {
      const normalizedType = normalizeServiceType(lead.service_type);
      return {
        id: lead.id,
        service_type: lead.service_type,
        normalized_service_type: normalizedType
      };
    }).filter(update => update.normalized_service_type !== null);
    
    console.log(`Normalizing ${updates.length} leads with valid service types`);
    
    // Update in batches of 100
    const batchSize = 100;
    let totalUpdated = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Update each lead in the batch
      const promises = batch.map(update => 
        supabase
          .from('leads')
          .update({ normalized_service_type: update.normalized_service_type })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const batchErrors = results.filter(result => result.error);
      
      if (batchErrors.length > 0) {
        console.error(`Errors in batch ${i / batchSize + 1}:`, batchErrors);
        errors.push(...batchErrors);
      }
      
      totalUpdated += batch.length - batchErrors.length;
      console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(updates.length / batchSize)}`);
    }
    
    // Get stats after normalization
    const { data: stats } = await supabase
      .from('leads')
      .select('service_type, normalized_service_type')
      .not('service_type', 'is', null);
    
    const uniqueOriginalTypes = new Set(stats?.map(lead => lead.service_type).filter(Boolean) || []);
    const uniqueNormalizedTypes = new Set(stats?.map(lead => lead.normalized_service_type).filter(Boolean) || []);
    
    const response = {
      success: true,
      normalized: totalUpdated,
      total: leads.length,
      errors: errors.length,
      stats: {
        uniqueOriginalTypes: uniqueOriginalTypes.size,
        uniqueNormalizedTypes: uniqueNormalizedTypes.size,
        reductionRatio: uniqueOriginalTypes.size > 0 
          ? ((uniqueOriginalTypes.size - uniqueNormalizedTypes.size) / uniqueOriginalTypes.size * 100).toFixed(1) + '%'
          : '0%'
      }
    };
    
    console.log('Batch normalization complete:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in normalization:', error);
    return NextResponse.json(
      { error: 'Failed to normalize service types' },
      { status: 500 }
    );
  }
}

// GET endpoint to check normalization stats
export async function GET() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current stats
    const { data: stats, error } = await supabase
      .from('leads')
      .select('service_type, normalized_service_type')
      .not('service_type', 'is', null);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const total = stats?.length || 0;
    const normalized = stats?.filter(lead => lead.normalized_service_type !== null).length || 0;
    const notNormalized = total - normalized;
    
    // Count unique service types before and after normalization
    const originalTypes = new Set(stats?.map(lead => lead.service_type).filter(Boolean) || []);
    const normalizedTypes = new Set(stats?.map(lead => lead.normalized_service_type).filter(Boolean) || []);
    
    // Get examples of unmapped types
    const unmappedTypes = stats
      ?.filter(lead => lead.service_type && !lead.normalized_service_type)
      .map(lead => lead.service_type)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .slice(0, 10);
    
    return NextResponse.json({
      total,
      normalized,
      notNormalized,
      uniqueOriginalTypes: originalTypes.size,
      uniqueNormalizedTypes: normalizedTypes.size,
      reductionRatio: originalTypes.size > 0 
        ? ((originalTypes.size - normalizedTypes.size) / originalTypes.size * 100).toFixed(1) + '%'
        : '0%',
      unmappedExamples: unmappedTypes
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      { error: 'Failed to get normalization stats' },
      { status: 500 }
    );
  }
}