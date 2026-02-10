## Plan: Dynamic DOM Extraction & Seamless Visual Guidance

**TL;DR**: The current system has only 10 hardcoded CSS selectors for the Dashboard page, no dynamic DOM discovery, no smooth transition between highlights, and no synchronization between voice and visuals. This plan replaces the static `UI_SELECTORS` map with a client-side DOM scraper that extracts every meaningful selector on the current page, adds a `highlight_sequence` tool for multi-element walkthroughs with staggered timing, redesigns the highlight CSS for smooth crossfade transitions, rewrites the system prompt to eliminate meta-commentary, and ensures the AI never references its knowledge base sources.

**Steps**

### Phase 1: Client-Side DOM Selector Extraction

1. **Create a new `dom-scanner.ts` module** in apps/client-sdk/src/ that exports a `scanDOM()` function. This function will:
   - Walk the DOM tree (`document.querySelectorAll('*')`) filtering for meaningful UI elements (elements with `id`, semantic class names, `data-*` attributes, `role` attributes, buttons, inputs, links, headings, tables, cards, forms)
   - For each element, generate an optimal CSS selector (prefer `#id`, then `[data-testid]`, then unique `.class-name`, then `.parent > .child` combos)
   - Attach a human-readable label derived from: `textContent` (truncated), `aria-label`, `title`, `placeholder`, heading content, or tag semantics
   - Group selectors by semantic category (navigation, forms, cards, tables, buttons, inputs, stats, charts)
   - Return a `SelectorMap` object: `Record<string, { selector: string; label: string; category: string; boundingRect: DOMRect }>`
   - Deduplicate and filter noise (skip invisible elements, elements < 20px, purely structural wrappers)

2. **Hook `scanDOM()` into the page lifecycle** in apps/client-sdk/src/index.ts:
   - Run `scanDOM()` on initial connection after screen share starts
   - Re-scan on navigation (detect via `MutationObserver` on `<body>` + `popstate`/`hashchange` events)  
   - Re-scan debounced (500ms) when DOM mutations exceed a threshold (e.g., 10+ added/removed nodes)
   - Send the extracted selector map to the server via a new `{ type: 'selector_map', selectors: SelectorMap }` WebSocket message

3. **Server receives and caches the selector map** in apps/server/src/index.ts:
   - Store in `SessionState` as `currentSelectors: SelectorMap`
   - When the selector map updates, dynamically rebuild the relevant portion of the Live API context by calling `session.send()` with an updated text part listing all available selectors
   - Replace the static `UI_SELECTORS` from apps/server/src/gemini/live.ts with the dynamic map

### Phase 2: Smooth Multi-Element Highlight Sequencing

4. **Add `highlight_sequence` tool** to apps/server/src/gemini/live.ts `LIVE_OVERLAY_TOOLS` and apps/server/src/agents/tools.ts:
   - Parameters: `steps: Array<{ selector: string; label: string; delay_ms?: number }>` — an ordered list of elements to highlight one-by-one
   - The server sends a single `{ type: 'highlight_sequence', steps: [...] }` message to the client
   - This is the primary tool for any walkthrough or contextual guidance (billing process, creating a deal, etc.)

5. **Implement sequence playback in the client** in apps/client-sdk/src/overlay.ts:
   - New method `playHighlightSequence(steps, onStepStart?)`:
     - For each step: fade out the previous highlight (300ms crossfade), then fade in the next (400ms)
     - Use CSS `@keyframes ocula-hl-fadeout` (opacity 1→0, scale 1→0.98) on both the element's `.ocula-hl-active` class and its label
     - After fadeout completes, remove the old highlight, apply the new one with the existing fadein animation
     - Default inter-step delay: 2500ms (configurable per step via `delay_ms`) — timed to match the AI's spoken sentence length
     - Expose a `cancelSequence()` method and auto-cancel on new user input

