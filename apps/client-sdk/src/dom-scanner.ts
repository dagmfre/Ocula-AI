/**
 * DOM Scanner — Dynamic CSS Selector Extraction
 *
 * Walks the DOM tree to extract meaningful CSS selectors for every
 * interactive / semantically important element on the current page.
 * Sends the selector map to the server so the AI model always has
 * an accurate, up-to-date list of highlightable elements.
 *
 * Design goals:
 * - Prefer #id selectors (unique, stable)
 * - Fall back to [data-testid], [role], unique .class combos
 * - Attach human-readable labels from textContent, aria-label, placeholder, headings
 * - Filter noise: invisible elements, tiny elements, purely structural wrappers
 * - Group by semantic category for prompt readability
 */

// ── Types ────────────────────────────────────────────────────────────

export interface SelectorEntry {
  /** Optimal CSS selector for this element */
  selector: string;
  /** Human-readable label (e.g. "Search Bar", "New Deal Button") */
  label: string;
  /** Semantic category for grouping in the prompt */
  category: string;
}

export type SelectorMap = SelectorEntry[];

// ── Constants ────────────────────────────────────────────────────────

/** Minimum visible size (px) — skip elements smaller than this */
const MIN_SIZE = 20;

/** Maximum label text length */
const MAX_LABEL_LEN = 50;

/** Tags that are always interesting even without id/class */
const SEMANTIC_TAGS = new Set([
  'button', 'a', 'input', 'select', 'textarea', 'form',
  'table', 'thead', 'tbody', 'tr', 'th',
  'nav', 'aside', 'header', 'footer', 'main', 'section', 'article',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'dialog', 'details', 'summary',
]);

/** Classes that indicate structural noise (skip these) */
const NOISE_CLASSES = new Set([
  'container', 'wrapper', 'inner', 'outer', 'row', 'col',
  'flex', 'grid', 'block', 'inline', 'hidden', 'sr-only',
]);

/** Tags to always skip */
const SKIP_TAGS = new Set([
  'script', 'style', 'link', 'meta', 'br', 'hr', 'wbr',
  'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
  'g', 'defs', 'clippath', 'mask', 'use', 'symbol',
  'head', 'html',
]);

/** Category inference keywords */
const CATEGORY_RULES: [RegExp, string][] = [
  [/nav|sidebar|menu|breadcrumb/i, 'Navigation'],
  [/btn|button|cta|action|submit/i, 'Buttons'],
  [/input|search|filter|text|email|password|textarea|select/i, 'Inputs'],
  [/card|stat|metric|kpi|widget/i, 'Cards'],
  [/table|grid|list|row|tbody|thead/i, 'Tables'],
  [/chart|graph|plot|canvas/i, 'Charts'],
  [/form|fieldset/i, 'Forms'],
  [/header|top-bar|toolbar/i, 'Header'],
  [/footer|bottom/i, 'Footer'],
  [/modal|dialog|popup|overlay|drawer/i, 'Modals'],
  [/tab|pill|toggle|switch/i, 'Tabs'],
  [/badge|tag|chip|label|alert|notice/i, 'Badges'],
  [/avatar|profile|user/i, 'Profile'],
  [/link|anchor|href/i, 'Links'],
  [/heading|title|h[1-6]/i, 'Headings'],
  [/image|img|icon|logo/i, 'Media'],
];

// ── Helpers ──────────────────────────────────────────────────────────

/** Check if an element is visible and has a meaningful size */
function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width >= MIN_SIZE && rect.height >= MIN_SIZE;
}

/** Check if element is inside the Ocula overlay/widget (skip our own UI) */
function isOculaInternal(el: Element): boolean {
  return !!(
    el.closest('#ocula-overlay') ||
    el.closest('#ocula-widget') ||
    el.closest('[id^="ocula-"]') ||
    el.id?.startsWith('ocula-')
  );
}

