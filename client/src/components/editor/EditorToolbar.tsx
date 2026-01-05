/**
 * Editor Toolbar Component
 * Quick actions and shortcuts for the editor
 */

import { Play, Terminal, Settings, Maximize2, Minimize2 } from 'lucide-react';
import Button from '../ui/Button';

interface EditorToolbarProps {
  onRun?: () => void;
  onTerminalToggle?: () => void;
  onSettings?: () => void;
  isTerminalOpen?: boolean;
  canExecute?: boolean;
}

export default function EditorToolbar({
  onRun,
  onTerminalToggle,
  onSettings,
  isTerminalOpen = false,
  canExecute = true,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border-b border-[#1a1a2e]">
      {/* Run button */}
      {canExecute && onRun && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRun}
          title="Run code (Ctrl+Enter)"
          className="interactive"
        >
          <Play className="w-4 h-4" />
          Run
        </Button>
      )}

      {/* Terminal toggle */}
      {onTerminalToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTerminalToggle}
          className={`interactive ${isTerminalOpen ? 'text-emerald-400' : ''}`}
          title="Toggle terminal (Ctrl+`)"
        >
          <Terminal className="w-4 h-4" />
          Terminal
        </Button>
      )}

      {/* Divider */}
      <div className="flex-1" />

      {/* Settings */}
      {onSettings && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettings}
          title="Editor settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

