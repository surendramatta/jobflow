import Link from 'next/link';
import { Briefcase, FileText, Send, TrendingUp, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/status-badge';
import { ScoreRing } from '@/components/score-ring';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getStats(userId: string) {
  const [totalJobs, pendingApproval, submitted, avgScore] = await Promise.all([
    db.jobPosting.count({ where: { userId } }),
    db.match.count({ where: { userId, status: 'approval_needed' } }),
    db.applicationAttempt.count({ where: { userId, status: 'submitted' } }),
    db.match.aggregate({ where: { userId }, _avg: { score: true } }),
  ]);

  return {
    totalJobs,
    pendingApproval,
    submitted,
    matchRate: Math.round((avgScore._avg.score || 0) * 100),
  };
}

async function getRecentJobs(userId: string) {
  return db.jobPosting.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      matches: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

async function getRecentApplications(userId: string) {
  return db.applicationAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      match: {
        include: {
          job: true,
        },
      },
    },
  });
}

export default async function DashboardPage() {
  const userId = 'demo-user';
  const stats = await getStats(userId);
  const recentJobs = await getRecentJobs(userId);
  const recentApps = await getRecentApplications(userId);

  const cards = [
    { name: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, href: '/dashboard/jobs', color: 'bg-blue-50 text-blue-600' },
    { name: 'Pending Approval', value: stats.pendingApproval, icon: FileText, href: '/dashboard/jobs', color: 'bg-orange-50 text-orange-600' },
    { name: 'Submitted', value: stats.submitted, icon: Send, href: '/dashboard/applications', color: 'bg-green-50 text-green-600' },
    { name: 'Avg Match', value: `${stats.matchRate}%`, icon: TrendingUp, href: '/dashboard/jobs', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((card) => (
          <Link key={card.name} href={card.href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`rounded-lg p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/dashboard/jobs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.company} • {formatDate(job.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.matches[0] && <ScoreRing score={job.matches[0].score} size={36} />}
                  <StatusBadge status={job.matches[0]?.status || 'pending'} />
                </div>
              </div>
            ))}
            {recentJobs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No jobs yet. <Link href="/dashboard/jobs" className="text-primary-600">Add one</Link>.</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link href="/dashboard/applications" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{app.match.job.title}</p>
                  <p className="text-xs text-gray-500">{app.match.job.company} • {app.submittedAt ? formatDate(app.submittedAt) : 'Pending'}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
            {recentApps.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No applications yet. Approve a tailored resume to submit.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
