'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, Trash2, Sparkles, Briefcase } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { ScoreRing } from '@/components/score-ring';
import { formatDate } from '@/lib/utils';

interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  url?: string;
  status: string;
  createdAt: string;
  matches: Array<{
    id: string;
    score: number;
    status: string;
  }>;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [url, setUrl] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const res = await fetch('/api/jobs', { headers: { 'x-user-id': 'demo-user' } });
    if (res.ok) setJobs(await res.json());
  }

  async function addJob(e: React.FormEvent) {
    e.preventDefault();
    if (!url && !manualTitle) return;
    setLoading(true);

    const body = showManual 
      ? { url: url || 'https://example.com/job', company: manualCompany, title: manualTitle, description: manualDesc }
      : { url };

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setUrl('');
      setManualCompany('');
      setManualTitle('');
      setManualDesc('');
      fetchJobs();
    }
    setLoading(false);
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'x-user-id': 'demo-user' } });
    fetchJobs();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
      </div>

      <div className="card mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowManual(false)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${!showManual ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            URL Import
          </button>
          <button
            onClick={() => setShowManual(true)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${showManual ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Manual Entry
          </button>
        </div>

        <form onSubmit={addJob} className="space-y-3">
          {!showManual ? (
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="Paste job URL (Greenhouse, Lever, Workday, LinkedIn...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input flex-1"
                required={!showManual}
              />
              <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
                <Plus className="h-4 w-4 mr-1" />
                {loading ? 'Scraping...' : 'Add Job'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  className="input"
                  required={showManual}
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="input"
                  required={showManual}
                />
              </div>
              <input
                type="url"
                placeholder="Job URL (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input w-full"
              />
              <textarea
                placeholder="Paste job description here..."
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                rows={4}
                className="input w-full"
                required={showManual}
              />
              <button type="submit" disabled={loading} className="btn-primary">
                <Plus className="h-4 w-4 mr-1" />
                {loading ? 'Processing...' : 'Add Job'}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const match = job.matches[0];
          return (
            <div key={job.id} className="card flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-lg font-bold text-primary-700">
                  {job.company[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company} {job.location ? `• ${job.location}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Added {formatDate(job.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {match && (
                  <>
                    <ScoreRing score={match.score} size={40} />
                    <StatusBadge status={match.status} />
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="btn-secondary text-xs"
                    >
                      {match.status === 'pending' ? (
                        <><Sparkles className="h-3 w-3 mr-1" /> Tailor</>
                      ) : match.status === 'approval_needed' ? (
                        'Review'
                      ) : (
                        'View'
                      )}
                    </Link>
                  </>
                )}
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 p-1">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button onClick={() => deleteJob(job.id)} className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium">No jobs yet</p>
            <p className="text-sm mt-1">Paste a job URL or enter details manually above</p>
          </div>
        )}
      </div>
    </div>
  );
}
