import { db } from '@/lib/db';
import { BarChart3, TrendingUp, Target, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAnalytics(userId: string) {
  const [
    totalJobs,
    totalApplications,
    avgMatchScore,
    statusBreakdown,
    recentActivity,
  ] = await Promise.all([
    db.jobPosting.count({ where: { userId } }),
    db.applicationAttempt.count({ where: { userId } }),
    db.match.aggregate({ where: { userId }, _avg: { score: true } }),
    db.match.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    }),
    db.applicationAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        match: {
          include: {
            job: { select: { company: true, title: true } },
          },
        },
      },
    }),
  ]);

  return {
    totalJobs,
    totalApplications,
    avgMatchScore: Math.round((avgMatchScore._avg.score || 0) * 100),
    statusBreakdown: statusBreakdown.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {} as Record<string, number>),
    recentActivity,
  };
}

export default async function AnalyticsPage() {
  const userId = 'demo-user';
  const data = await getAnalytics(userId);

  const pipelineStages = [
    { label: 'Jobs Added', value: data.totalJobs, color: 'bg-blue-500' },
    { label: 'Tailored', value: data.statusBreakdown['approval_needed'] || 0, color: 'bg-purple-500' },
    { label: 'Approved', value: data.statusBreakdown['approved'] || 0, color: 'bg-orange-500' },
    { label: 'Submitted', value: data.totalApplications, color: 'bg-green-500' },
  ];

  const maxPipeline = Math.max(...pipelineStages.map(s => s.value), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Match Score</p>
              <p className="text-2xl font-bold text-gray-900">{data.avgMatchScore}%</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Application Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalJobs > 0 ? Math.round((data.totalApplications / data.totalJobs) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Pipeline</h2>
        <div className="space-y-4">
          {pipelineStages.map((stage) => (
            <div key={stage.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{stage.label}</span>
                <span className="text-gray-500">{stage.value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`${stage.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${(stage.value / maxPipeline) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            ))}
            {Object.keys(data.statusBreakdown).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.map((app) => (
              <div key={app.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-900">
                    Applied to <span className="font-medium">{app.match.job.title}</span> at {app.match.job.company}
                  </p>
                  <p className="text-xs text-gray-500">
                    {app.submittedAt 
                      ? new Date(app.submittedAt).toLocaleDateString() 
                      : new Date(app.createdAt).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
