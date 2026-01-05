/**
 * Dashboard Page - Production-grade project management interface
 * Featuring quick actions, smart filtering, and real-time collaboration indicators
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderOpen,
  Clock,
  Users,
  Search,
  MoreVertical,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  Grid3x3,
  List,
  Globe,
  Lock,
  Code2,
  Sparkles,
  Star,
  Settings,
  Share2,
  Play,
  ArrowRight,
  Zap,
  Activity,
  Eye,
  AlertCircle,
  Command,
  ChevronRight,
  Terminal,
  FileCode,
  Calendar,
  TrendingUp,
  X,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { roomsApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import type { RoomListItem } from '../types';

// Language icon mapping
const languageIcons: Record<string, { icon: string; color: string; name: string }> = {
  javascript: { icon: 'JS', color: '#f7df1e', name: 'JavaScript' },
  typescript: { icon: 'TS', color: '#3178c6', name: 'TypeScript' },
  python: { icon: 'PY', color: '#3776ab', name: 'Python' },
  java: { icon: 'JV', color: '#f89820', name: 'Java' },
  cpp: { icon: 'C++', color: '#00599c', name: 'C++' },
  c: { icon: 'C', color: '#a8b9cc', name: 'C' },
  go: { icon: 'GO', color: '#00add8', name: 'Go' },
  rust: { icon: 'RS', color: '#ce422b', name: 'Rust' },
  ruby: { icon: 'RB', color: '#cc342d', name: 'Ruby' },
  php: { icon: 'PHP', color: '#777bb4', name: 'PHP' },
};

type SortOption = 'recent' | 'name' | 'members' | 'created';
type ViewMode = 'grid' | 'list';
type ActivityFilter = 'all' | 'active' | 'stale';
type VisibilityFilter = 'all' | 'public' | 'private';

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'editor' | 'viewer'>('all');
  const [filterActivity, setFilterActivity] = useState<ActivityFilter>('all');
  const [filterVisibility, setFilterVisibility] = useState<VisibilityFilter>('all');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { rooms } = await roomsApi.list();
      setRooms(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalProjects = rooms.length;
    const ownedProjects = rooms.filter(r => r.role === 'owner').length;
    const collaborativeProjects = rooms.filter(r => r.memberCount > 1).length;
    const publicProjects = rooms.filter(r => r.settings.isPublic).length;
    const activeToday = rooms.filter(r => new Date(r.lastActivityAt) > oneDayAgo).length;
    const activeThisWeek = rooms.filter(r => new Date(r.lastActivityAt) > sevenDaysAgo).length;
    const staleProjects = rooms.filter(r => new Date(r.lastActivityAt) <= sevenDaysAgo).length;
    
    return { 
      totalProjects, 
      ownedProjects, 
      collaborativeProjects,
      publicProjects,
      activeToday,
      activeThisWeek,
      staleProjects,
    };
  }, [rooms]);

  // Get most recent project for "Continue where you left off"
  const mostRecentProject = useMemo(() => {
    if (rooms.length === 0) return null;
    return [...rooms].sort((a, b) => 
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    )[0];
  }, [rooms]);

  // Handle stat card clicks
  const handleStatClick = useCallback((statType: string) => {
    setActiveStatFilter(activeStatFilter === statType ? null : statType);
    
    // Reset other filters when clicking stats
    if (statType !== activeStatFilter) {
      switch (statType) {
        case 'owned':
          setFilterRole('owner');
          setFilterActivity('all');
          setFilterVisibility('all');
          break;
        case 'collaborative':
          setFilterRole('all');
          setFilterActivity('all');
          setFilterVisibility('all');
          break;
        case 'public':
          setFilterRole('all');
          setFilterActivity('all');
          setFilterVisibility('public');
          break;
        case 'activeToday':
          setFilterRole('all');
          setFilterActivity('active');
          setFilterVisibility('all');
          break;
        default:
          setFilterRole('all');
          setFilterActivity('all');
          setFilterVisibility('all');
      }
    } else {
      // Clear all filters when deselecting
      setFilterRole('all');
      setFilterActivity('all');
      setFilterVisibility('all');
    }
  }, [activeStatFilter]);

  // Filter and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let filtered = rooms.filter(room => {
      // Search filter (fuzzy-ish matching)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        room.name.toLowerCase().includes(searchLower) ||
        room.description?.toLowerCase().includes(searchLower) ||
        room.owner.username?.toLowerCase().includes(searchLower);
      
      // Role filter
      const matchesRole = filterRole === 'all' || room.role === filterRole;
      
      // Activity filter
      const lastActivity = new Date(room.lastActivityAt);
      const matchesActivity = filterActivity === 'all' ||
        (filterActivity === 'active' && lastActivity > sevenDaysAgo) ||
        (filterActivity === 'stale' && lastActivity <= sevenDaysAgo);
      
      // Visibility filter
      const matchesVisibility = filterVisibility === 'all' ||
        (filterVisibility === 'public' && room.settings.isPublic) ||
        (filterVisibility === 'private' && !room.settings.isPublic);
      
      // Stat-based filter for collaborative
      const matchesCollaborative = activeStatFilter !== 'collaborative' || room.memberCount > 1;

      return matchesSearch && matchesRole && matchesActivity && matchesVisibility && matchesCollaborative;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.memberCount - a.memberCount;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      }
    });

    return filtered;
  }, [rooms, searchQuery, sortBy, filterRole, filterActivity, filterVisibility, activeStatFilter]);

  const clearAllFilters = () => {
    setFilterRole('all');
    setFilterActivity('all');
    setFilterVisibility('all');
    setActiveStatFilter(null);
    setSearchQuery('');
  };

  const hasActiveFilters = filterRole !== 'all' || filterActivity !== 'all' || 
    filterVisibility !== 'all' || activeStatFilter !== null || searchQuery !== '';

  return (
    <div className="min-h-screen bg-[#050505]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Continue Where You Left Off */}
        {!isLoading && mostRecentProject && (
          <section className="mb-10">
            <div 
              className="relative overflow-hidden rounded-2xl border border-[#1a1a2e] bg-gradient-to-br from-[#0a0a14] via-[#0d0d1a] to-[#0a0a14]"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>
              
              <div className="relative p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-3">
                      <Zap className="w-4 h-4" />
                      Continue where you left off
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">
                      {mostRecentProject.name}
                    </h2>
                    <p className="text-gray-400 mb-4 line-clamp-2 max-w-xl">
                      {mostRecentProject.description || 'Your most recently active project'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Last active {formatTimeAgo(mostRecentProject.lastActivityAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {mostRecentProject.memberCount} {mostRecentProject.memberCount === 1 ? 'member' : 'members'}
                      </div>
                      {mostRecentProject.settings.isPublic && (
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <Globe className="w-4 h-4" />
                          Public
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowCreateModal(true)}
                      className="border-[#2a2a4a] hover:border-emerald-500/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                    <Button 
                      onClick={() => navigate(`/room/${mostRecentProject.slug}`)}
                      size="lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Open Project
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions - Only show on empty state or first visit */}
        {!isLoading && rooms.length === 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Get Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={Plus}
                title="Create a Project"
                description="Start a new collaborative coding room"
                color="emerald"
                onClick={() => setShowCreateModal(true)}
              />
              <QuickActionCard
                icon={Share2}
                title="Join via Invite"
                description="Enter an invite code to join a team"
                color="blue"
                onClick={() => toast.info('Invite code feature coming soon!')}
              />
              <QuickActionCard
                icon={Code2}
                title="Explore Templates"
                description="Start from a pre-built project template"
                color="purple"
                onClick={() => toast.info('Templates coming soon!')}
              />
            </div>
          </section>
        )}

        {/* Stats Cards - Clickable */}
        {!isLoading && rooms.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={FolderOpen}
                label="Total Projects"
                value={stats.totalProjects}
                color="gray"
                isActive={false}
                onClick={() => clearAllFilters()}
              />
              <StatCard
                icon={Sparkles}
                label="Owned by You"
                value={stats.ownedProjects}
                color="emerald"
                isActive={activeStatFilter === 'owned'}
                onClick={() => handleStatClick('owned')}
              />
              <StatCard
                icon={Users}
                label="Collaborative"
                value={stats.collaborativeProjects}
                color="blue"
                isActive={activeStatFilter === 'collaborative'}
                onClick={() => handleStatClick('collaborative')}
              />
              <StatCard
                icon={Activity}
                label="Active Today"
                value={stats.activeToday}
                color="amber"
                isActive={activeStatFilter === 'activeToday'}
                onClick={() => handleStatClick('activeToday')}
              />
            </div>
          </section>
        )}

        {/* Search and Filters */}
        <section className="mb-6">
          {/* Search Bar with keyboard hint */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-20 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md bg-[#1a1a2e] text-gray-500 text-xs">
                <Command className="w-3 h-3" />
                K
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-[#0a0a0f] border-[#1a1a2e] text-gray-400 hover:text-white hover:border-[#2a2a4a]'
                }`}
              >
                <Settings className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
              
              {/* View Toggle */}
              <div className="flex items-center bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#1a1a2e] text-emerald-400'
                      : 'text-gray-500 hover:text-white'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#1a1a2e] text-emerald-400'
                      : 'text-gray-500 hover:text-white'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="p-4 bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap items-center gap-6">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Role</label>
                  <div className="flex items-center gap-1">
                    {(['all', 'owner', 'editor', 'viewer'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => setFilterRole(role)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                          filterRole === role
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a2e]'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Filter */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Activity</label>
                  <div className="flex items-center gap-1">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'active', label: 'Active (7d)' },
                      { value: 'stale', label: 'Stale' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setFilterActivity(value as ActivityFilter)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          filterActivity === value
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a2e]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Filter */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Visibility</label>
                  <div className="flex items-center gap-1">
                    {[
                      { value: 'all', label: 'All', icon: null },
                      { value: 'public', label: 'Public', icon: Globe },
                      { value: 'private', label: 'Private', icon: Lock },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setFilterVisibility(value as VisibilityFilter)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                          filterVisibility === value
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a2e]'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2 ml-auto">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-[#0d0d14] border border-[#1a1a2e] rounded-lg px-4 py-2 pr-10 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="recent">Recently Active</option>
                    <option value="created">Newest First</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="members">Most Members</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 ml-4"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active filters summary */}
          {hasActiveFilters && !showFilters && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Filtered:</span>
              {filterRole !== 'all' && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md capitalize">
                  {filterRole}
                </span>
              )}
              {filterActivity !== 'all' && (
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md">
                  {filterActivity === 'active' ? 'Active (7d)' : 'Stale'}
                </span>
              )}
              {filterVisibility !== 'all' && (
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md capitalize">
                  {filterVisibility}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded-md">
                  "{searchQuery}"
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-white transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Projects Grid/List */}
        <section>
          {/* Results count */}
          {!isLoading && rooms.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filteredAndSortedRooms.length === rooms.length 
                  ? `${rooms.length} project${rooms.length !== 1 ? 's' : ''}`
                  : `${filteredAndSortedRooms.length} of ${rooms.length} projects`
                }
              </p>
            </div>
          )}

          {isLoading ? (
            <LoadingSkeletons viewMode={viewMode} />
          ) : filteredAndSortedRooms.length === 0 ? (
            <EmptyState
              searchQuery={searchQuery}
              hasFilters={hasActiveFilters}
              onClearFilters={clearAllFilters}
              onCreateNew={() => setShowCreateModal(true)}
            />
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {filteredAndSortedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  viewMode={viewMode}
                  onClick={() => navigate(`/room/${room.slug}`)}
                  onDelete={async () => {
                    if (confirm(`Delete "${room.name}"? This cannot be undone.`)) {
                      try {
                        await roomsApi.delete(room.slug);
                        toast.success('Project deleted');
                        loadRooms();
                      } catch (error: any) {
                        toast.error(error.response?.data?.error || 'Failed to delete project');
                      }
                    }
                  }}
                  onShare={() => {
                    navigate(`/room/${room.slug}`, { state: { openShare: true } });
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating New Project Button (mobile) */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all z-40"
        aria-label="Create new project"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(room) => {
            setShowCreateModal(false);
            navigate(`/room/${room.slug}`);
          }}
        />
      )}
    </div>
  );
}

// Quick Action Card
function QuickActionCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  color: 'emerald' | 'blue' | 'purple';
  onClick: () => void;
}) {
  const colorClasses = {
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5',
    blue: 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5',
    purple: 'border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5',
  };

  const iconColors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`group text-left p-6 rounded-xl border bg-[#0a0a0f] transition-all duration-200 ${colorClasses[color]}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
        {title}
        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </h3>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isActive,
  onClick,
}: {
  icon: any;
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'gray';
  isActive: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    emerald: {
      base: 'border-emerald-500/20 hover:border-emerald-500/40',
      active: 'bg-emerald-500/10 border-emerald-500/40',
      icon: 'text-emerald-400',
    },
    blue: {
      base: 'border-blue-500/20 hover:border-blue-500/40',
      active: 'bg-blue-500/10 border-blue-500/40',
      icon: 'text-blue-400',
    },
    purple: {
      base: 'border-purple-500/20 hover:border-purple-500/40',
      active: 'bg-purple-500/10 border-purple-500/40',
      icon: 'text-purple-400',
    },
    amber: {
      base: 'border-amber-500/20 hover:border-amber-500/40',
      active: 'bg-amber-500/10 border-amber-500/40',
      icon: 'text-amber-400',
    },
    gray: {
      base: 'border-[#1a1a2e] hover:border-[#2a2a4a]',
      active: 'bg-[#0d0d14] border-[#2a2a4a]',
      icon: 'text-gray-400',
    },
  };

  const styles = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border bg-[#0a0a0f] transition-all text-left group ${
        isActive ? styles.active : styles.base
      }`}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${styles.icon}`} />
        <span className={`text-2xl font-bold text-white`}>{value}</span>
      </div>
      <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{label}</p>
    </button>
  );
}

// Loading Skeletons
function LoadingSkeletons({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[#0a0a0f] border border-[#1a1a2e] animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a2e]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-[#1a1a2e] rounded" />
                <div className="h-4 w-32 bg-[#1a1a2e]/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-xl bg-[#0a0a0f] border border-[#1a1a2e] animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a2e]" />
            <div className="w-8 h-8 rounded-lg bg-[#1a1a2e]" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-3/4 bg-[#1a1a2e] rounded" />
            <div className="h-4 w-full bg-[#1a1a2e]/50 rounded" />
            <div className="h-4 w-2/3 bg-[#1a1a2e]/30 rounded" />
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#1a1a2e]">
            <div className="h-4 w-20 bg-[#1a1a2e]/50 rounded" />
            <div className="h-4 w-16 bg-[#1a1a2e]/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State
function EmptyState({
  searchQuery,
  hasFilters,
  onClearFilters,
  onCreateNew,
}: {
  searchQuery: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
}) {
  if (searchQuery || hasFilters) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-[#1a1a2e] flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Try adjusting your search or filters to find what you're looking for
        </p>
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
        <FolderOpen className="w-12 h-12 text-emerald-400" />
      </div>
      <h3 className="text-2xl font-semibold text-white mb-2">Welcome to Codeverse</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Create your first collaborative coding room to start building with your team in real-time
      </p>
      <Button onClick={onCreateNew} size="lg">
        <Plus className="w-5 h-5 mr-2" />
        Create Your First Project
      </Button>
    </div>
  );
}

// Room Card Component
function RoomCard({
  room,
  viewMode,
  onClick,
  onDelete,
  onShare,
}: {
  room: RoomListItem;
  viewMode: ViewMode;
  onClick: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  if (viewMode === 'list') {
    return (
      <div
        className="group relative bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl p-4 hover:border-emerald-500/30 hover:bg-[#0d0d14] transition-all duration-200 cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        <div className="flex items-center gap-4">
          {/* Project Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${room.owner.color}20, ${room.owner.color}08)`,
              border: `1px solid ${room.owner.color}25`,
            }}
          >
            <FolderOpen className="w-6 h-6" style={{ color: room.owner.color }} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-white truncate">{room.name}</h3>
              {room.settings.isPublic ? (
                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" aria-label="Public project" />
              ) : (
                <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" aria-label="Private project" />
              )}
              <RoleBadge role={room.role} />
            </div>
            <p className="text-sm text-gray-500 truncate mb-2">
              {room.description || 'No description'}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTimeAgo(room.lastActivityAt)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {room.role === 'owner' && (
              <button
                className="p-2 rounded-lg hover:bg-[#1a1a2e] text-gray-400 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                aria-label="Share project"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <ContextMenu
              isOwner={room.role === 'owner'}
              showMenu={showMenu}
              setShowMenu={setShowMenu}
              onClick={onClick}
              onDelete={onDelete}
              onShare={onShare}
            />
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="group relative bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl p-5 hover:border-emerald-500/30 hover:bg-[#0d0d14] transition-all duration-200 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${room.owner.color}20, ${room.owner.color}08)`,
            border: `1px solid ${room.owner.color}25`,
          }}
        >
          <FolderOpen className="w-6 h-6" style={{ color: room.owner.color }} />
        </div>
        
        <div className="flex items-center gap-2">
          {room.settings.isPublic ? (
            <span className="p-1.5 rounded-md bg-blue-500/10" aria-label="Public project">
              <Globe className="w-4 h-4 text-blue-400" />
            </span>
          ) : (
            <span className="p-1.5 rounded-md bg-[#1a1a2e]" aria-label="Private project">
              <Lock className="w-4 h-4 text-gray-600" />
            </span>
          )}
          <ContextMenu
            isOwner={room.role === 'owner'}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            onClick={onClick}
            onDelete={onDelete}
            onShare={onShare}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-white truncate">{room.name}</h3>
          <RoleBadge role={room.role} />
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
          {room.description || 'No description'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-[#1a1a2e]/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {formatTimeAgo(room.lastActivityAt)}
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {room.memberCount}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <button
          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          aria-label="Open project"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Role Badge
function RoleBadge({ role }: { role: string }) {
  const styles = {
    owner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    editor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${styles[role as keyof typeof styles] || styles.viewer}`}>
      {role}
    </span>
  );
}

// Context Menu
function ContextMenu({
  isOwner,
  showMenu,
  setShowMenu,
  onClick,
  onDelete,
  onShare,
}: {
  isOwner: boolean;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  onClick: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  return (
    <div className="relative">
      <button
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#1a1a2e] transition-all text-gray-400 hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        aria-label="More options"
        aria-expanded={showMenu}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div className="absolute right-0 top-10 z-20 bg-[#0d0d14] border border-[#1a1a2e] rounded-xl shadow-2xl py-2 min-w-[160px]">
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1a1a2e] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </button>
            {isOwner && (
              <>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1a1a2e] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                    setShowMenu(false);
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <div className="border-t border-[#1a1a2e] my-1" />
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[#1a1a2e] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Create Room Modal
function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (room: any) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const room = await roomsApi.create({
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
      onCreated(room);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0f] border border-[#1a1a2e] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1a1a2e] text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <Input
            label="Project Name"
            placeholder="My Awesome Project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-[#050505] border border-[#1a1a2e] text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all resize-none"
              placeholder="What's this project about?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-3 px-4 rounded-xl hover:bg-[#0d0d14] transition-colors -mx-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 rounded-md bg-[#050505] border-[#2a2a4a] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
            />
            <div>
              <span className="text-sm text-gray-200 font-medium">Make this project public</span>
              <p className="text-xs text-gray-500 mt-0.5">Anyone with the link can view this project</p>
            </div>
          </label>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Utility function
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return date.toLocaleDateString();
}
