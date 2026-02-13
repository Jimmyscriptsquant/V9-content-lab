'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  Search,
  Grid,
  List,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  Copy,
  Eye,
  X,
  Film,
  Clock,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react';

interface VideoScene {
  sceneNumber: number;
  prompt: string;
  duration: number;
  taskId: string;
  status: string;
  videoUrl?: string;
}

interface ContentItem {
  id: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'reel' | 'carousel';
  title?: string;
  text?: string;
  status: 'draft' | 'ready' | 'published' | 'failed' | 'archived' | 'processing';
  createdAt: string;
  media?: { type: 'image' | 'video' | 'audio'; url: string }[];
  aiGeneration?: {
    textPrompt?: string;
    imagePrompt?: string;
    videoScenes?: VideoScene[];
    voiceoverText?: string;
  };
}

const typeIcons: Record<string, any> = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  voice: Mic,
  reel: Film,
  carousel: ImageIcon,
};

const statusColors: Record<string, string> = {
  draft: 'badge-ghost',
  ready: 'badge-info',
  processing: 'badge-warning',
  published: 'badge-success',
  failed: 'badge-error',
  archived: 'badge-neutral',
};

const typeColors: Record<string, string> = {
  text: 'from-blue-500/20 to-blue-600/10',
  image: 'from-purple-500/20 to-purple-600/10',
  video: 'from-red-500/20 to-red-600/10',
  voice: 'from-green-500/20 to-green-600/10',
  reel: 'from-pink-500/20 to-pink-600/10',
  carousel: 'from-amber-500/20 to-amber-600/10',
};

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    } catch {
      // Mock data for demo
      setContent([
        { id: '1', type: 'text', title: 'AI Automation Tweet', text: 'AI is revolutionizing how we work. Here are 5 ways to leverage automation in your business today...', status: 'published', createdAt: '2026-02-10' },
        { id: '2', type: 'image', title: 'Product Launch Visual', text: 'Futuristic product showcase', status: 'draft', createdAt: '2026-02-09', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400' }] },
        { id: '3', type: 'text', title: 'LinkedIn Article', text: 'The future of content creation is here. AI-powered tools are changing the game for marketers and creators alike...', status: 'ready', createdAt: '2026-02-08' },
        { id: '4', type: 'reel', title: 'Product Demo Reel', status: 'ready', createdAt: '2026-02-07', aiGeneration: { videoScenes: [{ sceneNumber: 1, prompt: 'Product showcase with modern lighting', duration: 5, taskId: 'demo-1', status: 'complete' }, { sceneNumber: 2, prompt: 'Feature highlights animation', duration: 5, taskId: 'demo-2', status: 'complete' }, { sceneNumber: 3, prompt: 'Call to action closing scene', duration: 5, taskId: 'demo-3', status: 'complete' }] } },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/content/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContent((prev) => prev.filter((item) => item.id !== id));
        toast.success('Content deleted');
      } else {
        // Fallback: remove from local state anyway for demo
        setContent((prev) => prev.filter((item) => item.id !== id));
        toast.success('Content removed');
      }
    } catch {
      setContent((prev) => prev.filter((item) => item.id !== id));
      toast.success('Content removed');
    }
    setDeleteConfirm(null);
    if (previewItem?.id === id) setPreviewItem(null);
  };

  const duplicateItem = async (item: ContentItem) => {
    const dup: ContentItem = {
      ...item,
      id: `dup_${Date.now()}`,
      title: `${item.title || 'Content'} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setContent((prev) => [dup, ...prev]);
    toast.success('Content duplicated');
  };

  const filteredContent = content.filter((item) => {
    const haystack = `${item.title || ''} ${item.text || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getPreviewThumbnail = (item: ContentItem) => {
    const imageMedia = item.media?.find((m) => m.type === 'image');
    if (imageMedia) return imageMedia.url;
    return null;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm breadcrumbs mb-1">
            <ul>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li>Content Library</li>
            </ul>
          </div>
          <h1 className="text-xl lg:text-3xl font-extrabold">Content Library</h1>
          <p className="text-base-content/60 text-sm mt-0.5">
            {content.length} item{content.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Link href="/dashboard/create" className="btn btn-primary btn-sm sm:btn-md">
          + Create Content
        </Link>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-3 lg:p-4">
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[140px]">
              <label className="input input-bordered input-sm lg:input-md flex items-center gap-2">
                <Search size={16} className="text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="grow"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            {/* Type Filter */}
            <select
              className="select select-bordered select-sm lg:select-md"
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
              className="select select-bordered select-sm lg:select-md"
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
            <div className="join">
              <button
                className={`btn btn-sm lg:btn-md join-item ${view === 'grid' ? 'btn-active' : ''}`}
                onClick={() => setView('grid')}
              >
                <Grid size={16} />
              </button>
              <button
                className={`btn btn-sm lg:btn-md join-item ${view === 'list' ? 'btn-active' : ''}`}
                onClick={() => setView('list')}
              >
                <List size={16} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {filteredContent.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            const title = item.title || `${item.type.toUpperCase()} content`;
            const preview = item.text || '';
            const thumbnail = getPreviewThumbnail(item);

            return (
              <div
                key={item.id}
                className="card bg-base-100 shadow hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
                onClick={() => setPreviewItem(item)}
              >
                {/* Thumbnail / gradient header */}
                {thumbnail ? (
                  <figure className="h-36 sm:h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                  </figure>
                ) : (
                  <div className={`h-20 sm:h-24 bg-gradient-to-br ${typeColors[item.type] || 'from-base-200 to-base-300'} flex items-center justify-center`}>
                    <Icon size={32} className="text-base-content/20" />
                  </div>
                )}

                <div className="card-body p-3 lg:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge badge-sm ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                      <span className="badge badge-sm badge-outline capitalize">{item.type}</span>
                    </div>
                    {/* Menu dropdown */}
                    <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
                      <label tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
                        <MoreVertical size={14} />
                      </label>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-44 border border-base-300 z-20">
                        <li>
                          <button onClick={() => setPreviewItem(item)}>
                            <Eye size={14} /> View
                          </button>
                        </li>
                        <li>
                          <Link href={`/dashboard/create?edit=${item.id}`}>
                            <Edit size={14} /> Edit
                          </Link>
                        </li>
                        <li>
                          <button onClick={() => duplicateItem(item)}>
                            <Copy size={14} /> Duplicate
                          </button>
                        </li>
                        <li>
                          <Link href={`/dashboard/publish?contentId=${item.id}`}>
                            <Send size={14} /> Publish
                          </Link>
                        </li>
                        <li>
                          <button className="text-error" onClick={() => setDeleteConfirm(item.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm lg:text-base mt-1 line-clamp-1">{title}</h3>
                  {preview ? (
                    <p className="text-xs lg:text-sm text-base-content/60 line-clamp-2">{preview}</p>
                  ) : item.aiGeneration?.videoScenes && item.aiGeneration.videoScenes.length > 0 ? (
                    <p className="text-xs lg:text-sm text-base-content/60">
                      {item.aiGeneration.videoScenes.length} scene{item.aiGeneration.videoScenes.length !== 1 ? 's' : ''}
                      {' '}&middot;{' '}
                      {item.aiGeneration.videoScenes.filter(s => s.status === 'complete' || s.status === 'succeed' || s.status === 'completed').length} ready
                    </p>
                  ) : item.aiGeneration?.textPrompt ? (
                    <p className="text-xs lg:text-sm text-base-content/60 line-clamp-2">{item.aiGeneration.textPrompt}</p>
                  ) : null}
                  <div className="text-xs text-base-content/40 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="card bg-base-100 shadow">
          <div className="overflow-x-auto">
            <table className="table table-sm lg:table-md">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th className="hidden sm:table-cell">Status</th>
                  <th className="hidden md:table-cell">Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => {
                  const Icon = typeIcons[item.type] || FileText;
                  const title = item.title || `${item.type.toUpperCase()} content`;
                  const preview = item.text || '';
                  return (
                    <tr
                      key={item.id}
                      className="hover cursor-pointer"
                      onClick={() => setPreviewItem(item)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <Icon size={18} className="text-primary flex-shrink-0" />
                          <span className="capitalize text-xs sm:hidden">{item.type}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-sm">{title}</div>
                          <div className="text-xs text-base-content/60 truncate max-w-[150px] sm:max-w-xs">{preview}</div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className={`badge badge-sm ${statusColors[item.status]}`}>{item.status}</span>
                      </td>
                      <td className="hidden md:table-cell text-base-content/60 text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-xs" title="View" onClick={() => setPreviewItem(item)}>
                            <Eye size={14} />
                          </button>
                          <Link href={`/dashboard/create?edit=${item.id}`} className="btn btn-ghost btn-xs" title="Edit">
                            <Edit size={14} />
                          </Link>
                          <Link href={`/dashboard/publish?contentId=${item.id}`} className="btn btn-ghost btn-xs" title="Publish">
                            <Send size={14} />
                          </Link>
                          <button className="btn btn-ghost btn-xs text-error" title="Delete" onClick={() => setDeleteConfirm(item.id)}>
                            <Trash2 size={14} />
                          </button>
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

      {/* ─── Preview Modal ─── */}
      {previewItem && (
        <div className="modal modal-open" onClick={() => setPreviewItem(null)}>
          <div
            className="modal-box max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg">
                  {previewItem.title || `${previewItem.type.toUpperCase()} content`}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`badge badge-sm ${statusColors[previewItem.status]}`}>{previewItem.status}</span>
                  <span className="badge badge-sm badge-outline capitalize">{previewItem.type}</span>
                  <span className="text-xs text-base-content/50">
                    {new Date(previewItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setPreviewItem(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Media preview */}
            {previewItem.media && previewItem.media.length > 0 && (
              <div className="space-y-3 mb-4">
                {previewItem.media.map((m, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden bg-base-200">
                    {m.type === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="w-full max-h-96 object-contain" />
                    )}
                    {m.type === 'video' && (
                      <video src={m.url} controls className="w-full max-h-96" />
                    )}
                    {m.type === 'audio' && (
                      <div className="p-4">
                        <audio src={m.url} controls className="w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text content */}
            {previewItem.text && (
              <div className="bg-base-200 rounded-xl p-4 mb-4">
                <p className="text-sm whitespace-pre-wrap">{previewItem.text}</p>
              </div>
            )}

            {/* Reel/Video scenes preview */}
            {previewItem.aiGeneration?.videoScenes && previewItem.aiGeneration.videoScenes.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-semibold text-base-content/70">
                  Scenes ({previewItem.aiGeneration.videoScenes.length})
                </h4>
                {previewItem.aiGeneration.videoScenes.map((scene) => {
                  const isDone = scene.status === 'complete' || scene.status === 'succeed' || scene.status === 'completed';
                  const isFailed = scene.status === 'failed';
                  const isProcessing = !isDone && !isFailed;
                  return (
                    <div key={scene.sceneNumber} className="bg-base-200 rounded-xl overflow-hidden">
                      {scene.videoUrl && isDone ? (
                        <video src={scene.videoUrl} controls className="w-full max-h-64" />
                      ) : (
                        <div className="p-4 flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {isDone && <CheckCircle size={18} className="text-success" />}
                            {isFailed && <XCircle size={18} className="text-error" />}
                            {isProcessing && <Clock size={18} className="text-warning animate-pulse" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">Scene {scene.sceneNumber}</span>
                              <span className={`badge badge-xs ${isDone ? 'badge-success' : isFailed ? 'badge-error' : 'badge-warning'}`}>
                                {isDone ? 'Ready' : isFailed ? 'Failed' : 'Processing'}
                              </span>
                              {scene.duration && (
                                <span className="text-xs text-base-content/50">{scene.duration}s</span>
                              )}
                            </div>
                            <p className="text-xs text-base-content/60 line-clamp-2">{scene.prompt}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI generation prompt info */}
            {!previewItem.text && previewItem.aiGeneration?.textPrompt && (
              <div className="bg-base-200 rounded-xl p-4 mb-4">
                <p className="text-xs text-base-content/50 mb-1">AI Prompt</p>
                <p className="text-sm whitespace-pre-wrap">{previewItem.aiGeneration.textPrompt}</p>
              </div>
            )}

            {/* No content placeholder */}
            {!previewItem.text
              && (!previewItem.media || previewItem.media.length === 0)
              && (!previewItem.aiGeneration?.videoScenes || previewItem.aiGeneration.videoScenes.length === 0)
              && !previewItem.aiGeneration?.textPrompt
              && (
              <div className="bg-base-200 rounded-xl p-8 mb-4 flex flex-col items-center text-base-content/40">
                <FileText size={32} className="mb-2" />
                <p className="text-sm">No preview content available</p>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/create?edit=${previewItem.id}`}
                className="btn btn-outline btn-sm gap-1 flex-1 sm:flex-none"
              >
                <Edit size={14} /> Edit
              </Link>
              <button
                className="btn btn-outline btn-sm gap-1 flex-1 sm:flex-none"
                onClick={() => { duplicateItem(previewItem); setPreviewItem(null); }}
              >
                <Copy size={14} /> Duplicate
              </button>
              <Link
                href={`/dashboard/publish?contentId=${previewItem.id}`}
                className="btn btn-primary btn-sm gap-1 flex-1 sm:flex-none"
              >
                <Send size={14} /> Publish
              </Link>
              <button
                className="btn btn-error btn-outline btn-sm gap-1 flex-1 sm:flex-none"
                onClick={() => setDeleteConfirm(previewItem.id)}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <div className="modal modal-open" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Delete Content?</h3>
            <p className="py-3 text-sm text-base-content/70">
              This will permanently remove this content from your library. This action cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-error btn-sm" onClick={() => deleteItem(deleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
