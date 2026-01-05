/**
 * Editor Store
 * Manages editor state, files, folders, and collaboration
 */

import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_URL } from '../config/constants';
import type { FileItem, UserPresence, ExecutionResult } from '../types';

interface EditorStore {
  // Room state
  roomSlug: string | null;
  isConnected: boolean;
  connectionError: string | null;

  // Yjs state
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  awareness: any | null;

  // Files state (includes folders)
  files: FileItem[];
  activeFileId: string | null;
  expandedFolders: Set<string>;

  // Presence state
  users: UserPresence[];

  // Execution state
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  input: string;

  // Editor settings
  theme: string;
  fontSize: number;

  // Actions
  connectToRoom: (roomSlug: string, accessToken: string) => void;
  disconnect: () => void;
  setActiveFile: (fileId: string) => void;
  createFile: (name: string, language: string, parentId?: string | null) => void;
  createFolder: (name: string, parentId?: string | null) => void;
  deleteFile: (fileId: string) => void;
  deleteFolder: (folderId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  renameFolder: (folderId: string, newName: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  setExecutionResult: (result: ExecutionResult | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setInput: (input: string) => void;
  setTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  updateUsers: (users: UserPresence[]) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  roomSlug: null,
  isConnected: false,
  connectionError: null,
  ydoc: null,
  provider: null,
  awareness: null,
  files: [],
  activeFileId: null,
  expandedFolders: new Set<string>(),
  users: [],
  isExecuting: false,
  executionResult: null,
  input: '',
  theme: 'vs-dark',
  fontSize: 14,

  // Connect to a room
  connectToRoom: (roomSlug: string, accessToken: string) => {
    const { disconnect } = get();
    
    // Disconnect from any existing room
    disconnect();

    // Create new Yjs document
    const ydoc = new Y.Doc();

    // Connect to WebSocket provider
    const wsUrl = `${WS_URL}/yjs`;
    const provider = new WebsocketProvider(wsUrl, roomSlug, ydoc, {
      params: { room: roomSlug, token: accessToken },
    });

    // Set up connection status handlers
    provider.on('status', (event: { status: string }) => {
      set({ isConnected: event.status === 'connected' });
    });

    provider.on('connection-error', (event: any) => {
      console.error('Yjs connection error:', event);
      set({ connectionError: 'Connection failed' });
    });

    // Set up awareness for cursor sharing
    const awareness = provider.awareness;

    // Listen for file changes
    const filesMap = ydoc.getMap('files');
    const foldersMap = ydoc.getMap('folders');
    const metadataMap = ydoc.getMap('metadata');

    const updateFiles = () => {
      const files: FileItem[] = [];
      
      // Get all folders first
      foldersMap.forEach((value: any, key: string) => {
        files.push({ 
          id: key, 
          type: 'folder',
          language: '',
          ...value 
        });
      });
      
      // Get all files
      filesMap.forEach((value: any, key: string) => {
        files.push({ 
          id: key, 
          type: 'file',
          parentId: value.parentId || null,
          ...value 
        });
      });
      
      set({ files });
    };

    const updateActiveFile = () => {
      const activeFileId = metadataMap.get('activeFileId') as string | undefined;
      if (activeFileId) {
        set({ activeFileId });
      }
    };

    filesMap.observe(updateFiles);
    foldersMap.observe(updateFiles);
    metadataMap.observe(updateActiveFile);

    // Initial sync
    setTimeout(() => {
      updateFiles();
      updateActiveFile();
    }, 100);

    set({
      roomSlug,
      ydoc,
      provider,
      awareness,
      connectionError: null,
    });
  },

  // Disconnect from room
  disconnect: () => {
    const { provider, ydoc } = get();
    
    if (provider) {
      provider.destroy();
    }
    if (ydoc) {
      ydoc.destroy();
    }

    set({
      roomSlug: null,
      isConnected: false,
      ydoc: null,
      provider: null,
      awareness: null,
      files: [],
      activeFileId: null,
      expandedFolders: new Set<string>(),
      users: [],
    });
  },

  // Set active file
  setActiveFile: (fileId: string) => {
    const { ydoc, files } = get();
    
    // Only set active file if it's a file (not folder)
    const item = files.find(f => f.id === fileId);
    if (item && item.type === 'folder') return;
    
    if (ydoc) {
      const metadataMap = ydoc.getMap('metadata');
      metadataMap.set('activeFileId', fileId);
    }
    set({ activeFileId: fileId });
  },

  // Create new file
  createFile: (name: string, language: string, parentId: string | null = null) => {
    const { ydoc, files } = get();
    if (!ydoc) return;

    // Validate: check for duplicate name in same parent
    const siblings = files.filter(f => f.parentId === parentId);
    const nameExists = siblings.some(f => f.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
      console.warn('File with this name already exists in this folder');
      return;
    }

    const filesMap = ydoc.getMap('files');
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    filesMap.set(fileId, {
      id: fileId,
      name,
      type: 'file',
      language,
      parentId,
      createdAt: Date.now(),
    });

    // Create text content for the file
    const fileContent = ydoc.getText(`file:${fileId}`);
    fileContent.insert(0, `// ${name}\n`);

    // Switch to new file
    get().setActiveFile(fileId);
  },

  // Create new folder
  createFolder: (name: string, parentId: string | null = null) => {
    const { ydoc, files, expandedFolders } = get();
    if (!ydoc) return;

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 128) {
      console.warn('Invalid folder name');
      return;
    }

    // Check for forbidden characters
    const forbiddenChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (forbiddenChars.test(trimmedName)) {
      console.warn('Folder name contains forbidden characters');
      return;
    }

    // Check for duplicate name in same parent
    const siblings = files.filter(f => f.parentId === parentId && f.type === 'folder');
    const nameExists = siblings.some(f => f.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      console.warn('Folder with this name already exists');
      return;
    }

    // Check max depth (8 levels)
    let depth = 0;
    let currentParent = parentId;
    while (currentParent) {
      depth++;
      const parent = files.find(f => f.id === currentParent);
      currentParent = parent?.parentId || null;
      if (depth > 8) {
        console.warn('Maximum folder depth exceeded');
        return;
      }
    }

    const foldersMap = ydoc.getMap('folders');
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    foldersMap.set(folderId, {
      id: folderId,
      name: trimmedName,
      type: 'folder',
      parentId,
      createdAt: Date.now(),
    });

    // Auto-expand new folder
    const newExpandedFolders = new Set(expandedFolders);
    newExpandedFolders.add(folderId);
    
    // Also expand parent if exists
    if (parentId) {
      newExpandedFolders.add(parentId);
    }
    
    set({ expandedFolders: newExpandedFolders });
  },

  // Delete file
  deleteFile: (fileId: string) => {
    const { ydoc, files, activeFileId } = get();
    if (!ydoc) return;

    const file = files.find(f => f.id === fileId);
    if (!file || file.type !== 'file') return;

    const filesMap = ydoc.getMap('files');
    filesMap.delete(fileId);

    // Clear file content
    const fileContent = ydoc.getText(`file:${fileId}`);
    fileContent.delete(0, fileContent.length);

    // Switch to another file if needed
    if (activeFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId && f.type === 'file');
      if (remainingFiles.length > 0) {
        get().setActiveFile(remainingFiles[0].id);
      } else {
        set({ activeFileId: null });
      }
    }
  },

  // Delete folder (and all contents)
  deleteFolder: (folderId: string) => {
    const { ydoc, files } = get();
    if (!ydoc) return;

    const folder = files.find(f => f.id === folderId);
    if (!folder || folder.type !== 'folder') return;

    // Recursively find all children
    const getAllChildren = (parentId: string): string[] => {
      const children = files.filter(f => f.parentId === parentId);
      let allIds = children.map(c => c.id);
      children.forEach(child => {
        if (child.type === 'folder') {
          allIds = [...allIds, ...getAllChildren(child.id)];
        }
      });
      return allIds;
    };

    const childrenIds = getAllChildren(folderId);
    const filesMap = ydoc.getMap('files');
    const foldersMap = ydoc.getMap('folders');

    // Delete all children
    childrenIds.forEach(id => {
      const item = files.find(f => f.id === id);
      if (item?.type === 'file') {
        filesMap.delete(id);
        // Clear file content
        const fileContent = ydoc.getText(`file:${id}`);
        fileContent.delete(0, fileContent.length);
      } else {
        foldersMap.delete(id);
      }
    });

    // Delete the folder itself
    foldersMap.delete(folderId);
  },

  // Rename file
  renameFile: (fileId: string, newName: string) => {
    const { ydoc, files } = get();
    if (!ydoc) return;

    const file = files.find(f => f.id === fileId);
    if (!file || file.type !== 'file') return;

    const filesMap = ydoc.getMap('files');
    const fileData = filesMap.get(fileId) as any;
    
    if (fileData) {
      filesMap.set(fileId, {
        ...fileData,
        name: newName,
        updatedAt: Date.now(),
      });
    }
  },

  // Rename folder
  renameFolder: (folderId: string, newName: string) => {
    const { ydoc, files } = get();
    if (!ydoc) return;

    const folder = files.find(f => f.id === folderId);
    if (!folder || folder.type !== 'folder') return;

    const foldersMap = ydoc.getMap('folders');
    const folderData = foldersMap.get(folderId) as any;
    
    if (folderData) {
      foldersMap.set(folderId, {
        ...folderData,
        name: newName.trim(),
        updatedAt: Date.now(),
      });
    }
  },

  // Toggle folder expanded state
  toggleFolderExpanded: (folderId: string) => {
    const { expandedFolders } = get();
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    
    set({ expandedFolders: newExpanded });
  },

  // Execution
  setExecutionResult: (result) => set({ executionResult: result }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setInput: (input) => set({ input }),

  // Settings
  setTheme: (theme) => set({ theme }),
  setFontSize: (size) => set({ fontSize: size }),

  // Users
  updateUsers: (users) => set({ users }),
}));
