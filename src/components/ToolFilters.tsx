'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const PRICING_MODELS = ['Free', 'Freemium', 'Paid', 'Usage_Based'];

export default function ToolFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQuery('search', search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  function updateQuery(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset page on filter change
    params.delete('page');

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  const activeCategory = searchParams.get('category') || 'all';
  const activePricing = searchParams.get('pricing') || 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--slate-400)', marginBottom: '0.5rem', display: 'block' }}>
            Search AI Tools
          </label>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', color: 'white' }}
              placeholder="e.g. 'writing assistant' or 'image gen'..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {isPending && <div className="spinner" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--brand-500)' }} />}
          </div>
        </div>

        <div style={{ width: '200px' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--slate-400)', marginBottom: '0.5rem', display: 'block' }}>
            Pricing Model
          </label>
          <select 
            className="glass-panel form-input" 
            style={{ width: '100%', background: 'var(--slate-900)' }}
            value={activePricing}
            onChange={(e) => updateQuery('pricing', e.target.value)}
          >
            <option value="all">All Pricing</option>
            {PRICING_MODELS.map(model => (
              <option key={model} value={model}>{model.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)', marginRight: '0.5rem' }}>Categories:</span>
        <button
          className={`badge ${activeCategory === 'all' ? '' : 'badge-outline'}`}
          style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
          onClick={() => updateQuery('category', 'all')}
        >
          Explore All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`badge ${activeCategory === cat.slug ? '' : 'badge-outline'}`}
            style={{ cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
            onClick={() => updateQuery('category', cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
