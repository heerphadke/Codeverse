/**
 * Member Management Component
 * Shows room members and allows role management (for owners/editors)
 */

import { useState, useEffect } from 'react';
import { Users, Crown, Edit, Eye, MoreVertical, Trash2, Shield } from 'lucide-react';
import { roomsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../ui/Toast';
import type { Room } from '../../types';

interface MemberManagementProps {
  room: Room | null;
  onUpdate: () => void;
}

type Role = 'owner' | 'editor' | 'viewer';

const roleIcons = {
  owner: Crown,
  editor: Edit,
  viewer: Eye,
};

const roleColors = {
  owner: 'text-yellow-400',
  editor: 'text-blue-400',
  viewer: 'text-gray-400',
};

const roleLabels = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

export default function MemberManagement({ room, onUpdate }: MemberManagementProps) {
  const { user: currentUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toast = useToast();

  if (!room) return null;

  const currentUserRole = room.role || 'viewer';
  const canManage = currentUserRole === 'owner' || currentUserRole === 'editor';

  const getUserId = (user: any): string => {
    return user._id || user.id || '';
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!confirm(`Remove ${username} from this room?`)) return;

    try {
      await roomsApi.removeMember(room.slug, userId);
      toast.success(`${username} removed from room`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
    setMenuOpen(null);
  };

  const handleUpdateRole = async (userId: string, newRole: Role, username: string) => {
    try {
      await roomsApi.updateMemberRole(room.slug, userId, newRole);
      toast.success(`${username} role updated to ${roleLabels[newRole]}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
    setMenuOpen(null);
  };

  const allMembers = [
    {
      user: room.owner,
      role: 'owner' as Role,
      joinedAt: room.createdAt,
    },
    ...room.members.map((m) => ({
      user: m.user,
      role: m.role as Role,
      joinedAt: m.joinedAt,
    })),
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-[#1a1a2e] w-64">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e]">
        <span className="icon-text text-sm font-medium text-gray-300">
          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>Members</span>
        </span>
        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
          {allMembers.length}
        </span>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto py-2">
      {allMembers.map((member) => {
        const userId = getUserId(member.user);
        const currentUserId = currentUser?._id || '';
        const isCurrentUser = currentUserId === userId;
        const canModify = canManage && !isCurrentUser && member.role !== 'owner';
        const RoleIcon = roleIcons[member.role];

        return (
          <div
            key={userId}
            className="relative px-4 py-2.5 hover:bg-[#1a1a2e]/50 transition-colors"
          >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg"
                    style={{
                      backgroundColor: member.user.color || '#4ECDC4',
                      boxShadow: `0 0 0 2px ${(member.user.color || '#4ECDC4')}30`,
                    }}
                  >
                    {member.user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {member.role === 'owner' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                      <Crown className="w-2.5 h-2.5 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {member.user.username}
                      {isCurrentUser && (
                        <span className="text-gray-500 font-normal ml-1">(you)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RoleIcon className={`w-3 h-3 ${roleColors[member.role]}`} />
                    <span className={`text-xs ${roleColors[member.role]}`}>
                      {roleLabels[member.role]}
                    </span>
                  </div>
                </div>

                {/* Actions menu */}
                {canModify && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === userId ? null : userId)}
                      className="p-1.5 hover:bg-[#2a2a4a] rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {menuOpen === userId && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-8 z-20 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg shadow-xl min-w-[180px] py-1">
                          {/* Role change options */}
                          {member.role !== 'editor' && (
                            <button
                              onClick={() => handleUpdateRole(userId, 'editor', member.user.username)}
                              className="nav-item w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a4a] transition-colors"
                            >
                              <Edit className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <span>Make Editor</span>
                            </button>
                          )}
                          {member.role !== 'viewer' && (
                            <button
                              onClick={() => handleUpdateRole(userId, 'viewer', member.user.username)}
                              className="nav-item w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a4a] transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>Make Viewer</span>
                            </button>
                          )}
                          <div className="h-px bg-[#2a2a4a] my-1" />
                          <button
                            onClick={() => handleRemoveMember(userId, member.user.username)}
                            className="nav-item w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#2a2a4a] transition-colors"
                          >
                            <Trash2 className="w-4 h-4 flex-shrink-0" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {canManage && (
        <div className="p-3 border-t border-[#1a1a2e]">
          <p className="text-xs text-gray-500 text-center">
            {currentUserRole === 'owner' ? 'You can manage all members' : 'You can manage editors and viewers'}
          </p>
        </div>
      )}
    </div>
  );
}

