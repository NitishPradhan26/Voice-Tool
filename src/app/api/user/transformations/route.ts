import { NextRequest, NextResponse } from 'next/server';
import { getUserTransformations, addUserTransformations } from '@/services/userDataService';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, transformations } = body;

    if (!uid || !transformations) {
      return NextResponse.json(
        { error: 'User ID and transformations are required' },
        { status: 400 }
      );
    }

    // Validate transformations is an object with key:value pairs
    if (typeof transformations !== 'object' || Array.isArray(transformations)) {
      return NextResponse.json(
        { error: 'Transformations must be an object with key:value pairs' },
        { status: 400 }
      );
    }

    await addUserTransformations(uid, transformations);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user transformations:', error);
    return NextResponse.json(
      { error: 'Failed to update user transformations' },
      { status: 500 }
    );
  }
}