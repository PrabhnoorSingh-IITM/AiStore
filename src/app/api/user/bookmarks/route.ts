import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client using the Anon Key to verify user sessions.
// We strictly avoid the Service Role key here to prevent privilege escalation.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Public Session via Authorization Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token.' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the JWT with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }

    // 2. Parse Body for tool_id and action (save/unsave)
    const body = await req.json();
    const { tool_id, action } = body;

    if (!tool_id || !['save', 'unsave'].includes(action)) {
      return NextResponse.json({ error: 'Bad Request: Invalid payload.' }, { status: 400 });
    }

    // 3. Execute Prisma Mutation
    if (action === 'save') {
      try {
        await prisma.bookmark.create({
          data: {
            user_id: user.id,
            tool_id: tool_id,
          }
        });
        return NextResponse.json({ message: 'Bookmark saved successfully.' }, { status: 201 });
      } catch (dbError: any) {
        // P2002 is Prisma's Unique Constraint Violation Code
        if (dbError.code === 'P2002') {
          return NextResponse.json({ message: 'Bookmark already exists.' }, { status: 200 });
        }
        throw dbError; // Bubble up for standard 500 handling
      }
    } else if (action === 'unsave') {
      // For delete, we query by the compound unique constraint
      try {
        await prisma.bookmark.delete({
          where: {
            user_id_tool_id: {
              user_id: user.id,
              tool_id: tool_id,
            }
          }
        });
        return NextResponse.json({ message: 'Bookmark removed successfully.' }, { status: 200 });
      } catch (dbError: any) {
        // P2025: Record to delete does not exist
        if (dbError.code === 'P2025') {
          return NextResponse.json({ message: 'Bookmark did not exist.' }, { status: 200 });
        }
        throw dbError;
      }
    }

  } catch (error: any) {
    console.error('[POST /api/user/bookmarks] Server Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
