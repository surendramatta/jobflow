'use client';

import { useState } from 'react';
import { Shield, Bell, Database, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    statusChanges: true,
    weeklyDigest: false,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emailUpdates', label: 'Application status emails', desc: 'Get notified when application status changes' },
              { key: 'statusChanges', label: 'Real-time status updates', desc: 'Show in-app notifications for status changes' },
              { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Receive a weekly summary of your job search activity' },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Safety */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Privacy & Safety</h2>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">AI Safety Guardrails Active</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    JobFlow will never invent facts on your resume. All tailoring is based on your uploaded resume only.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Data Retention</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Your resume and job data is stored locally in your database. You can export or delete it at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Delete all data</p>
                <p className="text-xs text-gray-500">Permanently delete all jobs, applications, and resume data</p>
              </div>
              <button 
                onClick={() => confirm('This will delete ALL your data. Are you sure?')}
                className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
