'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plug,
  Plus,
  Check,
  X,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  platform: string;
  platformUsername: string;
  profilePicture?: string;
  status: 'active' | 'expired' | 'revoked' | 'error';
  lastUsedAt: string | null;
  createdAt: string;
}

const platforms = [
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: 'bg-black text-white' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600 text-white' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700 text-white' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black text-white' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-600 text-white' },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [connectAccountId, setConnectAccountId] = useState('');
  const [connectCredentialsJson, setConnectCredentialsJson] = useState('{\n  "accessToken": ""\n}');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.data || []);
      }
    } catch (error) {
      // Mock data
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    setConnectPlatform(platformId);
    setShowConnectModal(true);
    setConnectingPlatform(null);
  };

  const submitManualConnect = async () => {
    if (!connectPlatform) return;

    let credentials: any;
    try {
      credentials = JSON.parse(connectCredentialsJson);
    } catch (e) {
      alert('Credentials must be valid JSON');
      return;
    }

    try {
      const res = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: connectPlatform,
          credentials,
          profileInfo: {
            username: connectUsername || 'Unknown',
            accountId: connectAccountId || credentials.accountId,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || 'Failed to connect account');
        return;
      }

      setShowConnectModal(false);
      setConnectPlatform(null);
      setConnectUsername('');
      setConnectAccountId('');
      setConnectCredentialsJson('{\n  "accessToken": ""\n}');
      fetchAccounts();
    } catch (e) {
      console.error('Failed to connect:', e);
      alert('Failed to connect account');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    try {
      await fetch(`/api/v1/accounts?id=${accountId}`, { method: 'DELETE' });
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const connectedPlatforms = accounts.map(a => a.platform);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="text-sm breadcrumbs mb-2">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li>Connected Accounts</li>
          </ul>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold flex items-center gap-2">
          <Plug className="text-primary" />
          Connected Accounts
        </h1>
        <p className="text-base-content/60 mt-1">
          Connect your social media accounts to publish content
        </p>
      </div>

      {/* Security Note */}
      <div className="alert alert-info">
        <Shield size={20} />
        <div>
          <p className="font-medium">Your tokens are secure</p>
          <p className="text-sm">All access tokens are encrypted with AES-256-GCM and stored securely.</p>
        </div>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title mb-4">Connected Accounts ({accounts.length})</h2>
            <div className="space-y-3">
              {accounts.map((account) => {
                const platform = platforms.find(p => p.id === account.platform);
                return (
                  <div key={account.id} className="flex items-center gap-4 p-4 bg-base-200 rounded-xl">
                    <div className={`w-12 h-12 rounded-xl ${platform?.color || 'bg-base-300'} flex items-center justify-center text-2xl`}>
                      {platform?.icon || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{platform?.name || account.platform}</div>
                      <div className="text-sm text-base-content/60">@{account.platformUsername}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {account.status}
                      </span>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title mb-4">Connect a Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const isConnected = connectedPlatforms.includes(platform.id);
              const isConnecting = connectingPlatform === platform.id;
              
              return (
                <div
                  key={platform.id}
                  className={`card bg-base-200 ${isConnected ? 'opacity-60' : 'hover:shadow-md cursor-pointer'} transition-all`}
                >
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-2xl`}>
                        {platform.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{platform.name}</h3>
                        {isConnected ? (
                          <span className="text-sm text-success flex items-center gap-1">
                            <Check size={14} /> Connected
                          </span>
                        ) : (
                          <span className="text-sm text-base-content/60">Not connected</span>
                        )}
                      </div>
                    </div>
                    {!isConnected && (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                        className={`btn btn-primary btn-sm mt-3 ${isConnecting ? 'loading' : ''}`}
                      >
                        {isConnecting ? 'Connecting...' : (
                          <>
                            <Plus size={16} />
                            Connect
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && accounts.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-12">
            <Plug size={48} className="text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold">No accounts connected</h3>
            <p className="text-base-content/60">Connect your first social media account to start publishing</p>
          </div>
        </div>
      )}

      {/* Manual Connect Modal */}
      {showConnectModal && connectPlatform && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Connect {connectPlatform}</h3>
            <p className="text-sm text-base-content/70 mt-1">
              Paste credentials as JSON (use a secret manager; this is for development/testing).
            </p>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Username (optional)</span>
              </label>
              <input
                className="input input-bordered"
                value={connectUsername}
                onChange={(e) => setConnectUsername(e.target.value)}
                placeholder="e.g. velocitynine"
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Account ID (optional)</span>
              </label>
              <input
                className="input input-bordered"
                value={connectAccountId}
                onChange={(e) => setConnectAccountId(e.target.value)}
                placeholder="Platform account ID"
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Credentials JSON</span>
              </label>
              <textarea
                className="textarea textarea-bordered font-mono h-40"
                value={connectCredentialsJson}
                onChange={(e) => setConnectCredentialsJson(e.target.value)}
              />
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowConnectModal(false);
                  setConnectPlatform(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitManualConnect}>
                Connect
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowConnectModal(false)} />
        </div>
      )}
    </div>
  );
}
