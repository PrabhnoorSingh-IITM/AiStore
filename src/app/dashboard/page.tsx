'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '@/src/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(json => {
        if (json.data) setCategories(json.data);
      });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const fd = new FormData(e.currentTarget);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const body = {
      name: fd.get('name'),
      slug: fd.get('slug'),
      website_url: fd.get('websiteUrl') || undefined,
      pricing_model: fd.get('pricingModel'),
      description: fd.get('description'),
      capability_score: Number(fd.get('capability_score')) || undefined,
      speed_score: Number(fd.get('speed_score')) || undefined,
      cost_efficiency_score: Number(fd.get('cost_efficiency_score')) || undefined,
      usefulness_score: Number(fd.get('usefulness_score')) || undefined,
      overall_score: Number(fd.get('overall_score')) || undefined,
      category_ids: selectedCategories,
    };

    const res = await fetch('/api/admin/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (res.ok) {
      setStatus({ type: 'success', msg: `"${result.data.name}" published successfully!` });
      (e.target as HTMLFormElement).reset();
      setSelectedCategories([]);
    } else {
      setStatus({ type: 'error', msg: result.error || 'Submission failed.' });
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar showBackToDirectory showLogout onLogout={handleLogout} />

      <main className="container" style={{ padding: '4rem 1rem 8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ width: '100%', maxWidth: '42rem', marginBottom: '2rem' }}>
          <span className="badge" style={{ marginBottom: '0.5rem' }}>Secure Portal</span>
          <h1>Dashboard</h1>
          <p>Add new generative models and utilities straight into the Master Directory.</p>
        </div>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '42rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Add New Directory Listing</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '2rem' }}>
            Changes pushed here hit the live database instantly.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {status && (
              <div className={status.type === 'success' ? 'alert-success' : 'alert-error'}>
                {status.msg}
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Tool Name</label>
                <input type="text" id="name" name="name" className="form-input" placeholder="e.g. ChatGPT" required />
              </div>
              <div className="form-group">
                <label htmlFor="slug" className="form-label">URL Slug</label>
                <input type="text" id="slug" name="slug" className="form-input" placeholder="e.g. chatgpt" required pattern="[a-z0-9-]+" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="websiteUrl" className="form-label">Official Website URL</label>
              <input type="url" id="websiteUrl" name="websiteUrl" className="form-input" placeholder="https://chat.openai.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Categories</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`badge ${selectedCategories.includes(cat.id) ? '' : 'badge-outline'}`}
                    style={{ cursor: 'pointer', border: '1px solid var(--slate-700)', padding: '0.4rem 0.8rem' }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pricingModel" className="form-label">Pricing Model</label>
              <select id="pricingModel" name="pricingModel" className="form-input">
                <option value="Free">Free</option>
                <option value="Freemium">Freemium</option>
                <option value="Paid">Paid</option>
                <option value="Usage_Based">Usage-Based</option>
              </select>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="overall_score" className="form-label" style={{ color: 'var(--brand-400)' }}>Overall Rank (0-10)</label>
                <input type="number" id="overall_score" name="overall_score" step="0.1" min="0" max="10" className="form-input" placeholder="9.2" style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }} />
              </div>
              <div className="form-group">
                <label htmlFor="capability_score" className="form-label">Capability</label>
                <input type="number" id="capability_score" name="capability_score" step="0.1" min="0" max="10" className="form-input" placeholder="9.5" />
              </div>
              <div className="form-group">
                <label htmlFor="speed_score" className="form-label">Speed</label>
                <input type="number" id="speed_score" name="speed_score" step="0.1" min="0" max="10" className="form-input" placeholder="8.0" />
              </div>
              <div className="form-group">
                <label htmlFor="cost_efficiency_score" className="form-label">Cost Efficiency</label>
                <input type="number" id="cost_efficiency_score" name="cost_efficiency_score" step="0.1" min="0" max="10" className="form-input" placeholder="7.5" />
              </div>
              <div className="form-group">
                <label htmlFor="usefulness_score" className="form-label">Usefulness</label>
                <input type="number" id="usefulness_score" name="usefulness_score" step="0.1" min="0" max="10" className="form-input" placeholder="9.0" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea id="description" name="description" className="form-input" rows={4} placeholder="A powerful conversational LLM built by OpenAI..." required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }} disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> Publishing...</>
              ) : 'Publish Tool'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
