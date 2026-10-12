import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Menu,
  Stack,
  Button,
  Dialog,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  DialogActions,
  DialogContent,
  ListSubheader,
  LinearProgress,
} from '@mui/material';

import { brandApi } from 'src/api/docStudioApi';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Paragraph styles: each maps to a class the document stylesheet defines. */
const STYLES = [
  { id: 'p', label: 'Body text', apply: (c) => c.setParagraph().updateAttributes('paragraph', { class: null }) },
  { id: 'doc-title', label: 'Document title', apply: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'doc-title' }), sx: { fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' } },
  { id: 'doc-subtitle', label: 'Subtitle', apply: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'doc-subtitle' }), sx: { letterSpacing: 2, textTransform: 'uppercase', fontSize: 12 } },
  { id: 'section-heading', label: 'Section heading', apply: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'section-heading' }), sx: { fontWeight: 700, textTransform: 'uppercase', fontSize: 13 } },
  { id: 'h1', label: 'Heading 1', apply: (c) => c.setHeading({ level: 1 }), sx: { fontWeight: 700, fontSize: 20 } },
  { id: 'h2', label: 'Heading 2', apply: (c) => c.setHeading({ level: 2 }), sx: { fontWeight: 700, fontSize: 17 } },
  { id: 'h3', label: 'Heading 3', apply: (c) => c.setHeading({ level: 3 }), sx: { fontWeight: 700, fontSize: 15 } },
  { id: 'closing', label: 'Closing paragraph', apply: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'closing' }) },
  { id: 'fine-print', label: 'Fine print', apply: (c) => c.setParagraph().updateAttributes('paragraph', { class: 'fine-print' }), sx: { fontSize: 11, color: 'text.secondary' } },
];

function activeStyle(editor) {
  for (let level = 1; level <= 3; level += 1) if (editor.isActive('heading', { level })) return `h${level}`;
  const cls = editor.getAttributes('paragraph').class;
  return STYLES.find((style) => style.id === cls) ? cls : 'p';
}

const bar = { borderRadius: 1, p: 0.6 };

function ToolButton({ title, icon, active, onClick, disabled }) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{ ...bar, color: active ? 'primary.main' : 'text.secondary', bgcolor: active ? 'primary.lighter' : 'transparent' }}
        >
          <Iconify icon={icon} width={18} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

ToolButton.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

// ----------------------------------------------------------------------

