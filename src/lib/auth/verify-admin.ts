import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/src/lib/supabase/admin';

export interface VerifiedAdmin {
  id: string;
  email?: string;
}

export async function verifyAdmin(req: NextRequest): Promise<VerifiedAdmin | NextResponse> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or malformed Bearer token.' },
      { status: 401 }
    );
  }

  const token = authHeader.split('Bearer ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Empty token.' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('[verifyAdmin] JWT Verification Failed:', error?.message);
      return NextResponse.json(
        { error: 'Forbidden: Invalid or expired authentication token.' },
        { status: 403 }
      );
    }

    return { id: user.id, email: user.email };

  } catch (error: any) {
    console.error('[verifyAdmin] Execution Error:', error?.message);
    return NextResponse.json(
      { error: 'Internal Server Error during authentication.' },
      { status: 500 }
    );
  }
}
