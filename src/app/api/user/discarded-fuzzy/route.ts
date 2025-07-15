import { NextRequest, NextResponse } from 'next/server';
import { getUserDiscardedFuzzy, addUserDiscardedFuzzy } from '@/services/promptService';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const discardedFuzzy = await getUserDiscardedFuzzy(uid);
    
    return NextResponse.json({ discardedFuzzy });
  } catch (error) {
    console.error('Error fetching user discarded fuzzy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user discarded fuzzy' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, discardedFuzzy } = body;

    if (!uid || !discardedFuzzy) {
      return NextResponse.json(
        { error: 'User ID and discarded fuzzy data are required' },
        { status: 400 }
      );
    }

    // Validate discardedFuzzy is an object with key:value pairs
    if (typeof discardedFuzzy !== 'object' || Array.isArray(discardedFuzzy)) {
      return NextResponse.json(
        { error: 'Discarded fuzzy data must be an object with key:value pairs' },
        { status: 400 }
      );
    }

    await addUserDiscardedFuzzy(uid, discardedFuzzy);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user discarded fuzzy:', error);
    return NextResponse.json(
      { error: 'Failed to update user discarded fuzzy' },
      { status: 500 }
    );
  }
}