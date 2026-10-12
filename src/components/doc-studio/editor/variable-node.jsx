import PropTypes from 'prop-types';
import { Node, nodeInputRule, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import { Box, Tooltip, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const TYPE_ICONS = {
  date: 'mdi:calendar-blank-outline',
  money: 'mdi:cash',
  url: 'mdi:link-variant',
};

/**
 * The chip an author sees in place of a {{token}}.
 *
 * Rendered from the catalogue, so a variable the document does not know is
 * unmistakable (red, struck) instead of silently printing nothing. Secrets such
 * as temporary passwords carry a lock: their sample value is masked everywhere.
 */
function VariableChip({ node, extension, selected }) {
  const { name } = node.attrs;
  const variable = (extension.options.variables || []).find((item) => item.key === name);
  const known = Boolean(variable);
  let icon = 'mdi:alert-circle-outline';
  if (known) icon = variable.sensitive ? 'mdi:lock-outline' : TYPE_ICONS[variable.type];

  const tooltip = known ? (
    <Box sx={{ p: 0.25 }}>
      <Typography variant="subtitle2">{variable.label}</Typography>
      {variable.description && (
        <Typography variant="caption" display="block" sx={{ opacity: 0.85 }}>
          {variable.description}
        </Typography>
      )}
      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
        {`{{${name}}}`} → {variable.sample || '—'}
      </Typography>
    </Box>
  ) : (
    `Unknown variable {{${name}}} — it will print as nothing`
  );

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Tooltip title={tooltip} arrow placement="top">
        <Box
          component="span"
          contentEditable={false}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            mx: '1px',
            px: '6px',
            height: '1.45em',
            lineHeight: 1,
            borderRadius: '6px',
            verticalAlign: 'baseline',
            fontFamily: 'inherit',
            fontSize: '0.92em',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'grab',
            userSelect: 'none',
            transition: 'box-shadow .15s',
            ...(known
              ? { color: 'info.darker', bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }
              : { color: 'error.dark', bgcolor: 'error.lighter', border: '1px dashed', borderColor: 'error.main', textDecoration: 'line-through' }),
            ...(selected && { boxShadow: (theme) => `0 0 0 2px ${theme.palette.info.main}` }),
          }}
        >
          {icon && <Iconify icon={icon} width={12} />}
          {known ? variable.label : name}
        </Box>
      </Tooltip>
    </NodeViewWrapper>
  );
}

VariableChip.propTypes = {
  node: PropTypes.object,
  extension: PropTypes.object,
  selected: PropTypes.bool,
};

// ----------------------------------------------------------------------

/**
 * An inline atom holding one variable — selected, dragged and deleted as a
 * single unit, so a half-token like `{{applican` can never be left behind.
 *
 * Serialises to `<span data-var="key">{{key}}</span>`: the literal token keeps
 * the stored HTML readable, and the renderer still resolves it if the span is
 * ever stripped.
 */
const VariableNode = Node.create({
  name: 'docVariable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { variables: [] };
  },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-var'),
        renderHTML: (attributes) => (attributes.name ? { 'data-var': attributes.name } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-var]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), `{{${node.attrs.name}}}`];
  },

  renderText({ node }) {
    return `{{${node.attrs.name}}}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableChip);
  },

  // Typing {{applicantName}} by hand turns it into a chip as soon as the
  // closing braces are typed.
  addInputRules() {
    return [
      nodeInputRule({
        find: /\{\{\s*([\w.]+)\s*\}\}$/,
        type: this.type,
        getAttributes: (match) => ({ name: match[1] }),
      }),
    ];
  },

  addCommands() {
    return {
      insertVariable:
        (name) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent([
              { type: this.name, attrs: { name } },
              // A trailing space keeps typing natural after insertion.
              { type: 'text', text: ' ' },
            ])
            .run(),
    };
  },
});

export default VariableNode;
