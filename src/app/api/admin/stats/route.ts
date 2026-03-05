import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats - Dashboard stats
export async function GET(_request: NextRequest) {
  try {
    const [totalApps, pendingApps, acceptedApps, jobStats] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      prisma.application.groupBy({
        by: ['jobId'],
        _count: { id: true },
      }),
    ]);

    // Get job details for stats
    const jobs = await prisma.job.findMany({
      select: { id: true, title: true, slug: true, icon: true },
    });

    const jobStatsWithDetails = jobStats.map((stat: { jobId: string; _count: { id: number } }) => {
      const job = jobs.find((j: { id: string }) => j.id === stat.jobId);
      return {
        jobId: stat.jobId,
        jobTitle: job?.title || 'Unknown',
        jobIcon: job?.icon || '💼',
        count: stat._count.id,
      };
    });

    return NextResponse.json({
      total: totalApps,
      pending: pendingApps,
      accepted: acceptedApps,
      rejected: totalApps - pendingApps - acceptedApps,
      byJob: jobStatsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