6. **Handle in connection layer** — Add `case 'highlight_sequence'` to apps/client-sdk/src/connection.ts `handleMessage()` and route through to `handleVisualCommand()` in apps/client-sdk/src/index.ts

### Phase 3: Smooth Crossfade Transition CSS

7. **Redesign the highlight CSS** in the `injectHighlightStyles()` method of apps/client-sdk/src/overlay.ts:
   - **Add fadeout keyframe**: `@keyframes ocula-hl-fadeout { from { opacity: 1; } to { opacity: 0; transform: scale(0.98); } }`
   - **Add `.ocula-hl-exiting` class**: applies `ocula-hl-fadeout 0.3s ease-out forwards`, removes pulse/border-flow animations
   - **Refine the pulse animation**: reduce intensity — use softer box-shadow values (cap outer ring at 25px instead of 60px) for a more professional, less "flashy" feel
   - **Soften border colors**: shift from vivid `rgba(124, 92, 252, 0.9)` to a calmer `rgba(124, 92, 252, 0.6)` base with gentler pulsing
   - **Label improvements**: add `transition: opacity 0.3s, transform 0.3s` to `.ocula-hl-label` for smooth repositioning; reduce the `✦` prefix size; add a subtle directional arrow (`▾`) pointing toward the highlighted element
   - **Ensure no layout shifts**: use `outline` only (no `border` changes), preserve `box-sizing`

8. **Update `clearHighlight()` in apps/client-sdk/src/overlay.ts** to apply the fadeout class first, then remove after animation completes (300ms timeout), instead of the current instant removal

### Phase 4: Voice-Visual Synchronization

9. **Redesign `handleLiveToolCall()` in apps/server/src/index.ts** for sequenced highlights:
   - When `highlight_sequence` is called, immediately send the entire sequence to the client so it can begin playing
   - The client starts the first highlight instantly (zero delay from tool call to first visual)
   - The model's voice naturally paces alongside — by default the 2500ms inter-step delay aligns with a typical 2-sentence spoken description per element
   - For single `highlight_element` calls: always send `clear` first (auto-clear before apply), then the highlight — this is a 2-message atomic clear-and-highlight to avoid the model needing to remember to call `clear_overlays` separately

10. **Auto-clear on `highlight_element`** — modify the server's `handleLiveToolCall` case for `highlight_element` to always emit a `{ type: 'clear' }` immediately before `{ type: 'draw' }`, removing the need for the model to call `clear_overlays()` explicitly. This eliminates a common source of stale highlights.

### Phase 5: System Prompt Rewrites (No Meta-Commentary)

11. **Rewrite the Live API system prompt** in apps/server/src/index.ts `initializeLiveSession()` (around line 216):
    - Remove all instructions that say "ALWAYS call clear_overlays() BEFORE" — the server now handles auto-clearing
    - Replace TOOL USAGE rules with:
      ```
      VISUAL GUIDANCE RULES:
      - Call highlight_element or highlight_sequence and SIMULTANEOUSLY speak your guidance.
      - NEVER say "I'm highlighting", "let me show you", "I've highlighted", "as you can see I'm pointing to" — the user already sees the highlight. Just describe the element and what to do with it.
      - NEVER mention tools, selectors, overlays, or any internal mechanism.
      - Speak as if the user is naturally looking at a glowing element — describe what IT is and what to do, not that you're showing it.
      - NEVER describe what you see verbatim from any provided documentation. Speak naturally about what's ON the screen.
      ```
    - Replace CONVERSATION STYLE with:
      ```
      VOICE STYLE:
      - Speak naturally, like a knowledgeable colleague sitting next to the user.
      - One concept per highlight. Move to the next element when the user is ready.
      - Do NOT enumerate steps out loud ("Step 1, Step 2...") — just guide fluidly.
      - If asked about a process (e.g., "What's the billing process?"), use highlight_sequence to walk through each relevant element while explaining each one.
      - NEVER reference "documentation", "knowledge base", "our records", or "according to the system". Everything you say should sound like personal expertise.
      ```

