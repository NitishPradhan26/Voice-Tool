import { NextRequest, NextResponse } from 'next/server';
import { getUserPrompt, updateUserPrompt } from '@/services/promptService';

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

    const prompt = await getUserPrompt(uid);
    
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error fetching user prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, prompt } = body;

    if (!uid || prompt === undefined) {
      return NextResponse.json(
        { error: 'User ID and prompt are required' },
        { status: 400 }
      );
    }

    await updateUserPrompt(uid, prompt);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update user prompt' },
      { status: 500 }
    );
  }
}