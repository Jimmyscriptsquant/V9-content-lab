"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import config from "@/config";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in, redirect to dashboard
  if (status === "authenticated") {
    router.push(config.auth.callbackUrl);
    return null;
  }

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: config.auth.callbackUrl,
      });

      if (res?.error) {
        setError(
          "Login failed. Check that DEV_LOGIN_PASSWORD is set in .env.local and MONGODB_URI is configured."
        );
      } else if (res?.url) {
        router.push(res.url);
      }
    } catch {
      setError("Something went wrong. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: config.auth.callbackUrl });
  };

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">Sign in to {config.appName}</h1>
            <p className="text-base-content/60 mt-1">
              Access your dashboard, create content, and manage API keys.
            </p>
          </div>

          {/* Dev Login Form */}
          <form onSubmit={handleDevLogin} className="space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Your DEV_LOGIN_PASSWORD"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error text-sm py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="divider text-xs text-base-content/40">OR</div>

          {/* Google OAuth */}
          <button onClick={handleGoogleLogin} className="btn btn-outline w-full">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Setup help */}
          <div className="mt-4 p-3 bg-base-200 rounded-lg text-xs text-base-content/60 space-y-1">
            <p className="font-semibold text-base-content/80">Local dev setup:</p>
            <p>
              1. Copy <code className="bg-base-300 px-1 rounded">env.example</code> →{" "}
              <code className="bg-base-300 px-1 rounded">.env.local</code>
            </p>
            <p>
              2. Set <code className="bg-base-300 px-1 rounded">MONGODB_URI</code> (
              <a
                href="https://www.mongodb.com/atlas/database"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                free Atlas cluster
              </a>
              )
            </p>
            <p>
              3. Set <code className="bg-base-300 px-1 rounded">DEV_LOGIN_PASSWORD=test123</code>
            </p>
            <p>4. Restart <code className="bg-base-300 px-1 rounded">npm run dev</code></p>
            <p>5. Log in above with any email + that password</p>
          </div>

          <Link href="/" className="btn btn-ghost btn-sm w-full mt-2">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
