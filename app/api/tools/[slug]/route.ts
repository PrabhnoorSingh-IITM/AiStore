import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing Tool Slug parameter.' },
        { status: 400 }
      );
    }

    const tool = await prisma.tool.findUnique({
      where: {
        slug: slug,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tutorials: true, // Eager load the markdown documents
      },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found.' },
        { status: 404 }
      );
    }

    // Flatten logic
    const formattedTool = {
      ...tool,
      categories: tool.categories.map((tc: any) => tc.category),
    };

    return NextResponse.json({ data: formattedTool });

  } catch (error: any) {
    console.error(`[GET /api/tools/${params.slug}] Fetch Error:`, error.message);
    return NextResponse.json(
      { error: 'Internal Server Error fetching specific tool.' },
      { status: 500 }
    );
  }
}
