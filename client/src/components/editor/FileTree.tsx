/**
 * File Tree Component
 * Displays and manages files and folders in the room
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  File,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  MoreVertical,
  Folder,
  FolderOpen,
  Edit2,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { EXTENSION_TO_LANGUAGE } from '../../config/constants';
import type { FileItem } from '../../types';

// File icon based on language
function getFileIcon(language: string) {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'python':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'java':
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'c':
    case 'cpp':
      return <FileCode className="w-4 h-4 text-purple-400" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
}

interface TreeItemProps {
  item: FileItem;
  isActive: boolean;
  isExpanded: boolean;
  depth: number;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onToggleExpand: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  canEdit: boolean;
}

function TreeItem({
  item,
  isActive,
  isExpanded,
  depth,
  onSelect,
  onDelete,
  onRename,
  onToggleExpand,
  onNewFile,
  onNewFolder,
  canEdit,
}: TreeItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const isFolder = item.type === 'folder';
  const paddingLeft = depth * 12 + 8;

  const handleRename = () => {
    if (newName.trim() && newName !== item.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
    setNewName(item.name);
  };

  const handleClick = () => {
    if (isFolder) {
      onToggleExpand();
    } else {
      onSelect();
    }
  };

  return (
    <div
      className={`
        group flex items-center gap-1.5 py-1.5 cursor-pointer
        hover:bg-[#1a1a2e] transition-colors rounded-md mx-1
        ${isActive && !isFolder ? 'bg-[#1a1a2e] border-l-2 border-emerald-500' : ''}
      `}
      style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '8px' }}
      onClick={handleClick}
    >
      {/* Folder chevron or file icon */}
      {isFolder ? (
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          )}
        </span>
      ) : (
        <span className="w-4" />
      )}

      {/* Icon */}
      <span className="flex-shrink-0">
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400" />
          )
        ) : (
          getFileIcon(item.language)
        )}
      </span>

      {/* Name */}
      {isRenaming ? (
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setIsRenaming(false);
              setNewName(item.name);
            }
          }}
          onBlur={handleRename}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-1 py-0 text-sm bg-[#0d0d0d] border border-emerald-500 rounded text-white focus:outline-none min-w-0"
          autoFocus
        />
      ) : (
        <span className={`flex-1 text-sm truncate ${isActive && !isFolder ? 'text-white' : 'text-gray-400'}`}>
          {item.name}
        </span>
      )}

      {/* Context menu */}
      {canEdit && !isRenaming && (
        <div className="relative">
          <button
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#2a2a4a] rounded transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            aria-label="More options"
          >
            <MoreVertical className="w-3 h-3 text-gray-500" />
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
              <div className="absolute right-0 top-6 z-20 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg shadow-xl py-1 min-w-[140px]">
                {isFolder && (
                  <>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#2a2a4a] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewFile();
                        setShowMenu(false);
                      }}
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      New File
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#2a2a4a] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewFolder();
                        setShowMenu(false);
                      }}
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      New Folder
                    </button>
                    <div className="border-t border-[#2a2a4a] my-1" />
                  </>
                )}
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#2a2a4a] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setShowMenu(false);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-[#2a2a4a] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface FileTreeProps {
  canEdit?: boolean;
}

