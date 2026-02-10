/**
 * Knowledge Base - Demo knowledge lookup
 * 
 * Provides keyword-based search over the hardcoded Acme CRM
 * knowledge base. In production, this would be replaced with
 * a vector store or API call to the host SaaS platform's docs.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Knowledge section parsed from demo.md */
interface KnowledgeSection {
  title: string;
  content: string;
  keywords: string[];
}

/** Knowledge search result */
export interface KnowledgeResult {
  found: boolean;
  sections: Array<{
    title: string;
    content: string;
    relevance: number;
  }>;
  summary: string;
}

// Cache parsed knowledge base
let knowledgeCache: KnowledgeSection[] | null = null;

/**
 * Load and parse the demo knowledge base
 */
function loadKnowledge(): KnowledgeSection[] {
  if (knowledgeCache) return knowledgeCache;

  try {
    const mdPath = join(__dirname, 'demo.md');
    const raw = readFileSync(mdPath, 'utf-8');
    knowledgeCache = parseMarkdownSections(raw);
    console.log(`[Knowledge] Loaded ${knowledgeCache.length} sections from demo.md`);
    return knowledgeCache;
  } catch (error) {
    console.error('[Knowledge] Failed to load demo.md:', error);
    return [];
  }
}

/**
 * Parse markdown into searchable sections
 */
function parseMarkdownSections(markdown: string): KnowledgeSection[] {
  const sections: KnowledgeSection[] = [];
  const lines = markdown.split('\n');
  
  let currentTitle = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    // Match ## or ### headings as section boundaries
    const headingMatch = line.match(/^#{2,3}\s+(.+)/);
    
    if (headingMatch) {
      // Save previous section
      if (currentTitle && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        sections.push({
          title: currentTitle,
          content,
          keywords: extractKeywords(currentTitle + ' ' + content),
        });
      }
      
      currentTitle = headingMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentTitle && currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    sections.push({
      title: currentTitle,
      content,
      keywords: extractKeywords(currentTitle + ' ' + content),
    });
  }

  return sections;
}

/**
 * Extract searchable keywords from text
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter((word, index, arr) => arr.indexOf(word) === index); // unique
}

/**
 * Search the knowledge base
 * 
 * Uses simple keyword matching for MVP.
 * Returns top matching sections ranked by relevance score.
 */
export async function lookupKnowledge(query: string): Promise<KnowledgeResult> {
  const sections = loadKnowledge();
  
  if (sections.length === 0) {
    return {
      found: false,
      sections: [],
      summary: 'Knowledge base is not available.',
    };
  }

  const queryKeywords = extractKeywords(query);
  
  // Score each section by keyword overlap
  const scored = sections.map(section => {
    let score = 0;
    
    for (const queryWord of queryKeywords) {
      // Exact keyword match
      if (section.keywords.includes(queryWord)) {
        score += 2;
      }
      
      // Partial match in title (higher weight)
      if (section.title.toLowerCase().includes(queryWord)) {
        score += 3;
      }
      
      // Partial match in content
      if (section.content.toLowerCase().includes(queryWord)) {
        score += 1;
      }
    }
    
    return { section, score };
  });

  // Filter and sort by relevance
  const results = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 results
    .map(s => ({
      title: s.section.title,
      content: s.section.content,
      relevance: s.score,
    }));

  if (results.length === 0) {
    return {
      found: false,
      sections: [],
      summary: `No knowledge base articles found for: "${query}". Try searching for specific features like "contacts", "deals", "reports", "billing", or "settings".`,
    };
  }

  return {
    found: true,
    sections: results,
    summary: `Found ${results.length} relevant article(s): ${results.map(r => r.title).join(', ')}`,
  };
}

export default lookupKnowledge;
