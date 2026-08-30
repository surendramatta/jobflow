'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { ExternalLink, Send, Clock, CheckCircle } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  method: string;
  submittedAt: string | null;
  createdAt: string;
  atsType: string;
  match: {
    job: {
      company: string;
      title: string;
      url?: string;
    };
  };
  receipt: {
    atsConfirmation?: string;
    fieldsSubmitted?: Record<string, string>;
  } | null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    const res = await fetch('/api/applications', { headers: {  } });
    if (res.ok) setApplications(await res.json());
  }

  const filtered = filter === 'all' 
    ? applications 
    : applications.filter(a => a.status === filter);

  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    confirmed: applications.filter(a => a.status === 'confirmed').length,
    failed: applications.filter(a => a.status === 'failed').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Applications</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Send, color: 'text-gray-600' },
          { label: 'Submitted', value: stats.submitted, icon: Clock, color: 'text-blue-600' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Failed', value: stats.failed, icon: Send, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card py-4 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'submitted', 'confirmed', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize ${
              filter === f 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((app) => (
          <div key={app.id} className="card flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{app.match.job.title}</h3>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase rounded font-medium">
                  {app.atsType}
                </span>
              </div>
              <p className="text-sm text-gray-500">{app.match.job.company}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <StatusBadge status={app.status} />
                <span className="text-xs text-gray-400">via {app.method}</span>
                {app.submittedAt && (
                  <span className="text-xs text-gray-400">{formatDate(app.submittedAt)}</span>
                )}
              </div>
              {app.receipt?.atsConfirmation && (
                <p className="text-xs text-gray-500 mt-1.5 font-mono">
                  Confirmation: {app.receipt.atsConfirmation}
                </p>
              )}
            </div>
            {app.match.job.url && (
              <a 
                href={app.match.job.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-16 text-gray-500">
            <Send className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium">No applications yet</p>
            <p className="text-sm mt-1">Go to Jobs, tailor a resume, and approve it to start applying.</p>
          </div>
        )}
      </div>
    </div>
  );
}
