import PropTypes from 'prop-types';
import { Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Suggestion from '@tiptap/suggestion';
import StarterKit from '@tiptap/starter-kit';
import { useRef, useMemo, useEffect } from 'react';
import { TableKit } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { useEditor, EditorContent } from '@tiptap/react';
import { Color, TextStyle } from '@tiptap/extension-text-style';

import { Box } from '@mui/material';

import BlockNode from './block-node';
import OptionalMark from './optional-mark';
import VariableNode from './variable-node';
import LetterToolbar from './letter-toolbar';
import PreservedClass from './preserved-class';
import variableSuggestion from './variable-suggestion';

// ----------------------------------------------------------------------

/**
 * Wires the `{{`-triggered insert menu into the editor.
 *
 * A thin extension rather than a `Node.addProseMirrorPlugins` on the variable
 * node itself, so the suggestion config can be rebuilt when the catalogue
 * arrives from the API without recreating the node type.
 */
const createVariableSuggestions = (getVariables) =>
  Extension.create({
    name: 'letterVariableSuggestion',
    addProseMirrorPlugins() {
      return [Suggestion({ editor: this.editor, ...variableSuggestion(getVariables) })];
    },
  });

// ----------------------------------------------------------------------

/**
 * The letter body editor: an A4-width writing surface styled to match the
 * printed page, so line breaks and paragraph rhythm read roughly as they will in
 * the PDF. The live preview beside it is the authority on exact output.
 */
export default function LetterEditor({ value, variables, disabled, onChange }) {
  // The suggestion plugin is created once, but reads the latest catalogue on
  // every keystroke — variables load asynchronously and would otherwise be
  // captured empty.
  const variablesRef = useRef(variables);
  variablesRef.current = variables;

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      TableKit.configure({ table: { resizable: true } }),
      VariableNode.configure({ variables: variablesRef.current }),
      BlockNode,
      OptionalMark,
      PreservedClass,
      createVariableSuggestions(() => variablesRef.current),
    ],
    // Intentionally built once: rebuilding extensions tears down the editor and
    // loses the caret. Variable data is read through the ref instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const editor = useEditor({
    extensions,
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  // Re-sync only when the document genuinely differs — comparing against the
  // editor's own HTML stops every keystroke from round-tripping back in and
  // resetting the cursor to the start of the letter.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  // Chips render through the catalogue, so they must repaint once it loads.
  useEffect(() => {
    if (!editor) return;
    editor.extensionManager.extensions
      .filter((extension) => extension.name === 'letterVariable')
      .forEach((extension) => {
        // eslint-disable-next-line no-param-reassign
        extension.options.variables = variables;
      });
    editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false));
  }, [editor, variables]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 1, minHeight: 0 }}>
      <LetterToolbar editor={editor} variables={variables} disabled={disabled} />

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          bgcolor: 'background.neutral',
          p: { xs: 1.5, md: 3 },
          '& .tiptap': {
            // 210mm less the template's 16mm side margins — the same measure the
            // printed letter uses, so a line that wraps here wraps there.
            maxWidth: '178mm',
            minHeight: '60vh',
            mx: 'auto',
            p: '12mm 10mm',
            bgcolor: 'common.white',
            color: '#555',
            borderRadius: 1,
            boxShadow: (theme) => theme.customShadows?.z8 || '0 2px 12px rgba(0,0,0,.08)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '10.5pt',
            lineHeight: 1.45,
            outline: 'none',
          },
          '& .tiptap p': { margin: '0 0 3mm', textAlign: 'justify' },
          '& .tiptap h1, & .tiptap h2, & .tiptap h3': { margin: '0 0 3mm', color: '#333', lineHeight: 1.3 },
          '& .tiptap h1': { fontSize: '15pt' },
          '& .tiptap h2': { fontSize: '13pt' },
          '& .tiptap h3': { fontSize: '11.5pt' },
          '& .tiptap ul, & .tiptap ol': { margin: '0 0 3mm', paddingLeft: 24 },
          '& .tiptap li': { margin: '0 0 1.5mm' },
          // The editor wraps list-item content in a paragraph; without this the
          // paragraph's bottom margin double-spaces every bullet.
          '& .tiptap li > p': { margin: 0 },
          '& .tiptap .letter-title': {
            textAlign: 'center',
            fontSize: '14pt',
            fontWeight: 'bold',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: '#333',
          },
          '& .tiptap .block-heading': { fontWeight: 'bold', color: '#333', textAlign: 'left' },
          '& .tiptap .block-heading .num': { display: 'inline-block', minWidth: 22 },
          '& .tiptap img': { maxWidth: '100%', height: 'auto' },
          '& .tiptap table': { width: '100%', borderCollapse: 'collapse', margin: '0 0 3mm' },
          '& .tiptap th, & .tiptap td': { border: '1px solid #ddd', padding: '1.5mm 2mm', textAlign: 'left' },
          '& .tiptap th': { background: '#f5f5f5' },
          '& .tiptap hr': { border: 0, borderTop: '1px solid #ddd', margin: '4mm 0' },
          // Optional segments are invisible in print; the dashed underline is an
          // editing affordance so the author can see what may vanish.
          '& .tiptap [data-optional]': {
            borderBottom: '1px dashed',
            borderColor: 'warning.main',
            backgroundColor: 'rgba(255,171,0,.08)',
          },
          '& .tiptap .ProseMirror-selectednode': { outline: '2px solid', outlineColor: 'primary.main' },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}

LetterEditor.propTypes = {
  value: PropTypes.string,
  variables: PropTypes.array,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
};
