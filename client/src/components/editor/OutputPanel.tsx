/**
 * Output Panel Component
 * Shows code execution results
 */

import { useState, useEffect } from 'react';
import {
  Play,
  Terminal,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { judgeApi } from '../../services/api';
import Button from '../ui/Button';

interface OutputPanelProps {
  language: string;
  getCode: () => string;
  canExecute?: boolean;
}

export default function OutputPanel({ language, getCode, canExecute = true }: OutputPanelProps) {
  const {
    isExecuting,
    setIsExecuting,
    executionResult,
    setExecutionResult,
    input,
    setInput,
  } = useEditorStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showInput, setShowInput] = useState(false);

  const handleRun = async () => {
    const code = getCode();
    if (!code.trim()) {
      setExecutionResult({
        success: false,
        stdout: null,
        stderr: 'No code to execute',
        compile_output: null,
        status: 'Error',
        statusId: 0,
        time: null,
        memory: null,
      });
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await judgeApi.run({
        code,
        language,
        input: input || undefined,
      });
      setExecutionResult(result);
    } catch (error: any) {
      setExecutionResult({
        success: false,
        stdout: null,
        stderr: error.response?.data?.error || 'Execution failed',
        compile_output: null,
        status: 'Error',
        statusId: 0,
        time: null,
        memory: null,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Listen for run event from toolbar
  useEffect(() => {
    const handleRunEvent = () => {
      if (canExecute && !isExecuting) {
        handleRun();
      }
    };

    window.addEventListener('editor:run', handleRunEvent);
    return () => window.removeEventListener('editor:run', handleRunEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canExecute, isExecuting]);

  const getStatusIcon = () => {
    if (!executionResult) return null;
    if (executionResult.success) {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (executionResult.statusId === 6) {
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getOutput = () => {
    if (!executionResult) return '';
    
    const parts = [];
    if (executionResult.compile_output) {
      parts.push(`Compilation:\n${executionResult.compile_output}`);
    }
    if (executionResult.stdout) {
      parts.push(executionResult.stdout);
    }
    if (executionResult.stderr) {
      parts.push(`Error:\n${executionResult.stderr}`);
    }
    
    return parts.join('\n') || 'No output';
  };

  return (
    <div className="flex flex-col bg-[#0a0a0a] border-t border-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          <button
            className="icon-text text-sm font-medium text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
            )}
            <Terminal className="w-4 h-4 flex-shrink-0" />
            <span>Output</span>
          </button>
          
          {executionResult && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex-shrink-0">{getStatusIcon()}</span>
              <span>{executionResult.status}</span>
              {executionResult.time && (
                <span className="icon-text-xs">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{executionResult.time}</span>
                </span>
              )}
              {executionResult.memory && (
                <span className="icon-text-xs">
                  <HardDrive className="w-3 h-3 flex-shrink-0" />
                  <span>{executionResult.memory}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInput(!showInput)}
            className={showInput ? 'text-emerald-400' : ''}
          >
            Input
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            isLoading={isExecuting}
            disabled={isExecuting || !canExecute}
            title={!canExecute ? 'Viewers cannot execute code' : undefined}
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
          {executionResult && (
            <button
              className="p-1 hover:bg-[#1a1a2e] rounded transition-colors"
              onClick={() => setExecutionResult(null)}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex">
          {/* Input panel */}
          {showInput && (
            <div className="w-1/3 border-r border-[#1a1a2e] p-2">
              <label className="block text-xs text-gray-500 mb-1">Standard Input</label>
              <textarea
                className="w-full h-32 p-2 bg-[#0d0d0d] border border-[#2a2a4a] rounded text-sm text-gray-300 font-mono resize-none focus:outline-none focus:border-emerald-500"
                placeholder="Enter input for your program..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
          )}
          
          {/* Output */}
          <div className={`flex-1 p-2 ${showInput ? '' : 'w-full'}`}>
            <pre className="h-32 p-2 overflow-auto text-sm font-mono bg-[#0d0d0d] rounded border border-[#1a1a2e]">
              {isExecuting ? (
                <span className="text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                  Running...
                </span>
              ) : executionResult ? (
                <span className={executionResult.success ? 'text-gray-300' : 'text-red-400'}>
                  {getOutput()}
                </span>
              ) : (
                <span className="text-gray-500">Click "Run" to execute your code</span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

