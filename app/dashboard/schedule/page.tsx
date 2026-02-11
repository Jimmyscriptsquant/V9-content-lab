'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status: 'scheduled' | 'published' | 'failed';
}

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📸',
  facebook: '📘',
  linkedin: '💼',
  tiktok: '🎵',
  youtube: '📺',
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/publish?status=scheduled');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const items = (data.data || []).map((p: any) => ({
            id: p.id,
            content: p.publishedContent?.text || '',
            platforms: [p.platform],
            scheduledFor: p.scheduledFor,
            status: p.status,
          }));
          setPosts(items);
        }
      }
    } catch (error) {
      // Mock data
      setPosts([
        { id: '1', content: 'Excited to announce our new feature!', platforms: ['twitter'], scheduledFor: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled' },
        { id: '2', content: 'Behind the scenes look at our process', platforms: ['instagram'], scheduledFor: new Date(Date.now() + 172800000).toISOString(), status: 'scheduled' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const weekDates = getWeekDates();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-sm breadcrumbs mb-2">
            <ul>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li>Schedule</li>
            </ul>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold flex items-center gap-2">
            <Calendar className="text-primary" />
            Content Schedule
          </h1>
          <p className="text-base-content/60 mt-1">
            View and manage your scheduled posts
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/publish" className="btn btn-primary">
            ➕ Schedule Post
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigateWeek(-1)} className="btn btn-ghost btn-circle">
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-sm text-base-content/60">
                {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button onClick={() => navigateWeek(1)} className="btn btn-ghost btn-circle">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card bg-base-100 shadow overflow-hidden">
        <div className="grid grid-cols-7 border-b border-base-300">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className="p-3 text-center font-medium text-base-content/60 border-r border-base-300 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDates.map((date, idx) => {
            const dayPosts = getPostsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={idx}
                className={`border-r border-b border-base-300 last:border-r-0 p-2 ${
                  isToday ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : 'text-base-content/60'}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-primary/10 text-primary rounded p-2 text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock size={10} />
                        <span>{new Date(post.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      <div className="truncate">{post.content.substring(0, 30)}...</div>
                      <div className="flex gap-1 mt-1">
                        {post.platforms.map(p => (
                          <span key={p}>{platformIcons[p]}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Posts List */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title mb-4">Upcoming Posts</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              <Calendar size={48} className="mx-auto mb-4 opacity-30" />
              <p>No scheduled posts</p>
              <Link href="/dashboard/publish" className="btn btn-primary btn-sm mt-4">
                Schedule Your First Post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()).map((post) => (
                <div key={post.id} className="flex items-center gap-4 p-4 bg-base-200 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium truncate">{post.content}</p>
                    <div className="flex items-center gap-2 text-sm text-base-content/60 mt-1">
                      <Clock size={14} />
                      <span>
                        {new Date(post.scheduledFor).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      {post.platforms.map(p => (
                        <span key={p}>{platformIcons[p]}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm btn-circle">
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-circle">
                      <Send size={16} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-circle text-error">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
