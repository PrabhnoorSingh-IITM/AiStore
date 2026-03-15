import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyAdmin } from '@/src/lib/auth/verify-admin';
import { createToolSchema } from '@/src/lib/validations/api-schemas';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // 1. Mandatory Authority Verification (throws JSON Response on failure)
    const adminCheck = await verifyAdmin(req);
    if (adminCheck instanceof NextResponse) return adminCheck;

    // 2. Parse Body Payload
    const body = await req.json();

    // 3. Strict Zod Validation Schema
    const p = createToolSchema.parse(body);

    // 4. Transform Category Mapping Array dynamically if present
    const categoryConnect = p.category_ids?.map((id: string) => ({
      category_id: id,
    })) || [];

    // 5. Native Prisma Postgres Insertion
    const newTool = await prisma.tool.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        website_url: p.website_url,
        pricing_model: p.pricing_model,
        capability_score: p.capability_score,
        speed_score: p.speed_score,
        cost_efficiency_score: p.cost_efficiency_score,
        usefulness_score: p.usefulness_score,
        overall_score: p.overall_score,
        categories: {
          create: categoryConnect, // Relational Insertion mapped via Join Table schema
        },
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json({ data: newTool }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[POST /api/admin/tools] Validation Failed:', error.issues);
      return NextResponse.json(
        { error: 'Invalid Payload', details: error.issues },
        { status: 400 }
      );
    }
    
    // Catch Prisma Unique Constraint exceptions (e.g. duplicate slug) automatically
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A tool with this identical name or slug already exists in the registry.' },
        { status: 409 }
      );
    }

    console.error('[POST /api/admin/tools] Internal Execution Error:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error during resource creation.' },
      { status: 500 }
    );
  }
}