/** Generate the best CSS selector for an element */
function buildSelector(el: Element): string | null {
  // 1. Prefer ID (if unique in the document)
  if (el.id && !el.id.startsWith('ocula-')) {
    const id = `#${CSS.escape(el.id)}`;
    if (document.querySelectorAll(id).length === 1) return id;
  }

  // 2. data-testid
  const testId = el.getAttribute('data-testid') || el.getAttribute('data-test-id');
  if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

  // 3. Unique class combination
  const classes = Array.from(el.classList).filter(
    c => !NOISE_CLASSES.has(c.toLowerCase()) && !c.startsWith('ocula')
  );

  if (classes.length > 0) {
    // Try single class first
    for (const cls of classes) {
      const sel = `.${CSS.escape(cls)}`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }

    // Try tag + class combo
    const tag = el.tagName.toLowerCase();
    for (const cls of classes) {
      const sel = `${tag}.${CSS.escape(cls)}`;
      if (document.querySelectorAll(sel).length === 1) return sel;
    }

    // Try parent context: .parent-class > .child-class
    const parent = el.parentElement;
    if (parent) {
      const parentClasses = Array.from(parent.classList).filter(
        c => !NOISE_CLASSES.has(c.toLowerCase()) && !c.startsWith('ocula')
      );
      for (const pc of parentClasses) {
        for (const cc of classes) {
          const sel = `.${CSS.escape(pc)} > .${CSS.escape(cc)}`;
          try {
            if (document.querySelectorAll(sel).length === 1) return sel;
          } catch { /* invalid selector */ }
        }
      }
    }

    // Fallback: first meaningful class (may match multiple)
    return `.${CSS.escape(classes[0])}`;
  }

  // 4. Role attribute
  const role = el.getAttribute('role');
  if (role) {
    const sel = `[role="${CSS.escape(role)}"]`;
    if (document.querySelectorAll(sel).length === 1) return sel;
  }

  // 5. Tag + nth-child for semantic tags
  const tag = el.tagName.toLowerCase();
  if (SEMANTIC_TAGS.has(tag) && el.parentElement) {
    const siblings = Array.from(el.parentElement.children).filter(
      s => s.tagName === el.tagName
    );
    if (siblings.length === 1) {
      const parentSel = buildSelector(el.parentElement);
      if (parentSel) return `${parentSel} > ${tag}`;
    }
  }

  return null;
}

/** Extract a human-readable label from an element */
function extractLabel(el: Element): string {
  // aria-label first
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return truncate(ariaLabel);

  // title attribute
  const title = el.getAttribute('title');
  if (title) return truncate(title);

  // placeholder for inputs
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.placeholder) return truncate(el.placeholder);
  }

  // Button / link text content
  const tag = el.tagName.toLowerCase();
  if (tag === 'button' || tag === 'a' || tag.match(/^h[1-6]$/)) {
    const text = (el.textContent || '').trim();
    if (text && text.length <= MAX_LABEL_LEN) return text;
    if (text) return truncate(text);
  }

  // First heading child
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const text = (heading.textContent || '').trim();
    if (text) return truncate(text);
  }

  // Card header text
  const cardHeader = el.querySelector('.card-header, .card-title, [class*="header"]');
  if (cardHeader) {
    const text = (cardHeader.textContent || '').trim();
    if (text) return truncate(text);
  }

  // Class-derived label: .stat-card → "Stat Card"
  const classes = Array.from(el.classList).filter(
    c => !NOISE_CLASSES.has(c.toLowerCase()) && !c.startsWith('ocula')
  );
  if (classes.length > 0) {
    return classes[0]
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  // Tag name as last resort
  return tag.toUpperCase();
}

function truncate(s: string): string {
  const cleaned = s.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= MAX_LABEL_LEN) return cleaned;
  return cleaned.slice(0, MAX_LABEL_LEN - 1) + '…';
}

/** Infer a semantic category for the element */
function inferCategory(el: Element, selector: string, label: string): string {
  const haystack = `${el.tagName} ${selector} ${label} ${Array.from(el.classList).join(' ')}`;
  for (const [pattern, cat] of CATEGORY_RULES) {
    if (pattern.test(haystack)) return cat;
  }
  return 'Other';
}

