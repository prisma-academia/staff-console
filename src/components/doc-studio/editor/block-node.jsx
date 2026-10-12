import { useState } from 'react';
import PropTypes from 'prop-types';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import { Box, Stack, Button, Popover, Tooltip, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import BlockPropsForm, { summarizeProps } from './block-props-form';

// ----------------------------------------------------------------------

const parseProps = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
};

/**
 * Blocks are drawn as labelled cards, not as a rendering of their content:
 * what they print changes per record, so showing one record's data inside the
 * template would misrepresent it. The live preview is where the real content
 * appears. The gear opens the block's own settings.
 */
function BlockCard({ node, selected, extension, updateAttributes, deleteNode, editor }) {
  const [anchor, setAnchor] = useState(null);
  const { name, props } = node.attrs;
  const context = extension.options.context || {};
  const block = (context.blocks || []).find((item) => item.name === name);
  const editable = editor?.isEditable;

  if (!block) {
    return (
      <NodeViewWrapper data-drag-handle>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          contentEditable={false}
          sx={{ my: 1, p: 1.25, borderRadius: 1.5, border: '1px dashed', borderColor: 'error.main', bgcolor: 'error.lighter', color: 'error.dark' }}
        >
          <Iconify icon="mdi:puzzle-remove-outline" width={18} />
          <Typography variant="caption" sx={{ flexGrow: 1 }}>
            The block &ldquo;{name}&rdquo; is not available in this template — it will print nothing.
          </Typography>
          {editable && (
            <Button size="small" color="error" onClick={deleteNode}>
              Remove
            </Button>
          )}
        </Stack>
      </NodeViewWrapper>
    );
  }

  const hasProps = Object.keys(block.props || {}).length > 0;
  const summary = summarizeProps(block.props, props);
  const isPageBreak = name === 'pagebreak';

  if (isPageBreak) {
    return (
      <NodeViewWrapper data-drag-handle>
        <Stack direction="row" alignItems="center" spacing={1} contentEditable={false} sx={{ my: 2, color: 'text.disabled', userSelect: 'none' }}>
          <Box sx={{ flex: 1, borderTop: '2px dashed', borderColor: selected ? 'primary.main' : 'divider' }} />
          <Iconify icon="mdi:scissors-cutting" width={16} />
          <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>
            Page break
          </Typography>
          <Box sx={{ flex: 1, borderTop: '2px dashed', borderColor: selected ? 'primary.main' : 'divider' }} />
        </Stack>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <Box
        contentEditable={false}
        sx={{
          my: 1,
          position: 'relative',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: selected ? 'info.main' : 'transparent',
          background: (theme) =>
            selected
              ? theme.palette.info.lighter
              : `repeating-linear-gradient(135deg, ${theme.palette.grey[100]}, ${theme.palette.grey[100]} 8px, ${theme.palette.grey[50] || '#fafafa'} 8px, ${theme.palette.grey[50] || '#fafafa'} 16px)`,
          boxShadow: selected ? 'none' : (theme) => `inset 0 0 0 1px ${theme.palette.divider}`,
          userSelect: 'none',
          fontFamily: (theme) => theme.typography.fontFamily,
          transition: 'border-color .15s, background .15s',
          '&:hover .block-actions': { opacity: 1 },
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 1.25, py: 1 }}>
          <Box data-drag-handle sx={{ cursor: 'grab', color: 'text.disabled', display: 'flex' }}>
            <Iconify icon="mdi:drag-vertical" width={18} />
          </Box>
          <Box
            sx={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              color: 'info.main',
              bgcolor: 'common.white',
              boxShadow: (theme) => theme.customShadows?.z1 || '0 1px 2px rgba(0,0,0,.08)',
            }}
          >
            <Iconify icon={block.icon || 'mdi:puzzle-outline'} width={18} />
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.3, color: 'text.primary' }}>
              {block.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {summary || block.description}
            </Typography>
          </Box>
          <Stack direction="row" className="block-actions" sx={{ opacity: selected ? 1 : 0.4, transition: 'opacity .15s' }}>
            {hasProps && (
              <Tooltip title="Block settings">
                <IconButton size="small" onClick={(event) => setAnchor(event.currentTarget)}>
                  <Iconify icon="mdi:tune-variant" width={18} />
                </IconButton>
              </Tooltip>
            )}
            {editable && (
              <Tooltip title="Remove block">
                <IconButton size="small" onClick={deleteNode}>
                  <Iconify icon="mdi:trash-can-outline" width={18} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: '70vh', p: 2 } } }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Iconify icon={block.icon} width={20} sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1">{block.label}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {block.description}
        </Typography>
        <BlockPropsForm
          schema={block.props}
          value={props}
          variables={context.variables}
          signatories={context.signatories}
          disabled={!editable}
          onChange={(next) => updateAttributes({ props: next })}
        />
      </Popover>
    </NodeViewWrapper>
  );
}

BlockCard.propTypes = {
  node: PropTypes.object,
  selected: PropTypes.bool,
  extension: PropTypes.object,
  updateAttributes: PropTypes.func,
  deleteNode: PropTypes.func,
  editor: PropTypes.object,
};

// ----------------------------------------------------------------------

/**
 * A block-level atom serialising to
 *   <div data-block="name" data-props='{"…":…}'></div>
 * which the server replaces with real markup per record. Props round-trip as an
 * attribute — ProseMirror would silently drop it otherwise.
 */
const BlockNode = Node.create({
  name: 'docBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { context: { blocks: [], variables: [], signatories: [] } };
  },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block'),
        renderHTML: (attributes) => (attributes.name ? { 'data-block': attributes.name } : {}),
      },
      props: {
        default: {},
        parseHTML: (element) => parseProps(element.getAttribute('data-props')),
        renderHTML: (attributes) =>
          attributes.props && Object.keys(attributes.props).length ? { 'data-props': JSON.stringify(attributes.props) } : {},
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
      insertDocBlock:
        (name, props = {}) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: { name, props } }).run(),
    };
  },
});

export default BlockNode;
