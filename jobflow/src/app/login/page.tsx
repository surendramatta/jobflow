import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <section className="card max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">Sign in to JobFlow</h1>
        <p className="text-gray-600">Your jobs, resume and application history belong to your account.</p>
        <form action={async () => {
          'use server';
          await signIn('github', { redirectTo: '/dashboard' });
        }}>
          <button className="btn-primary w-full" type="submit">Continue with GitHub</button>
        </form>
        <p className="text-sm text-gray-500">Self-hosting? Configure AUTH_GITHUB_ID, AUTH_GITHUB_SECRET and AUTH_SECRET before signing in. Demo email-only login is disabled.</p>
      </section>
    </main>
  );
}
