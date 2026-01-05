/**
 * Cursor Manager
 * Manages remote cursor decorations in Monaco Editor
 */

import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';
import type { Awareness } from 'y-protocols/awareness';

interface CursorState {
  cursor: { lineNumber: number; column: number } | null;
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;
  user: {
    name: string;
    color: string;
  };
}

interface CursorManagerProps {
  editor: editor.IStandaloneCodeEditor | null;
  awareness: Awareness | null;
  currentUser: {
    name: string;
    color: string;
  };
}

export function useCursorManager({ editor, awareness, currentUser }: CursorManagerProps) {
  const decorationsRef = useRef<Map<number, string[]>>(new Map());
  const styleSheetRef = useRef<HTMLStyleElement | null>(null);

  // Set local user state in awareness
  useEffect(() => {
    if (!awareness || !currentUser) return;

    awareness.setLocalStateField('user', {
      name: currentUser.name,
      color: currentUser.color,
    });
  }, [awareness, currentUser]);

  // Track cursor position changes
  useEffect(() => {
    if (!editor || !awareness) return;

    const updateLocalCursor = () => {
      const selection = editor.getSelection();
      const position = editor.getPosition();

      if (position) {
        awareness.setLocalStateField('cursor', {
          lineNumber: position.lineNumber,
          column: position.column,
        });
      }

      if (selection && !selection.isEmpty()) {
        awareness.setLocalStateField('selection', {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        });
      } else {
        awareness.setLocalStateField('selection', null);
      }
    };

    // Listen to cursor and selection changes
    const cursorDisposable = editor.onDidChangeCursorPosition(updateLocalCursor);
    const selectionDisposable = editor.onDidChangeCursorSelection(updateLocalCursor);

    // Initial update
    updateLocalCursor();

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
    };
  }, [editor, awareness]);

  // Render remote cursors
  useEffect(() => {
    if (!editor || !awareness) return;

    // Create stylesheet for cursor styles
    if (!styleSheetRef.current) {
      styleSheetRef.current = document.createElement('style');
      document.head.appendChild(styleSheetRef.current);
    }

    const updateRemoteCursors = () => {
      const model = editor.getModel();
      if (!model) return;

      const states = awareness.getStates();
      const localClientId = awareness.clientID;
      const newDecorations: editor.IModelDeltaDecoration[] = [];
      const cssRules: string[] = [];

      states.forEach((state: any, clientId: number) => {
        if (clientId === localClientId) return;
        if (!state?.user || !state?.cursor) return;

        const { user, cursor, selection } = state as CursorState;
        const uniqueClass = `remote-cursor-${clientId}`;
        const selectionClass = `remote-selection-${clientId}`;

        // Add CSS for this user's cursor
        cssRules.push(`
          .${uniqueClass} {
            background-color: ${user.color};
            width: 2px !important;
            margin-left: -1px;
          }
          .${uniqueClass}::after {
            content: '${user.name}';
            position: absolute;
            top: -18px;
            left: 0;
            background-color: ${user.color};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
            white-space: nowrap;
            pointer-events: none;
            z-index: 100;
          }
          .${selectionClass} {
            background-color: ${user.color}30;
          }
        `);

        // Add cursor decoration (cursor is already checked above)
        if (cursor) {
          newDecorations.push({
            range: {
              startLineNumber: cursor.lineNumber,
              startColumn: cursor.column,
              endLineNumber: cursor.lineNumber,
              endColumn: cursor.column,
            },
            options: {
              className: uniqueClass,
              stickiness: 1,
            },
          });
        }

        // Add selection decoration if exists
        if (selection) {
          newDecorations.push({
            range: {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            },
            options: {
              className: selectionClass,
              stickiness: 1,
            },
          });
        }
      });

      // Update stylesheet
      if (styleSheetRef.current) {
        styleSheetRef.current.textContent = cssRules.join('\n');
      }

      // Update decorations
      const oldDecorations: string[] = [];
      decorationsRef.current.forEach((ids) => oldDecorations.push(...ids));
      
      const newIds = editor.deltaDecorations(oldDecorations, newDecorations);
      
      // Store new decoration IDs
      decorationsRef.current.clear();
      decorationsRef.current.set(0, newIds);
    };

    // Listen to awareness changes
    awareness.on('change', updateRemoteCursors);

    // Initial render
    updateRemoteCursors();

    return () => {
      awareness.off('change', updateRemoteCursors);
      
      // Clean up decorations
      const oldDecorations: string[] = [];
      decorationsRef.current.forEach((ids) => oldDecorations.push(...ids));
      if (oldDecorations.length > 0) {
        editor.deltaDecorations(oldDecorations, []);
      }
    };
  }, [editor, awareness]);

  // Cleanup stylesheet on unmount
  useEffect(() => {
    return () => {
      if (styleSheetRef.current) {
        styleSheetRef.current.remove();
        styleSheetRef.current = null;
      }
    };
  }, []);
}

export default useCursorManager;