export default function FileTree({ canEdit = true }: FileTreeProps) {
  const {
    files,
    activeFileId,
    expandedFolders,
    setActiveFile,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    toggleFolderExpanded,
  } = useEditorStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null);

  // Listen for shortcuts
  useEffect(() => {
    const handleNewFile = () => {
      if (canEdit) {
        setNewItemParentId(null);
        setShowNewFileInput(true);
      }
    };

    const handleNewFolder = (e: CustomEvent) => {
      if (canEdit) {
        setNewItemParentId(e.detail?.parentId || null);
        setShowNewFolderInput(true);
      }
    };

    window.addEventListener('filetree:new', handleNewFile);
    window.addEventListener('filetree:newfolder', handleNewFolder as EventListener);
    return () => {
      window.removeEventListener('filetree:new', handleNewFile);
      window.removeEventListener('filetree:newfolder', handleNewFolder as EventListener);
    };
  }, [canEdit]);

  // Keyboard shortcut for new folder (Ctrl+Shift+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (canEdit) {
          setNewItemParentId(null);
          setShowNewFolderInput(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit]);

  const handleCreateFile = () => {
    if (!newItemName.trim()) return;

    const ext = newItemName.includes('.')
      ? `.${newItemName.split('.').pop()}`
      : '.js';
    const language = EXTENSION_TO_LANGUAGE[ext] || 'javascript';
    const fileName = newItemName.includes('.') ? newItemName : `${newItemName}.js`;

    createFile(fileName, language, newItemParentId);
    setNewItemName('');
    setShowNewFileInput(false);
    setNewItemParentId(null);
  };

  const handleCreateFolder = () => {
    if (!newItemName.trim()) return;

    createFolder(newItemName, newItemParentId);
    setNewItemName('');
    setShowNewFolderInput(false);
    setNewItemParentId(null);
  };

  // Build tree structure from flat list
  const buildTree = useMemo(() => {
    const itemMap = new Map<string | null, FileItem[]>();

    // Group items by parent
    files.forEach((item) => {
      const parentId = item.parentId || null;
      if (!itemMap.has(parentId)) {
        itemMap.set(parentId, []);
      }
      itemMap.get(parentId)!.push(item);
    });

    // Sort each group: folders first, then alphabetically
    itemMap.forEach((items) => {
      items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return itemMap;
  }, [files]);

  // Render tree recursively
  const renderTree = (parentId: string | null, depth: number): React.ReactNode[] => {
    const items = buildTree.get(parentId) || [];
    const elements: React.ReactNode[] = [];

    items.forEach((item) => {
      const isExpanded = item.type === 'folder' && expandedFolders.has(item.id);

      elements.push(
        <TreeItem
          key={item.id}
          item={item}
          isActive={item.id === activeFileId}
          isExpanded={isExpanded}
          depth={depth}
          onSelect={() => setActiveFile(item.id)}
          onDelete={() => {
            if (item.type === 'folder') {
              if (confirm(`Delete folder "${item.name}" and all its contents?`)) {
                deleteFolder(item.id);
              }
            } else {
              deleteFile(item.id);
            }
          }}
          onRename={(newName) => {
            if (item.type === 'folder') {
              renameFolder(item.id, newName);
            } else {
              renameFile(item.id, newName);
            }
          }}
          onToggleExpand={() => toggleFolderExpanded(item.id)}
          onNewFile={() => {
            setNewItemParentId(item.id);
            setShowNewFileInput(true);
          }}
          onNewFolder={() => {
            setNewItemParentId(item.id);
            setShowNewFolderInput(true);
          }}
          canEdit={canEdit}
        />
      );

      // Render children if folder is expanded
      if (item.type === 'folder' && isExpanded) {
        elements.push(...renderTree(item.id, depth + 1));
      }
    });

    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a2e]">
        <button
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span>Files</span>
        </button>

        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 hover:bg-[#1a1a2e] rounded transition-colors group"
              onClick={() => {
                setNewItemParentId(null);
                setShowNewFolderInput(true);
              }}
              title="New Folder (Ctrl+Shift+N)"
              aria-label="Create new folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-400 group-hover:text-amber-400 transition-colors" />
            </button>
            <button
              className="p-1.5 hover:bg-[#1a1a2e] rounded transition-colors group"
              onClick={() => {
                setNewItemParentId(null);
                setShowNewFileInput(true);
              }}
              title="New File (Ctrl+N)"
              aria-label="Create new file"
            >
              <FilePlus className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* New folder input */}
      {showNewFolderInput && (
        <div className="px-3 py-2 border-b border-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <input
              type="text"
              className="flex-1 px-2 py-1 text-sm bg-[#0d0d0d] border border-amber-500 rounded text-white placeholder-gray-500 focus:outline-none"
              placeholder="Folder name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setShowNewFolderInput(false);
                  setNewItemName('');
                  setNewItemParentId(null);
                }
              }}
              onBlur={() => {
                if (!newItemName.trim()) {
                  setShowNewFolderInput(false);
                  setNewItemParentId(null);
                }
              }}
              autoFocus
              aria-label="New folder name"
            />
          </div>
          {newItemParentId && (
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Creating in: {files.find((f) => f.id === newItemParentId)?.name || 'root'}
            </p>
          )}
        </div>
      )}

      {/* New file input */}
      {showNewFileInput && (
        <div className="px-3 py-2 border-b border-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <input
              type="text"
              className="flex-1 px-2 py-1 text-sm bg-[#0d0d0d] border border-emerald-500 rounded text-white placeholder-gray-500 focus:outline-none"
              placeholder="filename.js"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setShowNewFileInput(false);
                  setNewItemName('');
                  setNewItemParentId(null);
                }
              }}
              onBlur={() => {
                if (!newItemName.trim()) {
                  setShowNewFileInput(false);
                  setNewItemParentId(null);
                }
              }}
              autoFocus
              aria-label="New file name"
            />
          </div>
          {newItemParentId && (
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Creating in: {files.find((f) => f.id === newItemParentId)?.name || 'root'}
            </p>
          )}
        </div>
      )}

      {/* File list */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto py-1" role="tree" aria-label="File explorer">
          {files.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Folder className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No files yet</p>
              {canEdit && (
                <button
                  onClick={() => {
                    setNewItemParentId(null);
                    setShowNewFileInput(true);
                  }}
                  className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Create your first file
                </button>
              )}
            </div>
          ) : (
            renderTree(null, 0)
          )}
        </div>
      )}
    </div>
  );
}
