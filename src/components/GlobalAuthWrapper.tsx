'use client';

import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function GlobalAuthWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) setIsOpen(false); // Close modal on login
    });

    // Listen for custom open-auth-modal event
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('open-auth-modal', handleOpenModal);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('open-auth-modal', handleOpenModal);
    };
  }, []);

  return (
    <>
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Optional: Render a tiny user avatar/login button floating or in standard nav if we had access here, 
          but for now we just handle the modal. */}
    </>
  );
}
