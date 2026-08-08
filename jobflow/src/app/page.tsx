import Link from 'next/link';
import { Briefcase, Sparkles, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary-600 flex items-center justify-center">
                <Briefcase className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              JobFlow
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              AI-powered job application assistant. Tailor your resume and cover letter 
              for every job — with full transparency and your approval at every step.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/dashboard"
                className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Get Started
              </Link>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: 'AI Tailoring',
                  description: 'Our AI rephrases and reorganizes your existing experience to match each job description. No fabricated facts.',
                },
                {
                  icon: Shield,
                  title: 'You Control Everything',
                  description: 'Review every change with a structured diff view. Approve or reject before any submission.',
                },
                {
                  icon: Zap,
                  title: 'Track Everything',
                  description: 'Full audit log of what was submitted, when, and to which ATS. Never lose track of an application.',
                },
              ].map((feature) => (
                <div key={feature.title} className="card text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
