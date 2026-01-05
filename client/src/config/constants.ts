/**
 * Frontend Configuration Constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'codeverse_access_token',
  REFRESH_TOKEN: 'codeverse_refresh_token',
  USER: 'codeverse_user',
} as const;

// Language configuration
export const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: '.js', monacoId: 'javascript' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts', monacoId: 'typescript' },
  { id: 'python', name: 'Python', extension: '.py', monacoId: 'python' },
  { id: 'c', name: 'C', extension: '.c', monacoId: 'c' },
  { id: 'cpp', name: 'C++', extension: '.cpp', monacoId: 'cpp' },
  { id: 'java', name: 'Java', extension: '.java', monacoId: 'java' },
  { id: 'go', name: 'Go', extension: '.go', monacoId: 'go' },
  { id: 'rust', name: 'Rust', extension: '.rs', monacoId: 'rust' },
] as const;

// File extension to language mapping
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
};

// Monaco editor themes
export const EDITOR_THEMES = [
  { id: 'vs-dark', name: 'Dark' },
  { id: 'vs', name: 'Light' },
  { id: 'hc-black', name: 'High Contrast' },
] as const;

// Default editor settings
export const DEFAULT_EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const,
  renderWhitespace: 'selection' as const,
  bracketPairColorization: { enabled: true },
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
};

// Socket events
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  UPDATE_CURSOR: 'update-cursor',
  USERS_UPDATE: 'users-update',
  CURSOR_UPDATE: 'cursor-update',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
  ROOM_FULL: 'room-full',
} as const;

