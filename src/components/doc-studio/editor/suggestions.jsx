import PropTypes from 'prop-types';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import { Box, Paper, Stack, MenuItem, MenuList, Typography, ListSubheader } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * A keyboard-driven floating list (shared by the `{{` variable menu and the
 * `/` command menu). Items: { id, group, label, hint, icon }.
 */
const SuggestionList = forwardRef(({ items, command, emptyText }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) return false;
      if (event.key === 'ArrowUp') {
        setSelected((current) => (current + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelected((current) => (current + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <Paper elevation={8} sx={{ p: 1.5, width: 300 }}>
        <Typography variant="caption" color="text.secondary">
          {emptyText}
        </Typography>
      </Paper>
    );
  }

  let lastGroup = null;
  return (
    <Paper elevation={12} sx={{ width: 340, maxHeight: 360, overflowY: 'auto', borderRadius: 1.5 }}>
      <MenuList dense disablePadding sx={{ py: 0.5 }}>
        {items.map((item, index) => {
          const showGroup = item.group && item.group !== lastGroup;
          lastGroup = item.group;
          return [
            showGroup ? (
              <ListSubheader key={`${item.group}-h`} sx={{ lineHeight: '26px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.group}
              </ListSubheader>
            ) : null,
            <MenuItem
              key={item.id}
              selected={index === selected}
              onMouseEnter={() => setSelected(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                command(item);
              }}
              sx={{ py: 0.75, mx: 0.5, borderRadius: 1 }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                {item.icon && (
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: 'grey.100', color: 'text.secondary', flexShrink: 0 }}>
                    <Iconify icon={item.icon} width={16} />
                  </Box>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.label}
                  </Typography>
                  {item.hint && (
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {item.hint}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </MenuItem>,
          ];
        })}
      </MenuList>
    </Paper>
  );
});

SuggestionList.propTypes = {
  items: PropTypes.array,
  command: PropTypes.func,
  emptyText: PropTypes.string,
};

/** Positions the list against the caret, flipping above when space runs out. */
function floatingRenderer(emptyText) {
  return () => {
    let component;
    let element;

    const place = (clientRect) => {
      if (!element || !clientRect) return;
      const rect = clientRect();
      if (!rect) return;
      const height = element.offsetHeight || 340;
      const top = window.innerHeight - rect.bottom < height + 16 ? rect.top - height - 6 : rect.bottom + 6;
      element.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 360))}px`;
      element.style.top = `${Math.max(8, top)}px`;
    };

    return {
      onStart: (props) => {
        component = new ReactRenderer(SuggestionList, { props: { ...props, emptyText }, editor: props.editor });
        element = document.createElement('div');
        element.style.position = 'fixed';
        element.style.zIndex = '1400';
        element.appendChild(component.element);
        document.body.appendChild(element);
        place(props.clientRect);
      },
      onUpdate: (props) => {
        component?.updateProps({ ...props, emptyText });
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
  };
}

const matches = (needle, ...haystack) => haystack.join(' ').toLowerCase().includes(String(needle || '').trim().toLowerCase());

// ----------------------------------------------------------------------

/**
 * `{{` → variable menu. Reads the catalogue through a getter: it arrives from
 * the API after the editor is built, and a captured array would stay empty.
 */
export const VariableSuggestion = (getContext) =>
  Extension.create({
    name: 'docVariableSuggestion',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: new PluginKey('docVariableSuggestion'),
          char: '{{',
          allowSpaces: false,
          items: ({ query }) =>
            (getContext().variables || [])
              .filter((variable) => matches(query, variable.key, variable.label, variable.group))
              .slice(0, 14)
              .map((variable) => ({
                id: variable.key,
                group: variable.group,
                label: variable.label,
                hint: `{{${variable.key}}} · ${variable.sample || ''}`,
                icon: variable.sensitive ? 'mdi:lock-outline' : 'mdi:code-braces',
              })),
          command: ({ editor, range, props }) => editor.chain().focus().deleteRange(range).insertVariable(props.id).run(),
          render: floatingRenderer('No matching variable.'),
        }),
      ];
    },
  });

// ----------------------------------------------------------------------

const FORMAT_COMMANDS = [
  { id: 'h1', label: 'Heading 1', icon: 'mdi:format-header-1', run: (c) => c.setHeading({ level: 1 }) },
  { id: 'h2', label: 'Heading 2', icon: 'mdi:format-header-2', run: (c) => c.setHeading({ level: 2 }) },
  { id: 'h3', label: 'Heading 3', icon: 'mdi:format-header-3', run: (c) => c.setHeading({ level: 3 }) },
  { id: 'title', label: 'Document title', hint: 'Centred, uppercase', icon: 'mdi:format-title', run: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'doc-title' }) },
  { id: 'section', label: 'Section heading', hint: 'Small caps with an accent rule', icon: 'mdi:format-section', run: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'section-heading' }) },
  { id: 'bullets', label: 'Bulleted list', icon: 'mdi:format-list-bulleted', run: (c) => c.toggleBulletList() },
  { id: 'numbers', label: 'Numbered list', icon: 'mdi:format-list-numbered', run: (c) => c.toggleOrderedList() },
  { id: 'quote', label: 'Quote', icon: 'mdi:format-quote-open', run: (c) => c.toggleBlockquote() },
  { id: 'table', label: 'Table', hint: '3 × 3 with a header row', icon: 'mdi:table', run: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: 'rule', label: 'Divider line', icon: 'mdi:minus', run: (c) => c.setHorizontalRule() },
  { id: 'fine', label: 'Fine print', hint: 'Small, centred, muted', icon: 'mdi:format-font-size-decrease', run: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'fine-print' }) },
];

/** `/` at the start of a line → blocks, headings, lists, tables. */
export const SlashCommands = (getContext) =>
  Extension.create({
    name: 'docSlashCommands',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: new PluginKey('docSlashCommands'),
          char: '/',
          startOfLine: true,
          items: ({ query }) => {
            const blocks = (getContext().blocks || [])
              .filter((block) => matches(query, block.name, block.label, block.description, block.group))
              .map((block) => ({ id: `block:${block.name}`, group: 'Dynamic blocks', label: block.label, hint: block.description, icon: block.icon, block: block.name }));
            const formats = FORMAT_COMMANDS.filter((item) => matches(query, item.label, item.hint)).map((item) => ({ ...item, group: 'Format' }));
            return [...blocks, ...formats].slice(0, 20);
          },
          command: ({ editor, range, props }) => {
            const chain = editor.chain().focus().deleteRange(range);
            if (props.block) chain.insertDocBlock(props.block).run();
            else FORMAT_COMMANDS.find((item) => item.id === props.id).run(chain).run();
          },
          render: floatingRenderer('Nothing matches — keep typing to write text.'),
        }),
      ];
    },
  });

export { FORMAT_COMMANDS };
