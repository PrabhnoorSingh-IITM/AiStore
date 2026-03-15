import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyAdmin } from '@/src/lib/auth/verify-admin';
import { updateToolSchema } from '@/src/lib/validations/api-schemas';
import { z } from 'zod';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. JWT Authentication Guard
    const adminCheck = await verifyAdmin(req);
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { id: toolId } = await params;
    if (!toolId) {
       return NextResponse.json({ error: 'Target Tool ID parameter is required.' }, { status: 400 });
    }

    // 2. Extrapolate Body Payload & Zod Validation mapping Partials
    const body = await req.json();
    const p = updateToolSchema.parse(body);

    // 3. Database Updates via Prisma
    const updatedTool = await prisma.tool.update({
      where: { id: toolId },
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
        
        // Note: Full relational category mapping update would require deleting and recreating tuples.
        // If category_ids are passed, we execute a transaction replacement
        ...(p.category_ids && {
          categories: {
            deleteMany: {}, // Clear existing
            create: p.category_ids.map((cId: string) => ({ category_id: cId })), // Assign new
          }
        })
      },
      include: {
        categories: true
      }
    });

    return NextResponse.json({ data: updatedTool }, { status: 200 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid Payload', details: error.issues }, { status: 400 });
    }
    
    // Prisma equivalent of "Record to update not found."
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'The requested tool record does not exist.' }, { status: 404 });
    }

    console.error(`[PUT /api/admin/tools] Internal Execution Error:`, error.message);
    return NextResponse.json({ error: 'Internal Server Error during mutation.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authority
    const adminCheck = await verifyAdmin(req);
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { id: toolId } = await params;
    if (!toolId) {
       return NextResponse.json({ error: 'Target Tool ID parameter is required.' }, { status: 400 });
    }

    // Rely on Prisma cascading rules to nuke related tool_categories and tutorials inherently
    await prisma.tool.delete({
      where: { id: toolId },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Target resource does not exist.' }, { status: 404 });
    }
    console.error(`[DELETE /api/admin/tools] Internal Execution Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error executing purge.' }, { status: 500 });
  }
}
