import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all leads for the current user
    const { error: deleteError, count } = await supabase
      .from('leads')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting leads:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete leads', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count || 0} leads`,
      count: count || 0
    });

  } catch (error) {
    console.error('Unexpected error in delete-all endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}