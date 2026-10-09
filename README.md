# Supabase Architecture Analysis + Notes App

## Project Description
This project analyzes the architecture of **Supabase**, an open-source backend platform, and includes a working prototype that demonstrates several of its subsystems.

**Architectural style:** A suite of loosely coupled, open-source services built around a shared PostgreSQL database, fronted by a Kong API gateway.

**Key components:** Kong (API gateway), PostgREST (REST API), Supabase Auth (formerly GoTrue), Realtime (WebSockets), Storage, Edge Functions, Supavisor (connection pooler), and PostgreSQL.

**Prototype:** A notes app (Vite + vanilla JavaScript + `supabase-js`) with email/password auth, per-user notes protected by Row Level Security, live updates via Realtime Postgres Changes, and an interactive "Architecture" tab explaining each component.

- **Live site:** https://supabase-architecture-explorer-9kydkit2v-eric-537c.vercel.app/

## Setup & Run Instructions
1. Clone the repo:
   git clone [your repo URL]
   cd [repo folder]
2. Install dependencies:
   npm install
3. Create a free project at supabase.com. In the SQL Editor, run:
   create table notes (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null default auth.uid() references auth.users,
     content text not null check (char_length(content) between 1 and 280),
     created_at timestamptz default now()
   );
   alter table notes enable row level security;
   create policy "read own" on notes for select using (auth.uid() = user_id);
   create policy "insert own" on notes for insert with check (auth.uid() = user_id);
   create policy "delete own" on notes for delete using (auth.uid() = user_id);
   alter publication supabase_realtime add table notes;
4. In Supabase, turn off "Confirm email" under Authentication → Providers → Email.
5. Copy `.env.example` to `.env` and fill in your Project URL and publishable key (Project Settings → API).
6. Run the app: `npm run dev`
7. Run the tests: `npm test`

## AI Disclosure & Prompt Appendix
**AI tool used:** Gemini (architecture breakdown and app scaffolding).

Full documentation:
- [ai-log.md](ai-log.md): exact prompts and raw outputs
- [fact-check.md](fact-check.md): claim-by-claim verification against official docs
- [customization-log.md](customization-log.md): every change I made to the AI's output

**Summary of what I verified, corrected, and customized:**
- **Verified:** component technologies (PostgREST/Haskell, Realtime/Elixir, Storage/Node, Supavisor/Elixir) and the RLS request flow.
- **Corrected (hallucinations and inaccuracies):** Gemini named Envoy as the API gateway, but Supabase uses Kong. It also said services never communicate directly, that every service is stateless, and that all of Realtime reads the WAL. It was also outdated on the Auth service name and JWT verification.
- **Fixed in the generated code:** a realtime bug after logout and login, accessibility problems from positive tabindex values, and architecture text that repeated the AI's errors.
- **Customized:** character counter, friendlier validation messages, error handling for load and delete, and my own colors and styling.
- **Testing:** Jest unit tests for the validation logic (`npm test`) plus a manual QA checklist.