import PropTypes from 'prop-types';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import { Box, Stack, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * The dynamic pieces of the letter that cannot be authored as static text
 * because their content depends on the admission being printed.
 *
 * Keys must match the `data-block` names handled by
 * application-api/src/util/letter-html.js — that file decides what each one
 * actually renders.
 */
export const LETTER_BLOCKS = [
  {
    name: 'meta',
    label: 'Recipient header',
    icon: 'eva:person-outline',
    description: 'Name, application ID, admission number and date.',
  },
  {
    name: 'details',
    label: 'Programme details',
    icon: 'eva:list-outline',
    description: 'Duration, session, set, mode of study and the registration dates. Rows with no value are left out.',
  },
  {
    name: 'documents',
    label: 'Required documents',
    icon: 'eva:file-text-outline',
    description: 'The documents list below — or the student’s own requirements when the offer set them.',
  },
  {
    name: 'notes',
    label: 'Important notes',
    icon: 'eva:alert-circle-outline',
    description: 'The notes list from the Content panel, numbered.',
  },
  {
    name: 'signature',
    label: 'Signature block',
    icon: 'eva:edit-2-outline',
    description: 'Signature image, name, honorifics and title from the Signatory panel.',
  },
  {
    name: 'pagebreak',
    label: 'Page break',
    icon: 'eva:scissors-outline',
    description: 'Everything after this starts on a new sheet.',
  },
];

const blockByName = (name) => LETTER_BLOCKS.find((block) => block.name === name);

// ----------------------------------------------------------------------

/**
 * Blocks are drawn as labelled cards rather than a live rendering of their
 * content: what they print changes per admission, so showing one admission's
 * data inside the editor would misrepresent the template. The live preview beside
 * the editor is where the real content is seen.
 */
function BlockCard({ node, selected }) {
  const block = blockByName(node.attrs.name);

  if (!block) {
    return (
      <NodeViewWrapper>
        <Box
          contentEditable={false}
          sx={{ my: 1, p: 1.5, borderRadius: 1, border: '1px dashed', borderColor: 'error.main', color: 'error.main' }}
        >
          <Typography variant="caption">Unknown block &ldquo;{node.attrs.name}&rdquo; — it will print nothing.</Typography>
        </Box>
      </NodeViewWrapper>
    );
  }

  const isPageBreak = block.name === 'pagebreak';

  return (
    <NodeViewWrapper>
      <Box
        contentEditable={false}
        sx={{
          my: 1,
          px: 1.5,
          py: isPageBreak ? 0.75 : 1.25,
          borderRadius: 1,
          border: '1px dashed',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: selected ? 'primary.lighter' : 'background.neutral',
          userSelect: 'none',
          transition: 'border-color .15s, background-color .15s',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Iconify icon={block.icon} width={18} sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
              {block.label}
            </Typography>
            {!isPageBreak && (
              <Typography variant="caption" color="text.secondary">
                {block.description}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
    </NodeViewWrapper>
  );
}

BlockCard.propTypes = {
  node: PropTypes.object,
  selected: PropTypes.bool,
};

// ----------------------------------------------------------------------

/**
 * A block-level atom serialising to `<div data-block="name"></div>`, which the
 * server swaps for real markup when it renders the letter.
 */
const BlockNode = Node.create({
  name: 'letterBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block'),
        renderHTML: (attributes) => (attributes.name ? { 'data-block': attributes.name } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockCard);
  },

  addCommands() {
    return {
      insertLetterBlock:
        (name) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: { name } }).run(),
    };
  },
});

export default BlockNode;
