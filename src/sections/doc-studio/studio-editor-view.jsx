import { useSnackbar } from 'notistack';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Tab,
  Card,
  Menu,
  Tabs,
  Chip,
  Stack,
  Alert,
  Badge,
  Button,
  Drawer,
  Divider,
  Tooltip,
  MenuItem,
  IconButton,
  Typography,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import { HistoryDrawer } from 'src/components/doc-studio/history';
import CommandPalette from 'src/components/doc-studio/command-palette';
import PreviewPane from 'src/components/doc-studio/preview/preview-pane';
import DocEditor, { InlineEditor } from 'src/components/doc-studio/editor/doc-editor';
import { HealthPanel, LayoutPanel, BlocksPanel, VariablesPanel } from 'src/components/doc-studio/panels';
import { useShortcuts, useLivePreview, useRelativeTime, useStudioTemplate } from 'src/components/doc-studio/hooks';
import { ConfirmDialog, PublishDialog, TestSendDialog, ConflictDialog, ShortcutsDialog } from 'src/components/doc-studio/dialogs';

import { useStudioCatalogue } from './use-catalogue';
import { StatusChip, CHANNEL_META } from './studio-meta';

// ----------------------------------------------------------------------

const COACH_KEY = 'docStudio.coach.v1';

// eslint-disable-next-line react/prop-types
function SaveIndicator({ state, savedAt, onRetry }) {
  const ago = useRelativeTime(savedAt);
  const look = {
    saving: { icon: <CircularProgress size={12} />, text: 'Saving…', color: 'text.secondary' },
    dirty: { icon: <Iconify icon="mdi:circle-edit-outline" width={14} />, text: 'Editing…', color: 'text.secondary' },
    saved: { icon: <Iconify icon="mdi:cloud-check-outline" width={15} />, text: `Draft saved ${ago}`, color: 'success.main' },
    error: { icon: <Iconify icon="mdi:cloud-alert-outline" width={15} />, text: 'Not saved', color: 'error.main' },
    conflict: { icon: <Iconify icon="mdi:account-alert-outline" width={15} />, text: 'Edited elsewhere', color: 'warning.main' },
    idle: { icon: <Iconify icon="mdi:cloud-outline" width={15} />, text: 'Up to date', color: 'text.disabled' },
  }[state] || {};
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: look.color, minWidth: 0 }}>
      {look.icon}
      <Typography variant="caption" fontWeight={600} noWrap>
        {look.text}
      </Typography>
      {state === 'error' && (
        <Button size="small" color="error" onClick={onRetry} sx={{ minWidth: 0, py: 0 }}>
          Retry
        </Button>
      )}
    </Stack>
  );
}

// eslint-disable-next-line react/prop-types
function RailTabs({ tab, onChange, issueCount, errorCount }) {
  const tabs = [
    { value: 'variables', icon: 'mdi:code-braces', label: 'Variables' },
    { value: 'blocks', icon: 'mdi:puzzle-outline', label: 'Blocks' },
    { value: 'layout', icon: 'mdi:page-layout-header-footer', label: 'Layout' },
    { value: 'health', icon: 'mdi:heart-pulse', label: 'Health' },
  ];
  return (
    <Tabs value={tab} onChange={(_event, next) => onChange(next)} variant="fullWidth" sx={{ minHeight: 56, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { minHeight: 56, minWidth: 0, px: 0.5, fontSize: 11 } }}>
      {tabs.map((item) => (
        <Tab
          key={item.value}
          value={item.value}
          label={item.label}
          icon={
            item.value === 'health' && issueCount ? (
              <Badge color={errorCount ? 'error' : 'warning'} badgeContent={issueCount} max={9}>
                <Iconify icon={item.icon} width={20} />
              </Badge>
            ) : (
              <Iconify icon={item.icon} width={20} />
            )
          }
          iconPosition="top"
        />
      ))}
    </Tabs>
  );
}

// ----------------------------------------------------------------------

