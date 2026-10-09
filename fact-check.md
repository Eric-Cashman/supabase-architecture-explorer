# Fact-Check: Gemini's Supabase Architecture Breakdown

**Final architectural style (my label):**
A suite of loosely coupled, open-source services built around a shared PostgreSQL database, fronted by a Kong API gateway.

**Method:** I compared each claim in Entry 1 of ai-log.md against Supabase's official documentation and source repositories.

| # | Gemini's claim | Verdict | What the source says | Source |
|---|---|---|---|---|
| 1 | API gateway is Envoy (C++) | Incorrect | Supabase's architecture page lists Kong, built on NGINX. Kong is written in Lua, not C++. | https://supabase.com/docs/guides/getting-started/architecture |
| 2 | Style is "database-centric microservices" | Correct | Supabase describes Postgres as its core, with separate tools that can work independently and integrate through APIs and webhooks. The label fits this design, but it is not an official term used on the page. | https://supabase.com/docs/guides/getting-started/architectureDO |
| 3 | Services never communicate directly | Incorrect | Services can work independently, but they also integrate through APIs and webhooks. “Works in isolation” does not mean “never communicates.” | https://supabase.com/docs/guides/getting-started/architecture|
| 4 | Every service is stateless | Incorrect | Realtime stores users’ Presence state in memory and shares it across its nodes. This shows that not every service is stateless. | https://supabase.com/docs/guides/realtime/architecture |
| 5 | Realtime reads the WAL for all features | Incorrect | Postgres Changes and Broadcast from the database use the WAL. Client Broadcast sends messages through channels, while Presence tracks users in memory. So, not all Realtime features use the WAL. | https://supabase.com/docs/guides/realtime |
| 6 | PostgREST verifies JWT with a shared secret | Partially Correct | PostgREST can verify JWTs using a shared secret or public keys. A shared secret applies to the legacy setup, but newer setups also support asymmetric keys. | https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys |
| 7 | PostgREST uses Supavisor's pool | Incorrect | PostgREST connects to Postgres using its own internal connection pool rather than Supavisor’s pool. | https://github.com/orgs/supabase/discussions/21566 |
| 8 | Auth service is called GoTrue | Partially Correct | The service is now called Supabase Auth. It was originally based on Netlify’s GoTrue, and its settings still use the GOTRUE_ prefix. | https://github.com/supabase/auth |
| 9 | Edge Functions are TypeScript/Rust | Correct | Edge Functions are written in TypeScript. The Edge Runtime that runs them is written in Rust and uses Deno. | https://supabase.com/docs/guides/functions & https://supabase.com/blog/edge-runtime-self-hosted-deno-functions |

**Claims verified as correct:** PostgREST (Haskell), Realtime (Elixir), Storage (Node/TypeScript), Supavisor (Elixir), postgres-meta (TypeScript), Postgres as the single data store, and the SET LOCAL role plus request.jwt.claims mechanism.

**Summary:** Gemini got most of the component list right but was wrong about the API gateway, and it overstated how isolated and stateless the services are.