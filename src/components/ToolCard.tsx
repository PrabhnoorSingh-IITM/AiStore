'use client';

import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  website_url?: string | null;
  overall_score?: number | null;
  categories: Category[];
}

const PRICING_COLORS: Record<string, string> = {
  Free: '#10b981',
  Freemium: '#06b6d4',
  Paid: '#6366f1',
  'Usage_Based': '#f59e0b',
};

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tool/${tool.slug}`} className="glass-panel tool-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tool.categories.slice(0, 2).map((cat) => (
            <span key={cat.id} className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
              {cat.name}
            </span>
          ))}
        </div>
        {tool.overall_score !== null && tool.overall_score !== undefined && (
          <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
            {tool.overall_score.toString()}
          </span>
        )}
      </div>
      <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{tool.name}</h3>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, flex: 1, color: 'var(--slate-400)', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {tool.description}
      </p>
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          padding: '0.2rem 0.5rem', 
          borderRadius: '4px', 
          color: PRICING_COLORS[tool.pricing_model] || '#fff', 
          background: `${PRICING_COLORS[tool.pricing_model]}20` 
        }}>
          {tool.pricing_model.replace('_', '-')}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--brand-400)', fontWeight: 600 }}>
          View Profile →
        </span>
      </div>
    </Link>
  );
}
