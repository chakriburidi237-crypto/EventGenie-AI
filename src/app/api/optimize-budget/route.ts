import { NextRequest, NextResponse } from 'next/server';
import { optimizeBudget } from '@/lib/ai-client';
import { EventSetup } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setup, currentBudget, priorities } = body as {
      setup: EventSetup;
      currentBudget: { category: string; amount: number }[];
      priorities: string[];
    };

    if (!setup || !currentBudget) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const apiKey = request.headers.get('x-gemini-api-key') || (body as Record<string, any>).apiKey;
    const optimization = await optimizeBudget(setup, currentBudget, priorities || [], apiKey);

    return NextResponse.json({ success: true, data: optimization });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Optimize budget error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize budget. Please try again.' },
      { status: 500 }
    );
  }
}
