'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { ScoreRing } from '@/components/score-ring';
import { Check, X, Loader2, Send, ArrowLeft, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface JobDetail {
  id: string;
  company: string;
  title: string;
  location: string;
  description: string;
  url: string;
  atsType: string;
  createdAt: string;
  matches: Array<{
    id: string;
    score: number;
    status: string;
    matchReasons: string[];
    skillGaps: string[];
    tailoringDrafts: Array<{
      id: string;
      tailoredResume: string;
      tailoredCoverLetter?: string;
      diffMetadata: Array<{ originalBullet: string; tailoredBullet: string; reason: string }>;
      keywordCoverage: Array<{ keyword: string; covered: boolean; source: string }>;
      rationale: string;
      status: string;
    }>;
  }>;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'diff'>('resume');

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function fetchJob() {
    const res = await fetch(`/api/jobs/${id}`, { headers: { 'x-user-id': 'demo-user' } });
    if (res.ok) setJob(await res.json());
  }

  async function tailorResume() {
    const match = job?.matches[0];
    if (!match) return;
    setLoading(true);
    const res = await fetch(`/api/tailor/${match.id}`, {
      method: 'POST',
      headers: { 'x-user-id': 'demo-user' },
    });
    if (res.ok) fetchJob();
    setLoading(false);
  }

  async function approve(decision: 'approved' | 'rejected') {
    const match = job?.matches[0];
    const draft = match?.tailoringDrafts[0];
    if (!match || !draft) return;

    await fetch(`/api/tailor/${match.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify({ draftId: draft.id, decision }),
    });
    fetchJob();
  }

  async function submitApplication() {
    const match = job?.matches[0];
    const draft = match?.tailoringDrafts[0];
    if (!match || !draft) return;

    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify({ matchId: match.id, draftId: draft.id, method: 'manual' }),
    });
    fetchJob();
  }

  if (!job) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );

  const match = job.matches[0];
  const draft = match?.tailoringDrafts[0];

  return (
    <div>
      <Link href="/dashboard/jobs" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to jobs
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full uppercase tracking-wide">{job.atsType}</span>
        </div>
        <p className="text-gray-500">{job.company} {job.location ? `• ${job.location}` : ''}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Status & Actions */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Match Analysis</h3>
            <div className="flex items-center gap-4 mb-4">
              <ScoreRing score={match?.score || 0} size={64} />
              <div>
                <StatusBadge status={match?.status || 'pending'} />
                <p className="text-xs text-gray-500 mt-1">{Math.round((match?.score || 0) * 100)}% match</p>
              </div>
            </div>
            {match?.matchReasons && match.matchReasons.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Why this matches</p>
                <ul className="space-y-1.5">
                  {match.matchReasons.map((r, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2">
              {match?.status === 'pending' && (
                <button onClick={tailorResume} disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Generate Tailored Resume
                </button>
              )}

              {match?.status === 'approval_needed' && draft && (
                <>
                  <button onClick={() => approve('approved')} className="btn-primary w-full justify-center">
                    <Check className="h-4 w-4 mr-2" /> Approve Documents
                  </button>
                  <button onClick={() => approve('rejected')} className="btn-secondary w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="h-4 w-4 mr-2" /> Reject & Regenerate
                  </button>
                </>
              )}

              {match?.status === 'approved' && (
                <button onClick={submitApplication} className="btn-primary w-full justify-center">
                  <Send className="h-4 w-4 mr-2" /> Mark as Submitted
                </button>
              )}

              {match?.status === 'submitted' && (
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-700 font-medium">Application submitted!</p>
                  <p className="text-xs text-green-600 mt-1">Track status in Applications tab</p>
                </div>
              )}
            </div>
          </div>

          {match?.skillGaps && match.skillGaps.length > 0 && (
            <div className="card border-yellow-200 bg-yellow-50/50">
              <h3 className="font-semibold text-yellow-800 mb-2 text-sm">Skill Gaps Detected</h3>
              <p className="text-xs text-yellow-700 mb-2">These skills were mentioned in the job but not found in your resume:</p>
              <div className="flex flex-wrap gap-1.5">
                {match.skillGaps.map((gap, i) => (
                  <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Original Job Description</h3>
            <div className="max-h-64 overflow-y-auto text-xs text-gray-600 space-y-2">
              {job.description.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700 mt-2 inline-block">
              View original posting →
            </a>
          </div>
        </div>

        {/* Right column: Document Preview */}
        <div className="lg:col-span-2">
          {draft ? (
            <div className="card">
              <div className="flex gap-1 mb-4 border-b border-gray-200">
                {(['resume', 'cover', 'diff'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'resume' ? 'Tailored Resume' : tab === 'cover' ? 'Cover Letter' : 'Changes & Diff'}
                  </button>
                ))}
              </div>

              {activeTab === 'resume' && (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono bg-gray-50 p-4 rounded-lg">
                    {draft.tailoredResume}
                  </div>
                </div>
              )}

              {activeTab === 'cover' && (
                <div className="prose prose-sm max-w-none">
                  {draft.tailoredCoverLetter ? (
                    <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono bg-gray-50 p-4 rounded-lg">
                      {draft.tailoredCoverLetter}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="italic">No cover letter template configured.</p>
                      <p className="text-sm mt-1">Go to Resume settings to add a template.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diff' && (
                <div className="space-y-4">
                  {draft.rationale && (
                    <div className="p-3 bg-blue-50 rounded-lg mb-4">
                      <p className="text-sm text-blue-800 font-medium mb-1">AI Rationale</p>
                      <p className="text-sm text-blue-700">{draft.rationale}</p>
                    </div>
                  )}

                  {draft.diffMetadata?.map((diff, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <div className="bg-red-50 p-3 border-b border-red-100">
                        <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Original</span>
                        <p className="text-sm text-red-800 mt-1">{diff.originalBullet}</p>
                      </div>
                      <div className="bg-green-50 p-3">
                        <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Tailored</span>
                        <p className="text-sm text-green-800 mt-1">{diff.tailoredBullet}</p>
                      </div>
                      <div className="bg-gray-50 p-2 border-t">
                        <p className="text-xs text-gray-500 italic">{diff.reason}</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6">
                    <h4 className="font-semibold text-sm mb-3">Keyword Coverage</h4>
                    <div className="flex flex-wrap gap-2">
                      {draft.keywordCoverage?.map((kw, i) => (
                        <span
                          key={i}
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            kw.covered
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}
                          title={kw.covered ? `Covered by: ${kw.source}` : 'Not covered'}
                        >
                          {kw.covered ? '✓' : '✗'} {kw.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium">No tailored documents yet</p>
              <p className="text-sm mt-1 mb-4">Click "Generate Tailored Resume" to start the AI pipeline</p>
              {match?.status === 'pending' && (
                <button onClick={tailorResume} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
