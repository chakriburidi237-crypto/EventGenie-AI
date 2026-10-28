import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are EventGenie AI, a friendly and expert event planning assistant. You help users plan weddings, birthdays, community events, and corporate gatherings.

Your expertise includes:
- Budget planning and allocation strategies
- Theme and decoration ideas
- Venue selection tips
- Catering and menu planning
- Timeline and task management
- Vendor coordination advice
- Guest management and RSVP strategies
- Entertainment and activity ideas
- Seasonal event considerations

Guidelines:
- Be concise but helpful (2-4 sentences per response)
- Use emojis sparingly for warmth
- Give practical, actionable advice
- Never invent specific vendor names or fake prices
- If asked something unrelated to events, gently redirect
- Be enthusiastic and supportive`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ reply: "Please send a shorter message about event planning! 🎉" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const conversationHistory = (history || []).slice(-6).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: "I'm EventGenie AI, ready to help with event planning!" }] },
            ...conversationHistory,
            { role: 'user', parts: [{ text: message }] },
          ],
          config: { maxOutputTokens: 300, temperature: 0.8 },
        });

        const reply = result.text?.trim();
        if (reply) {
          return NextResponse.json({ reply });
        }
      } catch {
        // Fall through to rule-based response
      }
    }

    // Rule-based fallback responses
    const reply = generateFallbackResponse(message.toLowerCase());
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: "I'm here to help with event planning! Try asking about budgets, themes, venues, or timelines. 🎉",
    });
  }
}

function generateFallbackResponse(msg: string): string {
  if (msg.includes('budget') || msg.includes('cost') || msg.includes('money') || msg.includes('spend')) {
    return "Great question about budgets! 💰 A good rule of thumb: allocate 40-50% for venue & catering, 10-15% for decoration, 10% for photography, and keep 5-10% as contingency. Start by listing your must-haves vs nice-to-haves!";
  }
  if (msg.includes('theme') || msg.includes('decor') || msg.includes('decoration')) {
    return "For themes, think about what reflects your personality! 🎨 Popular trends include bohemian garden parties, celestial/starlight elegance, vintage rustic, and modern minimalist. Match your theme to your venue type and season for the best effect.";
  }
  if (msg.includes('venue') || msg.includes('location') || msg.includes('place')) {
    return "Venue selection is key! 🏛️ Book 6-12 months in advance for popular dates. Consider: guest capacity (plan for 10% more than expected), parking/accessibility, in-house catering options, and weather backup plans for outdoor venues.";
  }
  if (msg.includes('food') || msg.includes('catering') || msg.includes('menu') || msg.includes('diet')) {
    return "For catering success: plan 1.5x portions per guest, always offer vegetarian options, and consider a mix of stations + plated service. 🍽️ Ask about allergies on your RSVP cards and do a tasting 4-6 weeks before the event!";
  }
  if (msg.includes('timeline') || msg.includes('schedule') || msg.includes('when') || msg.includes('plan ahead')) {
    return "Here's a planning timeline: 12+ months out — book venue & major vendors. 6 months — finalize theme, send save-the-dates. 3 months — send invitations. 1 month — confirm all vendors, finalize seating. 1 week — final walkthrough! ⏰";
  }
  if (msg.includes('guest') || msg.includes('invite') || msg.includes('rsvp')) {
    return "For guest management: send invitations 6-8 weeks before (12 weeks for destination events). Set RSVP deadlines 3 weeks before. Expect 15-20% won't attend. 📧 Use our Guest Manager to track RSVPs and dietary needs!";
  }
  if (msg.includes('wedding')) {
    return "Wedding planning tip: prioritize what matters most to YOU as a couple! 💍 Common regrets are overspending on things that don't matter to you. Book photographer & videographer early — the best ones get booked 12-18 months out!";
  }
  if (msg.includes('birthday')) {
    return "Birthday party ideas: for milestone birthdays, a themed photo booth is always a hit! 🎂 Consider the honoree's personality — introverts may prefer intimate dinner parties, while extroverts love big celebrations with activities!";
  }
  if (msg.includes('vendor') || msg.includes('photographer') || msg.includes('dj') || msg.includes('florist')) {
    return "When choosing vendors: get 3+ quotes, read recent reviews, ask for references, and ALWAYS get everything in writing. 📋 Meet in person when possible and check if they've worked at your venue before!";
  }
  return "That's a great event planning question! 🎉 I can help with budgets, themes, timelines, vendor tips, guest management, and creative ideas. What specific aspect of your event would you like to dive into?";
}
