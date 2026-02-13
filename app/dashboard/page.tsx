import { auth } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import config from "@/config";
import { 
  Key, 
  Plug, 
  FileText, 
  Send, 
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  // DEV BYPASS: skip auth when SKIP_AUTH=1 in development
  const skipAuth = process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "1";

  let session: any = skipAuth
    ? {
        user: {
          id: "000000000000000000000001",
          name: "Dev User",
          email: "admin@velocitynine-labs.com",
          image: null,
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      }
    : await auth();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  const quickActions = [
    {
      title: "Create Content",
      description: "Generate text, images, videos with AI",
      href: "/dashboard/create",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "API Keys",
      description: "Manage your API access",
      href: "/dashboard/api-keys",
      icon: Key,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Connected Accounts",
      description: "Manage social media connections",
      href: "/dashboard/accounts",
      icon: Plug,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Content Library",
      description: "View and manage your content",
      href: "/dashboard/content",
      icon: FileText,
      color: "from-orange-500 to-yellow-500",
    },
  ];

  // Recent activity (mock data)
  const recentActivity = [
    { type: 'created', item: 'AI-generated tweet about productivity', time: '2 hours ago' },
    { type: 'published', item: 'Instagram post to @mybrand', time: '5 hours ago' },
    { type: 'scheduled', item: 'LinkedIn article for tomorrow', time: '1 day ago' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Welcome back{session.user?.name ? `, ${session.user.name}` : ""}! 👋
        </h1>
        <p className="text-base-content/70">
          Create, generate, and publish content from one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat bg-base-100 rounded-xl shadow p-3 sm:p-4">
          <div className="stat-figure text-primary hidden sm:block">
            <FileText size={24} />
          </div>
          <div className="stat-title text-xs sm:text-sm">Content Created</div>
          <div className="stat-value text-primary text-xl sm:text-2xl lg:text-3xl">0</div>
          <div className="stat-desc text-xs">This month</div>
        </div>
        <div className="stat bg-base-100 rounded-xl shadow p-3 sm:p-4">
          <div className="stat-figure text-secondary hidden sm:block">
            <Send size={24} />
          </div>
          <div className="stat-title text-xs sm:text-sm">Published</div>
          <div className="stat-value text-secondary text-xl sm:text-2xl lg:text-3xl">0</div>
          <div className="stat-desc text-xs">This month</div>
        </div>
        <div className="stat bg-base-100 rounded-xl shadow p-3 sm:p-4">
          <div className="stat-figure text-accent hidden sm:block">
            <Plug size={24} />
          </div>
          <div className="stat-title text-xs sm:text-sm">Accounts</div>
          <div className="stat-value text-accent text-xl sm:text-2xl lg:text-3xl">0</div>
          <div className="stat-desc text-xs">Connected</div>
        </div>
        <div className="stat bg-base-100 rounded-xl shadow p-3 sm:p-4">
          <div className="stat-figure text-info hidden sm:block">
            <Zap size={24} />
          </div>
          <div className="stat-title text-xs sm:text-sm">API Requests</div>
          <div className="stat-value text-info text-xl sm:text-2xl lg:text-3xl">0</div>
          <div className="stat-desc text-xs">This month</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="card bg-base-100 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer shadow"
              >
                <div className="card-body">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="card-title text-lg">{action.title}</h3>
                  <p className="text-sm text-base-content/70">{action.description}</p>
                  <div className="card-actions justify-end mt-2">
                    <ArrowRight size={18} className="text-base-content/50" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">
              <Clock size={20} />
              Recent Activity
            </h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-3 mt-2">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                    <div className={`badge ${
                      activity.type === 'created' ? 'badge-primary' :
                      activity.type === 'published' ? 'badge-success' :
                      'badge-warning'
                    }`}>
                      {activity.type}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.item}</p>
                      <p className="text-xs text-base-content/60">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/60">
                <p>No recent activity</p>
                <Link href="/dashboard/create" className="btn btn-primary btn-sm mt-4">
                  Create Content
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* API Quick Start */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow">
          <div className="card-body">
            <h2 className="card-title">
              <Key size={20} />
              API Quick Start
            </h2>
            <p className="text-base-content/70 mb-4">
              Use your API key to create and publish content programmatically.
            </p>
            <div className="mockup-code bg-base-300 text-xs overflow-x-auto">
              <pre data-prefix="$"><code>curl -X POST /v1/generate \</code></pre>
              <pre data-prefix=" "><code>  -H "Authorization: Bearer v9cf_..." \</code></pre>
              <pre data-prefix=" "><code>  -d '{`{"type": "text", "prompt": "..."}`}'</code></pre>
            </div>
            <div className="card-actions justify-end mt-4">
              <Link href="/docs/api" className="btn btn-ghost btn-sm">
                View Docs
              </Link>
              <Link href="/dashboard/api-keys" className="btn btn-primary btn-sm">
                Get API Key
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">
              <TrendingUp size={20} />
              Usage Overview
            </h2>
            <Link href="/dashboard/analytics" className="btn btn-ghost btn-sm">
              View Analytics →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-base-200 rounded-xl p-4">
              <div className="text-sm text-base-content/60 mb-1">Text Generations</div>
              <div className="text-2xl font-bold">0 / 100</div>
              <progress className="progress progress-primary w-full mt-2" value="0" max="100"></progress>
            </div>
            <div className="bg-base-200 rounded-xl p-4">
              <div className="text-sm text-base-content/60 mb-1">Image Generations</div>
              <div className="text-2xl font-bold">0 / 50</div>
              <progress className="progress progress-secondary w-full mt-2" value="0" max="100"></progress>
            </div>
            <div className="bg-base-200 rounded-xl p-4">
              <div className="text-sm text-base-content/60 mb-1">Posts Published</div>
              <div className="text-2xl font-bold">0 / 100</div>
              <progress className="progress progress-accent w-full mt-2" value="0" max="100"></progress>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
