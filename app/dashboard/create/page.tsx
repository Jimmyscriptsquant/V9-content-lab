'use client';

import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import SocialPostPreview, { type PreviewPlatform } from '@/components/dashboard/SocialPostPreview';

type ContentType = 'text' | 'image' | 'reel' | 'voice';

const contentTypes = [
  { id: 'text', name: 'Text', icon: FileText, description: 'Captions, posts, threads' },
  { id: 'image', name: 'Image', icon: ImageIcon, description: 'AI-generated images' },
  { id: 'reel', name: 'Reel', icon: Video, description: 'Storyboard → 30s reel generation' },
  { id: 'voice', name: 'Voiceover', icon: Mic, description: 'AI voice generation' },
];

const textTemplates = [
  { id: 'tweet', name: 'Tweet/X Post', maxLength: 280 },
  { id: 'thread', name: 'Twitter Thread', maxLength: 2000 },
  { id: 'instagram', name: 'Instagram Caption', maxLength: 2200 },
  { id: 'linkedin', name: 'LinkedIn Post', maxLength: 3000 },
  { id: 'tiktok', name: 'TikTok Caption', maxLength: 2200 },
  { id: 'youtube', name: 'YouTube Description', maxLength: 5000 },
];

export default function CreatePage() {
  const [activeType, setActiveType] = useState<ContentType>('text');
  const [prompt, setPrompt] = useState('');
  const [template, setTemplate] = useState('tweet');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('instagram');

  // Brand Kit
  const [brandKit, setBrandKit] = useState<any>(null);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandUploading, setBrandUploading] = useState(false);

  // Reel storyboard
  const [reelPlatform, setReelPlatform] = useState<'instagram' | 'tiktok' | 'youtube_shorts'>('instagram');
  const [reelDuration, setReelDuration] = useState<15 | 30>(30);
  const [planLoading, setPlanLoading] = useState(false);
  const [reelPlan, setReelPlan] = useState<any>(null);
  const [reelContentId, setReelContentId] = useState<string | null>(null);
  const [reelGenerating, setReelGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/brand-kit');
        const data = await res.json();
        if (data.success) {
          setBrandKit(data.data || {
            brandName: '',
            websiteUrl: '',
            voice: '',
            audience: '',
            do: [],
            dont: [],
            keywords: [],
            colors: [],
            fonts: [],
            assets: [],
          });
        }
      } catch (e) {
        console.error('Failed to load brand kit:', e);
      }
    };
    load();
  }, []);

  const reelTotalSeconds = useMemo(() => {
    const scenes = reelPlan?.scenes || [];
    return scenes.reduce((sum: number, s: any) => sum + (Number(s.durationSeconds) || 0), 0);
  }, [reelPlan]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGenerated(null);

    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeType,
          prompt,
          options: {
            template,
            tone,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGenerated({ ...data.data, type: activeType });
      } else {
        // Demo: generate mock content
        setGenerated({
          type: activeType,
          text: `Here's an AI-generated ${template} about "${prompt}":\n\n${prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}\n\n#AI #ContentCreation #V9Labs`,
        });
      }
    } catch (error) {
      console.error('Generation failed:', error);
      // Demo fallback
      setGenerated({ type: activeType, text: `Generated content for: ${prompt}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveBrandKit = async () => {
    setBrandSaving(true);
    try {
      const res = await fetch('/api/v1/brand-kit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandKit),
      });
      const data = await res.json();
      if (data.success) {
        setBrandKit(data.data);
      } else {
        alert(data.error || 'Failed to save brand kit');
      }
    } catch (e) {
      console.error('Failed to save brand kit:', e);
      alert('Failed to save brand kit');
    } finally {
      setBrandSaving(false);
    }
  };

  useEffect(() => {
    // Pick a sensible default preview platform based on template/type
    if (activeType === 'image') setPreviewPlatform('instagram');
    if (activeType === 'reel') setPreviewPlatform('tiktok');
    if (activeType === 'voice') setPreviewPlatform('linkedin');

    if (activeType === 'text') {
      if (template === 'tweet' || template === 'thread') setPreviewPlatform('twitter');
      else if (template === 'linkedin') setPreviewPlatform('linkedin');
      else if (template === 'instagram') setPreviewPlatform('instagram');
      else if (template === 'tiktok') setPreviewPlatform('tiktok');
      else setPreviewPlatform('facebook');
    }
  }, [activeType, template]);

  const uploadAsset = async (file: File, kind: 'logo' | 'reference') => {
    setBrandUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/uploads', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || 'Upload failed');
        return;
      }

      const asset = {
        name: file.name,
        url: data.data.url,
        mimeType: data.data.mimeType,
        kind,
      };

      setBrandKit((prev: any) => ({
        ...(prev || {}),
        assets: [...(prev?.assets || []), asset],
      }));
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed');
    } finally {
      setBrandUploading(false);
    }
  };

  const planReelStoryboard = async () => {
    if (!prompt.trim()) return;
    setPlanLoading(true);
    setReelPlan(null);
    setReelContentId(null);

    try {
      const res = await fetch('/api/v1/reels/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          platform: reelPlatform,
          durationSeconds: reelDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || 'Failed to plan storyboard');
        return;
      }
      setReelPlan(data.data.plan);
      setReelContentId(data.data.contentId);
    } catch (e) {
      console.error('Plan failed:', e);
      alert('Failed to plan storyboard');
    } finally {
      setPlanLoading(false);
    }
  };

  const generateReel = async () => {
    if (!prompt.trim()) return;
    if (!reelPlan?.scenes?.length) return;

    setReelGenerating(true);
    try {
      const scenes = (reelPlan.scenes || []).map((s: any) => ({
        prompt: [
          s.visualPrompt,
          s.onScreenText ? `On-screen text: ${s.onScreenText}` : '',
          s.narration ? `Narration: ${s.narration}` : '',
          s.camera ? `Camera: ${s.camera}` : '',
        ].filter(Boolean).join('\n'),
        duration: Number(s.durationSeconds) || 3,
      }));

      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reel',
          prompt,
          options: {
            aspectRatio: '9:16',
            scenes,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || 'Reel generation failed');
        return;
      }

      setGenerated({ ...data.data, type: 'reel' });
    } catch (e) {
      console.error('Reel generation failed:', e);
      alert('Reel generation failed');
    } finally {
      setReelGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy =
      generated?.text ||
      generated?.url ||
      null;

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm breadcrumbs mb-2">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li>Create Content</li>
          </ul>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold flex items-center gap-2">
          <Sparkles className="text-primary" />
          Create Content
        </h1>
        <p className="text-base-content/60 mt-1">
          Generate AI-powered content in seconds
        </p>
      </div>

      {/* Content Type Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {contentTypes.map((type) => {
          const Icon = type.icon;
          const isActive = activeType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id as ContentType)}
              className={`card bg-base-100 hover:shadow-lg transition-all cursor-pointer ${
                isActive ? 'ring-2 ring-primary shadow-lg' : 'shadow'
              }`}
            >
              <div className="card-body items-center text-center py-6">
                <Icon size={32} className={isActive ? 'text-primary' : 'text-base-content/60'} />
                <h3 className="font-bold mt-2">{type.name}</h3>
                <p className="text-xs text-base-content/60">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <Wand2 size={20} />
              Generation Settings
            </h2>

            {activeType === 'text' && (
              <>
                {/* Template */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Content Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                  >
                    {textTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-medium">Tone</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="funny">Funny</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
              </>
            )}

            {/* Prompt */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">
                  {activeType === 'text' ? 'What should we write about?' :
                   activeType === 'image' ? 'Describe the image you want' :
                   activeType === 'reel' ? 'Describe the reel concept' :
                   'What text should we speak?'}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder={
                  activeType === 'text' ? 'E.g., Write a tweet about the benefits of AI automation for small businesses...' :
                  activeType === 'image' ? 'E.g., A futuristic office with AI robots working alongside humans...' :
                  activeType === 'reel' ? 'E.g., A 30-second reel that shows problem → solution → results with fast cuts...' :
                  'E.g., Welcome to our channel! Today we will discuss...'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Primary action */}
            {activeType === 'reel' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Platform</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={reelPlatform}
                      onChange={(e) => setReelPlatform(e.target.value as any)}
                    >
                      <option value="instagram">Instagram Reels</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube_shorts">YouTube Shorts</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Max length</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={String(reelDuration)}
                      onChange={(e) => setReelDuration(Number(e.target.value) as any)}
                    >
                      <option value="15">15 seconds</option>
                      <option value="30">30 seconds</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={planReelStoryboard}
                  disabled={!prompt.trim() || planLoading}
                  className={`btn btn-primary btn-lg w-full ${planLoading ? 'loading' : ''}`}
                >
                  <Film size={20} />
                  {planLoading ? 'Planning storyboard...' : 'Plan Storyboard'}
                </button>

                {reelPlan?.scenes?.length ? (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{reelPlan.title}</div>
                          <div className="text-sm text-base-content/70">{reelPlan.hook}</div>
                        </div>
                        <div className={`badge ${reelTotalSeconds <= reelDuration ? 'badge-success' : 'badge-warning'}`}>
                          {reelTotalSeconds}s / {reelDuration}s
                        </div>
                      </div>

                      <div className="divider my-2" />

                      <div className="space-y-3">
                        {(reelPlan.scenes || []).map((s: any, idx: number) => (
                          <div key={idx} className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-medium">Scene {s.sceneNumber}</div>
                                <input
                                  type="number"
                                  min={1}
                                  max={15}
                                  className="input input-bordered input-sm w-24"
                                  value={s.durationSeconds}
                                  onChange={(e) => {
                                    const v = Number(e.target.value) || 1;
                                    setReelPlan((prev: any) => {
                                      const next = { ...prev };
                                      next.scenes = [...(next.scenes || [])];
                                      next.scenes[idx] = { ...next.scenes[idx], durationSeconds: v };
                                      return next;
                                    });
                                  }}
                                />
                              </div>

                              <label className="label py-1">
                                <span className="label-text text-xs">Visual prompt</span>
                              </label>
                              <textarea
                                className="textarea textarea-bordered h-20"
                                value={s.visualPrompt}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setReelPlan((prev: any) => {
                                    const next = { ...prev };
                                    next.scenes = [...(next.scenes || [])];
                                    next.scenes[idx] = { ...next.scenes[idx], visualPrompt: v };
                                    return next;
                                  });
                                }}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                <div>
                                  <label className="label py-1">
                                    <span className="label-text text-xs">On-screen text</span>
                                  </label>
                                  <input
                                    className="input input-bordered input-sm w-full"
                                    value={s.onScreenText || ''}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setReelPlan((prev: any) => {
                                        const next = { ...prev };
                                        next.scenes = [...(next.scenes || [])];
                                        next.scenes[idx] = { ...next.scenes[idx], onScreenText: v };
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="label py-1">
                                    <span className="label-text text-xs">Camera</span>
                                  </label>
                                  <input
                                    className="input input-bordered input-sm w-full"
                                    value={s.camera || ''}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setReelPlan((prev: any) => {
                                        const next = { ...prev };
                                        next.scenes = [...(next.scenes || [])];
                                        next.scenes[idx] = { ...next.scenes[idx], camera: v };
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                              </div>

                              <label className="label py-1 mt-1">
                                <span className="label-text text-xs">Narration (optional)</span>
                              </label>
                              <textarea
                                className="textarea textarea-bordered h-16"
                                value={s.narration || ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setReelPlan((prev: any) => {
                                    const next = { ...prev };
                                    next.scenes = [...(next.scenes || [])];
                                    next.scenes[idx] = { ...next.scenes[idx], narration: v };
                                    return next;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          className={`btn btn-primary flex-1 ${reelGenerating ? 'loading' : ''}`}
                          onClick={generateReel}
                          disabled={reelGenerating || reelTotalSeconds <= 0}
                        >
                          <Sparkles size={18} />
                          {reelGenerating ? 'Generating reel...' : 'Generate Reel'}
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setReelPlan(null);
                            setReelContentId(null);
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`btn btn-primary btn-lg w-full ${isGenerating ? 'loading' : ''}`}
              >
                {isGenerating ? 'Generating...' : (
                  <>
                    <Sparkles size={20} />
                    Generate {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Brand Kit */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title mb-2">
              <Palette size={20} />
              Brand Kit
            </h2>
            <p className="text-sm text-base-content/60">
              Add brand identity once; we’ll use it for consistent style.
            </p>

            {!brandKit ? (
              <div className="py-6 flex justify-center">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Brand name</span>
                  </label>
                  <input
                    className="input input-bordered"
                    value={brandKit.brandName || ''}
                    onChange={(e) => setBrandKit((p: any) => ({ ...p, brandName: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Voice</span>
                  </label>
                  <input
                    className="input input-bordered"
                    placeholder="e.g. Bold, direct, practical"
                    value={brandKit.voice || ''}
                    onChange={(e) => setBrandKit((p: any) => ({ ...p, voice: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Audience</span>
                  </label>
                  <input
                    className="input input-bordered"
                    placeholder="e.g. marketers, founders, creators"
                    value={brandKit.audience || ''}
                    onChange={(e) => setBrandKit((p: any) => ({ ...p, audience: e.target.value }))}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Keywords (comma separated)</span>
                  </label>
                  <input
                    className="input input-bordered"
                    value={(brandKit.keywords || []).join(', ')}
                    onChange={(e) =>
                      setBrandKit((p: any) => ({
                        ...p,
                        keywords: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Upload logo / references (dev only)</span>
                  </label>
                  <div className="flex gap-2">
                    <label className={`btn btn-outline btn-sm ${brandUploading ? 'loading' : ''}`}>
                      <Upload size={16} />
                      Logo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadAsset(f, 'logo');
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <label className={`btn btn-outline btn-sm ${brandUploading ? 'loading' : ''}`}>
                      <Plus size={16} />
                      Reference
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadAsset(f, 'reference');
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                {(brandKit.assets || []).length ? (
                  <div className="space-y-2">
                    <div className="text-xs text-base-content/60">Assets</div>
                    <div className="flex flex-wrap gap-2">
                      {(brandKit.assets || []).map((a: any, idx: number) => (
                        <a
                          key={`${a.url}-${idx}`}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="badge badge-outline"
                        >
                          {a.kind}: {a.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  className={`btn btn-primary w-full ${brandSaving ? 'loading' : ''}`}
                  onClick={saveBrandKit}
                  disabled={brandSaving}
                >
                  Save Brand Kit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Generated Content</h2>
              {generated && (
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="btn btn-ghost btn-sm">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    <Download size={16} />
                  </button>
                </div>
              )}
            </div>

            {generated ? (
              <div className="space-y-3">
                <div className="tabs tabs-boxed">
                  <button
                    className={`tab ${previewPlatform === 'twitter' ? 'tab-active' : ''}`}
                    onClick={() => setPreviewPlatform('twitter')}
                    type="button"
                  >
                    𝕏
                  </button>
                  <button
                    className={`tab ${previewPlatform === 'instagram' ? 'tab-active' : ''}`}
                    onClick={() => setPreviewPlatform('instagram')}
                    type="button"
                  >
                    IG
                  </button>
                  <button
                    className={`tab ${previewPlatform === 'facebook' ? 'tab-active' : ''}`}
                    onClick={() => setPreviewPlatform('facebook')}
                    type="button"
                  >
                    f
                  </button>
                  <button
                    className={`tab ${previewPlatform === 'linkedin' ? 'tab-active' : ''}`}
                    onClick={() => setPreviewPlatform('linkedin')}
                    type="button"
                  >
                    in
                  </button>
                  <button
                    className={`tab ${previewPlatform === 'tiktok' ? 'tab-active' : ''}`}
                    onClick={() => setPreviewPlatform('tiktok')}
                    type="button"
                  >
                    TT
                  </button>
                </div>

                <SocialPostPreview
                  platform={previewPlatform}
                  brandName={brandKit?.brandName || 'Your Brand'}
                  handle="@yourbrand"
                  text={generated?.text || ''}
                  imageUrl={generated?.url || null}
                />

                {activeType === 'reel' && reelPlan?.scenes?.length ? (
                  <div className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="font-semibold mb-2">Storyboard</div>
                      <div className="space-y-2">
                        {(reelPlan.scenes || []).map((s: any) => (
                          <div key={s.sceneNumber} className="flex items-start gap-3 bg-base-100 rounded-xl p-3 border border-base-300">
                            <div className="badge badge-outline">#{s.sceneNumber}</div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{s.durationSeconds}s</div>
                              <div className="text-xs text-base-content/70 whitespace-pre-wrap">{s.visualPrompt}</div>
                              {s.onScreenText ? (
                                <div className="text-xs mt-1"><span className="font-semibold">Text:</span> {s.onScreenText}</div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-base-content/40">
                <Sparkles size={48} className="mb-4" />
                <p>Your generated content will appear here</p>
              </div>
            )}

            {generated && (
              <div className="flex gap-2 mt-4">
                <Link href="/dashboard/content" className="btn btn-outline flex-1">
                  View in Library
                </Link>
                <Link
                  href={generated?.contentId ? `/dashboard/publish?contentId=${generated.contentId}` : "/dashboard/publish"}
                  className="btn btn-primary flex-1"
                >
                  <Send size={16} />
                  Publish
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