export default function StudioEditorView() {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { service, key } = useParams();
  const { check } = usePermissions();
  const canEdit = check(PERMISSIONS.EDIT_DOC_TEMPLATE);
  const canPublish = check(PERMISSIONS.PUBLISH_DOC_TEMPLATE);
  const canTest = check(PERMISSIONS.TEST_SEND_TEMPLATE);

  const session = useStudioTemplate(service, key);
  const { data, content, api, status, template } = session;
  const type = data?.type;
  const channel = type?.channel;
  const catalogue = useStudioCatalogue();

  const [mainEditor, setMainEditor] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [tab, setTab] = useState('variables');
  const [showPreview, setShowPreview] = useState(true);
  const [mobileView, setMobileView] = useState('edit');
  const [railOpen, setRailOpen] = useState(false);
  const [record, setRecord] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [exactBusy, setExactBusy] = useState(false);
  const [coach, setCoach] = useState(() => {
    try {
      return !localStorage.getItem(COACH_KEY);
    } catch (error) {
      return false;
    }
  });

  const preview = useLivePreview({
    api,
    typeKey: key,
    content,
    recordId: record?.id,
    delay: channel === 'sms' ? 300 : 600,
    enabled: Boolean(content),
  });

  const context = useMemo(
    () => ({ variables: type?.variables || [], blocks: type?.blocks || [], signatories: data?.editor?.signatories || [] }),
    [type, data]
  );

  // Health: what the latest render reported (it includes the static checks).
  const issues = useMemo(() => {
    const list = preview.result?.issues || session.issues || [];
    const seen = new Set();
    return list.filter((issue) => {
      const id = `${issue.code}:${issue.message}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [preview.result, session.issues]);
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const issueCount = issues.filter((issue) => issue.severity !== 'info').length;

  // Track which editor the author last typed in, so side-panel inserts land there.
  const registerEditor = useCallback((instance, isMain) => {
    if (!instance) return;
    if (isMain) setMainEditor(instance);
    instance.on('focus', () => setActiveEditor(instance));
  }, []);
  const target = activeEditor && !activeEditor.isDestroyed ? activeEditor : mainEditor;

  const insertVariable = useCallback((name) => target?.chain().focus().insertVariable(name).run(), [target]);
  const insertBlock = useCallback((name) => mainEditor?.chain().focus().insertDocBlock(name).run(), [mainEditor]);

  const html = content?.body?.html || '';

  const applyFix = useCallback((fix) => {
    if (!fix) return;
    if (fix.kind === 'insertBlock') {
      mainEditor?.chain().focus('end').insertDocBlock(fix.name).run();
      return;
    }
    const rewrite = (source) => {
      let next = source || '';
      if (fix.kind === 'removeVariable') {
        const k = fix.key.replace('.', '\\.');
        next = next.replace(new RegExp(`<span[^>]*data-var=["']${k}["'][^>]*>[^<]*</span>`, 'g'), '').replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), '');
      }
      if (fix.kind === 'removeBlock') next = next.replace(new RegExp(`<div[^>]*data-block=["']${fix.name}["'][^>]*></div>`, 'g'), '');
      if (fix.kind === 'replaceText') next = next.split(fix.from).join(fix.to);
      return next;
    };
    session.update((current) => ({
      ...current,
      body: { ...current.body, html: rewrite(current.body.html), subject: rewrite(current.body.subject), preheader: rewrite(current.body.preheader) },
    }));
    enqueueSnackbar('Fixed', { variant: 'success' });
  }, [mainEditor, session, enqueueSnackbar]);

  const openExactPdf = useCallback(async () => {
    setExactBusy(true);
    try {
      const blob = await api.previewPdf({ key, content, recordId: record?.id });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (error) {
      enqueueSnackbar(error.message || 'Could not produce the PDF', { variant: 'error' });
    } finally {
      setExactBusy(false);
    }
  }, [api, key, content, record, enqueueSnackbar]);

  const hasDraft = status === 'draft' || status === 'changes' || session.saveState === 'dirty' || session.saveState === 'saving';
  const liveVersion = template?.published?.version || 0;
  const busy = !content;

  const doPublish = async (body) => {
    try {
      const res = await session.actions.publish(body);
      enqueueSnackbar(`Published version ${res.version} — it is live now`, { variant: 'success' });
      return res;
    } catch (error) {
      if (!error.data?.issues) enqueueSnackbar(error.message || 'Publishing failed', { variant: 'error' });
      throw error;
    }
  };

  const runAction = (fn, success) => async () => {
    try {
      await fn();
      if (success) enqueueSnackbar(success, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Something went wrong', { variant: 'error' });
    }
  };

  useShortcuts({
    s: () => session.actions.save().then((ok) => ok && enqueueSnackbar('Draft saved', { variant: 'success', autoHideDuration: 1200 })),
    enter: () => canPublish && hasDraft && setDialog('publish'),
    k: () => setDialog('palette'),
    'shift+p': () => setShowPreview((value) => !value),
    'shift+h': () => setDialog('history'),
    '/': () => setDialog('shortcuts'),
  });

  // ---- Command palette ----
  const commands = useMemo(() => {
    if (!type) return [];
    const list = [
      { id: 'publish', group: 'Actions', label: 'Publish', icon: 'mdi:rocket-launch-outline', keys: 'Ctrl+Enter', run: () => setDialog('publish') },
      { id: 'save', group: 'Actions', label: 'Save draft now', icon: 'mdi:content-save-outline', keys: 'Ctrl+S', run: () => session.actions.save() },
      { id: 'history', group: 'Actions', label: 'Version history', icon: 'mdi:history', keys: 'Ctrl+Shift+H', run: () => setDialog('history') },
      { id: 'preview', group: 'Actions', label: showPreview ? 'Hide preview' : 'Show preview', icon: 'mdi:eye-outline', keys: 'Ctrl+Shift+P', run: () => setShowPreview((value) => !value) },
      ...(channel === 'print' ? [{ id: 'pdf', group: 'Actions', label: 'Open the exact PDF', icon: 'mdi:file-pdf-box', run: openExactPdf }] : []),
      ...((channel === 'email' || channel === 'sms') && canTest ? [{ id: 'test', group: 'Actions', label: 'Send a test to myself', icon: 'mdi:send-outline', run: () => setDialog('test') }] : []),
      { id: 'brand', group: 'Actions', label: 'Open the Brand Kit', icon: 'mdi:palette-outline', run: () => navigate('/studio/brand') },
      { id: 'gallery', group: 'Actions', label: 'Back to all templates', icon: 'mdi:view-grid-outline', run: () => navigate('/studio') },
      { id: 'keys', group: 'Actions', label: 'Keyboard shortcuts', icon: 'mdi:keyboard-outline', keys: 'Ctrl+/', run: () => setDialog('shortcuts') },
    ];
    if (canEdit) {
      type.blocks.forEach((block) => list.push({ id: `b:${block.name}`, group: 'Insert block', label: block.label, hint: block.description, icon: block.icon, run: () => insertBlock(block.name) }));
      type.variables.forEach((variable) => list.push({ id: `v:${variable.key}`, group: 'Insert variable', label: variable.label, hint: `{{${variable.key}}} · ${variable.sample || ''}`, icon: 'mdi:code-braces', run: () => insertVariable(variable.key) }));
    }
    catalogue.types
      .filter((item) => !(item.service === service && item.key === key))
      .forEach((item) => list.push({ id: `t:${item.service}:${item.key}`, group: 'Open template', label: item.title, hint: `${CHANNEL_META[item.channel]?.label} · ${item.area}`, icon: item.icon, run: () => navigate(`/studio/${item.service}/${item.key}`) }));
    return list;
  }, [type, channel, canEdit, canTest, showPreview, catalogue.types, service, key, session.actions, insertBlock, insertVariable, navigate, openExactPdf]);

  useEffect(() => {
    setRecord(null);
  }, [service, key]);

  // ---- Loading / errors ----
  if (session.query.isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }
  if (session.query.error || !type) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={<Button color="inherit" onClick={() => navigate('/studio')}>Back to the Studio</Button>}>
          {session.query.error?.message || 'This template could not be opened.'}
        </Alert>
      </Box>
    );
  }

  const meta = CHANNEL_META[channel] || CHANNEL_META.print;
  let gridColumns = '1fr';
  if (wide) gridColumns = showPreview ? '300px minmax(0, 1.05fr) minmax(0, 1fr)' : '300px minmax(0, 1fr)';
  const landscape = (content?.layout?.orientation || type.layoutDefaults?.orientation) === 'landscape';
  const disabled = !canEdit || busy;

  // ---- Panels ----
  const rail = (
    <Stack sx={{ height: 1, minHeight: 0, bgcolor: 'background.paper' }}>
      <RailTabs tab={tab} onChange={setTab} issueCount={issueCount} errorCount={errorCount} />
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {tab === 'variables' && <VariablesPanel variables={type.variables} html={[html, content?.body?.subject, content?.body?.preheader].join(' ')} disabled={disabled} onInsert={insertVariable} onRemoveUnknown={(name) => applyFix({ kind: 'removeVariable', key: name })} />}
        {tab === 'blocks' &&
          (type.blocks.length ? (
            <BlocksPanel blocks={type.blocks} required={type.requiredBlocks} html={html} disabled={disabled} onInsert={insertBlock} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              Text messages have no blocks — only words and variables.
            </Typography>
          ))}
        {tab === 'layout' && (
          <LayoutPanel
            channel={channel}
            layout={content?.layout}
            fileName={content?.fileName}
            defaultFileName={type.defaultFileName}
            disabled={disabled}
            brandLayout={data.editor?.brandLayout}
            onLayout={session.setLayout}
            onFileName={(fileName) => session.update({ fileName })}
          />
        )}
        {tab === 'health' && <HealthPanel issues={issues} disabled={disabled} onFix={applyFix} />}
      </Box>
    </Stack>
  );

  const canvas = (
    <Stack sx={{ height: 1, minHeight: 0 }}>
      {coach && canEdit && (
        <Alert
          severity="info"
          icon={<Iconify icon="mdi:lightbulb-on-outline" />}
          onClose={() => {
            setCoach(false);
            try {
              localStorage.setItem(COACH_KEY, '1');
            } catch (error) {
              /* private mode */
            }
          }}
          sx={{ borderRadius: 0 }}
        >
          Type <strong>{'{{'}</strong> for a variable, <strong>/</strong> on an empty line for a block, and <strong>Ctrl+K</strong> for everything else.
          Your work saves as a <strong>draft</strong> automatically — nothing changes for students until you <strong>Publish</strong>.
        </Alert>
      )}

      {channel === 'email' && (
        <Stack spacing={0} sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          {[
            ['subject', 'Subject', 'What the inbox shows in bold'],
            ['preheader', 'Preview text', 'The grey line after the subject in most inboxes'],
          ].map(([field, label, placeholder]) => (
            <Stack key={field} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75, '&:not(:last-of-type)': { borderBottom: '1px dashed', borderColor: 'divider' } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ width: 84, flexShrink: 0, textTransform: 'uppercase' }}>
                {label}
              </Typography>
              <Box sx={{ flexGrow: 1, fontSize: field === 'subject' ? 15 : 13, fontWeight: field === 'subject' ? 600 : 400 }}>
                <InlineEditor
                  value={content?.body?.[field]}
                  onChange={(value) => session.setBody(field, value)}
                  onNormalize={(value) => session.adoptBody(field, value)}
                  variables={type.variables}
                  placeholder={placeholder}
                  disabled={disabled}
                  onEditor={(instance) => registerEditor(instance, false)}
                />
              </Box>
            </Stack>
          ))}
        </Stack>
      )}

      {channel === 'sms' ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 5 }, bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }}>
          <Card sx={{ maxWidth: 560, mx: 'auto', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="mdi:message-text-outline" width={22} sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                Message
              </Typography>
              <Button size="small" color="inherit" disabled={disabled} startIcon={<Iconify icon="mdi:code-braces" width={16} />} onClick={() => setTab('variables')}>
                Variable
              </Button>
              <Button size="small" color="inherit" disabled={disabled} startIcon={<Iconify icon="mdi:eye-off-outline" width={16} />} onClick={() => target?.chain().focus().toggleOptional().run()}>
                Optional
              </Button>
            </Stack>
            <Box sx={{ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', fontSize: 16 }}>
              <InlineEditor
                multiline
                minHeight={140}
                value={content?.body?.html}
                onChange={(value) => session.setBody('html', value)}
                onNormalize={(value) => session.adoptBody('html', value)}
                variables={type.variables}
                placeholder="Write the message — type {{ to insert a variable"
                disabled={disabled}
                onEditor={(instance) => registerEditor(instance, true)}
              />
            </Box>
            {preview.result?.sms && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                <Chip size="small" label={`${preview.result.sms.length} chars with sample values`} />
                <Chip size="small" color={preview.result.sms.encoding === 'UCS-2' ? 'warning' : 'success'} label={preview.result.sms.encoding} />
                <Chip size="small" color={preview.result.sms.segments > 1 ? 'warning' : 'success'} label={`${preview.result.sms.segments} SMS`} />
              </Stack>
            )}
          </Card>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <DocEditor
            value={html}
            onChange={(value) => session.setBody('html', value)}
            onNormalize={(value) => session.adoptBody('html', value)}
            context={context}
            editorCss={data.editor?.css}
            contentWidthMm={data.editor?.contentWidthMm}
            channel={channel}
            disabled={disabled}
            brandColors={data.editor?.brandColors}
            onEditor={(instance) => registerEditor(instance, true)}
            onOpenVariables={() => {
              setTab('variables');
              if (!wide) setRailOpen(true);
            }}
          />
        </Box>
      )}
    </Stack>
  );

  const previewPane = (
    <PreviewPane
      channel={channel}
      api={api}
      typeKey={key}
      recordNoun={type.recordNoun}
      supportsRecords={type.supportsRecords}
      record={record}
      onRecordChange={setRecord}
      preview={preview}
      landscape={landscape}
      brandName={data.editor?.brandName}
      smsSender={data.editor?.brandName}
      onExactPdf={openExactPdf}
      exactBusy={exactBusy}
    />
  );

  return (
    <Box sx={{ height: { lg: 'calc(100vh - 80px)' }, minHeight: { xs: 'calc(100vh - 64px)' }, display: 'flex', flexDirection: 'column', px: { xs: 1, md: 2 }, pb: 2 }}>
      {/* ---- Top bar ---- */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        <Tooltip title="All templates">
          <IconButton onClick={() => navigate('/studio')}>
            <Iconify icon="mdi:arrow-left" />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette[meta.color]?.main || theme.palette.primary.main, 0.12), color: `${meta.color}.main` }}>
          <Iconify icon={type.icon || meta.icon} width={22} />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            Template Studio · {type.area} · {meta.label}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {type.title}
            </Typography>
            <StatusChip status={status} version={liveVersion} />
          </Stack>
        </Box>

        <SaveIndicator state={session.saveState} savedAt={session.savedAt} onRetry={() => session.actions.save()} />

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Version history (Ctrl+Shift+H)">
            <IconButton onClick={() => setDialog('history')}>
              <Iconify icon="mdi:history" />
            </IconButton>
          </Tooltip>
          {(channel === 'email' || channel === 'sms') && canTest && (
            <Button variant="outlined" color="inherit" startIcon={<Iconify icon="mdi:send-outline" />} onClick={() => setDialog('test')}>
              Test
            </Button>
          )}
          {wide && (
            <Tooltip title={`${showPreview ? 'Hide' : 'Show'} preview (Ctrl+Shift+P)`}>
              <IconButton onClick={() => setShowPreview((value) => !value)} color={showPreview ? 'primary' : 'default'}>
                <Iconify icon={showPreview ? 'mdi:dock-right' : 'mdi:dock-window'} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Command palette (Ctrl+K)">
            <IconButton onClick={() => setDialog('palette')}>
              <Iconify icon="mdi:console-line" />
            </IconButton>
          </Tooltip>
          <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)}>
            <Iconify icon="mdi:dots-vertical" />
          </IconButton>
          {canPublish && (
            <Tooltip title={hasDraft ? 'Make your draft live (Ctrl+Enter)' : 'No unpublished changes'}>
              <span>
                <LoadingButton variant="contained" disabled={!hasDraft} onClick={() => setDialog('publish')} startIcon={<Iconify icon="mdi:rocket-launch" />}>
                  Publish
                </LoadingButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {canEdit && (status === 'draft' || status === 'changes') && (
          <MenuItem onClick={() => { setMenuAnchor(null); setDialog('discard'); }}>
            <ListItemIcon><Iconify icon="mdi:undo-variant" /></ListItemIcon>
            <ListItemText primary="Discard draft" secondary={liveVersion ? `Back to live v${liveVersion}` : 'Back to the built-in default'} />
          </MenuItem>
        )}
        {canEdit && (
          <MenuItem onClick={() => { setMenuAnchor(null); setDialog('reset'); }}>
            <ListItemIcon><Iconify icon="mdi:package-variant-closed" /></ListItemIcon>
            <ListItemText primary="Start from the built-in default" secondary="Replaces your draft" />
          </MenuItem>
        )}
        {canPublish && liveVersion > 0 && (
          <MenuItem onClick={() => { setMenuAnchor(null); setDialog('unpublish'); }}>
            <ListItemIcon><Iconify icon="mdi:broadcast-off" /></ListItemIcon>
            <ListItemText primary="Unpublish" secondary="Print the built-in default again" />
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { setMenuAnchor(null); navigate('/studio/brand'); }}>
          <ListItemIcon><Iconify icon="mdi:palette-outline" /></ListItemIcon>
          <ListItemText primary="Brand Kit" secondary="Logo, colours, signatories" />
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setDialog('shortcuts'); }}>
          <ListItemIcon><Iconify icon="mdi:keyboard-outline" /></ListItemIcon>
          <ListItemText primary="Keyboard shortcuts" />
        </MenuItem>
      </Menu>

      {!canEdit && (
        <Alert severity="info" icon={<Iconify icon="mdi:eye-outline" />} sx={{ mb: 1.5 }}>
          You can view this template but not change it.
        </Alert>
      )}
      {catalogue.engineSkew && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          The two servers are running different template-engine versions (a deploy is in progress). Previews may differ slightly until both are updated.
        </Alert>
      )}

      {/* ---- Workspace ---- */}
      {!wide && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Button size="small" variant="outlined" color="inherit" startIcon={<Iconify icon="mdi:menu" />} onClick={() => setRailOpen(true)}>
            Tools
          </Button>
          <Tabs value={mobileView} onChange={(_event, next) => setMobileView(next)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36 } }}>
            <Tab value="edit" label="Edit" />
            <Tab value="preview" label="Preview" />
          </Tabs>
        </Stack>
      )}

      <Card
        sx={{
          flexGrow: 1,
          minHeight: { xs: '75vh', lg: 0 },
          display: 'grid',
          gridTemplateColumns: gridColumns,
          overflow: 'hidden',
        }}
      >
        {wide && <Box sx={{ minHeight: 0, borderRight: '1px solid', borderColor: 'divider' }}>{rail}</Box>}
        {(wide || mobileView === 'edit') && <Box sx={{ minHeight: 0, minWidth: 0, borderRight: wide && showPreview ? '1px solid' : 0, borderColor: 'divider' }}>{canvas}</Box>}
        {((wide && showPreview) || (!wide && mobileView === 'preview')) && <Box sx={{ minHeight: 0, minWidth: 0 }}>{previewPane}</Box>}
      </Card>

      {!wide && (
        <Drawer anchor="left" open={railOpen} onClose={() => setRailOpen(false)} PaperProps={{ sx: { width: 320 } }}>
          {rail}
        </Drawer>
      )}

      {/* ---- Dialogs ---- */}
      <PublishDialog
        open={dialog === 'publish'}
        onClose={() => setDialog(null)}
        onPublish={doPublish}
        issues={issues}
        liveContent={template?.published?.content || data.defaultContent}
        draftContent={content}
        liveLabel={liveVersion ? `live v${liveVersion}` : 'the built-in default'}
      />
      {dialog === 'test' && (
        <TestSendDialog open onClose={() => setDialog(null)} api={api} typeKey={key} channel={channel} content={content} supportsRecords={type.supportsRecords} recordNoun={type.recordNoun} />
      )}
      <HistoryDrawer
        open={dialog === 'history'}
        onClose={() => setDialog(null)}
        api={api}
        typeKey={key}
        channel={channel}
        liveVersion={liveVersion}
        hasDraft={hasDraft}
        draftContent={content}
        defaultContent={data.defaultContent}
        landscape={landscape}
        canEdit={canEdit}
        onRestore={(version) => {
          setDialog(null);
          runAction(() => session.actions.restore(version), `Version ${version} is now your draft — publish it to make it live`)();
        }}
      />
      <CommandPalette open={dialog === 'palette'} onClose={() => setDialog(null)} commands={commands} />
      <ShortcutsDialog open={dialog === 'shortcuts'} onClose={() => setDialog(null)} />
      <ConflictDialog
        open={session.saveState === 'conflict'}
        onReload={runAction(session.reload, 'Loaded the latest version')}
        onOverwrite={runAction(session.overwrite)}
      />
      <ConfirmDialog
        open={dialog === 'discard'}
        title="Discard your draft?"
        message={liveVersion ? `The editor goes back to live version ${liveVersion}. Your unpublished changes are lost.` : 'The editor goes back to the built-in default.'}
        confirmLabel="Discard"
        color="error"
        onConfirm={runAction(session.actions.discardDraft, 'Draft discarded')}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'reset'}
        title="Start from the built-in default?"
        message="Your draft is replaced with the default template. Nothing goes live until you publish."
        confirmLabel="Use the default"
        onConfirm={runAction(session.actions.resetToDefault, 'The default is now your draft')}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'unpublish'}
        title="Unpublish this template?"
        message="Documents go back to the built-in default immediately. Your versions stay in the history."
        confirmLabel="Unpublish"
        color="warning"
        onConfirm={runAction(session.actions.unpublish, 'Unpublished — the built-in default is live')}
        onClose={() => setDialog(null)}
      />
    </Box>
  );
}