function LinkDialog({ open, onClose, editor, variables }) {
  const current = editor?.getAttributes('link').href || '';
  const [href, setHref] = useState(current);
  const urlVariables = (variables || []).filter((variable) => variable.type === 'url');

  const apply = () => {
    if (!href.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Link</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth size="small" label="Address" placeholder="https://" value={href} onChange={(event) => setHref(event.target.value)} sx={{ mt: 1 }} />
        {urlVariables.length > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
            Linking to a per-recipient address (a reset or payment link)? Use the <strong>Button</strong> block instead — it
            takes a variable and disappears when there is no link.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {current && (
          <Button color="error" onClick={() => { editor.chain().focus().unsetLink().run(); onClose(); }}>
            Remove link
          </Button>
        )}
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={apply}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

LinkDialog.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, editor: PropTypes.object, variables: PropTypes.array };

/**
 * Images are uploaded to the Brand Kit's asset store rather than pasted as
 * links to other websites, so a document never prints with a missing picture.
 */
function ImageDialog({ open, onClose, editor }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const insert = (src) => {
    editor.chain().focus().setImage({ src }).run();
    setUrl('');
    onClose();
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const result = await brandApi.upload(file);
      insert(result.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Insert image</DialogTitle>
      {busy && <LinearProgress />}
      <DialogContent>
        <Button component="label" variant="outlined" fullWidth startIcon={<Iconify icon="mdi:cloud-upload-outline" />} sx={{ py: 2, mt: 1, borderStyle: 'dashed' }} disabled={busy}>
          Upload PNG, JPEG or WebP (max 5 MB)
          <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => upload(event.target.files?.[0])} />
        </Button>
        <Divider sx={{ my: 2, typography: 'caption', color: 'text.secondary' }}>or link one</Divider>
        <TextField fullWidth size="small" label="Image address" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} />
        {error && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!/^https?:\/\//i.test(url.trim())} onClick={() => insert(url.trim())}>
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ImageDialog.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, editor: PropTypes.object };

// ----------------------------------------------------------------------

/**
 * Formatting for a printed document — deliberately narrow: anything that would
 * not survive the PDF (arbitrary fonts, floats, positioning) is not offered.
 */
export default function DocToolbar({ editor, variables, blocks, brandColors, channel, disabled, onOpenVariables }) {
  const [styleAnchor, setStyleAnchor] = useState(null);
  const [colourAnchor, setColourAnchor] = useState(null);
  const [blockAnchor, setBlockAnchor] = useState(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  if (!editor) return null;
  const off = disabled || !editor.isEditable;
  const run = (fn) => () => fn(editor.chain().focus()).run();
  const current = STYLES.find((style) => style.id === activeStyle(editor)) || STYLES[0];
  const isEmail = channel === 'email';

  const colours = [
    { value: null, label: 'Default' },
    ...(brandColors ? [
      { value: brandColors.primary, label: 'Brand primary' },
      { value: brandColors.heading, label: 'Heading' },
      { value: brandColors.muted, label: 'Muted' },
    ] : []),
    { value: '#b71c1c', label: 'Red' },
    { value: '#1b5e20', label: 'Green' },
    { value: '#0d47a1', label: 'Blue' },
  ];

  const groups = blocks.reduce((acc, block) => {
    (acc[block.group || 'Blocks'] = acc[block.group || 'Blocks'] || []).push(block);
    return acc;
  }, {});

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.25}
      flexWrap="wrap"
      useFlexGap
      sx={{ px: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', rowGap: 0.5 }}
    >
      <ToolButton title="Undo (Ctrl+Z)" icon="mdi:undo" onClick={run((c) => c.undo())} disabled={off || !editor.can().undo()} />
      <ToolButton title="Redo (Ctrl+Shift+Z)" icon="mdi:redo" onClick={run((c) => c.redo())} disabled={off || !editor.can().redo()} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Button
        size="small"
        color="inherit"
        disabled={off}
        onClick={(event) => setStyleAnchor(event.currentTarget)}
        endIcon={<Iconify icon="mdi:chevron-down" width={16} />}
        sx={{ minWidth: 150, justifyContent: 'space-between', fontWeight: 600, px: 1 }}
      >
        {current.label}
      </Button>
      <Menu anchorEl={styleAnchor} open={Boolean(styleAnchor)} onClose={() => setStyleAnchor(null)}>
        {STYLES.map((style) => (
          <MenuItem
            key={style.id}
            selected={style.id === current.id}
            onClick={() => {
              style.apply(editor.chain().focus()).run();
              setStyleAnchor(null);
            }}
          >
            <Typography sx={style.sx}>{style.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <ToolButton title="Bold (Ctrl+B)" icon="mdi:format-bold" active={editor.isActive('bold')} onClick={run((c) => c.toggleBold())} disabled={off} />
      <ToolButton title="Italic (Ctrl+I)" icon="mdi:format-italic" active={editor.isActive('italic')} onClick={run((c) => c.toggleItalic())} disabled={off} />
      <ToolButton title="Underline (Ctrl+U)" icon="mdi:format-underline" active={editor.isActive('underline')} onClick={run((c) => c.toggleUnderline())} disabled={off} />
      <ToolButton title="Strikethrough" icon="mdi:format-strikethrough" active={editor.isActive('strike')} onClick={run((c) => c.toggleStrike())} disabled={off} />
      <ToolButton title="Highlight" icon="mdi:marker" active={editor.isActive('highlight')} onClick={run((c) => c.toggleHighlight())} disabled={off} />
      <Tooltip title="Text colour">
        <span>
          <IconButton size="small" sx={bar} disabled={off} onClick={(event) => setColourAnchor(event.currentTarget)}>
            <Box sx={{ position: 'relative', display: 'flex' }}>
              <Iconify icon="mdi:format-color-text" width={18} />
              <Box sx={{ position: 'absolute', left: 1, right: 1, bottom: -2, height: 3, borderRadius: 1, bgcolor: editor.getAttributes('textStyle').color || 'text.primary' }} />
            </Box>
          </IconButton>
        </span>
      </Tooltip>
      <Menu anchorEl={colourAnchor} open={Boolean(colourAnchor)} onClose={() => setColourAnchor(null)}>
        {colours.map((colour) => (
          <MenuItem
            key={colour.label}
            onClick={() => {
              const chain = editor.chain().focus();
              (colour.value ? chain.setColor(colour.value) : chain.unsetColor()).run();
              setColourAnchor(null);
            }}
          >
            <ListItemIcon>
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid', borderColor: 'divider', bgcolor: colour.value || 'transparent' }} />
            </ListItemIcon>
            <ListItemText primary={colour.label} secondary={colour.value} />
          </MenuItem>
        ))}
      </Menu>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <ToolButton title="Align left" icon="mdi:format-align-left" active={editor.isActive({ textAlign: 'left' })} onClick={run((c) => c.setTextAlign('left'))} disabled={off} />
      <ToolButton title="Centre" icon="mdi:format-align-center" active={editor.isActive({ textAlign: 'center' })} onClick={run((c) => c.setTextAlign('center'))} disabled={off} />
      <ToolButton title="Align right" icon="mdi:format-align-right" active={editor.isActive({ textAlign: 'right' })} onClick={run((c) => c.setTextAlign('right'))} disabled={off} />
      <ToolButton title="Justify" icon="mdi:format-align-justify" active={editor.isActive({ textAlign: 'justify' })} onClick={run((c) => c.setTextAlign('justify'))} disabled={off} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <ToolButton title="Bulleted list" icon="mdi:format-list-bulleted" active={editor.isActive('bulletList')} onClick={run((c) => c.toggleBulletList())} disabled={off} />
      <ToolButton title="Numbered list" icon="mdi:format-list-numbered" active={editor.isActive('orderedList')} onClick={run((c) => c.toggleOrderedList())} disabled={off} />
      <ToolButton title="Quote" icon="mdi:format-quote-open" active={editor.isActive('blockquote')} onClick={run((c) => c.toggleBlockquote())} disabled={off} />
      <ToolButton title="Link" icon="mdi:link-variant" active={editor.isActive('link')} onClick={() => setLinkOpen(true)} disabled={off} />
      <ToolButton title="Image" icon="mdi:image-plus-outline" onClick={() => setImageOpen(true)} disabled={off} />
      {!isEmail && <ToolButton title="Table" icon="mdi:table-plus" onClick={run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))} disabled={off} />}
      <ToolButton title="Divider line" icon="mdi:minus" onClick={run((c) => c.setHorizontalRule())} disabled={off} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Optional: the selected text disappears when any variable inside it is empty">
        <span>
          <Button
            size="small"
            color={editor.isActive('docOptional') ? 'warning' : 'inherit'}
            variant={editor.isActive('docOptional') ? 'contained' : 'text'}
            disabled={off}
            onClick={run((c) => c.toggleOptional())}
            startIcon={<Iconify icon="mdi:eye-off-outline" width={16} />}
            sx={{ px: 1 }}
          >
            Optional
          </Button>
        </span>
      </Tooltip>

      <Box sx={{ flexGrow: 1 }} />

      <Button size="small" color="inherit" disabled={off} onClick={onOpenVariables} startIcon={<Iconify icon="mdi:code-braces" width={16} />}>
        Variable
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        disabled={off || !blocks.length}
        onClick={(event) => setBlockAnchor(event.currentTarget)}
        startIcon={<Iconify icon="mdi:puzzle-plus-outline" width={16} />}
      >
        Block
      </Button>
      <Menu anchorEl={blockAnchor} open={Boolean(blockAnchor)} onClose={() => setBlockAnchor(null)} slotProps={{ paper: { sx: { width: 340, maxHeight: 460 } } }}>
        {Object.entries(groups).map(([group, items]) => [
          <ListSubheader key={`${group}-h`} sx={{ lineHeight: '28px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            {group}
          </ListSubheader>,
          ...items.map((block) => (
            <MenuItem
              key={block.name}
              onClick={() => {
                editor.chain().focus().insertDocBlock(block.name).run();
                setBlockAnchor(null);
              }}
              sx={{ alignItems: 'flex-start', whiteSpace: 'normal' }}
            >
              <ListItemIcon sx={{ mt: 0.5 }}>
                <Iconify icon={block.icon} width={18} />
              </ListItemIcon>
              <ListItemText primary={block.label} secondary={block.description} secondaryTypographyProps={{ variant: 'caption' }} />
            </MenuItem>
          )),
        ])}
      </Menu>

      {linkOpen && <LinkDialog open onClose={() => setLinkOpen(false)} editor={editor} variables={variables} />}
      {imageOpen && <ImageDialog open onClose={() => setImageOpen(false)} editor={editor} />}
    </Stack>
  );
}

DocToolbar.propTypes = {
  editor: PropTypes.object,
  variables: PropTypes.array,
  blocks: PropTypes.array,
  brandColors: PropTypes.object,
  channel: PropTypes.string,
  disabled: PropTypes.bool,
  onOpenVariables: PropTypes.func,
};
