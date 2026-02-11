'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Send,
  Image as ImageIcon,
  Video,
  Calendar,
  Globe,
  Check,
  AlertCircle,
  Library,
  Search,
  X,
} from 'lucide-react';

const platforms = [
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', maxLength: 280 },
  { id: 'instagram', name: 'Instagram', icon: '📸', maxLength: 2200 },
  { id: 'facebook', name: 'Facebook', icon: '📘', maxLength: 63206 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', maxLength: 3000 },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', maxLength: 2200 },
];

export default function PublishPage() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const searchParams = useSearchParams();
  const contentId = searchParams.get('contentId');

  useEffect(() => {
    const loadContent = async () => {
      if (!contentId) return;
      try {
        const res = await fetch(`/api/v1/content?id=${contentId}`);
        const data = await res.json();
        if (data.success) {
          setContent(data.data?.text || '');
          setSelectedContentId(data.data?.id || data.data?._id || contentId);
          const firstMedia = data.data?.media?.[0];
          if (firstMedia?.url) {
            setSelectedMediaUrl(firstMedia.url);
            setMediaType(firstMedia.type === 'video' ? 'video' : 'image');
          }
        }
      } catch (e) {
        console.error('Failed to load content:', e);
      }
    };
    loadContent();
  }, [contentId]);

  const openPicker = async () => {
    setPickerOpen(true);
    setLibraryError(null);
    setPickerLoading(true);
    try {
      const res = await fetch('/api/v1/content?limit=50&offset=0');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLibraryItems([]);
        setLibraryError(data?.error || 'Failed to load library');
        return;
      }
      setLibraryItems(data.data?.items || []);
    } catch (e) {
      console.error('Failed to load library:', e);
      setLibraryError('Failed to load library');
    } finally {
      setPickerLoading(false);
    }
  };

  const pickItem = async (item: any) => {
    try {
      const id = item?.id || item?._id;
      if (!id) return;
      const res = await fetch(`/api/v1/content?id=${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || 'Failed to load content');
        return;
      }

      setSelectedContentId(id);
      setContent(data.data?.text || '');

      const firstMedia = data.data?.media?.[0];
      if (firstMedia?.url) {
        setSelectedMediaUrl(firstMedia.url);
        setMediaType(firstMedia.type === 'video' ? 'video' : 'image');
      } else {
        setSelectedMediaUrl(null);
        setMediaType('none');
      }

      setPickerOpen(false);
    } catch (e) {
      console.error('Failed to pick item:', e);
      alert('Failed to load content');
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    
    setIsPublishing(true);
    try {
      const payload = {
        ...(selectedContentId ? { contentId: selectedContentId } : (contentId ? { contentId } : {})),
        text: content,
        platforms: selectedPlatforms,
        ...(selectedMediaUrl ? { mediaUrls: [selectedMediaUrl] } : {}),
        ...(scheduleType === 'schedule' && {
          scheduledFor: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        }),
      };

      const res = await fetch('/api/v1/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || 'Publishing failed. Please try again.');
        return;
      }

      const results = data.data?.results || [];
      const okCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - okCount;

      alert(
        scheduleType === 'now'
          ? `Publish complete: ${okCount} succeeded, ${failCount} failed`
          : `Schedule complete: ${okCount} scheduled, ${failCount} failed`
      );

      setContent('');
      setSelectedPlatforms([]);
    } catch (error) {
      console.error('Publish failed:', error);
      alert('Publishing failed. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const getMinLength = () => {
    const selected = platforms.filter(p => selectedPlatforms.includes(p.id));
    return selected.length > 0 ? Math.min(...selected.map(p => p.maxLength)) : 280;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm breadcrumbs mb-2">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li>Publish</li>
          </ul>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold flex items-center gap-2">
          <Send className="text-primary" />
          Publish Content
        </h1>
        <p className="text-base-content/60 mt-1">
          Post to multiple platforms at once
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Content Input */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="card-title">Content</h2>
                <div className="flex items-center gap-2">
                  <button className="btn btn-outline btn-sm" onClick={openPicker} type="button">
                    <Library size={16} />
                    Choose from Library
                  </button>
                  {selectedContentId ? (
                    <span className="badge badge-success badge-outline">
                      Using library item
                    </span>
                  ) : null}
                </div>
              </div>

              <textarea
                className="textarea textarea-bordered h-40 text-lg"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMediaType(mediaType === 'image' ? 'none' : 'image')}
                    className={`btn btn-sm ${mediaType === 'image' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <ImageIcon size={16} />
                    Image
                  </button>
                  <button
                    onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
                    className={`btn btn-sm ${mediaType === 'video' ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <Video size={16} />
                    Video
                  </button>
                </div>
                <div className="text-sm text-base-content/60">
                  {content.length} / {getMinLength()}
                </div>
              </div>

              {mediaType !== 'none' && (
                <div className="mt-4 p-8 border-2 border-dashed border-base-300 rounded-xl text-center">
                  <input type="file" className="hidden" id="media-upload" accept={mediaType === 'image' ? 'image/*' : 'video/*'} />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    {mediaType === 'image' ? <ImageIcon size={32} className="mx-auto mb-2 text-base-content/40" /> : <Video size={32} className="mx-auto mb-2 text-base-content/40" />}
                    <p className="text-base-content/60">Click to upload {mediaType}</p>
                  </label>
                </div>
              )}

              {selectedMediaUrl ? (
                <div className="mt-4 card bg-base-200 border border-base-300">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">Selected media</div>
                      <button
                        className="btn btn-ghost btn-xs"
                        type="button"
                        onClick={() => {
                          setSelectedMediaUrl(null);
                          setMediaType('none');
                        }}
                      >
                        <X size={14} />
                        Remove
                      </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {mediaType === 'image' ? (
                      <img
                        src={selectedMediaUrl}
                        alt="Selected media"
                        className="w-full max-h-[360px] object-contain rounded-lg bg-base-100 border border-base-300"
                      />
                    ) : (
                      <div className="text-sm text-base-content/70">
                        Video selected: <code className="break-all">{selectedMediaUrl}</code>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Schedule Options */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title mb-4">When to publish?</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    className="radio radio-primary"
                    checked={scheduleType === 'now'}
                    onChange={() => setScheduleType('now')}
                  />
                  <span>Publish now</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schedule"
                    className="radio radio-primary"
                    checked={scheduleType === 'schedule'}
                    onChange={() => setScheduleType('schedule')}
                  />
                  <span>Schedule for later</span>
                </label>
              </div>

              {scheduleType === 'schedule' && (
                <div className="flex gap-4 mt-4">
                  <div className="form-control flex-1">
                    <label className="label"><span className="label-text">Date</span></label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="form-control flex-1">
                    <label className="label"><span className="label-text">Time</span></label>
                    <input
                      type="time"
                      className="input input-bordered"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Platform Selection */}
        <div className="space-y-4">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <Globe size={20} />
                Select Platforms
              </h2>
              <div className="space-y-2">
                {platforms.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const isTooLong = content.length > platform.maxLength;
                  
                  return (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-base-200 border-2 border-transparent hover:bg-base-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isSelected}
                        onChange={() => togglePlatform(platform.id)}
                      />
                      <span className="text-2xl">{platform.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{platform.name}</div>
                        <div className="text-xs text-base-content/60">Max {platform.maxLength} chars</div>
                      </div>
                      {isSelected && isTooLong && (
                        <AlertCircle size={18} className="text-warning" />
                      )}
                    </label>
                  );
                })}
              </div>

              {selectedPlatforms.length === 0 && (
                <p className="text-sm text-base-content/60 mt-2">
                  Select at least one platform to publish
                </p>
              )}
            </div>
          </div>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={!content.trim() || selectedPlatforms.length === 0 || isPublishing}
            className={`btn btn-primary btn-lg w-full ${isPublishing ? 'loading' : ''}`}
          >
            {isPublishing ? 'Publishing...' : (
              <>
                {scheduleType === 'now' ? <Send size={20} /> : <Calendar size={20} />}
                {scheduleType === 'now' ? 'Publish Now' : 'Schedule Post'}
              </>
            )}
          </button>

          {/* Preview */}
          {content && selectedPlatforms.length > 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="font-bold text-sm mb-2">Preview</h3>
                <div className="bg-base-200 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{content}</p>
                </div>
                <div className="flex gap-1 mt-2">
                  {selectedPlatforms.map(p => {
                    const platform = platforms.find(pl => pl.id === p);
                    return (
                      <span key={p} className="badge badge-sm">{platform?.icon}</span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Picker Modal */}
      {pickerOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-lg">Choose from Content Library</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPickerOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="form-control mt-4">
              <div className="join w-full">
                <input
                  className="input input-bordered join-item w-full"
                  placeholder="Search title or text..."
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                />
                <button className="btn btn-primary join-item" type="button">
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              {pickerLoading ? (
                <div className="py-10 flex justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : libraryError ? (
                <div className="alert alert-error">
                  <AlertCircle size={20} />
                  <span>{libraryError}</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-base-300 rounded-xl">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Title / Preview</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {libraryItems
                        .filter((it) => {
                          const q = pickerQuery.trim().toLowerCase();
                          if (!q) return true;
                          const hay = `${it.title || ''} ${it.text || ''}`.toLowerCase();
                          return hay.includes(q);
                        })
                        .slice(0, 50)
                        .map((it) => (
                          <tr key={it.id}>
                            <td className="font-medium">{it.type}</td>
                            <td>
                              <div className="font-semibold">{it.title || 'Untitled'}</div>
                              <div className="text-sm text-base-content/60 truncate max-w-md">
                                {it.text || (it.media?.[0]?.url ? `Media: ${it.media[0].url}` : '—')}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-outline">{it.status}</span>
                            </td>
                            <td className="text-sm text-base-content/60">
                              {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="text-right">
                              <button className="btn btn-primary btn-sm" type="button" onClick={() => pickItem(it)}>
                                Use this
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setPickerOpen(false)} type="button">
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPickerOpen(false)} />
        </div>
      )}
    </div>
  );
}
