import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyAdmin } from '@/src/lib/auth/verify-admin';
import { createTutorialSchema } from '@/src/lib/validations/api-schemas';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // 1. Mandatory Authority Verification (throws JSON Response on failure)
    const adminCheck = await verifyAdmin(req);
    if (adminCheck instanceof NextResponse) return adminCheck;

    // 2. Parse Body Payload
    const body = await req.json();

    // 3. Strict Zod Validation Schema
    const p = createTutorialSchema.parse(body);

    // 4. Verify the Target Tool exists first
    const targetTool = await prisma.tool.findUnique({
      where: { id: p.tool_id },
    });

    if (!targetTool) {
      return NextResponse.json(
        { error: 'The specified tool_id does not exist in the registry.' },
        { status: 404 }
      );
    }

    // 5. Native Prisma Postgres Insertion
    const newTutorial = await prisma.tutorial.create({
      data: {
        tool_id: p.tool_id,
        title: p.title,
        content: p.content,
        prompt_strategies: p.prompt_strategies,
        token_optimization_tips: p.token_optimization_tips,
      },
    });

    return NextResponse.json({ data: newTutorial }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[POST /api/admin/tutorials] Validation Failed:', error.issues);
      return NextResponse.json(
        { error: 'Invalid Payload', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[POST /api/admin/tutorials] Internal Execution Error:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error during tutorial creation.' },
      { status: 500 }
    );
  }
}
