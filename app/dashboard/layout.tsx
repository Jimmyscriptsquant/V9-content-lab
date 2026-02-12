import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/libs/next-auth";
import config from "@/config";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

// Dashboard layout with sidebar navigation
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // DEV BYPASS: skip auth when SKIP_AUTH=1 in development
  const skipAuth = process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "1";

  let session: any = null;

  if (skipAuth) {
    session = {
      user: {
        id: "000000000000000000000001",
        name: "Dev User",
        email: "admin@velocitynine-labs.com",
        image: null,
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
  } else {
    try {
      session = await auth();
    } catch (error) {
      console.error("Dashboard auth error:", error);

      return (
        <div className="min-h-screen bg-base-200 p-6">
          <div className="max-w-2xl mx-auto card bg-base-100 shadow">
            <div className="card-body">
              <h1 className="card-title text-2xl">Auth setup required</h1>
              <p className="text-base-content/70">
                The dashboard requires NextAuth to be configured. Your server logs show a NextAuth
                config error (commonly missing <code>NEXTAUTH_SECRET</code>).
              </p>

              <div className="mt-4">
                <p className="font-semibold mb-2">Fix:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    Copy <code>env.example</code> → <code>.env.local</code>
                  </li>
                  <li>
                    Set <code>NEXTAUTH_SECRET</code> (any random string for local dev)
                  </li>
                  <li>
                    Set auth provider env vars (e.g. <code>GOOGLE_ID</code>/<code>GOOGLE_SECRET</code>)
                    or adjust providers
                  </li>
                  <li>Restart the dev server</li>
                </ol>
              </div>

              <div className="mt-4 flex gap-2">
                <Link className="btn btn-primary" href="/">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!session) {
      redirect(config.auth.loginUrl);
    }
  }

  return (
    <div className="flex min-h-screen bg-base-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
