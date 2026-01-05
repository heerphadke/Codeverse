/**
 * Shared TypeScript Types
 */

// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  color: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Room types
export type RoomRole = 'owner' | 'editor' | 'viewer';

export interface RoomSettings {
  isPublic: boolean;
  allowAnonymous: boolean;
  maxMembers: number;
  defaultLanguage: string;
}

export interface RoomMember {
  user: User;
  role: RoomRole;
  joinedAt: string;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  owner: User;
  members: RoomMember[];
  role: RoomRole;
  settings: RoomSettings;
  lastActivityAt: string;
  createdAt: string;
}

export interface RoomListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  owner: User;
  memberCount: number;
  role: RoomRole;
  settings: RoomSettings;
  lastActivityAt: string;
  createdAt: string;
}

// File types
export type FileSystemItemType = 'file' | 'folder';

export interface FileItem {
  id: string;
  name: string;
  type: FileSystemItemType;
  language: string;
  parentId: string | null; // null = root level
  createdAt?: number;
  updatedAt?: number;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  parentId: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export type FileSystemItem = FileItem | FolderItem;

// Presence types
export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface Selection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface UserPresence {
  oderId: string;
  username: string;
  color: string;
  cursor: CursorPosition | null;
  selection: Selection | null;
  activeFileId: string | null;
  socketId: string;
}

// Code execution types
export interface ExecutionResult {
  success: boolean;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: string;
  statusId: number;
  time: string | null;
  memory: string | null;
  exitCode?: number;
}

// API response types
export interface ApiError {
  error: string;
  code: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

