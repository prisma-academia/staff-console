import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import {
  Box,
  Menu,
  Stack,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  ToggleButton,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  ToggleButtonGroup,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { LETTER_BLOCKS } from './block-node';

// ----------------------------------------------------------------------

const BLOCK_STYLES = [
  { value: 'paragraph', label: 'Body text' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
];

const TEXT_COLOURS = [
  { value: '', label: 'Default' },
  { value: '#cc003b', label: 'Primary' },
  { value: '#333333', label: 'Heading' },
  { value: '#555555', label: 'Body' },
  { value: '#b71c1c', label: 'Red' },
  { value: '#1b5e20', label: 'Green' },
  { value: '#0d47a1', label: 'Blue' },
];

const barButton = { border: 'none', borderRadius: 1, px: 1, py: 0.5 };

// ----------------------------------------------------------------------

/**
 * Formatting controls for the letter body.
 *
 * Deliberately narrow: this produces a printed A4 document, so anything that
 * would not survive the PDF (font families, arbitrary sizes, floats) is left out
 * rather than offered and then quietly ignored by the renderer.
 */
export default function LetterToolbar({ editor, variables, disabled }) {
  const [blockAnchor, setBlockAnchor] = useState(null);
  const [colourAnchor, setColourAnchor] = useState(null);
  const [variableAnchor, setVariableAnchor] = useState(null);
  const [variableQuery, setVariableQuery] = useState('');
  const searchRef = useRef(null);

  if (!editor) return null;

  const activeStyle = (() => {
    const match = BLOCK_STYLES.find(
      (style) => style.value !== 'paragraph' && editor.isActive('heading', { level: Number(style.value.slice(1)) })
    );
    return match ? match.value : 'paragraph';
  })();

  const applyStyle = (value) => {
    const chain = editor.chain().focus();
    if (value === 'paragraph') chain.setParagraph().run();
    else chain.setHeading({ level: Number(value.slice(1)) }).run();
  };

  const promptLink = () => {
    const current = editor.getAttributes('link').href || '';
    // eslint-disable-next-line no-alert
    const href = window.prompt('Link address', current);
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  };

  const promptImage = () => {
    // eslint-disable-next-line no-alert
    const src = window.prompt('Image URL — it is downloaded and embedded when the letter is printed');
    if (src && src.trim()) editor.chain().focus().setImage({ src: src.trim() }).run();
  };

  const filteredVariables = (variables || []).filter((variable) =>
    `${variable.key} ${variable.label} ${variable.group}`.toLowerCase().includes(variableQuery.trim().toLowerCase())
  );

  const closeVariables = () => {
    setVariableAnchor(null);
    setVariableQuery('');
  };

  const mark = (name, command, icon, title, options) => (
    <Tooltip title={title}>
      <ToggleButton
        value={name}
        size="small"
        selected={editor.isActive(name, options)}
        onClick={command}
        disabled={disabled}
        sx={barButton}
      >
        <Iconify icon={icon} width={18} />
      </ToggleButton>
    </Tooltip>
  );

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      gap={0.5}
      sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <TextField
        select
        size="small"
        value={activeStyle}
        onChange={(event) => applyStyle(event.target.value)}
        disabled={disabled}
        sx={{ width: 130, '& .MuiInputBase-root': { height: 32 } }}
      >
        {BLOCK_STYLES.map((style) => (
          <MenuItem key={style.value} value={style.value}>
            {style.label}
          </MenuItem>
        ))}
      </TextField>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {mark('bold', () => editor.chain().focus().toggleBold().run(), 'eva:text-outline', 'Bold')}
        {mark('italic', () => editor.chain().focus().toggleItalic().run(), 'ph:text-italic-bold', 'Italic')}
        {mark('underline', () => editor.chain().focus().toggleUnderline().run(), 'ph:text-underline-bold', 'Underline')}
        {mark('strike', () => editor.chain().focus().toggleStrike().run(), 'ph:text-strikethrough-bold', 'Strikethrough')}
        {mark('highlight', () => editor.chain().focus().toggleHighlight().run(), 'ph:highlighter-bold', 'Highlight')}
      </ToggleButtonGroup>

      <Tooltip title="Text colour">
        <span>
          <IconButton size="small" onClick={(event) => setColourAnchor(event.currentTarget)} disabled={disabled}>
            <Iconify icon="ph:palette-bold" width={18} />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {mark('bulletList', () => editor.chain().focus().toggleBulletList().run(), 'ph:list-bullets-bold', 'Bulleted list')}
        {mark('orderedList', () => editor.chain().focus().toggleOrderedList().run(), 'ph:list-numbers-bold', 'Numbered list')}
        {mark('blockquote', () => editor.chain().focus().toggleBlockquote().run(), 'ph:quotes-bold', 'Quote')}
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <ToggleButtonGroup size="small" sx={{ gap: 0.25 }}>
        {['left', 'center', 'right', 'justify'].map((align) =>
          mark(
            `align-${align}`,
            () => editor.chain().focus().setTextAlign(align).run(),
            `ph:text-align-${align}-bold`,
            `Align ${align}`,
            undefined
          )
        )}
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Link">
        <span>
          <IconButton size="small" onClick={promptLink} disabled={disabled}>
            <Iconify icon="eva:link-2-outline" width={18} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Image">
        <span>
          <IconButton size="small" onClick={promptImage} disabled={disabled}>
            <Iconify icon="eva:image-outline" width={18} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Table">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
            disabled={disabled}
          >
            <Iconify icon="ph:table-bold" width={18} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Horizontal rule">
        <span>
          <IconButton size="small" onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={disabled}>
            <Iconify icon="ph:minus-bold" width={18} />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Drop this text when a variable inside it is empty">
        <ToggleButton
          value="optional"
          size="small"
          selected={editor.isActive('letterOptional')}
          onClick={() => editor.chain().focus().toggleOptional().run()}
          disabled={disabled}
          sx={{ ...barButton, gap: 0.5 }}
        >
          <Iconify icon="ph:brackets-square-bold" width={18} />
          <Typography variant="caption" fontWeight={600}>
            Optional
          </Typography>
        </ToggleButton>
      </Tooltip>

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip title="Insert a variable — or just type {{ in the letter">
        <ToggleButton
          value="variable"
          size="small"
          selected={Boolean(variableAnchor)}
          onClick={(event) => setVariableAnchor(event.currentTarget)}
          disabled={disabled}
          sx={{ ...barButton, gap: 0.5, color: 'primary.main' }}
        >
          <Iconify icon="ph:brackets-curly-bold" width={18} />
          <Typography variant="caption" fontWeight={600}>
            Variable
          </Typography>
        </ToggleButton>
      </Tooltip>

      <Tooltip title="Insert a block that fills itself in per admission">
        <ToggleButton
          value="block"
          size="small"
          selected={Boolean(blockAnchor)}
          onClick={(event) => setBlockAnchor(event.currentTarget)}
          disabled={disabled}
          sx={{ ...barButton, gap: 0.5 }}
        >
          <Iconify icon="ph:squares-four-bold" width={18} />
          <Typography variant="caption" fontWeight={600}>
            Block
          </Typography>
        </ToggleButton>
      </Tooltip>

      {/* ---- Colour menu ---- */}
      <Menu anchorEl={colourAnchor} open={Boolean(colourAnchor)} onClose={() => setColourAnchor(null)}>
        {TEXT_COLOURS.map((colour) => (
          <MenuItem
            key={colour.label}
            onClick={() => {
              const chain = editor.chain().focus();
              if (colour.value) chain.setColor(colour.value).run();
              else chain.unsetColor().run();
              setColourAnchor(null);
            }}
          >
            <ListItemIcon>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: colour.value || 'transparent',
                }}
              />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>{colour.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* ---- Block menu ---- */}
      <Menu
        anchorEl={blockAnchor}
        open={Boolean(blockAnchor)}
        onClose={() => setBlockAnchor(null)}
        slotProps={{ paper: { sx: { width: 340 } } }}
      >
        {LETTER_BLOCKS.map((block) => (
          <MenuItem
            key={block.name}
            onClick={() => {
              editor.chain().focus().insertLetterBlock(block.name).run();
              setBlockAnchor(null);
            }}
            sx={{ alignItems: 'flex-start', py: 1, whiteSpace: 'normal' }}
          >
            <ListItemIcon sx={{ mt: 0.25 }}>
              <Iconify icon={block.icon} width={18} />
            </ListItemIcon>
            <ListItemText
              primary={block.label}
              secondary={block.description}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* ---- Variable menu ---- */}
      <Menu
        anchorEl={variableAnchor}
        open={Boolean(variableAnchor)}
        onClose={closeVariables}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
        // The list is long, so open focused on the search box rather than making
        // the author scroll for a variable they can already name.
        TransitionProps={{ onEntered: () => searchRef.current?.focus() }}
      >
        <Box sx={{ px: 1.5, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            inputRef={searchRef}
            placeholder="Search variables"
            value={variableQuery}
            onChange={(event) => setVariableQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </Box>

        {!filteredVariables.length && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
            No matching variable.
          </Typography>
        )}

        {filteredVariables.map((variable, index) => {
          const showGroup = index === 0 || variable.group !== filteredVariables[index - 1].group;
          return [
            showGroup ? (
              <ListSubheader key={`${variable.group}-header`} sx={{ lineHeight: '28px', fontSize: 11, textTransform: 'uppercase' }}>
                {variable.group}
              </ListSubheader>
            ) : null,
            <MenuItem
              key={variable.key}
              onClick={() => {
                editor.chain().focus().insertVariable(variable.key).run();
                closeVariables();
              }}
              sx={{ alignItems: 'flex-start', py: 0.75, whiteSpace: 'normal' }}
            >
              <ListItemText
                primary={variable.label}
                secondary={`{{${variable.key}}} — ${variable.sample}`}
                primaryTypographyProps={{ variant: 'subtitle2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>,
          ];
        })}
      </Menu>
    </Stack>
  );
}

LetterToolbar.propTypes = {
  editor: PropTypes.object,
  variables: PropTypes.array,
  disabled: PropTypes.bool,
};
