# ShikayatAI — Civic Complaint Assistant

**ShikayatAI** ("shikayat" means "complaint" in Urdu) helps everyday citizens in Pakistan turn informal, plain-language descriptions of civic problems — broken roads, water leakage, electricity faults, garbage, noise, illegal parking — into professional, formally worded complaints, addressed to the correct government department, with guidance on urgency, evidence to attach, and where to file.

### The problem it solves

Most citizens who face civic issues either don't complain at all, or write informal, emotional messages that get ignored by overworked municipal offices because they lack the structure, tone, and specificity that formal grievance systems expect. ShikayatAI removes that barrier: a user describes their issue in their own words — in English, Urdu, or even by voice — and the app instantly produces a properly formatted complaint ready to submit, along with practical next steps (which department, how urgent, what evidence to bring, where to file). It's built for everyday residents of Pakistan, especially those less comfortable writing formal English or Urdu themselves.

---

## Live App

🔗 **Live URL (primary):** https://shikayatai.lovable.app
🔗 **Live URL (mirror):** https://shikayatai.vercel.app

> Both links run the same app. The Lovable link is the primary/reference deployment; the Vercel link is provided as an additional public hosting mirror per the assignment's allowance.

---

## Features

- **Account system** — simple email/password sign-up and sign-in, powered by Supabase Auth
- **Plain-language complaint input** — a large text box for describing an issue in natural language, no formal writing skills required
- **Voice input** — a microphone button using the browser's built-in Web Speech API to dictate a complaint instead of typing, supporting both English and Urdu speech recognition
- **Quick-select issue chips** — one-tap buttons (Broken Road, Water Leak, Electricity Fault, Garbage, Noise, Illegal Parking) that auto-fill the category
- **Category selector** — optional manual dropdown (Water, Electricity, Roads, Sanitation, Police, Other) if auto-detection isn't wanted
- **Language toggle** — switch between English and Urdu; the AI-generated complaint is produced in the selected language
- **AI-generated formal complaint** — one click transforms the raw description into a structured, professionally worded complaint
- **Results page** showing:
  - A formal subject line
  - The full rewritten formal complaint text
  - The assigned government department/authority
  - An urgency level badge (Low / Medium / High / Emergency)
  - A checklist of suggested evidence to attach (photos, GPS location, documents, etc.)
  - Where this type of complaint is typically filed, with an embedded map when the location can be geocoded
  - A side-by-side view comparing the user's original message with the AI-formatted version
- **Download as PDF** — generates a formatted PDF of the complaint (subject, body, department, urgency, evidence, filing location, and the date) using jsPDF
- **Complaint history dashboard** — logged-in users can view all their previously generated complaints, sorted by most recent
- **Delete complaints** — users can remove any past complaint from their history at any time
- **Clean, official-style design** — blue-and-white color scheme, header identification bar, breadcrumb navigation, and a footer with privacy/about information, styled to feel trustworthy like a government portal

---

## The AI Feature

**What it does:** When a user submits their issue description (plus optional category and language), the app calls the Google Gemini API through a Supabase Edge Function (`generate-complaint`). Gemini analyzes the raw text and returns a structured JSON response containing a formal subject line, a fully rewritten formal complaint in the correct register and language, the responsible department, an urgency assessment, suggested evidence, and where the complaint is typically filed.

**System prompt / instructions used** *(replace this with the exact wording from your `generate-complaint` edge function before submitting — this is a representative summary, not a verbatim copy)*:

