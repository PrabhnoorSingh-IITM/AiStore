/**
 * scripts/scrape-tools.ts
 *
 * Weekly web scraper: Discovers new AI tools from Futurepedia's open sitemap
 * and submits them to our /api/admin/tools endpoint.
 *
 * Targets: https://www.futurepedia.io (robots.txt compliant, public directory)
 * Trigger: GitHub Actions cron (weekly) or run manually:
 *   ADMIN_API_URL=https://your-site.com ADMIN_API_KEY=xxx npx tsx scripts/scrape-tools.ts
 */

import 'dotenv/config';
import { chromium, type Browser, type Page } from 'playwright';
import * as cheerio from 'cheerio';
import { z } from 'zod';

// ─── Configuration ────────────────────────────────────────────────────────────

const TARGET_URL  = process.env.SCRAPE_TARGET_URL  ?? 'https://www.futurepedia.io/ai-tools';
const ADMIN_API_URL = process.env.ADMIN_API_URL ?? 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? '';        // Supabase service-role JWT
const MAX_PAGES   = parseInt(process.env.SCRAPE_MAX_PAGES ?? '5', 10);  // Pages to crawl per run
const DELAY_MS    = 1500; // Polite delay between requests (ms)

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY is required. Set it in .env.local or as an env variable.');
  process.exit(1);
}

// ─── Zod Validation Schema ────────────────────────────────────────────────────

const ScrapedToolSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(5).max(3000), // Relaxed min length
  website_url: z.string().url().optional(),
  pricing_model: z.enum(['Free', 'Freemium', 'Paid', 'Usage_Based']).default('Free'),
  category_names: z.array(z.string().min(1).max(100)).min(1).max(5),
});

type ScrapedTool = z.infer<typeof ScrapedToolSchema>;

// ─── Slug Generator ───────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 200);
}

// ─── Category Inference (same keyword map as seed script) ─────────────────────

const CATEGORY_MAP: Array<{ name: string; keywords: string[] }> = [
  { name: 'Image Generation',      keywords: ['image gen', 'text-to-image', 'ai art', 'generate images', 'image synthesis'] },
  { name: 'Video Generation',      keywords: ['video gen', 'text-to-video', 'ai video', 'video creation', 'video clips'] },
  { name: 'Audio & Music',         keywords: ['music', 'audio', 'speech', 'voice', 'podcast', 'text-to-speech', 'sound', 'transcri'] },
  { name: 'Writing & Content',     keywords: ['writing', 'content creation', 'copywriting', 'blog', 'essay', 'seo content'] },
  { name: 'Code & Development',    keywords: ['coding', 'code', 'developer', 'programming', 'sql', 'debug', 'github', 'api'] },
  { name: 'Productivity',          keywords: ['productivity', 'task management', 'scheduling', 'workflow', 'meeting', 'notes'] },
  { name: 'Marketing & Ads',       keywords: ['marketing', 'advertising', 'ad copy', 'social media', 'campaign', 'brand'] },
  { name: 'Data & Analytics',      keywords: ['data analysis', 'analytics', 'dashboard', 'visualization', 'business intelligence'] },
  { name: 'Customer Support',      keywords: ['customer service', 'customer support', 'chatbot', 'helpdesk', 'live chat'] },
  { name: 'Research',              keywords: ['research', 'scientific', 'literature', 'academic', 'knowledge base'] },
  { name: 'Design & Creative',     keywords: ['design', 'logo', 'graphic', 'ui', 'figma', 'creative', 'illustration', 'avatar'] },
  { name: 'Education',             keywords: ['education', 'learning', 'tutoring', 'quiz', 'course', 'teaching'] },
  { name: 'Healthcare',            keywords: ['health', 'medical', 'clinical', 'therapy', 'mental health', 'fitness'] },
  { name: 'Finance',               keywords: ['finance', 'investment', 'trading', 'stock', 'crypto', 'banking', 'fintech'] },
  { name: 'Automation',            keywords: ['automate', 'automation', 'rpa', 'no-code', 'low-code', 'workflow automation'] },
  { name: 'General AI Tools',      keywords: [] },
];

function inferCategories(description: string): string[] {
  const lower = description.toLowerCase();
  const matched = CATEGORY_MAP.filter(
    (c) => c.keywords.length > 0 && c.keywords.some((kw) => lower.includes(kw))
  ).slice(0, 3);
  return matched.length ? matched.map((c) => c.name) : ['General AI Tools'];
}

function inferPricing(text: string): ScrapedTool['pricing_model'] {
  const lower = text.toLowerCase();
  if (lower.includes('free trial') || lower.includes('freemium'))  return 'Freemium';
  if (lower.includes('subscription') || lower.includes('$'))        return 'Paid';
  if (lower.includes('usage') || lower.includes('per api') || lower.includes('token')) return 'Usage_Based';
  return 'Free';
}

// ─── Scraper ─────────────────────────────────────────────────────────────────

