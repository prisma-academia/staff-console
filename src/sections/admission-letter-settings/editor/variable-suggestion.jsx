import PropTypes from 'prop-types';
import { ReactRenderer } from '@tiptap/react';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import {
  Box,
  Paper,
  MenuList,
  MenuItem,
  Typography,
  ListSubheader,
} from '@mui/material';

// ----------------------------------------------------------------------

const MAX_RESULTS = 12;

/** Matches on key, label and group so "reg" finds the registration dates. */
const filterVariables = (variables, query) => {
  const needle = String(query || '').trim().toLowerCase();
  const matches = !needle
    ? variables
    : variables.filter((variable) =>
        `${variable.key} ${variable.label} ${variable.group}`.toLowerCase().includes(needle)
      );
  return matches.slice(0, MAX_RESULTS);
};

// ----------------------------------------------------------------------

const VariableList = forwardRef(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  const select = (index) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelected((current) => (current + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelected((current) => (current + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        select(selected);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <Paper elevation={8} sx={{ p: 1.5, width: 300 }}>
        <Typography variant="caption" color="text.secondary">
          No matching variable.
        </Typography>
      </Paper>
    );
  }

  // Subheaders are emitted inline as the group changes, so the flat keyboard
  // index stays in step with what is on screen.
  let lastGroup = null;

  return (
    <Paper elevation={8} sx={{ width: 320, maxHeight: 320, overflowY: 'auto' }}>
      <MenuList dense disablePadding>
        {items.map((item, index) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;

          return [
            showGroup ? (
              <ListSubheader key={`${item.group}-header`} sx={{ lineHeight: '28px', fontSize: 11, textTransform: 'uppercase' }}>
                {item.group}
              </ListSubheader>
            ) : null,
            <MenuItem
              key={item.key}
              selected={index === selected}
              onMouseEnter={() => setSelected(index)}
              onClick={() => select(index)}
              sx={{ alignItems: 'flex-start', py: 0.75 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {`{{${item.key}}} — ${item.sample}`}
                </Typography>
              </Box>
            </MenuItem>,
          ];
        })}
      </MenuList>
    </Paper>
  );
});

VariableList.propTypes = {
  items: PropTypes.array,
  command: PropTypes.func,
};

// ----------------------------------------------------------------------

/**
 * Builds the `{{`-triggered insert menu.
 *
 * Positioned by hand against the caret rect rather than with a popper library:
 * TipTap hands us a `clientRect` on every update, and adding tippy.js just for
 * this would be a dependency for one floating box.
 *
 * `getVariables` is a callback rather than an array because the catalogue is
 * fetched from the API and arrives after the editor is created.
 */
export default function variableSuggestion(getVariables) {
  return {
    char: '{{',
    // Only fire at a word boundary, so typing "{{" inside a URL or a code-ish
    // string does not pop the menu open.
    allowSpaces: false,
    startOfLine: false,

    items: ({ query }) => filterVariables(getVariables() || [], query),

    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertVariable(props.key)
        .run();
    },

    render: () => {
      let component;
      let element;

      const place = (clientRect) => {
        if (!element || !clientRect) return;
        const rect = clientRect();
        if (!rect) return;

        // Flip above the caret when there is not enough room below, so the menu
        // is never clipped by the bottom of the viewport.
        const spaceBelow = window.innerHeight - rect.bottom;
        const height = element.offsetHeight || 320;
        const top = spaceBelow < height + 16 ? rect.top - height - 6 : rect.bottom + 6;

        element.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;
        element.style.top = `${Math.max(8, top)}px`;
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(VariableList, { props, editor: props.editor });

          element = document.createElement('div');
          element.style.position = 'fixed';
          element.style.zIndex = '1400';
          element.appendChild(component.element);
          document.body.appendChild(element);

          place(props.clientRect);
        },

        onUpdate: (props) => {
          component?.updateProps(props);
          place(props.clientRect);
        },

        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            element?.remove();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          element?.remove();
          component?.destroy();
          element = null;
          component = null;
        },
      };
    },
  };
}
