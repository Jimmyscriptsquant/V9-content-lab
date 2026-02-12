'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Mic,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Download,
  Send,
  Palette,
  Upload,
  Plus,
  Film,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  GripVertical,
  Settings2,
  Eye,
  Layers,
  Clock,
  Volume2,
  ImagePlus,
  FileVideo,
  X,
} from 'lucide-react';
import SocialPostPreview, { type PreviewPlatform } from '@/components/dashboard/SocialPostPreview';

/* ───────── Types ───────── */

type ContentType = 'text' | 'image' | 'reel';

interface UploadedMedia {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
}

interface ReelScene {
  sceneNumber: number;
  durationSeconds: number;
  visualPrompt: string;
  onScreenText: string;
  narration: string;
  camera: string;
  voice: string;
  mediaRef?: string; // URL of user-uploaded media for this scene
}

/* ───────── Constants ───────── */

const AI_VIDEO_MODELS = [
  { id: 'kling-v1', name: 'Kling v1', desc: 'Standard quality, fast' },
  { id: 'kling-v1-5', name: 'Kling v1.5', desc: 'Higher quality, slower' },
  { id: 'kling-v1-5-pro', name: 'Kling v1.5 Pro', desc: 'Best quality' },
];

const AI_VOICES = [
  { id: 'alloy', name: 'Alloy', desc: 'Neutral & balanced' },
  { id: 'echo', name: 'Echo', desc: 'Warm & clear' },
  { id: 'fable', name: 'Fable', desc: 'Expressive & dynamic' },
  { id: 'onyx', name: 'Onyx', desc: 'Deep & authoritative' },
  { id: 'nova', name: 'Nova', desc: 'Friendly & upbeat' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Soft & gentle' },
];

const textTemplates = [
  { id: 'tweet', name: 'Tweet / X Post', maxLength: 280 },
  { id: 'thread', name: 'Twitter Thread', maxLength: 2000 },
  { id: 'instagram', name: 'Instagram Caption', maxLength: 2200 },
  { id: 'linkedin', name: 'LinkedIn Post', maxLength: 3000 },
  { id: 'tiktok', name: 'TikTok Caption', maxLength: 2200 },
  { id: 'youtube', name: 'YouTube Description', maxLength: 5000 },
];

/* ───────── Component ───────── */

export default function CreatePage() {
  const [activeType, setActiveType] = useState<ContentType>('reel');
  const [prompt, setPrompt] = useState('');
  const [template, setTemplate] = useState('tweet');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [latestContentId, setLatestContentId] = useState<string | null>(null);
  const [reelResult, setReelResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('instagram');

  // Brand Kit
  const [brandKit, setBrandKit] = useState<any>(null);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  // Reel state
  const [reelPlatform, setReelPlatform] = useState<'instagram' | 'tiktok' | 'youtube_shorts'>('instagram');
  const [reelDuration, setReelDuration] = useState<15 | 30>(30);
  const [planLoading, setPlanLoading] = useState(false);
  const [reelPlan, setReelPlan] = useState<{ title: string; hook: string; scenes: ReelScene[] } | null>(null);
  const [reelGenerating, setReelGenerating] = useState(false);
  const [selectedVideoModel, setSelectedVideoModel] = useState('kling-v1');
  const [globalVoice, setGlobalVoice] = useState('alloy');
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);

  // Media library
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings panel
  const [settingsTab, setSettingsTab] = useState<'media' | 'voice' | 'brand'>('media');

  /* ───── Load brand kit ───── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/brand-kit');
        const data = await res.json();
        if (data.success) {
          setBrandKit(data.data || { brandName: '', voice: '', audience: '', keywords: [], colors: [], assets: [] });
        }
      } catch (e) { console.error('Failed to load brand kit:', e); }
    })();
  }, []);

  /* ───── Computed ───── */
  const reelTotalSeconds = useMemo(() => {
    return (reelPlan?.scenes || []).reduce((s, sc) => s + (Number(sc.durationSeconds) || 0), 0);
  }, [reelPlan]);

  const activeScene = reelPlan?.scenes?.[activeSceneIdx] || null;
  const hasContent = !!(generatedText || generatedImageUrl);

  /* ───── Media upload ───── */
  const handleUploadMedia = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/v1/uploads', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok && data.success) {
          const media: UploadedMedia = {
            id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            url: data.data.url,
            mimeType: data.data.mimeType,
            size: data.data.size,
            thumbnail: file.type.startsWith('image/') ? data.data.url : undefined,
          };
          setMediaFiles((prev) => [...prev, media]);
        }
      }
    } catch (e) { console.error('Upload failed:', e); }
    finally { setUploading(false); }
  }, []);

  const removeMedia = (id: string) => setMediaFiles((prev) => prev.filter((m) => m.id !== id));

  const attachMediaToScene = (sceneIdx: number, url: string) => {
    setReelPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, scenes: [...prev.scenes] };
      next.scenes[sceneIdx] = { ...next.scenes[sceneIdx], mediaRef: url };
      return next;
    });
  };

  /* ───── Scene helpers ───── */
  const updateScene = (idx: number, patch: Partial<ReelScene>) => {
    setReelPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, scenes: [...prev.scenes] };
      next.scenes[idx] = { ...next.scenes[idx], ...patch };
      return next;
    });
  };

  const addScene = () => {
    setReelPlan((prev) => {
      if (!prev) return prev;
      const num = prev.scenes.length + 1;
      return {
        ...prev,
        scenes: [...prev.scenes, {
          sceneNumber: num, durationSeconds: 3, visualPrompt: '', onScreenText: '',
          narration: '', camera: '', voice: globalVoice,
        }],
      };
    });
  };

  const removeScene = (idx: number) => {
    setReelPlan((prev) => {
      if (!prev || prev.scenes.length <= 1) return prev;
      const scenes = prev.scenes.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sceneNumber: i + 1 }));
      return { ...prev, scenes };
    });
    setActiveSceneIdx((prev) => Math.max(0, prev - 1));
  };

  /* ───── Generation ───── */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeType, prompt, options: { template, tone } }),
      });
      const data = await res.json();
      if (data.success) {
        if (activeType === 'text') {
          setGeneratedText(data.data.text || `Generated content for: ${prompt}`);
        } else if (activeType === 'image') {
          setGeneratedImageUrl(data.data.url);
        }
        if (data.data.contentId) setLatestContentId(data.data.contentId);
      } else {
        if (activeType === 'text') setGeneratedText(`Generated content for: ${prompt}`);
      }
    } catch {
      if (activeType === 'text') setGeneratedText(`Generated content for: ${prompt}`);
    } finally { setIsGenerating(false); }
  };

  const planReelStoryboard = async () => {
    if (!prompt.trim()) return;
    setPlanLoading(true);
    setReelPlan(null);
    try {
      const res = await fetch('/api/v1/reels/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platform: reelPlatform, durationSeconds: reelDuration }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const plan = data.data.plan;
        plan.scenes = (plan.scenes || []).map((s: any) => ({ ...s, voice: globalVoice }));
        setReelPlan(plan);
        setActiveSceneIdx(0);
      } else {
        alert(data?.error || 'Failed to plan storyboard');
      }
    } catch { alert('Failed to plan storyboard'); }
    finally { setPlanLoading(false); }
  };

  const generateReel = async () => {
    if (!prompt.trim() || !reelPlan?.scenes?.length) return;
    setReelGenerating(true);
    try {
      const scenes = reelPlan.scenes.map((s) => ({
        prompt: [s.visualPrompt, s.onScreenText ? `Text: ${s.onScreenText}` : '', s.camera ? `Camera: ${s.camera}` : ''].filter(Boolean).join('\n'),
        duration: Number(s.durationSeconds) || 3,
        mediaRef: s.mediaRef || undefined,
      }));
      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reel', prompt,
          options: { aspectRatio: '9:16', scenes, model: selectedVideoModel, voice: voiceoverEnabled ? globalVoice : undefined },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReelResult({ ...data.data, type: 'reel' });
        if (data.data.contentId) setLatestContentId(data.data.contentId);
      } else { alert(data?.error || 'Reel generation failed'); }
    } catch { alert('Reel generation failed'); }
    finally { setReelGenerating(false); }
  };

  const saveBrandKit = async () => {
    setBrandSaving(true);
    try {
      const res = await fetch('/api/v1/brand-kit', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brandKit) });
      const data = await res.json();
      if (data.success) setBrandKit(data.data);
    } catch { alert('Failed to save brand kit'); }
    finally { setBrandSaving(false); }
  };

  const handleCopy = () => {
    const text = generatedText || generatedImageUrl || reelResult?.text;
    if (text) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  useEffect(() => {
    if (activeType === 'image') setPreviewPlatform('instagram');
    if (activeType === 'reel') setPreviewPlatform('tiktok');
    if (activeType === 'text') {
      if (template === 'tweet' || template === 'thread') setPreviewPlatform('twitter');
      else if (template === 'linkedin') setPreviewPlatform('linkedin');
      else if (template === 'instagram') setPreviewPlatform('instagram');
      else setPreviewPlatform('facebook');
    }
  }, [activeType, template]);

  /* ───── Poll Kling video tasks ───── */
  useEffect(() => {
    if (!reelResult?.scenes?.length) return;
    const processing = reelResult.scenes.filter((s: any) => s.status === 'processing');
    if (processing.length === 0) return;

    const interval = setInterval(async () => {
      let updated = false;
      const newScenes = reelResult.scenes.map((s: any) => ({ ...s }));

      for (const scene of newScenes) {
        if (scene.status !== 'processing' || !scene.taskId) continue;
        try {
          const res = await fetch(`/api/v1/generate?taskId=${scene.taskId}`);
          const data = await res.json();
          if (data.success && data.data) {
            if (data.data.status === 'succeed') {
              scene.status = 'complete';
              scene.videoUrl = data.data.videoUrl;
              updated = true;
            } else if (data.data.status === 'failed') {
              scene.status = 'failed';
              updated = true;
            }
          }
        } catch (e) {
          console.error('Poll error:', e);
        }
      }

      if (updated) {
        const allDone = newScenes.every((s: any) => s.status !== 'processing');
        setReelResult((prev: any) => ({
          ...prev,
          scenes: newScenes,
          status: allDone ? 'ready' : 'processing',
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [reelResult]);

  /* ───────── Render ───────── */
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* ─── Top bar ─── */}
      <div className="bg-base-100 border-b border-base-300 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles size={20} className="text-primary" />
          </div>
      <div>
            <h1 className="text-lg font-bold leading-tight">Content Studio</h1>
            <p className="text-xs text-base-content/50">Create &amp; edit AI-powered content</p>
          </div>
      </div>

        {/* Content type tabs */}
        <div className="flex bg-base-200 rounded-xl p-1 gap-1">
          {([
            { id: 'text', label: 'Text', icon: FileText },
            { id: 'image', label: 'Image', icon: ImageIcon },
            { id: 'reel', label: 'Reel Studio', icon: Film },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = activeType === t.id;
          return (
            <button
                key={t.id}
                onClick={() => setActiveType(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-300 text-base-content/70'
                }`}
              >
                <Icon size={16} />
                {t.label}
            </button>
          );
        })}
      </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          {(hasContent || reelResult) && (
            <>
              <button onClick={handleCopy} className="btn btn-ghost btn-sm gap-1">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <Link
                href={latestContentId ? `/dashboard/publish?contentId=${latestContentId}` : '/dashboard/publish'}
                className="btn btn-primary btn-sm gap-1"
              >
                <Send size={14} /> Publish
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ─── Main content area ─── */}
      {activeType === 'reel' ? (
        /* ═══════════════ REEL STUDIO ═══════════════ */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ── Left: Storyboard ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Prompt bar */}
            <div className="p-4 bg-base-100 border-b border-base-300">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="label py-1">
                    <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/50">Reel Concept</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-20 text-sm"
                    placeholder="Describe your reel idea... e.g. 'Show 3 productivity hacks with fast cuts, energetic music vibe, end with CTA'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select className="select select-bordered select-sm" value={reelPlatform} onChange={(e) => setReelPlatform(e.target.value as any)}>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube_shorts">YT Shorts</option>
                    </select>
                    <select className="select select-bordered select-sm" value={String(reelDuration)} onChange={(e) => setReelDuration(Number(e.target.value) as any)}>
                      <option value="15">15s</option>
                      <option value="30">30s</option>
                    </select>
                  </div>
                  <button
                    onClick={planReelStoryboard}
                    disabled={!prompt.trim() || planLoading}
                    className="btn btn-primary btn-sm gap-1"
                  >
                    {planLoading ? <span className="loading loading-spinner loading-xs" /> : <Wand2 size={14} />}
                    {planLoading ? 'Planning...' : 'Plan Storyboard'}
                  </button>
                </div>
              </div>
            </div>

            {/* Scene timeline / storyboard */}
            <div className="flex-1 overflow-y-auto p-4 bg-base-200/50">
              {!reelPlan ? (
                <div className="flex flex-col items-center justify-center h-full text-base-content/30">
                  <Film size={64} className="mb-4" />
                  <p className="text-lg font-medium">No storyboard yet</p>
                  <p className="text-sm mt-1">Enter a concept above and click &quot;Plan Storyboard&quot; to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Title & hook */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{reelPlan.title}</h3>
                      <p className="text-sm text-base-content/60 italic">{reelPlan.hook}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`badge gap-1 ${reelTotalSeconds <= reelDuration ? 'badge-success' : 'badge-warning'}`}>
                        <Clock size={12} /> {reelTotalSeconds}s / {reelDuration}s
                      </div>
                      <button onClick={addScene} className="btn btn-ghost btn-sm gap-1">
                        <Plus size={14} /> Add Scene
                      </button>
                    </div>
                  </div>

                  {/* Duration bar */}
                  <div className="flex h-2 rounded-full overflow-hidden bg-base-300">
                    {reelPlan.scenes.map((s, i) => (
                      <div
                        key={i}
                        className={`h-full transition-all cursor-pointer ${
                          i === activeSceneIdx ? 'bg-primary' : 'bg-primary/40'
                        }`}
                        style={{ width: `${reelDuration > 0 ? (s.durationSeconds / reelDuration) * 100 : 0}%` }}
                        onClick={() => setActiveSceneIdx(i)}
                        title={`Scene ${s.sceneNumber}: ${s.durationSeconds}s`}
                      />
                    ))}
                  </div>

                  {/* Scene cards */}
                  <div className="grid grid-cols-1 gap-3">
                    {reelPlan.scenes.map((scene, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveSceneIdx(idx)}
                        className={`card bg-base-100 border-2 transition-all cursor-pointer ${
                          idx === activeSceneIdx ? 'border-primary shadow-lg' : 'border-base-300 hover:border-primary/30'
                        }`}
                      >
                        <div className="card-body p-3">
                          <div className="flex gap-3">
                            {/* Scene number & thumbnail */}
                            <div className="flex flex-col items-center gap-2 min-w-[80px]">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                                idx === activeSceneIdx ? 'bg-primary text-primary-content' : 'bg-base-200'
                              }`}>
                                {scene.sceneNumber}
                              </div>
                              {/* Thumbnail / media slot */}
                              <div
                                className="w-20 h-14 rounded-lg border-2 border-dashed border-base-300 bg-base-200 flex items-center justify-center overflow-hidden relative group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!scene.mediaRef) fileInputRef.current?.click();
                                }}
                              >
                                {scene.mediaRef ? (
                                  <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={scene.mediaRef} alt="" className="w-full h-full object-cover" />
                                    <button
                                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                      onClick={(e) => { e.stopPropagation(); updateScene(idx, { mediaRef: undefined }); }}
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <ImagePlus size={16} className="text-base-content/30" />
                                )}
                              </div>
                              <div className="badge badge-sm badge-outline">{scene.durationSeconds}s</div>
                            </div>

                            {/* Scene content */}
                            <div className="flex-1 space-y-2 min-w-0">
                              {/* Visual prompt */}
                              <textarea
                                className="textarea textarea-bordered w-full text-sm h-16 leading-tight"
                                placeholder="Visual prompt for this scene..."
                                value={scene.visualPrompt}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateScene(idx, { visualPrompt: e.target.value })}
                              />

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <input
                                    className="input input-bordered input-sm w-full text-xs"
                                    placeholder="On-screen text"
                                    value={scene.onScreenText}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateScene(idx, { onScreenText: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <input
                                    className="input input-bordered input-sm w-full text-xs"
                                    placeholder="Camera direction"
                                    value={scene.camera}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateScene(idx, { camera: e.target.value })}
                                  />
                                </div>
                              </div>

                              {/* Narration + voice */}
                              {voiceoverEnabled && (
                                <div className="flex gap-2 items-start">
                                  <div className="flex-1">
                                    <input
                                      className="input input-bordered input-sm w-full text-xs"
                                      placeholder="Narration text for this scene..."
                                      value={scene.narration}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => updateScene(idx, { narration: e.target.value })}
                                    />
                                  </div>
                                  <select
                                    className="select select-bordered select-sm text-xs w-28"
                                    value={scene.voice || globalVoice}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateScene(idx, { voice: e.target.value })}
                                  >
                                    {AI_VOICES.map((v) => (
                                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                                </div>
                              )}
                            </div>

                            {/* Scene actions */}
                            <div className="flex flex-col gap-1">
                              <input
                                type="number"
                                min={1}
                                max={15}
                                className="input input-bordered input-sm w-16 text-center text-xs"
                                value={scene.durationSeconds}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateScene(idx, { durationSeconds: Math.max(1, Math.min(15, Number(e.target.value) || 1)) })}
                              />
                              <span className="text-[10px] text-base-content/40 text-center">sec</span>
                              {reelPlan.scenes.length > 1 && (
                                <button
                                  className="btn btn-ghost btn-xs text-error"
                                  onClick={(e) => { e.stopPropagation(); removeScene(idx); }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Generate button */}
                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn btn-primary flex-1 gap-2"
                      onClick={generateReel}
                      disabled={reelGenerating || reelTotalSeconds <= 0}
                    >
                      {reelGenerating ? <span className="loading loading-spinner loading-sm" /> : <Sparkles size={16} />}
                      {reelGenerating ? 'Generating Reel...' : 'Generate Reel'}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { setReelPlan(null); setReelResult(null); }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Settings & Media Panel ── */}
          <div className="w-full lg:w-80 xl:w-96 border-l border-base-300 bg-base-100 flex flex-col overflow-hidden">
            {/* Panel tabs */}
            <div className="flex border-b border-base-300">
              {([
                { id: 'media', label: 'Media', icon: Layers },
                { id: 'voice', label: 'Voice & Model', icon: Settings2 },
                { id: 'brand', label: 'Brand', icon: Palette },
              ] as const).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${
                      settingsTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content/80'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* MEDIA PANEL */}
              {settingsTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Your Media</h3>
                    <p className="text-xs text-base-content/50">Upload photos or videos to use as scene references</p>
                </div>

                  {/* Upload zone */}
                  <div
                    className="border-2 border-dashed border-base-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUploadMedia(e.dataTransfer.files);
                    }}
                  >
                    {uploading ? (
                      <span className="loading loading-spinner loading-md text-primary" />
                    ) : (
                      <>
                        <Upload size={24} className="text-base-content/30" />
                        <p className="text-xs text-base-content/50 text-center">
                          Drop files here or click to upload<br />
                          <span className="text-[10px]">Images & videos up to 20MB</span>
                        </p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => { handleUploadMedia(e.target.files); e.currentTarget.value = ''; }}
                    />
                  </div>

                  {/* Media grid */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaFiles.map((m) => (
                        <div key={m.id} className="relative group rounded-lg overflow-hidden border border-base-300 aspect-square bg-base-200">
                          {m.mimeType.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <FileVideo size={20} className="text-base-content/40" />
                              <span className="text-[10px] text-base-content/40 mt-1 truncate max-w-full px-1">{m.name}</span>
                            </div>
                          )}
                          {/* Overlay actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            {reelPlan && activeSceneIdx >= 0 && (
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => attachMediaToScene(activeSceneIdx, m.url)}
                              >
                                Use in Scene {activeSceneIdx + 1}
                              </button>
                            )}
                            <button className="btn btn-xs btn-error" onClick={() => removeMedia(m.id)}>
                              <Trash2 size={10} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mediaFiles.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-base-content/40">No media uploaded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* VOICE & MODEL PANEL */}
              {settingsTab === 'voice' && (
                <div className="space-y-5">
                  {/* Video model */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Video size={14} /> Video Model
                    </h3>
                    <div className="space-y-2">
                      {AI_VIDEO_MODELS.map((model) => (
                        <label
                          key={model.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedVideoModel === model.id ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name="videoModel"
                            className="radio radio-primary radio-sm"
                            checked={selectedVideoModel === model.id}
                            onChange={() => setSelectedVideoModel(model.id)}
                          />
                          <div>
                            <div className="text-sm font-medium">{model.name}</div>
                            <div className="text-xs text-base-content/50">{model.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="divider my-0" />

                  {/* Voiceover */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Volume2 size={14} /> AI Voiceover
                      </h3>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={voiceoverEnabled}
                        onChange={() => setVoiceoverEnabled(!voiceoverEnabled)}
                      />
                    </div>

                    {voiceoverEnabled && (
                      <div className="space-y-2">
                        <p className="text-xs text-base-content/50">
                          Default voice for all scenes. Override per scene in the storyboard.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {AI_VOICES.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => {
                                setGlobalVoice(v.id);
                                // Apply to all scenes that haven't been individually set
                                setReelPlan((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    scenes: prev.scenes.map((s) => ({ ...s, voice: v.id })),
                                  };
                                });
                              }}
                              className={`flex flex-col p-2.5 rounded-xl border-2 text-left transition-all ${
                                globalVoice === v.id ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/30'
                              }`}
                            >
                              <span className="text-sm font-medium">{v.name}</span>
                              <span className="text-[10px] text-base-content/50">{v.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BRAND PANEL */}
              {settingsTab === 'brand' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Brand Kit</h3>
                    <p className="text-xs text-base-content/50">Your brand identity ensures consistent style across content</p>
                  </div>

                  {!brandKit ? (
                    <div className="flex justify-center py-6"><span className="loading loading-spinner" /></div>
                  ) : (
                    <div className="space-y-3">
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs">Brand name</span></label>
                        <input className="input input-bordered input-sm" value={brandKit.brandName || ''} onChange={(e) => setBrandKit((p: any) => ({ ...p, brandName: e.target.value }))} />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs">Voice / Tone</span></label>
                        <input className="input input-bordered input-sm" placeholder="e.g. Bold, direct, practical" value={brandKit.voice || ''} onChange={(e) => setBrandKit((p: any) => ({ ...p, voice: e.target.value }))} />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs">Target audience</span></label>
                        <input className="input input-bordered input-sm" placeholder="e.g. marketers, founders" value={brandKit.audience || ''} onChange={(e) => setBrandKit((p: any) => ({ ...p, audience: e.target.value }))} />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs">Keywords (comma separated)</span></label>
                        <input
                          className="input input-bordered input-sm"
                          value={(brandKit.keywords || []).join(', ')}
                          onChange={(e) => setBrandKit((p: any) => ({ ...p, keywords: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
                        />
                      </div>
                      <button className={`btn btn-primary btn-sm w-full ${brandSaving ? 'loading' : ''}`} onClick={saveBrandKit} disabled={brandSaving}>
                        Save Brand Kit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reel generation status */}
            {reelResult && (
              <div className="border-t border-base-300 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5"><Eye size={14} /> Reel Status</h3>
                  <div className={`badge badge-sm ${reelResult.status === 'ready' ? 'badge-success' : reelResult.status === 'failed' ? 'badge-error' : 'badge-warning'}`}>
                    {reelResult.status}
                  </div>
                </div>
                <div className="space-y-2">
                  {(reelResult.scenes || []).map((scene: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-base-200 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center text-xs font-bold">
                        {scene.sceneNumber || idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{scene.prompt?.slice(0, 50) || 'Scene'}</p>
                        <p className="text-[10px] text-base-content/50">{scene.duration || 5}s</p>
                      </div>
                      <div>
                        {scene.status === 'processing' && <span className="loading loading-spinner loading-xs text-warning" />}
                        {scene.status === 'complete' && <div className="badge badge-success badge-xs">Done</div>}
                        {scene.status === 'failed' && <div className="badge badge-error badge-xs">Failed</div>}
                      </div>
                      {scene.videoUrl && (
                        <a href={scene.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost">
                          <Play size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                {reelResult.status === 'ready' && (
                  <div className="mt-3">
                    <Link
                      href={latestContentId ? `/dashboard/publish?contentId=${latestContentId}` : '/dashboard/publish'}
                      className="btn btn-primary btn-sm w-full gap-1"
                    >
                      <Send size={14} /> Publish Reel
                    </Link>
                  </div>
                )}
                {reelResult.error && (
                  <p className="text-xs text-error mt-2">{reelResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════ TEXT & IMAGE MODE ═══════════════ */
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── Left: Input ── */}
            <div className="lg:col-span-3 space-y-4">
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                    <Wand2 size={18} className="text-primary" />
                    {activeType === 'text' ? 'Write Content' : 'Generate Image'}
                  </h2>

                  {activeType === 'text' && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs font-medium">Template</span></label>
                        <select className="select select-bordered select-sm" value={template} onChange={(e) => setTemplate(e.target.value)}>
                          {textTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs font-medium">Tone</span></label>
                        <select className="select select-bordered select-sm" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="funny">Funny</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs font-medium">
                        {activeType === 'text' ? 'What should we write about?' : 'Describe the image you want'}
                </span>
              </label>
              <textarea
                      className="textarea textarea-bordered h-32 text-sm"
                placeholder={
                        activeType === 'text'
                          ? 'E.g., Write a tweet about the benefits of AI automation for small businesses...'
                          : 'E.g., A futuristic office with AI robots working alongside humans, cinematic lighting...'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
                    className="btn btn-primary w-full mt-2 gap-2"
                  >
                    {isGenerating ? <span className="loading loading-spinner loading-sm" /> : <Sparkles size={16} />}
                    {isGenerating ? 'Generating...' : `Generate ${activeType === 'text' ? 'Text' : 'Image'}`}
            </button>
          </div>
        </div>

              {/* Brand Kit accordion */}
        <div className="card bg-base-100 shadow">
                <div className="card-body p-0">
                  <button
                    className="flex items-center justify-between w-full p-4"
                    onClick={() => setBrandOpen(!brandOpen)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Palette size={16} /> Brand Kit
                    </span>
                    {brandOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {brandOpen && brandKit && (
                    <div className="px-4 pb-4 space-y-3 border-t border-base-300 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-control">
                          <label className="label py-1"><span className="label-text text-xs">Brand name</span></label>
                          <input className="input input-bordered input-sm" value={brandKit.brandName || ''} onChange={(e) => setBrandKit((p: any) => ({ ...p, brandName: e.target.value }))} />
                        </div>
                        <div className="form-control">
                          <label className="label py-1"><span className="label-text text-xs">Voice</span></label>
                          <input className="input input-bordered input-sm" placeholder="Bold, direct" value={brandKit.voice || ''} onChange={(e) => setBrandKit((p: any) => ({ ...p, voice: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className="label-text text-xs">Audience</span></label>
                        <input className="input input-bordered input-sm" placeholder="marketers, founders" value={brandKit.audience || ''} onChange={(e) => setBrandKit((p: any) => ({ ...p, audience: e.target.value }))} />
                      </div>
                      <button className={`btn btn-primary btn-sm w-full ${brandSaving ? 'loading' : ''}`} onClick={saveBrandKit} disabled={brandSaving}>
                        Save Brand Kit
                  </button>
                </div>
              )}
                </div>
              </div>
            </div>

            {/* ── Right: Preview ── */}
            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow sticky top-4">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold flex items-center gap-1.5"><Eye size={14} /> Preview</h2>
                    {hasContent && (
                      <div className="flex gap-1">
                        <button onClick={handleCopy} className="btn btn-ghost btn-xs">
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button className="btn btn-ghost btn-xs"><Download size={12} /></button>
                  </div>
                )}
                  </div>

                  {/* Platform tabs */}
                  <div className="flex gap-1 mb-3">
                    {(['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPreviewPlatform(p)}
                        className={`btn btn-xs flex-1 ${previewPlatform === p ? 'btn-primary' : 'btn-ghost'}`}
                      >
                        {p === 'twitter' ? '𝕏' : p === 'instagram' ? 'IG' : p === 'facebook' ? 'f' : p === 'linkedin' ? 'in' : 'TT'}
                      </button>
                    ))}
                  </div>

                  {hasContent ? (
                    <>
                      <SocialPostPreview
                        platform={previewPlatform}
                        brandName={brandKit?.brandName || 'Your Brand'}
                        handle="@yourbrand"
                        text={generatedText || ''}
                        imageUrl={generatedImageUrl || null}
                      />
                      <div className="flex gap-2 mt-4">
                        <Link href="/dashboard/content" className="btn btn-outline btn-sm flex-1">Library</Link>
                        <Link
                          href={latestContentId ? `/dashboard/publish?contentId=${latestContentId}` : '/dashboard/publish'}
                          className="btn btn-primary btn-sm flex-1 gap-1"
                        >
                          <Send size={12} /> Publish
                        </Link>
              </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
                      <Sparkles size={40} className="mb-3" />
                      <p className="text-sm">Your content preview will appear here</p>
              </div>
            )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
