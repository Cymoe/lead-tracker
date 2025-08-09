import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        userError 
      }, { status: 401 });
    }
    
    // Try to create a simple import operation
    const testData = {
      user_id: user.id,
      operation_type: 'google_maps_import',
      source: 'Google Maps',
      lead_count: 1,
      metadata: { test: true }
    };
    
    console.log('Test: Inserting data:', testData);
    
    const { data, error } = await supabase
      .from('import_operations')
      .insert(testData)
      .select()
      .single();
      
    if (error) {
      console.error('Test: Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json({ 
        error: 'Database error',
        details: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        },
        testData
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      data,
      testData
    });
    
  } catch (error) {
    console.error('Test: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}