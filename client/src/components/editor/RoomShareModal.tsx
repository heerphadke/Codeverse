/**
 * Room Share Modal
 * Allows room owners/editors to generate invite links and manage sharing
 */

import { useState, useEffect } from 'react';
import { X, Copy, Check, Link2, Users, Clock, Globe, Lock } from 'lucide-react';
import { roomsApi } from '../../services/api';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';

interface RoomShareModalProps {
  roomSlug: string;
  isOpen: boolean;
  onClose: () => void;
  roomSettings?: {
    isPublic: boolean;
    maxMembers: number;
  };
}

export default function RoomShareModal({
  roomSlug,
  isOpen,
  onClose,
  roomSettings,
}: RoomShareModalProps) {
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && !inviteUrl) {
      generateInvite();
    }
  }, [isOpen]);

  const generateInvite = async () => {
    setIsGenerating(true);
    try {
      const result = await roomsApi.generateInvite(roomSlug, expiresInHours);
      setInviteUrl(result.inviteUrl);
      setExpiresAt(new Date(result.expiresAt));
      toast.success('Invite link generated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate invite link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#1a1a2e] rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Share Room</h2>
              <p className="text-xs text-gray-500">Invite collaborators to join</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Room visibility */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e]/50">
            {roomSettings?.isPublic ? (
              <>
                <Globe className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">Public Room</p>
                  <p className="text-xs text-gray-500">Anyone with the link can join</p>
                </div>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">Private Room</p>
                  <p className="text-xs text-gray-500">Only invited members can join</p>
                </div>
              </>
            )}
          </div>

          {/* Invite link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 px-4 py-2.5 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Copy className="w-5 h-5 text-emerald-400" />
                )}
              </button>
            </div>
          </div>

          {/* Expiration settings */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link Expires In
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value={1}>1 hour</option>
              <option value={24}>24 hours</option>
              <option value={168}>7 days</option>
              <option value={720}>30 days</option>
            </select>
          </div>

          {/* Expiration info */}
          {expiresAt && (
            <span className="icon-text text-xs text-gray-500">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Expires: {expiresAt.toLocaleString()}</span>
            </span>
          )}

          {/* Member limit info */}
          {roomSettings && (
            <span className="icon-text text-xs text-gray-500">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Max {roomSettings.maxMembers} members</span>
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={generateInvite}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Regenerate Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

