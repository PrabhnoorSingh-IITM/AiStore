/**
 * scripts/seed-tools.ts
 *
 * Seeding script using Supabase JS client.
 * Bypasses Prisma connection issues and RLS for initial seeding.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: ENV_PATH });

const BATCH_SIZE = 50;
const CSV_PATH = path.resolve(process.cwd(), 'data/data.csv');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Category Inference logic
const CATEGORY_KEYWORDS: Array<{ name: string; slug: string; keywords: string[] }> = [
  { name: 'Language Model', slug: 'language-model', keywords: ['llm', 'gpt', 'language model', 'text generation', 'chat'] },
  { name: 'Image Generation', slug: 'image-generation', keywords: ['image gen', 'text-to-image', 'ai art', 'generate images'] },
  { name: 'Video Generation', slug: 'video-generation', keywords: ['video generation', 'text-to-video', 'ai video'] },
  { name: 'Audio & Music', slug: 'audio-music', keywords: ['music', 'audio', 'speech', 'voice', 'podcast'] },
  { name: 'Writing & Content', slug: 'writing-content', keywords: ['writing', 'content creation', 'copywriting', 'blog'] },
  { name: 'Code & Development', slug: 'code-development', keywords: ['coding', 'code', 'developer', 'programming'] },
  { name: 'Productivity', slug: 'productivity', keywords: ['productivity', 'work', 'automation'] },
  { name: 'Marketing & Ads', slug: 'marketing-ads', keywords: ['marketing', 'advertising', 'ads'] },
  { name: 'Data & Analytics', slug: 'data-analytics', keywords: ['data', 'analytics', 'dashboard', 'visualization'] },
  { name: 'General AI Tools', slug: 'general-ai', keywords: [] },
];

function inferCategories(description: string) {
  const lower = (description || '').toLowerCase();
  const matched = CATEGORY_KEYWORDS.filter(c => c.slug !== 'general-ai' && c.keywords.some(kw => lower.includes(kw)));
  return matched.length ? matched.slice(0, 3) : [CATEGORY_KEYWORDS.find(c => c.slug === 'general-ai')!];
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 200);
}

async function getOrCreateCategory(cat: { name: string; slug: string }) {
  const { data, error } = await supabase
    .from('categories')
    .upsert({ name: cat.name, slug: cat.slug, description: `AI tools in the ${cat.name} category.` }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) {
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();
    if (existing) return existing.id;
    throw error;
  }
  return data.id;
}

async function main() {
  console.log('🌱 AI Store — Seeding via Supabase JS Client');
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`✅ Parsed ${rows.length} rows.`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    console.log(`🔄 Batch ${Math.floor(i/BATCH_SIZE) + 1}...`);

    for (const row of chunk) {
      const name = row.Title?.trim();
      const description = row.Description?.trim();
      if (!name) continue;

      const slug = toSlug(name);
      const inferred = inferCategories(description || '');

      try {
        const catIds = await Promise.all(inferred.map(c => getOrCreateCategory(c)));

        const { data: tool, error: toolError } = await supabase
          .from('tools')
          .upsert({ 
              name, 
              slug, 
              description, 
              website_url: row.Website || null, 
              pricing_model: 'Free' 
          }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (toolError) {
          console.error(`  ❌ Error for "${name}":`, toolError.message);
          continue;
        }

        await Promise.all(catIds.map(catId => 
          supabase.from('tool_categories').upsert({ tool_id: tool.id, category_id: catId }, { onConflict: 'tool_id,category_id' })
        ));
      } catch (e: any) {
        console.error(`  ❌ Failed "${name}": ${e.message}`);
      }
    }
  }

  console.log('\n🏁 Seeding Complete!');
}

main().catch(console.error);
