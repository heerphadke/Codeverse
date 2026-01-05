/**
 * Editor Page
 * Main collaborative coding environment
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Header from '../components/layout/Header';
import FileTree from '../components/editor/FileTree';
import CodeEditor from '../components/editor/CodeEditor';
import OutputPanel from '../components/editor/OutputPanel';
import TerminalPanel from '../components/editor/TerminalPanel';
import EditorToolbar from '../components/editor/EditorToolbar';
import PresencePanel from '../components/editor/PresencePanel';
import RoomShareModal from '../components/editor/RoomShareModal';
import MemberManagement from '../components/editor/MemberManagement';
import { useEditorStore } from '../stores/editorStore';
import { useAuthStore } from '../stores/authStore';
import { roomsApi } from '../services/api';
import { API_BASE_URL, SOCKET_EVENTS } from '../config/constants';
import { useToast } from '../components/ui/Toast';
import type { Room, UserPresence } from '../types';

export default function EditorPage() {
  const { slug, fileId: urlFileId } = useParams<{ slug: string; fileId?: string }>();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<any>(null);
  
  const { accessToken, user } = useAuthStore();
  const {
    connectToRoom,
    disconnect,
    updateUsers,
    setActiveFile,
    ydoc,
    activeFileId,
    files,
  } = useEditorStore();

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const toast = useToast();

  // Load room data
  const loadRoom = async () => {
    if (!slug) return;
    try {
      const roomData = await roomsApi.get(slug);
      setRoom(roomData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load room';
      const statusCode = err.response?.status;
      
      // Handle specific error codes properly
      if (statusCode === 401) {
        navigate('/login', { state: { from: { pathname: `/room/${slug}` } } });
        return;
      }
      if (statusCode === 403) {
        setError("You don't have access to this project");
      } else if (statusCode === 404) {
        setError('Project not found');
      } else {
        setError(errorMessage);
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [slug]);

  // Handle deep link to specific file (only once when files load)
  const [hasSetInitialFile, setHasSetInitialFile] = useState(false);
  
  useEffect(() => {
    if (urlFileId && files.length > 0 && !hasSetInitialFile) {
      const targetFile = files.find(f => f.id === urlFileId);
      if (targetFile && targetFile.type === 'file') {
        setActiveFile(urlFileId);
        setHasSetInitialFile(true);
      } else if (!targetFile) {
        // File not found - show toast and navigate to project root
        toast.error(`File not found: ${urlFileId}`);
        navigate(`/room/${slug}`, { replace: true });
        setHasSetInitialFile(true);
      }
    }
  }, [urlFileId, files, hasSetInitialFile, setActiveFile, toast, navigate, slug]);

  // Connect to Yjs WebSocket
  useEffect(() => {
    if (!slug || !accessToken) return;

    connectToRoom(slug, accessToken);

    return () => {
      disconnect();
    };
  }, [slug, accessToken]);

  // Connect to Socket.IO for presence
  useEffect(() => {
    if (!slug || !accessToken || !user) return;

    // Create socket connection
    const socket = io(API_BASE_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomSlug: slug });
    });

    socket.on(SOCKET_EVENTS.USERS_UPDATE, (users: UserPresence[]) => {
      updateUsers(users);
    });

    socket.on(SOCKET_EVENTS.ERROR, (error: any) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    socket.on(SOCKET_EVENTS.UNAUTHORIZED, () => {
      navigate('/login');
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomSlug: slug });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [slug, accessToken, user]);

  // Get current file language
  const getCurrentLanguage = () => {
    if (!activeFileId) return 'javascript';
    const file = files.find(f => f.id === activeFileId);
    return file?.language || 'javascript';
  };

  // Get code from Yjs document
  const getCode = () => {
    if (!ydoc || !activeFileId) return '';
    const ytext = ydoc.getText(`file:${activeFileId}`);
    return ytext.toString();
  };

  // Handle run from toolbar
  const handleRunFromToolbar = () => {
    // Trigger run by focusing output panel or using a ref
    // For now, we'll expose this through a custom event
    window.dispatchEvent(new CustomEvent('editor:run'));
  };

  // Get user role and permissions
  // Default to editor if user is the owner (check by comparing user ID with room owner)
  const userRole = room?.role || (room?.owner && user?._id === room.owner._id ? 'owner' : 'viewer');
  const canEdit = userRole === 'owner' || userRole === 'editor';
  
  // Debug: log role and canEdit
  useEffect(() => {
    if (room) {
      console.log('Room loaded:', { 
        userRole, 
        canEdit, 
        roomOwner: room.owner?._id, 
        currentUser: user?._id,
        roomRole: room.role 
      });
    }
  }, [room, userRole, canEdit, user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Run code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('editor:run'));
      }

      // Ctrl/Cmd + `: Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
      }

      // Ctrl/Cmd + N: New file (if can edit)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (canEdit) {
          // Trigger new file creation in FileTree
          window.dispatchEvent(new CustomEvent('filetree:new'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to load room</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <Header 
        showNav={true} 
        roomName={room?.name}
        roomSlug={slug}
        onShareClick={() => setShowShareModal(true)}
        onMembersClick={() => setShowMembers(!showMembers)}
        userRole={userRole}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-56 flex-shrink-0">
          <FileTree canEdit={canEdit} />
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <EditorToolbar
            onRun={handleRunFromToolbar}
            onTerminalToggle={() => setShowTerminal(!showTerminal)}
            isTerminalOpen={showTerminal}
            canExecute={canEdit}
          />

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={getCurrentLanguage()}
              readOnly={!canEdit}
            />
          </div>

          {/* Output Panel */}
          <OutputPanel
            language={getCurrentLanguage()}
            getCode={getCode}
            canExecute={canEdit}
          />

          {/* Terminal Panel */}
          <TerminalPanel
            isExpanded={showTerminal}
            onToggle={() => setShowTerminal(!showTerminal)}
          />
        </div>

        {/* Side Panels */}
        <div className="flex">
          {/* Presence Panel */}
          <PresencePanel />
          
          {/* Member Management (toggleable) */}
          {showMembers && (
            <MemberManagement 
              room={room} 
              onUpdate={loadRoom}
            />
          )}
        </div>
      </div>

      {/* Share Modal */}
      {slug && (
        <RoomShareModal
          roomSlug={slug}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          roomSettings={room?.settings}
        />
      )}
    </div>
  );
}

