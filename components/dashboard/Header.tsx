'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Plus, Bell, ChevronDown, FileText, Image as ImageIcon, Film, Send } from 'lucide-react';
import ButtonAccount from '@/components/ButtonAccount';
import V9Logo from '@/components/Logo';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/dashboard/content?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-base-100 border-b border-base-300 px-3 lg:px-6 py-2.5 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <Link href="/dashboard" className="lg:hidden flex items-center flex-shrink-0">
          <V9Logo variant="compact" width={120} />
        </Link>

        {/* Search Bar - grows to fill available space */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <label className="input input-bordered input-sm flex items-center gap-2 w-full">
            <Search size={16} className="text-base-content/40" />
            <input
              type="text"
              placeholder="Search content..."
              className="grow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </form>

        {/* Spacer for desktop */}
        <div className="flex-1 md:hidden" />

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Single Create button with dropdown */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-primary btn-sm gap-1 px-3">
              <Plus size={16} />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown size={14} className="hidden sm:inline opacity-70" />
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300 mt-1">
              <li>
                <Link href="/dashboard/create">
                  <Plus size={14} /> New Content
                </Link>
              </li>
              <li>
                <Link href="/dashboard/create?type=text">
                  <FileText size={14} /> Generate Text
                </Link>
              </li>
              <li>
                <Link href="/dashboard/create?type=image">
                  <ImageIcon size={14} /> Generate Image
                </Link>
              </li>
              <li>
                <Link href="/dashboard/create?type=reel">
                  <Film size={14} /> Create Reel
                </Link>
              </li>
              <div className="divider my-1" />
              <li>
                <Link href="/dashboard/publish">
                  <Send size={14} /> Quick Publish
                </Link>
              </li>
            </ul>
          </div>

          {/* Notifications */}
          <button className="btn btn-ghost btn-circle btn-sm">
            <div className="indicator">
              <Bell size={18} />
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </button>

          {/* User Account */}
          <ButtonAccount />
        </div>
      </div>

      {/* Mobile Search */}
      <form onSubmit={handleSearch} className="md:hidden mt-2">
        <label className="input input-bordered input-sm flex items-center gap-2 w-full">
          <Search size={14} className="text-base-content/40" />
          <input
            type="text"
            placeholder="Search content..."
            className="grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </form>
    </header>
  );
}
