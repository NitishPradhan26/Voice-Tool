import { NextRequest, NextResponse } from 'next/server';
import { getUserTransformations } from '@/services/promptService';

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

    const transformations = await getUserTransformations(uid);
    
    return NextResponse.json({ transformations });
  } catch (error) {
    console.error('Error fetching user transformations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user transformations' },
      { status: 500 }
    );
  }
}