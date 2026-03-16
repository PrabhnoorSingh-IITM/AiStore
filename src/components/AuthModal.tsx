'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage('Configuration error.');
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel w-full max-w-md p-8 relative" style={{ background: 'var(--slate-900)' }}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">Sign In to Save Tools</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <button 
            onClick={() => handleOAuth('google')}
            className="btn glass-panel w-full flex justify-center items-center gap-2"
            style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 opacity-50">
          <div className="flex-1 border-t border-slate-700"></div>
          <span className="text-sm">or</span>
          <div className="flex-1 border-t border-slate-700"></div>
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? 'Sending link...' : 'Email Magic Link'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('Check') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
