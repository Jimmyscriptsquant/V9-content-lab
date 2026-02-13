'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Sparkles,
  Key,
  Plug,
  FileText,
  Send,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  Film,
  MoreHorizontal,
} from 'lucide-react';
import { useReelJobs } from './ReelJobProvider';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create', href: '/dashboard/create', icon: Sparkles },
  { name: 'Content Library', href: '/dashboard/content', icon: FileText },
  { name: 'Publish', href: '/dashboard/publish', icon: Send },
  { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Plug },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { jobs, setActiveJobId } = useReelJobs();
  const processingJobs = jobs.filter((j) => j.status === 'processing');
  const completedJobs = jobs.filter((j) => j.status === 'ready');

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-base-100 border-r border-base-300 min-h-screen transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-base-300">
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/logo.svg"
                alt="V9 Content Lab"
                width={40}
                height={40}
                className="rounded-xl flex-shrink-0"
                priority
              />
              <div>
                <span className="text-lg font-bold leading-tight block">Content Lab</span>
                <span className="text-xs text-base-content/60 block">by V9 Labs</span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex justify-center">
              <Image
                src="/logo.svg"
                alt="V9 Content Lab"
                width={40}
                height={40}
                className="rounded-xl"
                priority
              />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-md'
                    : 'hover:bg-base-200'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-base-300">
          {/* Active Reel Jobs */}
          {(processingJobs.length > 0 || completedJobs.length > 0) && !isCollapsed && (
            <div className="mb-3 space-y-1.5">
              {processingJobs.map((job) => {
                const done = job.scenes.filter((s) => s.status === 'complete' || s.status === 'failed').length;
                const total = job.scenes.length;
                return (
                  <Link
                    key={job.id}
                    href="/dashboard/create"
                    onClick={() => setActiveJobId(job.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-xl text-xs hover:bg-warning/20 transition-colors"
                  >
                    <span className="loading loading-spinner loading-xs text-warning" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <p className="text-base-content/50">{done}/{total} scenes</p>
                    </div>
                  </Link>
                );
              })}
              {completedJobs.map((job) => (
                <Link
                  key={job.id}
                  href="/dashboard/create"
                  onClick={() => setActiveJobId(job.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/30 rounded-xl text-xs hover:bg-success/20 transition-colors"
                >
                  <Film size={14} className="text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-success">{job.scenes.length} scenes ready</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* Collapsed job indicator */}
          {(processingJobs.length > 0 || completedJobs.length > 0) && isCollapsed && (
            <Link
              href="/dashboard/create"
              className="flex justify-center mb-3 relative"
              title={`${processingJobs.length} processing, ${completedJobs.length} ready`}
            >
              <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center relative">
                <Film size={18} className={processingJobs.length > 0 ? 'text-warning' : 'text-success'} />
                {processingJobs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning text-[10px] font-bold flex items-center justify-center text-warning-content">
                    {processingJobs.length}
                  </span>
                )}
              </div>
            </Link>
          )}

          {/* Usage Stats */}
          {!isCollapsed && (
            <div className="px-3 py-2 mb-3 bg-base-200 rounded-xl">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-base-content/60">API Usage</span>
                <span className="font-medium">0 / 100</span>
              </div>
              <progress className="progress progress-primary w-full h-2" value="0" max="100"></progress>
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-base-200 transition-colors text-base-content/60"
          >
            <ChevronLeft size={18} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50 safe-area-bottom">
        <div className="flex justify-around py-1.5 px-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors min-w-0 ${
                  isActive ? 'text-primary' : 'text-base-content/60'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] mt-0.5 truncate">{item.name === 'Content Library' ? 'Library' : item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
          {/* More dropdown for remaining items */}
          <div className="dropdown dropdown-top dropdown-end">
            <label tabIndex={0} className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              navItems.slice(4).some((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                ? 'text-primary' : 'text-base-content/60'
            }`}>
              <MoreHorizontal size={18} />
              <span className="text-[10px] mt-0.5">More</span>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 mb-2 shadow-lg bg-base-100 rounded-box w-48 border border-base-300">
              {navItems.slice(4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={isActive ? 'active' : ''}>
                      <Icon size={16} /> {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
