import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Configurable Query Parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const categorySlug = searchParams.get('category');
    const searchKeyword = searchParams.get('search');
    const pricingModel = searchParams.get('pricing');

    // Build the Prisma 'where' object dynamically
    const whereClause: any = {};

    if (categorySlug && categorySlug !== 'all') {
      whereClause.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      };
    }

    if (searchKeyword) {
      whereClause.OR = [
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { description: { contains: searchKeyword, mode: 'insensitive' } },
      ];
    }

    if (pricingModel) {
      // Map exact Enum value, ensuring capitalization string matches Prisma Enum
      whereClause.pricing_model = pricingModel;
    }

    // Execute paginated relational fetch
    const skip = (page - 1) * limit;

    const [tools, totalCount] = await Promise.all([
      prisma.tool.findMany({
        where: whereClause,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.tool.count({ where: whereClause }),
    ]);

    // Flatten category structure for clean JSON serialization
    const formattedTools = tools.map((t: any) => ({
      ...t,
      categories: t.categories.map((tc: any) => tc.category),
    }));

    return NextResponse.json({
      data: formattedTools,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error: any) {
    console.error('[GET /api/tools] Prisma Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch directory tools due to server error.' },
      { status: 500 }
    );
  }
}