async function scrapePage(page: Page, url: string): Promise<ScrapedTool[]> {
  console.log(`  🌐 Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for AI tool cards to load (Futurepedia uses React hydration)
  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {});

  const html = await page.content();
  const $ = cheerio.load(html);
  
  // DEBUG: Log first 2000 chars of main to find naming patterns
  console.log(`\n  🔬 DEBUG: <main> HTML (first 2000 chars):\n${$('main').html()?.substring(0, 2000)}\n`);

  const tools: ScrapedTool[] = [];

  // Refined selectors for Futurepedia tool cards
  const cardSelectors = [
    'div[class*="tool-card"]',
    'div[class*="ToolCard"]',
    'article',
    'div.group', 
    'div[class*="flex-col"]',
    '[data-testid*="tool"]',
  ];

  let cards = $([]);
  for (const sel of cardSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      console.log(`  🔍 Selection matched ${found.length} items using selector: "${sel}"`);
      cards = found;
      break;
    }
  }

  if (cards.length === 0) {
    console.warn(`  ⚠️  No tool cards found on ${url}`);
    return [];
  }

  cards.each((i, el) => {
    const card = $(el);
    
    // DEBUG: Log first card's HTML to help fix selectors
    if (i === 0) {
      console.log(`\n  🔬 DEBUG: Card #1 HTML (first 1000 chars):\n${card.toString().substring(0, 1000)}\n`);
    }

    // Try to find title in h2, h3, h4, or a bold span
    let name = card.find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
    if (!name && card.is('a') && card.attr('href')?.includes('/ai-tools/')) {
        // Fallback for compact cards: sometimes the name is just the text of the link or an aria-label
        name = card.attr('aria-label') || card.text().split('\n')[0].trim();
    }

    const description = card.find('p, [class*="desc"], [class*="description"], [class*="summary"]').first().text().trim();
    const rawHref     = card.attr('href') ?? card.find('a').first().attr('href') ?? '';
    const pricingText = card.find('[class*="price"], [class*="pricing"], [class*="badge"]').text().trim();

    if (!name || !description || name.length < 2 || description.length < 5) {
      return;
    }

    // Filter out common navigation items
    const navItems = ['AI Agents', 'Productivity Tools', 'Image Generators', 'All AI Categories', 'Dashboard'];
    if (navItems.includes(name)) return;

    const websiteUrl = rawHref.startsWith('http')
      ? rawHref
      : rawHref ? `https://www.futurepedia.io${rawHref}` : undefined;

    const rawTool = {
      name,
      description,
      website_url: websiteUrl,
      pricing_model: inferPricing(pricingText + ' ' + description),
      category_names: inferCategories(description),
    };

    const parsed = ScrapedToolSchema.safeParse(rawTool);
    if (!parsed.success) {
      if (i < 3) console.warn(`  ⚠️  Zod error for "${name}": ${parsed.error.issues[0].message}`);
      return;
    }

    tools.push(parsed.data);
  });

  return tools;
}

// ─── API Submission ───────────────────────────────────────────────────────────

async function submitTool(tool: ScrapedTool): Promise<{ ok: boolean; status: number }> {
  const slug = toSlug(tool.name);

  const payload = {
    name:          tool.name,
    slug,
    description:   tool.description,
    website_url:   tool.website_url ?? null,
    pricing_model: tool.pricing_model,
    // Map category names to an array the API expects
    category_names: tool.category_names,
  };

  try {
    const res = await fetch(`${ADMIN_API_URL}/api/admin/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    console.error(`  ❌ Network error submitting "${tool.name}": ${err.message}`);
    return { ok: false, status: 0 };
  }
}

// ─── Pagination Helper ────────────────────────────────────────────────────────

async function getNextPageUrl(page: Page, currentPage: number): Promise<string | null> {
  // Try to find a "Next page" button / pagination link
  const nextHref = await page.$eval(
    'a[aria-label="Next page"], a[rel="next"], [class*="pagination"] a:last-child',
    (el: HTMLAnchorElement) => el.href
  ).catch(() => null);

  if (nextHref) return nextHref;

  // Fallback: append ?page=N query param
  const url = new URL(TARGET_URL);
  url.searchParams.set('page', String(currentPage + 1));
  return url.toString();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 AI Store — Weekly Tool Scraper');
  console.log('===================================');
  console.log(`📡 Target  : ${TARGET_URL}`);
  console.log(`🚀 API     : ${ADMIN_API_URL}/api/admin/tools`);
  console.log(`📄 Max pages: ${MAX_PAGES}\n`);

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for GitHub Actions
  });

  const page: Page = await browser.newPage();

  // Respect robots.txt — identify as a legitimate bot
  await page.setExtraHTTPHeaders({
    'User-Agent': 'AiStoreBot/1.0 (+https://github.com/PrabhnoorSingh-IITM/AiStore)',
  });

  let currentUrl: string | null = TARGET_URL;
  let pageNum = 1;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const seen = new Set<string>(); // Deduplicate by slug within a run

  try {
    while (currentUrl && pageNum <= MAX_PAGES) {
      console.log(`\n── Page ${pageNum}/${MAX_PAGES} ──────────────────────────────`);
      const tools = await scrapePage(page, currentUrl);

      for (const tool of tools) {
        const slug = toSlug(tool.name);
        if (seen.has(slug)) { totalSkipped++; continue; }
        seen.add(slug);

        process.stdout.write(`  ↑ Submitting "${tool.name}"... `);
        const { ok, status } = await submitTool(tool);

        if (ok) {
          console.log('✅');
          totalInserted++;
        } else if (status === 409) {
          // 409 Conflict = already exists — not an error
          console.log('⏭️  (already exists)');
          totalSkipped++;
        } else {
          console.log(`❌ HTTP ${status}`);
          totalFailed++;
        }

        // Polite delay
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }

      // Advance to next page
      if (pageNum < MAX_PAGES) {
        currentUrl = await getNextPageUrl(page, pageNum);
      } else {
        currentUrl = null;
      }
      pageNum++;
    }
  } finally {
    await browser.close();
  }

  console.log('\n===================================');
  console.log('🏁 Scrape Complete!');
  console.log(`   ✅ Submitted : ${totalInserted}`);
  console.log(`   ⏭️  Skipped   : ${totalSkipped}`);
  console.log(`   ❌ Failed    : ${totalFailed}`);
  console.log('===================================\n');

  if (totalFailed > 0) process.exit(1); // Signal failure to GitHub Actions
}

main().catch((err) => {
  console.error('💥 Fatal scraper error:', err);
  process.exit(1);
});
