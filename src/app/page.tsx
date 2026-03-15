import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import ToolFilters from '@/src/components/ToolFilters';
import ToolCard from '@/src/components/ToolCard';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  category?: string;
  pricing?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { search, category, pricing } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch Categories
  let categoriesQuery = supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');
  
  const { data: categories = [] } = await categoriesQuery;

  // 2. Fetch Tools with filters
  let toolsQuery = supabase
    .from('tools')
    .select(`
      id, 
      name, 
      slug, 
      description, 
      pricing_model, 
      website_url, 
      overall_score,
      categories:tool_categories(
        category:categories(id, name, slug)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(40);

  if (category && category !== 'all') {
    // Filter by category slug in the join table
    toolsQuery = toolsQuery.filter('tool_categories.category.slug', 'eq', category);
  }

  if (search) {
    toolsQuery = toolsQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (pricing && pricing !== 'all') {
    toolsQuery = toolsQuery.eq('pricing_model', pricing);
  }

  const { data: tools = [] } = await toolsQuery;

  // Flatten categories for ToolCard
  const formattedTools = (tools || []).map((t: any) => ({
    ...t,
    categories: t.categories.map((tc: any) => tc.category).filter(Boolean),
  }));

  // Client-side filtering fallback for category join (Supabase complex filter can be tricky)
  const filteredTools = (category && category !== 'all') 
    ? formattedTools.filter((t: any) => t.categories.some((c: any) => c.slug === category))
    : formattedTools;

  return (
    <>
      <Navbar />

      <header style={{ padding: '6rem 1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="glow-blur" />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <span className="badge" style={{ marginBottom: '1.5rem' }}>The AI Directory for Builders</span>
          <h1 className="text-gradient" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
            Discover the Future.<br />Master the Tools.
          </h1>
          <p style={{ fontSize: '1.125rem', maxWidth: '42rem', margin: '0 auto', color: 'var(--slate-400)' }}>
            The world&apos;s most curated directory of AI tools. Filter by capability, explore deep-dive performance tutorials, and optimize your API costs.
          </p>
        </div>
      </header>

      <main className="container" id="directory" style={{ paddingBottom: '6rem' }}>
        <ToolFilters categories={categories as any || []} />

        <div className="tools-grid">
          {filteredTools.map((tool: any) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}

          {filteredTools.length === 0 && (
            <div style={{ 
              gridColumn: '1/-1', 
              textAlign: 'center', 
              padding: '6rem 2rem', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '24px',
              border: '1px dashed var(--slate-800)'
            }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>No tools matched your search</h3>
              <p style={{ color: 'var(--slate-500)' }}>Try adjusting your keywords or selected categories.</p>
              <Link href="/" style={{ display: 'inline-block', marginTop: '2rem', color: 'var(--brand-400)', fontWeight: 600 }}>
                Clear all filters
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
