/**
 * Code Editor Component
 * Monaco Editor with Yjs binding and live cursors
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as Y from 'yjs';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';
import { useCursorManager } from './CursorManager';
import { DEFAULT_EDITOR_OPTIONS } from '../../config/constants';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ language = 'javascript', readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isLocalChange = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const { ydoc, provider, activeFileId, fontSize } = useEditorStore();
  const { user } = useAuthStore();

  // Get awareness from provider
  const awareness = provider?.awareness || null;

  // Initialize cursor manager for live cursors
  useCursorManager({
    editor: editorRef.current,
    awareness,
    currentUser: user ? {
      name: user.username,
      color: user.color,
    } : { name: 'Anonymous', color: '#888888' },
  });

  // Handle editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco theme
    monaco.editor.defineTheme('codeverse-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editorLineNumber.foreground': '#4a4a6a',
        'editorLineNumber.activeForeground': '#c0c0c0',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#10b981',
        'editorIndentGuide.background': '#1a1a2e',
        'editorIndentGuide.activeBackground': '#2a2a4a',
      },
    });

    monaco.editor.setTheme('codeverse-dark');
    setIsReady(true);
  };

  // Sync Yjs document with editor
  useEffect(() => {
    if (!isReady || !editorRef.current || !ydoc || !activeFileId) {
      return;
    }

    const ytext = ydoc.getText(`file:${activeFileId}`);
    const model = editorRef.current.getModel();

    if (!model) return;

    // Set initial content
    const initialContent = ytext.toString();
    if (model.getValue() !== initialContent) {
      isLocalChange.current = true;
      model.setValue(initialContent);
      isLocalChange.current = false;
    }

    // Listen to Yjs changes
    const observer = (event: Y.YTextEvent) => {
      if (isLocalChange.current) return;

      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      if (!model) return;

      isLocalChange.current = true;
      
      let index = 0;
      event.delta.forEach((op) => {
        if (op.retain !== undefined) {
          index += op.retain;
        } else if (op.insert !== undefined && typeof op.insert === 'string') {
          const pos = model.getPositionAt(index);
          model.applyEdits([{
            range: {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column,
            },
            text: op.insert,
          }]);
          index += op.insert.length;
        } else if (op.delete !== undefined) {
          const startPos = model.getPositionAt(index);
          const endPos = model.getPositionAt(index + op.delete);
          model.applyEdits([{
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            text: '',
          }]);
        }
      });
      
      isLocalChange.current = false;
    };

    ytext.observe(observer);

    return () => {
      ytext.unobserve(observer);
    };
  }, [isReady, ydoc, activeFileId]);

  // Handle editor changes
  const handleChange: OnChange = useCallback((value) => {
    if (isLocalChange.current || !ydoc || !activeFileId || !editorRef.current) {
      return;
    }

    const ytext = ydoc.getText(`file:${activeFileId}`);
    const currentContent = ytext.toString();
    const newContent = value || '';

    if (currentContent === newContent) return;

    // Simple diff: replace entire content
    isLocalChange.current = true;
    ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, newContent);
    });
    isLocalChange.current = false;
  }, [ydoc, activeFileId]);

  // Update editor options when settings change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  if (!activeFileId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a1a2e] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full">
      <Editor
        height="100%"
        language={language}
        theme="codeverse-dark"
        onMount={handleEditorMount}
        onChange={handleChange}
        options={{
          ...DEFAULT_EDITOR_OPTIONS,
          fontSize,
          readOnly,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          </div>
        }
      />
    </div>
  );
}
