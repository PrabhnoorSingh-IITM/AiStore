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

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const PRICING_COLORS: Record<string, string> = {
  Free: '#10b981',
  Freemium: '#06b6d4',
  Paid: '#6366f1',
  'Usage_Based': '#f59e0b',
};

// Initialize Supabase to grab standard session token
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ToolCard({ tool }: { tool: Tool }) {
  const [isSaved, setIsSaved] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); // Stop Link navigation
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }

    // Optimistically toggle
    const newStatus = !isSaved;
    setIsSaved(newStatus);
    const action = newStatus ? 'save' : 'unsave';

    try {
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tool_id: tool.id, action })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.error('Failed to bookmark tool:', err);
      setIsSaved(!newStatus); // Rollback
    }
  };

  return (
    <Link href={`/tool/${tool.slug}`} className="glass-panel tool-card flex flex-col h-full relative group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          {tool.categories.slice(0, 2).map((cat) => (
            <span key={cat.id} className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
              {cat.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {tool.overall_score !== null && tool.overall_score !== undefined && (
            <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {tool.overall_score.toString()}
            </span>
          )}
          {/* Bookmark Button */}
          <button 
            onClick={handleBookmark}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
              background: isSaved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isSaved ? '#10b981' : 'var(--slate-400)',
            }}
            className="hover:bg-slate-800 z-10 hover:text-white"
            aria-label={isSaved ? "Remove Bookmark" : "Save Bookmark"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
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