/** Check if this element is "interesting" enough to include */
function isInteresting(el: Element): boolean {
  const tag = el.tagName.toLowerCase();

  // Always skip certain tags
  if (SKIP_TAGS.has(tag)) return false;

  // Always include semantic tags
  if (SEMANTIC_TAGS.has(tag)) return true;

  // Include if has a meaningful id
  if (el.id && !el.id.startsWith('ocula-')) return true;

  // Include if has data-testid
  if (el.getAttribute('data-testid') || el.getAttribute('data-test-id')) return true;

  // Include if has role
  if (el.getAttribute('role')) return true;

  // Include if has semantic classes (card, stat, badge, chart, etc.)
  const classes = Array.from(el.classList);
  const hasSemanticClass = classes.some(c => {
    const lower = c.toLowerCase();
    return (
      !NOISE_CLASSES.has(lower) &&
      !lower.startsWith('ocula') &&
      /card|stat|badge|chart|table|form|modal|dialog|tab|panel|menu|alert|toast|header|footer|nav|btn|button|input|pill|plan|invoice|payment|toggle|section|feed|grid|column/.test(lower)
    );
  });
  if (hasSemanticClass) return true;

  // Include divs with very few children that look like components
  if (tag === 'div' && classes.length > 0) {
    const nonNoiseClasses = classes.filter(
      c => !NOISE_CLASSES.has(c.toLowerCase()) && !c.startsWith('ocula')
    );
    if (nonNoiseClasses.length > 0 && el.children.length <= 10) {
      // Heuristic: if it has a meaningful single-word class, it's probably a component
      return nonNoiseClasses.some(c => c.includes('-') || c.includes('_') || /[A-Z]/.test(c));
    }
  }

  return false;
}

// ── Main Scanner ─────────────────────────────────────────────────────

/**
 * Scan the entire DOM and extract a map of meaningful CSS selectors.
 *
 * Returns a deduplicated, categorized list of selector entries
 * suitable for injection into the AI model's system prompt.
 */
export function scanDOM(): SelectorMap {
  const results: SelectorMap = [];
  const seenSelectors = new Set<string>();

  const allElements = document.querySelectorAll('*');

  for (const el of allElements) {
    // Skip Ocula's own elements
    if (isOculaInternal(el)) continue;

    // Skip uninteresting elements
    if (!isInteresting(el)) continue;

    // Skip invisible / tiny elements
    if (!isVisible(el)) continue;

    // Build the selector
    const selector = buildSelector(el);
    if (!selector) continue;

    // Deduplicate
    if (seenSelectors.has(selector)) continue;
    seenSelectors.add(selector);

    // Extract label and category
    const label = extractLabel(el);
    const category = inferCategory(el, selector, label);

    results.push({ selector, label, category });
  }

  console.log(`[Ocula] DOM scan found ${results.length} elements`);
  return results;
}

// ── Mutation Observer ────────────────────────────────────────────────

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let onChangeCallback: ((map: SelectorMap) => void) | null = null;

/**
 * Start watching the DOM for structural changes.
 * When significant mutations occur, re-scans and invokes the callback.
 */
export function startDOMWatcher(onChange: (map: SelectorMap) => void): void {
  stopDOMWatcher();
  onChangeCallback = onChange;

  // Watch for navigation events (SPA page changes)
  window.addEventListener('popstate', handleNavChange);
  window.addEventListener('hashchange', handleNavChange);

  // MutationObserver for DOM structural changes
  observer = new MutationObserver((mutations) => {
    // Count significant mutations (added/removed nodes, not just text/attr changes)
    let significantChanges = 0;
    for (const m of mutations) {
      if (m.type === 'childList' && (m.addedNodes.length + m.removedNodes.length) > 0) {
        significantChanges += m.addedNodes.length + m.removedNodes.length;
      }
    }

    // Only re-scan if enough DOM nodes changed (threshold: 5+)
    if (significantChanges >= 5) {
      debouncedRescan();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[Ocula] DOM watcher started');
}

/** Stop the DOM watcher */
export function stopDOMWatcher(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  window.removeEventListener('popstate', handleNavChange);
  window.removeEventListener('hashchange', handleNavChange);
  onChangeCallback = null;
  console.log('[Ocula] DOM watcher stopped');
}

function handleNavChange(): void {
  // On navigation, wait a tick for the new DOM to render, then rescan
  setTimeout(() => {
    const map = scanDOM();
    onChangeCallback?.(map);
  }, 300);
}

function debouncedRescan(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const map = scanDOM();
    onChangeCallback?.(map);
  }, 500);
}
