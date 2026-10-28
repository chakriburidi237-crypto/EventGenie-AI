# EventGenie AI

> **"Plan Smarter. Celebrate Better. Powered by AI."**

EventGenie AI is a full-stack, AI-powered event planning web application built for weddings, birthdays, community celebrations, and corporate gatherings. It solves common event planning bottlenecks: budget allocation, preparation timelines, vendor coordination, task tracking, and personalized creative ideas.

---

## 🚀 Key Features

1. **Event Setup & Validation**: Comprehensive configuration including event type, guest count, budget, currency, venue preference (indoor/outdoor/both), and dietary/special requirements. Complete client-side and server-side validation.
2. **AI Event Plan Generator**: Leverages Google Gemini (`gemini-2.5-flash`) via `@google/genai` to generate structured JSON plans with event concepts, decor concepts, catering suggestions, entertainment ideas, timelines, and personalized tips.
3. **Smart Budget Planner**: 8 standard editable categories (Venue, Food & Catering, Decoration, Photography, Entertainment, Invitations, Transportation, Miscellaneous). Calculates totals, remaining budget, and detects over-budget status in real time. Clearly labels estimates as estimates without fabricating market quotes.
4. **Timeline & Task Manager**: Actionable preparation tasks with due dates, priority tiers (`high`, `medium`, `low`), categories, and completion states. Flags past-due and overdue deadlines.
5. **Vendor Checklist**: Track service categories, quotes, booking states (`contacted`, `quoted`, `booked`, `confirmed`, `cancelled`), and contact notes without inventing fictional businesses.
6. **AI Budget Optimizer**: When planned expenses exceed the allocated budget, the AI suggests practical, priority-preserving adjustments showing original vs. proposed allocations and potential savings.
7. **Theme & Idea Explorer**: Interactive ideation engine suggesting tailored themes, estimated cost ranges, and signature highlights based on guest count and budget.
8. **Exportable Plans**: Download formatted event plans, budgets, and checklists as `.txt` files for offline review and vendor sharing.
9. **Curated Demo Experience**: Evaluators can explore a pre-loaded sample event ("Sarah & James — Enchanted Garden Wedding") with complete plan, budget, timeline, and vendors without needing an API key. All sample data is explicitly labeled.
10. **Resilient Offline / Fallback States**: App remains functional if the AI provider is unavailable. Events and local edits persist seamlessly in `localStorage`.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom design system tokens (indigo/blue palette, responsive glassmorphic cards, micro-interactions)
- **AI Integration**: `@google/genai` SDK calling Google Gemini (`gemini-2.5-flash`) with structured JSON schema responses
- **Storage**: Client-side `localStorage` persistence with zero backend database requirements for instant setup
- **Testing**: Automated unit tests using `tsx` and Node's native test runner (`node:test`, `node:assert`)
- **Icons**: `lucide-react`

---

## 🔒 Security & Privacy

- **Server-Side API Routes**: All Gemini API calls are strictly handled on server routes (`/api/generate-plan`, `/api/optimize-budget`, `/api/explore-ideas`).
- **Zero API Key Exposure**: The Gemini API key is never exposed to the client bundle or browser network requests.
- **Strict Input Validation**: Payloads are sanitized and validated both client-side and server-side.
- **No Secrets in Version Control**: `.env.example` provides placeholders only; actual keys are loaded through environment variables.

---

## 📋 Getting Started

### Prerequisites

- Node.js `v20+` or `v24+`
- npm `v10+`

### Installation

1. Navigate to the project directory:
   ```bash
   cd eventgenie-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
   *(Note: The application still runs and can be explored using the pre-loaded Demo Event even without an API key).*

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

Automated tests cover all critical budget calculations (totals, actuals, remaining, percentages, over-budget detection, AI allocation mapping) and event setup validation rules.

Run the test suite:
```bash
npm test
```

Expected output:
```
✔ Smart Budget Planner Calculations (9 tests)
✔ Event Setup Input Validation (5 tests)
ℹ tests 14
ℹ pass 14
```

---

## 🚢 Deployment to Vercel

The application is architected for zero-configuration deployment on Vercel:

1. Push the repository to GitHub / GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Set the Root Directory to `eventgenie-ai` if applicable.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
5. Click **Deploy**.

---

## 📄 License

MIT License. Built for PromptWars Virtual — Challenge 5.
