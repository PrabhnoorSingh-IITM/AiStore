import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // Top 100 Leaderboard sorting directly inside Postgres via strict descending rules
    const topTools = await prisma.tool.findMany({
      orderBy: {
        overall_score: 'desc',
      },
      take: 100,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      // Ensure we only pull tools that actually have been scored
      where: {
        overall_score: {
          not: null,
        },
      },
    });

    const formattedLeaderboard = topTools.map((t: any) => ({
      ...t,
      categories: t.categories.map((tc: any) => tc.category),
    }));

    return NextResponse.json(
      { data: formattedLeaderboard },
      {
        status: 200,
        headers: {
          // Instruct highly optimized edge cache regeneration every hour
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );

  } catch (error: any) {
    console.error('[GET /api/tools/leaderboard] Prisma Data Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate leaderboard rankings.' },
      { status: 500 }
    );
  }
}
