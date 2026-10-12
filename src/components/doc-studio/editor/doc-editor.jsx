import PropTypes from 'prop-types';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { useRef, useMemo, useEffect } from 'react';
import { TableKit } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useEditor, EditorContent } from '@tiptap/react';
import { Color, TextStyle } from '@tiptap/extension-text-style';

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

import BlockNode from './block-node';
import DocToolbar from './doc-toolbar';
import VariableNode from './variable-node';
import { SlashCommands, VariableSuggestion } from './suggestions';
import { SingleLine, OptionalMark, PreservedClass } from './marks';

// ----------------------------------------------------------------------

/** Pushes the latest catalogue into the node views, which read it on render. */
function useSyncContext(editor, context) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.extensionManager.extensions.forEach((extension) => {
      if (extension.name === 'docVariable') extension.options.variables = context.variables; // eslint-disable-line no-param-reassign
      if (extension.name === 'docBlock') extension.options.context = context; // eslint-disable-line no-param-reassign
    });
    // Repaint chips and cards without an undo step — and without an update
    // event: plugins append to this transaction (the trailing paragraph), and
    // that must not count as the author editing, or merely opening a template
    // would create a draft.
    editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false).setMeta('preventUpdate', true));
  }, [editor, context]);
}

/** Keeps the editor in step with an external value without moving the caret. */
function useSyncValue(editor, value, onLoaded) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incoming = value || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
      if (onLoaded) onLoaded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);
}

/**
 * Separates the author's edits from the editor's own normalisation.
 *
 * ProseMirror re-serialises loaded HTML slightly differently (a list item gains
 * a paragraph, attributes reorder) and emits that as an update. Treated as an
 * edit, merely opening a template would create a draft. So until the author
 * focuses the editor — or a moment has passed since the content was loaded —
 * an update is adopted as the clean baseline (onNormalize) instead.
 */
function useAuthoredUpdates(onChange, onNormalize) {
  const touched = useRef(false);
  const loadedAt = useRef(Date.now());
  const handlers = useRef({ onChange, onNormalize });
  handlers.current = { onChange, onNormalize };
  return {
    onFocus: () => {
      touched.current = true;
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      const authored = touched.current || Date.now() - loadedAt.current > 1500;
      if (authored || !handlers.current.onNormalize) handlers.current.onChange(html);
      else handlers.current.onNormalize(html);
    },
    markLoaded: () => {
      loadedAt.current = Date.now();
    },
  };
}

// ----------------------------------------------------------------------

/**
 * The document canvas: a page-width writing surface styled by the SAME CSS
 * the server prints with (served as `editorCss`), so a line that wraps here
 * wraps in the PDF. Editor-only affordances (optional-segment underline, block
 * cards, selection rings) are layered on top and never reach the output.
 */
