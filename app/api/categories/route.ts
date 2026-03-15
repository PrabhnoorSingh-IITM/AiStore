import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ data: categories });

  } catch (error: any) {
    console.error('[GET /api/categories] Fetch Error:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error fetching categories.' },
      { status: 500 }
    );
  }
}
