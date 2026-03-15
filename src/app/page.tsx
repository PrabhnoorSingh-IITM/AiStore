'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/Navbar';

interface Category { id: string; name: string; slug: string; }
interface Tool {
  id: string; name: string; slug: string; description: string;
  pricing_model: string; overall_score?: number;
  categories: Category[];
}

const PRICING_COLORS: Record<string, string> = {
  Free: '#10b981', Freemium: '#06b6d4', Paid: '#6366f1', 'Usage_Based': '#f59e0b',
};

export default function HomePage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (searchValue) params.set('search', searchValue);

    fetch(`/api/tools?${params}`)
      .then(r => r.json())
      .then(d => { setTools(d.data || []); setLoading(false); })
      .catch(e => { setError('Database Connection Failed.'); setLoading(false); });
  }, [activeCategory, searchValue]);

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
          <p style={{ fontSize: '1.125rem', maxWidth: '42rem', margin: '0 auto' }}>
            The world&apos;s most curated directory of AI tools. Filter by capability, explore deep-dive performance tutorials, and optimize your API costs.
          </p>
        </div>
      </header>

      <main className="container" id="directory" style={{ paddingBottom: '6rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Master Directory</h2>
              <p style={{ fontSize: '0.875rem' }}>Browse and filter specific capabilities.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`badge ${activeCategory === 'all' ? '' : 'badge-outline'}`}
                style={{ cursor: 'pointer', border: 'none' }}
                onClick={() => setActiveCategory('all')}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`badge ${activeCategory === cat.slug ? '' : 'badge-outline'}`}
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => setActiveCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Search for tools by name or capability..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <div className="spinner" style={{ borderColor: 'var(--brand-500)', borderTopColor: 'transparent', width: '3rem', height: '3rem', margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--brand-400)', fontWeight: 500 }}>Querying Database...</p>
          </div>
        )}

        {!loading && error && (
          <div className="glass-panel alert-error" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3>Database Connection Failed</h3>
            <p style={{ marginTop: '0.5rem' }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="tools-grid">
            {tools.map(tool => (
              <Link key={tool.id} href={`/tool/${tool.slug}`} className="glass-panel tool-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {tool.categories.slice(0, 2).map(cat => (
                      <span key={cat.id} className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{cat.name}</span>
                    ))}
                  </div>
                  {tool.overall_score !== null && tool.overall_score !== undefined && (
                    <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.25rem' }}>{tool.overall_score}</span>
                  )}
                </div>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{tool.name}</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, flex: 1 }}>{tool.description}</p>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', color: PRICING_COLORS[tool.pricing_model] || '#fff', background: `${PRICING_COLORS[tool.pricing_model]}20` }}>
                    {tool.pricing_model.replace('_', '-')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--brand-400)' }}>View Profile →</span>
                </div>
              </Link>
            ))}
            {tools.length === 0 && (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: 'var(--slate-500)' }}>
                No tools found matching your criteria.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
