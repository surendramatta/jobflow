'use client';

import { useState, useEffect } from 'react';
import { Upload, Save, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface Profile {
  id: string;
  resumeText?: string;
  workAuthorization?: string;
  locationPreference?: string;
  remotePreference?: string;
  coverLetterTemplate?: string;
  resumeFacts?: Array<{
    id?: string;
    category: string;
    content: string;
    employer?: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    bullets?: string[];
  }>;
}

export default function ResumePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    workAuthorization: '',
    locationPreference: '',
    remotePreference: 'any',
    coverLetterTemplate: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const res = await fetch('/api/resumes', { headers: { 'x-user-id': 'demo-user' } });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      if (data) {
        setSettings({
          workAuthorization: data.workAuthorization || '',
          locationPreference: data.locationPreference || '',
          remotePreference: data.remotePreference || 'any',
          coverLetterTemplate: data.coverLetterTemplate || '',
        });
      }
    }
  }

  async function uploadResume(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    const res = await fetch('/api/resumes', {
      method: 'POST',
      headers: { 'x-user-id': 'demo-user' },
      body: formData,
    });

    if (res.ok) {
      setFile(null);
      fetchProfile();
    }
    setUploading(false);
  }

  async function saveSettings() {
    await fetch('/api/resumes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchProfile();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resume & Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Upload Resume
          </h2>

          <form onSubmit={uploadResume} className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all cursor-pointer"
              onClick={() => document.getElementById('resume-upload')?.click()}
            >
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="resume-upload"
              />
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Click to upload PDF or TXT'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports PDF and plain text files</p>
            </div>

            <button 
              type="submit" 
              disabled={!file || uploading} 
              className="btn-primary w-full"
            >
              {uploading ? (
                <><span className="animate-spin mr-2">⟳</span> Parsing with AI...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Parse & Extract Facts</>
              )}
            </button>
          </form>

          {profile?.resumeFacts && profile.resumeFacts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold text-sm text-gray-900">
                  Extracted Facts ({profile.resumeFacts.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {profile.resumeFacts.map((fact, i) => (
                  <div key={i} className="text-xs p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold uppercase rounded">
                        {fact.category}
                      </span>
                      {fact.employer && (
                        <span className="text-gray-500">{fact.employer}</span>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium">{fact.content}</p>
                    {fact.title && <p className="text-gray-500 mt-0.5">{fact.title}</p>}
                    {fact.bullets && fact.bullets.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {fact.bullets.map((b, j) => (
                          <li key={j} className="text-gray-600 pl-3 relative">
                            <span className="absolute left-0 text-gray-400">•</span>
                            <span className="ml-2">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile?.resumeText && !profile?.resumeFacts && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700">Resume text saved but fact extraction failed. The AI tailoring will still work with the raw text.</p>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Authorization</label>
              <select
                value={settings.workAuthorization}
                onChange={(e) => setSettings({ ...settings, workAuthorization: e.target.value })}
                className="input"
              >
                <option value="">Select authorization type...</option>
                <option value="US Citizen">US Citizen</option>
                <option value="Green Card">Green Card / Permanent Resident</option>
                <option value="H1B">H1B Visa</option>
                <option value="OPT">OPT / STEM OPT</option>
                <option value="TN Visa">TN Visa</option>
                <option value="L1 Visa">L1 Visa</option>
                <option value="O1 Visa">O1 Visa</option>
                <option value="Other">Other / Not Listed</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Used to filter jobs by work authorization requirements</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Preference</label>
              <input
                type="text"
                value={settings.locationPreference}
                onChange={(e) => setSettings({ ...settings, locationPreference: e.target.value })}
                placeholder="e.g., San Francisco, CA or New York, NY"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remote Preference</label>
              <select
                value={settings.remotePreference}
                onChange={(e) => setSettings({ ...settings, remotePreference: e.target.value })}
                className="input"
              >
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid (1-3 days in office)</option>
                <option value="onsite">On-site</option>
                <option value="any">Any / Open to all</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter Template</label>
              <textarea
                value={settings.coverLetterTemplate}
                onChange={(e) => setSettings({ ...settings, coverLetterTemplate: e.target.value })}
                rows={8}
                placeholder={`Dear Hiring Manager,

I am writing to express my interest in the {role} position at {company}. With my background in...

Use {company} and {role} as placeholders — they will be auto-filled for each job.`}
                className="input font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{company}'} and {'{role}'} as placeholders
              </p>
            </div>

            <button 
              onClick={saveSettings} 
              className="btn-primary w-full"
            >
              {saved ? (
                <><CheckCircle className="h-4 w-4 mr-2" /> Saved!</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Settings</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
