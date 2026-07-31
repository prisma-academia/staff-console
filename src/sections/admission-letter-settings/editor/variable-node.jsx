import PropTypes from 'prop-types';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

import { Chip, Tooltip } from '@mui/material';

// ----------------------------------------------------------------------

/**
 * The chip an author sees in place of a {{token}}.
 *
 * Rendered from the catalogue so a variable that no longer exists is obvious at
 * a glance rather than silently printing nothing in the finished letter.
 */
function VariableChip({ node, extension }) {
  const { name } = node.attrs;
  const variable = (extension.options.variables || []).find((item) => item.key === name);
  const known = Boolean(variable);

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline' }}>
      <Tooltip
        title={known ? `${variable.description} e.g. "${variable.sample}"` : `Unknown variable — {{${name}}} will print as nothing`}
      >
        <Chip
          component="span"
          size="small"
          label={known ? variable.label : name}
          color={known ? 'primary' : 'error'}
          variant={known ? 'filled' : 'outlined'}
          sx={{
            height: 20,
            fontSize: 12,
            fontWeight: 600,
            mx: '1px',
            verticalAlign: 'baseline',
            cursor: 'default',
            userSelect: 'none',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Tooltip>
    </NodeViewWrapper>
  );
}

VariableChip.propTypes = {
  node: PropTypes.object,
  extension: PropTypes.object,
};

// ----------------------------------------------------------------------

/**
 * An inline atom holding one letter variable.
 *
 * Being an atom is the point: the chip is selected and deleted as a single unit,
 * so an author can never leave a half-token like `{{applicant` behind — which is
 * exactly the failure the plain-textarea version invited.
 *
 * Serialises to `<span data-var="key">{{key}}</span>`. The literal `{{key}}` text
 * inside is what keeps the stored HTML readable and lets the server's plain-text
 * `renderTokens` resolve it even if the span were ever stripped.
 */
const VariableNode = Node.create({
  name: 'letterVariable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

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

  addCommands() {
    return {
      insertVariable:
        (name) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent([
              { type: this.name, attrs: { name } },
              // A trailing space keeps typing natural after insertion — without
              // it the caret sits flush against the chip and the next word looks
              // like part of the token.
              { type: 'text', text: ' ' },
            ])
            .run(),
    };
  },
});

export default VariableNode;
