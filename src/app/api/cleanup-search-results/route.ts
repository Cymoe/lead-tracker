import { NextResponse } from 'next/server';
import { cleanupExpiredSearchResults } from '@/lib/cleanup-search-results';

export async function POST() {
  try {
    const result = await cleanupExpiredSearchResults();
    
    if (result.success) {
      return NextResponse.json({ message: 'Expired search results cleaned up successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cleanup API:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired search results' },
      { status: 500 }
    );
  }
}