export default function DocEditor({ value, onChange, onNormalize, context, editorCss, contentWidthMm, channel, disabled, onEditor, onOpenVariables, brandColors }) {
  const contextRef = useRef(context);
  contextRef.current = context;

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      TableKit.configure({ table: { resizable: true } }),
      VariableNode.configure({ variables: contextRef.current.variables }),
      BlockNode.configure({ context: contextRef.current }),
      OptionalMark,
      PreservedClass,
      VariableSuggestion(() => contextRef.current),
      SlashCommands(() => contextRef.current),
      Placeholder.configure({ placeholder: 'Start writing — type {{ for a variable, / for a block' }),
    ],
    // Built once: rebuilding tears the editor down and loses the caret. The
    // catalogue is read through the ref instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const authored = useAuthoredUpdates(onChange, onNormalize);
  const editor = useEditor({
    extensions,
    content: value || '',
    editable: !disabled,
    onFocus: authored.onFocus,
    onUpdate: authored.onUpdate,
  });

  useSyncValue(editor, value, authored.markLoaded);
  useSyncContext(editor, context);
  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);
  // Announce each editor instance once (a fresh callback every render must
  // not re-register listeners on the same editor).
  const onEditorRef = useRef(onEditor);
  onEditorRef.current = onEditor;
  useEffect(() => {
    if (editor && onEditorRef.current) onEditorRef.current(editor);
  }, [editor]);

  const isEmail = channel === 'email';
  const pageWidth = isEmail ? '600px' : `${(contentWidthMm || 178) + 20}mm`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 1, minHeight: 0 }}>
      <DocToolbar
        editor={editor}
        variables={context.variables}
        blocks={context.blocks}
        brandColors={brandColors}
        channel={channel}
        disabled={disabled}
        onOpenVariables={onOpenVariables}
      />

      {/* The server's document stylesheet, scoped to this canvas. */}
      {editorCss && <style>{editorCss}</style>}

      <Box
        className="doc-canvas"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: { xs: 1.5, md: 4 },
          py: { xs: 2, md: 4 },
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          backgroundImage: (theme) => `radial-gradient(${alpha(theme.palette.grey[500], 0.14)} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
          '& .ProseMirror': {
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: pageWidth,
            minHeight: isEmail ? 360 : '120mm',
            mx: 'auto',
            p: isEmail ? '28px' : '14mm 10mm',
            bgcolor: 'common.white',
            borderRadius: isEmail ? '12px' : '2px',
            boxShadow: (theme) => theme.customShadows?.z16 || '0 8px 30px rgba(0,0,0,.08)',
            outline: 'none',
            caretColor: (theme) => theme.palette.primary.main,
          },
          '& .ProseMirror [data-optional]': {
            borderBottom: '1.5px dashed',
            borderColor: 'warning.main',
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
            borderRadius: '2px',
          },
          '& .ProseMirror .selectedCell': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) },
          '& .ProseMirror img.ProseMirror-selectednode': { outline: '2px solid', outlineColor: 'primary.main' },
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
          '& .ProseMirror .column-resize-handle': { position: 'absolute', right: -2, top: 0, bottom: 0, width: 4, bgcolor: 'primary.main', pointerEvents: 'none' },
          '& .ProseMirror .tableWrapper': { overflowX: 'auto' },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}

DocEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onNormalize: PropTypes.func,
  context: PropTypes.object,
  editorCss: PropTypes.string,
  contentWidthMm: PropTypes.number,
  channel: PropTypes.string,
  disabled: PropTypes.bool,
  onEditor: PropTypes.func,
  onOpenVariables: PropTypes.func,
  brandColors: PropTypes.object,
};

// ----------------------------------------------------------------------

/**
 * A small chips-aware field: email subject and preheader (single line) and the
 * SMS body (several lines). Plain text plus variables and optional segments —
 * nothing else would survive a subject line or a text message.
 */
export function InlineEditor({ value, onChange, onNormalize, variables, multiline, placeholder, disabled, minHeight, onEditor, sx }) {
  const contextRef = useRef({ variables });
  contextRef.current = { variables };

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
        hardBreak: false,
        trailingNode: false,
      }),
      VariableNode.configure({ variables }),
      OptionalMark,
      VariableSuggestion(() => contextRef.current),
      Placeholder.configure({ placeholder: placeholder || '' }),
      ...(multiline ? [] : [SingleLine]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const authored = useAuthoredUpdates(onChange, onNormalize);
  const editor = useEditor({
    extensions,
    content: value || '',
    editable: !disabled,
    onFocus: authored.onFocus,
    onUpdate: authored.onUpdate,
  });

  useSyncValue(editor, value, authored.markLoaded);
  useSyncContext(editor, { variables, blocks: [] });
  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);
  const onEditorRef = useRef(onEditor);
  onEditorRef.current = onEditor;
  useEffect(() => {
    if (editor && onEditorRef.current) onEditorRef.current(editor);
  }, [editor]);

  return (
    <Box
      sx={{
        '& .ProseMirror': {
          outline: 'none',
          minHeight: minHeight || 24,
          lineHeight: 1.6,
          '& p': { m: 0 },
        },
        '& .ProseMirror [data-optional]': { borderBottom: '1.5px dashed', borderColor: 'warning.main' },
        '& .ProseMirror p.is-editor-empty:first-of-type::before': {
          content: 'attr(data-placeholder)',
          color: 'text.disabled',
          float: 'left',
          height: 0,
          pointerEvents: 'none',
        },
        ...sx,
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );
}

InlineEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onNormalize: PropTypes.func,
  variables: PropTypes.array,
  multiline: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  minHeight: PropTypes.number,
  onEditor: PropTypes.func,
  sx: PropTypes.object,
};
