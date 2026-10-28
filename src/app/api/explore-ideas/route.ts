import { NextRequest, NextResponse } from 'next/server';
import { exploreThemes } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, budget, currency, guestCount, preferences } = body as {
      eventType: string;
      budget: number;
      currency: string;
      guestCount: number;
      preferences: string;
    };

    if (!eventType || !budget || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const ideas = await exploreThemes(eventType, budget, currency, guestCount, preferences);

    return NextResponse.json({ success: true, data: ideas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'AI_NOT_CONFIGURED') {
      return NextResponse.json(
        { success: false, error: 'AI provider is not configured. Set GEMINI_API_KEY.' },
        { status: 503 }
      );
    }

    console.error('Explore ideas error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to generate ideas. Please try again.' },
      { status: 500 }
    );
  }
}
