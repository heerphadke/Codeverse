/**
 * Terminal Panel Component
 * Interactive terminal for running commands
 */

import { useState, useRef, useEffect } from 'react';
import { Terminal, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface TerminalPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function TerminalPanel({ isExpanded, onToggle }: TerminalPanelProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState('~');
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (command: string) => {
    if (!command.trim()) return;

    const trimmed = command.trim();
    const parts = trimmed.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // Add command to history
    setHistory((prev) => [...prev, `$ ${trimmed}`]);

    // Handle commands
    if (cmd === 'clear' || cmd === 'cls') {
      setHistory([]);
      return;
    }

    if (cmd === 'help') {
      setHistory((prev) => [
        ...prev,
        'Available commands:',
        '  help     - Show this help message',
        '  clear    - Clear terminal',
        '  pwd      - Print working directory',
        '  echo     - Print text',
        '  date     - Show current date',
        '  whoami   - Show current user',
      ]);
      return;
    }

    if (cmd === 'pwd') {
      setHistory((prev) => [...prev, currentDirectory]);
      return;
    }

    if (cmd === 'echo') {
      setHistory((prev) => [...prev, args.join(' ') || '']);
      return;
    }

    if (cmd === 'date') {
      setHistory((prev) => [...prev, new Date().toLocaleString()]);
      return;
    }

    if (cmd === 'whoami') {
      setHistory((prev) => [...prev, 'codeverse-user']);
      return;
    }

    // Unknown command
    setHistory((prev) => [...prev, `Command not found: ${cmd}. Type 'help' for available commands.`]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput);
      setCurrentInput('');
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="flex flex-col bg-[#0a0a0a] border-t border-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
            <Terminal className="w-4 h-4" />
            Terminal
          </button>
          <span className="text-xs text-gray-500">Interactive shell</span>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-1.5 hover:bg-[#1a1a2e] rounded transition-colors"
              title="Clear terminal"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal content */}
      {isExpanded && (
        <div className="flex-1 flex flex-col p-2 bg-[#0d0d0d] min-h-[200px] max-h-[400px]">
          {/* History */}
          <div className="flex-1 overflow-y-auto mb-2 font-mono text-sm">
            {history.length === 0 ? (
              <div className="text-gray-500 text-xs p-2">
                Type 'help' for available commands. This is a basic terminal emulator.
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((line, index) => (
                  <div
                    key={index}
                    className={`px-2 py-0.5 ${
                      line.startsWith('$') ? 'text-emerald-400' : 'text-gray-300'
                    }`}
                  >
                    {line}
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-2 py-1 bg-[#0a0a0a] border border-[#1a1a2e] rounded">
            <span className="text-emerald-400 font-mono text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-gray-300 font-mono text-sm focus:outline-none"
              placeholder="Enter command..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

