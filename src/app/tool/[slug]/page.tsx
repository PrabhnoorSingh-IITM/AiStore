import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Category { id: string; name: string; slug: string; }
interface Tutorial {
  id: string;
  title: string;
  content?: string;
  prompt_strategies?: string;
  token_optimization_tips?: string;
}
interface Tool {
  id: string; name: string; slug: string; description: string;
  pricing_model: string; website_url?: string;
  capability_score?: number; speed_score?: number;
  overall_score?: number;
  categories: Category[];
  tutorials: Tutorial[];
}

const PRICING_COLORS: Record<string, string> = {
  Free: '#10b981', Freemium: '#06b6d4', Paid: '#6366f1', Usage_Based: '#f59e0b',
};

async function getTool(slug: string): Promise<Tool | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/tools/${slug}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default async function ToolDetailPage({ params }: { params: { slug: string } }) {
  const tool = await getTool(params.slug);

  if (!tool) notFound();

  const hasTutorials = tool.tutorials.length > 0;
  const firstTutorial = tool.tutorials[0];

  return (
    <>
      <nav>
        <div className="container nav-container">
          <Link href="/" className="nav-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-400)' }}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            AI Store
          </Link>
          <Link href="/" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to Directory
          </Link>
        </div>
      </nav>

      <header style={{ padding: '4rem 0', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--slate-800)', background: 'var(--slate-950)' }}>
        <div className="glow-blur" style={{ height: '16rem', width: '75%', background: 'rgba(6, 182, 212, 0.1)' }} />

        <div className="container" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {tool.categories.map(cat => (
                <span key={cat.id} className="badge">{cat.name}</span>
              ))}
            </div>

            <h1 style={{ marginBottom: '1rem' }}>{tool.name}</h1>
            <p style={{ fontSize: '1.125rem', maxWidth: '36rem', lineHeight: 1.8, marginBottom: '2rem', color: 'var(--slate-400)' }}>
              {tool.description}
            </p>

            {tool.website_url && (
              <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Visit Official API
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
          </div>

          <aside className="glass-panel" style={{ width: '100%', maxWidth: '300px', padding: '1.5rem', height: 'fit-content', background: 'rgba(15, 23, 42, 0.6)' }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--slate-800)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Algorithm Vitals
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Pricing Model</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', color: PRICING_COLORS[tool.pricing_model] || '#fff', background: `${PRICING_COLORS[tool.pricing_model]}20` }}>
                {tool.pricing_model.replace('_', '-')}
              </span>
            </div>

            {tool.capability_score !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderTop: '1px solid var(--slate-800)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Capability Rank</span>
                <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tool.capability_score}</span>
              </div>
            )}

            {tool.speed_score !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>Speed Score</span>
                <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tool.speed_score}</span>
              </div>
            )}
          </aside>
        </div>
      </header>

      <section className="container" style={{ maxWidth: '48rem', padding: '4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

        {!hasTutorials && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--slate-500)', margin: '0 auto 1rem' }}>
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 style={{ color: 'var(--slate-300)' }}>No Deep-Dive Tutorials Yet</h3>
            <p style={{ marginTop: '0.5rem' }}>Our editorial team hasn&apos;t published guides for this tool yet.</p>
          </div>
        )}

        {hasTutorials && firstTutorial.content && (
          <article>
            <h2 style={{ borderLeft: '4px solid var(--brand-500)', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
              General Overview
            </h2>
            <div className="glass-panel markdown-body" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.3)' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{firstTutorial.content}</p>
            </div>
          </article>
        )}

        {hasTutorials && firstTutorial.prompt_strategies && (
          <article>
            <h2 style={{ borderLeft: '4px solid #10b981', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
              Prompting Strategies
            </h2>
            <div className="glass-panel markdown-body" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.3)' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{firstTutorial.prompt_strategies}</p>
            </div>
          </article>
        )}

        {hasTutorials && firstTutorial.token_optimization_tips && (
          <article>
            <h2 style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
              Token Optimization Masterclass
            </h2>
            <div className="glass-panel markdown-body" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.3)' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{firstTutorial.token_optimization_tips}</p>
            </div>
          </article>
        )}
      </section>
    </>
  );
}
