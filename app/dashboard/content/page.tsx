'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Mic,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  Copy,
} from 'lucide-react';

interface ContentItem {
  id: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'reel' | 'carousel';
  title?: string;
  text?: string;
  status: 'draft' | 'ready' | 'published' | 'failed' | 'archived';
  createdAt: string;
  media?: { type: 'image' | 'video' | 'audio'; url: string }[];
}

const typeIcons = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  voice: Mic,
  reel: Video,
  carousel: ImageIcon,
};

const statusColors = {
  draft: 'badge-ghost',
  ready: 'badge-info',
  published: 'badge-success',
  failed: 'badge-error',
  archived: 'badge-neutral',
};

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/content');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setContent(data.data?.items || []);
        }
      }
    } catch (error) {
      // Mock data for demo
      setContent([
        { id: '1', type: 'text', title: 'AI Automation Tweet', text: 'AI is revolutionizing how we work...', status: 'published', createdAt: '2026-02-10' },
        { id: '2', type: 'image', title: 'Product Launch Visual', text: 'Futuristic product showcase', status: 'draft', createdAt: '2026-02-09' },
        { id: '3', type: 'text', title: 'LinkedIn Article', text: 'The future of content creation...', status: 'ready', createdAt: '2026-02-08' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContent = content.filter((item) => {
    const haystack = `${item.title || ''} ${item.text || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-sm breadcrumbs mb-2">
            <ul>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li>Content Library</li>
            </ul>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">Content Library</h1>
          <p className="text-base-content/60 mt-1">
            {content.length} items in your library
          </p>
        </div>
        <Link href="/dashboard/create" className="btn btn-primary">
          ➕ Create Content
        </Link>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="form-control flex-1 min-w-[200px]">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search content..."
                  className="input input-bordered w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-square">
                  <Search size={20} />
                </button>
              </div>
            </div>

            {/* Type Filter */}
            <select
              className="select select-bordered"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="voice">Voice</option>
              <option value="reel">Reel</option>
              <option value="carousel">Carousel</option>
            </select>

            {/* Status Filter */}
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
              <option value="archived">Archived</option>
            </select>

            {/* View Toggle */}
            <div className="btn-group">
              <button
                className={`btn ${view === 'grid' ? 'btn-active' : ''}`}
                onClick={() => setView('grid')}
              >
                <Grid size={18} />
              </button>
              <button
                className={`btn ${view === 'list' ? 'btn-active' : ''}`}
                onClick={() => setView('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid/List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-12">
            <FileText size={48} className="text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold">No content yet</h3>
            <p className="text-base-content/60">Create your first piece of content to get started</p>
            <Link href="/dashboard/create" className="btn btn-primary mt-4">
              Create Content
            </Link>
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => {
            const Icon = typeIcons[item.type];
            const title = item.title || `${item.type.toUpperCase()} content`;
            const preview = item.text
              ? item.text
              : item.media?.[0]?.url
                ? `Media: ${item.media[0].url}`
                : '—';
            return (
              <div key={item.id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={20} className="text-primary" />
                      <span className={`badge ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
                        <MoreVertical size={16} />
                      </label>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-300">
                        <li><a><Edit size={14} /> Edit</a></li>
                        <li><a><Copy size={14} /> Duplicate</a></li>
                        <li><a><Send size={14} /> Publish</a></li>
                        <li><a className="text-error"><Trash2 size={14} /> Delete</a></li>
                      </ul>
                    </div>
                  </div>
                  <h3 className="font-bold mt-2">{title}</h3>
                  <p className="text-sm text-base-content/60 line-clamp-2">{preview}</p>
                  <div className="text-xs text-base-content/40 mt-2">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => {
                  const Icon = typeIcons[item.type];
                  const title = item.title || `${item.type.toUpperCase()} content`;
                  const preview = item.text
                    ? item.text
                    : item.media?.[0]?.url
                      ? `Media: ${item.media[0].url}`
                      : '—';
                  return (
                    <tr key={item.id} className="hover">
                      <td><Icon size={20} className="text-primary" /></td>
                      <td>
                        <div>
                          <div className="font-medium">{title}</div>
                          <div className="text-sm text-base-content/60 truncate max-w-xs">{preview}</div>
                        </div>
                      </td>
                      <td><span className={`badge ${statusColors[item.status]}`}>{item.status}</span></td>
                      <td className="text-base-content/60">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-xs"><Edit size={14} /></button>
                          <button className="btn btn-ghost btn-xs"><Send size={14} /></button>
                          <button className="btn btn-ghost btn-xs text-error"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
