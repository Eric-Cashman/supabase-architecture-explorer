1. Realtime breaks after logging out and back in (real bug).
In updateAuthState, the logout branch removes the channel but never resets the variable, so setupRealtime() returns early on the next login and live updates stop. Fix:

js
if (realtimeChannel) {
  supabase.removeChannel(realtimeChannel);
  realtimeChannel = null;
}

2. Positive tabindex values (1, 2, 3...) hurt accessibility.
Positive values override the natural tab order, which accessibility tools flag. The AI claimed they give “sensible tab order”, but the browser’s natural order already does. Remove every tabindex attribute. The tabindex="9" on the <ul> and the tabindex="0" on buttons are also unnecessary. This matters for your Lighthouse check.

3. The AI repeated its own earlier errors in the architecture tab.

Auth (GoTrue) is outdated naming, from your fact-check row 8. Change it to “Supabase Auth (formerly GoTrue)”.
The Realtime description says it listens to the WAL, which is oversimplified (your row 5). Say that Postgres Changes uses the WAL, while Broadcast and Presence don’t.

# Customization Log

## 1. Architecture node background color
**File:** src/style.css (`.arch-node`)
**AI output:** `background: #333;`
**My change:** `background: #323030;`
**Why:** (e.g., a slightly warmer gray so the diagram nodes stand out from the panel behind them)

## 2. Note timestamp size
**File:** src/style.css (`.note-date`)
**AI output:** `font-size: 0.8rem;`
**My change:** `font-size: 0.7rem;`
**Why:** (e.g., make the timestamp less prominent than the note text)

## 3. Note card background color
**File:** src/style.css (`#notes-list li`)
**AI output:** `background: #2a2a2a;`
**My change:** `background: #343333;`
**Why:** (e.g., more contrast between note cards and the page background)

## 4. Realtime channel not reset after logout (bug fix)
**File:** src/main.js (`updateAuthState`)
**AI output:** removed the channel on logout but never reset `realtimeChannel`, so `setupRealtime()` skipped creating a new one after re-login.
**My change:** set `realtimeChannel = null` after `removeChannel`.
**Why:** Without it, live updates stop after logging back in.