12. **Rewrite the LangChain agent prompt** in apps/server/src/agents/agent.ts (around line 25) with matching rules — ensure the text-path agent also never references knowledge sources, never mentions tool mechanics, and uses `highlight_element` with the dynamic selector map.

13. **Inject dynamic selectors into the prompt** — Replace the static `KNOWN UI SELECTORS` block:
    - When `selector_map` arrives from the client, format it as a concise list grouped by category: `"Navigation: Sidebar (#sidebar-root), Dashboard Link (.sidebar-nav a:nth-child(1)), ..."`
    - Update the prompt dynamically using `session.send({ text: "UPDATED AVAILABLE SELECTORS:\n..." })` so the model always has the current page's selectors

### Phase 6: Knowledge Base Reference Suppression

14. **Modify the `search_knowledge` tool response** in `handleLiveToolCall()` apps/server/src/index.ts — prepend the knowledge result with:
    ```
    "[INTERNAL CONTEXT — Do NOT quote, cite, or reference this source. Use this information to guide the user naturally without revealing where this information comes from. Never say 'according to documentation' or similar phrases.]"
    ```

15. **Add a response filter** — after receiving text from the Live API's `onText` callback, scan for blacklisted phrases (`"according to the documentation"`, `"the knowledge base"`, `"our records show"`, `"based on the system"`, `"I'm highlighting"`, `"let me highlight"`, `"I've pointed"`) and strip them before forwarding to the client. This is a safety net beyond prompt instructions.

### Phase 7: Cleanup & Polish

16. **Remove legacy SVG overlay code** from apps/client-sdk/src/overlay.ts — delete the ~400 lines of unused SVG drawing methods (`drawRipplePulse`, `drawGlassLabel`, `findAnchorElement`, etc.) to reduce bundle size and complexity.

17. **Remove `clear_overlays` from the Live API tools** in apps/server/src/gemini/live.ts — since auto-clear is built into the server, the model no longer needs this tool. Fewer tools = fewer wrong choices.

18. **Add auto-timeout for highlights** in apps/client-sdk/src/overlay.ts — if no new highlight arrives within 15 seconds, auto-fadeout the current highlight to avoid stale visuals lingering on screen.

**Verification**

- **Manual test 1**: Open the mock CRM billing page, share screen, and ask "What's the billing process?" — verify: (a) AI highlights Current Plan card → Plan cards → Payment Method → Invoices one-by-one, (b) each transition has a smooth crossfade, (c) voice describes each element naturally without saying "I'm highlighting"
- **Manual test 2**: Navigate from Dashboard to Contacts while connected — verify the selector map auto-updates and the AI can highlight Contacts-specific elements (Import button, Add Contact button, Filter, etc.)
- **Manual test 3**: Ask "How do I export a report?" and verify the AI never says "according to the documentation" or "the knowledge base says"
- **Console check**: Verify `[Ocula] Selector map sent` log appears on connection + page navigation, and `[Server] Received selector_map with N selectors` on server side
- **Visual QA**: Screenshot each highlight state and verify: soft purple glow (not flashy), glassmorphism label positioned correctly, fadeout is smooth 300ms, fadein is smooth 400ms

**Decisions**

- **Dynamic DOM extraction over expanded hardcoded map**: Chose runtime scanning because it works on ANY platform (not just the mock CRM), aligning with the B2B embeddable widget vision. Hardcoding selectors for every page doesn't scale.
- **highlight_sequence as a first-class tool over chained highlight_element calls**: A sequence tool gives the model one decision point and lets the client control timing/animation, rather than relying on the model to pace individual tool calls alongside speech.
- **Auto-clear before highlight over explicit clear_overlays tool**: Removes a common failure mode where the model forgets to clear, and reduces tool count from 3→2 (fewer tools = better model accuracy).
- **Server-side response filter as safety net**: Prompt-only approaches can leak; a text filter catches edge cases where the model slips into meta-commentary despite instructions.