```
You are an assistant that helps Pakistani citizens convert informal complaints about civic issues 
into formal, professional complaints suitable for submission to government departments.

Given a user's issue description (in English or Urdu/Roman Urdu), a category (optional), and a 
target language, return a JSON object with exactly these fields:

- subject: a concise, formal subject line for the complaint
- formal_complaint: the complete formal complaint letter, written in the target language, using 
  respectful, official tone, proper salutation and closing, and specific reference to the issue 
  described — do not simply insert the user's raw text into the letter; rewrite it as a citizen 
  writing a serious, structured grievance
- department: the most likely responsible government department or authority for this issue in Pakistan
- urgency: one of "Low", "Medium", "High", or "Emergency", based on public safety and severity
- suggested_evidence: a list of specific evidence the citizen should gather (e.g. photos, GPS location, 
  video, prior complaint reference numbers)
- filing_location: where this type of complaint is typically filed (e.g. relevant department office, 
  citizen portal, helpline)

If the language is Urdu, write formal_complaint entirely in Urdu using proper formal register 
(not Roman Urdu). Always respond with valid JSON only, no extra commentary.
```

**Model used:** Google Gemini (via direct API call from the Supabase Edge Function)

---

## Tools, Services & AI Models Used

- **[Lovable](https://lovable.dev)** — AI app builder used to design and build the frontend, backend logic, and Supabase integration
- **[Supabase](https://supabase.com)** — authentication, Postgres database (storing users' complaint history), and Edge Functions (serverless backend for the AI call)
- **[Google Gemini API](https://ai.google.dev)** — the AI model that generates the formal complaint content
- **Web Speech API** (browser built-in) — voice-to-text input, no external service or key required
- **[jsPDF](https://github.com/parallax/jsPDF)** — client-side PDF generation for the "Download as PDF" feature
- **[OpenStreetMap Nominatim](https://nominatim.org/)** — free geocoding of the filing location to show an embedded map, where available
- **[Google Stitch](https://stitch.withgoogle.com)** — used during the design phase to prototype an alternative visual concept; several ideas (quick-select chips, urgency badges, evidence checklist, side-by-side comparison view) were adapted from this prototype into the final Lovable build
- **GitHub** — public code repository
- **Vercel** — secondary hosting/deployment
- **[Google AI Studio](https://aistudio.google.com)** — used to generate the Gemini API key

---

## Screenshots

> Add at least 3 screenshots below. In GitHub, the easiest way: create a folder called `screenshots/` in your repo, upload your images there (drag and drop via "Add file → Upload files" on GitHub's web UI), then reference them like this:

```markdown
![Landing page](screenshots/landing.png)
![Complaint form](screenshots/form.png)
![Results page](screenshots/results.png)
![History dashboard](screenshots/history.png)
```

Suggested screenshots to include:
1. Landing page (hero section)
2. The complaint form (with quick-select chips and language toggle visible)
3. The results page showing the formal complaint, urgency badge, and evidence checklist
4. The history dashboard with the delete option
5. A generated PDF, if you'd like to show that too

---

## How to Run This Project Locally

**Prerequisites:** Node.js (or Bun, since this project uses `bun.lock`), and a Supabase project of your own if you want the AI feature to work locally.

1. **Clone the repository**
   ```bash
   git clone https://github.com/rehma1ajmal1-debug/shikayatai.git
   cd shikayatai
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or, if you prefer npm:
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root with:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   VITE_SUPABASE_PROJECT_ID=your-supabase-project-id
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   SUPABASE_PROJECT_ID=your-supabase-project-id
   ```

   These are safe, public-facing Supabase values. The Gemini API key is **not** set here — it lives as a **Supabase Edge Function secret** (`GEMINI_API_KEY`), configured in your Supabase project dashboard under Edge Functions → Secrets, and is never exposed in the codebase or frontend.

4. **Run the development server**
   ```bash
   bun run dev
   # or: npm run dev
   ```

5. Open the local URL shown in your terminal (typically `http://localhost:5173` or similar).

> Note: complaint generation requires a working Supabase project with the `generate-complaint` Edge Function deployed and a valid `GEMINI_API_KEY` secret configured — without this, the AI feature will not work, but the rest of the UI can still be explored.

---

## Disclosure

ShikayatAI is an independent student project built for the ACT AI course final assignment. It is not affiliated with or endorsed by any government agency in Pakistan.
