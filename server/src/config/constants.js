/**
 * Application Constants
 * Centralized constants - no magic numbers in codebase
 */

// User roles for RBAC
const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = [ROLES.VIEWER, ROLES.EDITOR, ROLES.OWNER];

// Permissions matrix
const PERMISSIONS = {
  [ROLES.VIEWER]: ['read'],
  [ROLES.EDITOR]: ['read', 'write', 'execute'],
  [ROLES.OWNER]: ['read', 'write', 'execute', 'manage', 'delete'],
};

// Language mappings for Judge0
const LANGUAGE_MAP = {
  javascript: 93,
  js: 93,
  python: 71,
  py: 71,
  c: 50,
  cpp: 54,
  'c++': 54,
  java: 62,
  typescript: 74,
  ts: 74,
  go: 60,
  rust: 73,
  ruby: 72,
};

// File extensions to language mapping
const EXTENSION_TO_LANGUAGE = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.ts': 'typescript',
  '.py': 'python',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
};

// Default file templates
const DEFAULT_FILE_TEMPLATES = {
  javascript: '// Start coding in JavaScript!\nconsole.log("Hello, World!");\n',
  typescript: '// Start coding in TypeScript!\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);\n',
  python: '# Start coding in Python!\nprint("Hello, World!")\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
};

// User color palette for presence
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF7F50',
  '#9370DB', '#20B2AA', '#FFD700', '#FF6347', '#40E0D0',
];

// Socket.IO events
const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  UPDATE_CURSOR: 'update-cursor',
  EXECUTE_CODE: 'execute-code',
  
  // Server -> Client
  USERS_UPDATE: 'users-update',
  FILES_UPDATE: 'files-update',
  CODE_UPDATE: 'code-update',
  CURSOR_UPDATE: 'cursor-update',
  EXECUTION_RESULT: 'execution-result',
  ROOM_FULL: 'room-full',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
};

// Error codes
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  ROOM_FULL: 'ROOM_FULL',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  LANGUAGE_MAP,
  EXTENSION_TO_LANGUAGE,
  DEFAULT_FILE_TEMPLATES,
  USER_COLORS,
  SOCKET_EVENTS,
  ERROR_CODES,
};

