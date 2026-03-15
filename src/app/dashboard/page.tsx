'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Navbar from '@/src/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const fd = new FormData(e.currentTarget);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/admin/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: fd.get('name'),
        slug: fd.get('slug'),
        website_url: fd.get('websiteUrl') || undefined,
        pricing_model: fd.get('pricingModel'),
        description: fd.get('description'),
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setStatus({ type: 'success', msg: `"${result.data.name}" published successfully!` });
      (e.target as HTMLFormElement).reset();
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
              <label htmlFor="pricingModel" className="form-label">Pricing Model</label>
              <select id="pricingModel" name="pricingModel" className="form-input">
                <option value="Free">Free</option>
                <option value="Freemium">Freemium</option>
                <option value="Paid">Paid</option>
                <option value="Usage_Based">Usage-Based</option>
              </select>
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
