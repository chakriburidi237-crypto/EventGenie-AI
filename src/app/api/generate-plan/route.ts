import { NextRequest, NextResponse } from 'next/server';
import { generateEventPlan } from '@/lib/ai-client';
import { validateServerInput } from '@/lib/validation';
import { EventSetup } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errors = validateServerInput(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const apiKey = request.headers.get('x-gemini-api-key') || body.apiKey;
    const setup = body as EventSetup;
    const plan = await generateEventPlan(setup, apiKey);

    return NextResponse.json({
      success: true,
      data: plan,
      isDemo: plan.isSample,
      source: plan.source,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Generate plan error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to generate event plan. Please try again.' },
      { status: 500 }
    );
  }
}
