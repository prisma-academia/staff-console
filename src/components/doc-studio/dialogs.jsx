import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Alert,
  Button,
  Dialog,
  Checkbox,
  Collapse,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';

import { diffWords, contentText } from './diff';
import { RecordPicker } from './preview/preview-pane';

// ----------------------------------------------------------------------

/** Inline word diff: insertions green, deletions red and struck. */
export function DiffText({ before, after, maxHeight = 320 }) {
  const parts = diffWords(before, after);
  const changed = parts.some((part) => part.type !== 'same');
  if (!changed) {
    return (
      <Typography variant="body2" color="text.secondary">
        No wording changes — only layout or block settings differ.
      </Typography>
    );
  }
  return (
    <Box sx={{ maxHeight, overflowY: 'auto', p: 1.5, borderRadius: 1, bgcolor: 'grey.100', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 }}>
      {parts.map((part, index) => (
        <Box
          key={index}
          component="span"
          sx={{
            ...(part.type === 'added' && { bgcolor: 'success.lighter', color: 'success.darker', borderRadius: 0.5 }),
            ...(part.type === 'removed' && { bgcolor: 'error.lighter', color: 'error.darker', textDecoration: 'line-through', borderRadius: 0.5 }),
          }}
        >
          {part.text}
        </Box>
      ))}
    </Box>
  );
}

DiffText.propTypes = { before: PropTypes.string, after: PropTypes.string, maxHeight: PropTypes.number };

// ----------------------------------------------------------------------

/**
 * Publishing: health summary (errors block it), a change note for the
 * history, and the wording changes against what is live now.
 */
export function PublishDialog({ open, onClose, onPublish, issues, liveContent, draftContent, liveLabel }) {
  const [note, setNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [busy, setBusy] = useState(false);
  const [serverIssues, setServerIssues] = useState(null);
  const shown = serverIssues || issues;
  const errors = shown.filter((issue) => issue.severity === 'error');
  const warnings = shown.filter((issue) => issue.severity === 'warning');

  const publish = async () => {
    setBusy(true);
    try {
      await onPublish({ note, acknowledge: acknowledged || !warnings.length });
      setNote('');
      setAcknowledged(false);
      setServerIssues(null);
      onClose();
    } catch (error) {
      if (error.data?.issues) setServerIssues(error.data.issues);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Iconify icon="mdi:rocket-launch-outline" width={24} sx={{ color: 'primary.main' }} />
          <span>Publish changes</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Everyone who downloads or receives this from now on gets the new version. The current one stays in the history — you can restore it any time.
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Fix these first:</Typography>
            {errors.map((issue) => (
              <Typography key={issue.message} variant="body2">• {issue.message}</Typography>
            ))}
          </Alert>
        )}
        {!errors.length && warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {warnings.map((issue) => (
              <Typography key={issue.message} variant="body2">• {issue.message}</Typography>
            ))}
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={<Checkbox size="small" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />}
              label={<Typography variant="body2" fontWeight={600}>I&apos;ve checked these — publish anyway</Typography>}
            />
          </Alert>
        )}
        {!errors.length && !warnings.length && (
          <Alert severity="success" icon={<Iconify icon="mdi:check-decagram" />} sx={{ mb: 2 }}>
            Health checks pass.
          </Alert>
        )}

        <TextField fullWidth size="small" label="What changed? (for the history)" placeholder="e.g. New registrar's signature; updated fee deadline wording" value={note} onChange={(event) => setNote(event.target.value)} sx={{ mb: 2 }} />

        <Button size="small" color="inherit" onClick={() => setShowDiff((value) => !value)} endIcon={<Iconify icon={showDiff ? 'mdi:chevron-up' : 'mdi:chevron-down'} />} sx={{ mb: 1 }}>
          Wording changes vs. {liveLabel}
        </Button>
        <Collapse in={showDiff}>
          <DiffText before={contentText(liveContent)} after={contentText(draftContent)} />
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={busy}
          disabled={errors.length > 0 || (warnings.length > 0 && !acknowledged)}
          onClick={publish}
          startIcon={<Iconify icon="mdi:rocket-launch" />}
        >
          Publish
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

PublishDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onPublish: PropTypes.func,
  issues: PropTypes.array,
  liveContent: PropTypes.object,
  draftContent: PropTypes.object,
  liveLabel: PropTypes.string,
};

// ----------------------------------------------------------------------

/** Sends the working copy to yourself. Secrets are replaced with fakes server-side. */
export function TestSendDialog({ open, onClose, api, typeKey, channel, content, supportsRecords, recordNoun }) {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);
  const [to, setTo] = useState(channel === 'email' ? user?.email || '' : user?.phone || '');
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await api.testSend(typeKey, { to, recordId: record?.id, content });
      enqueueSnackbar(`Test ${channel === 'email' ? 'email' : 'SMS'} sent to ${to}`, { variant: 'success' });
      onClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Could not send the test', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Send a test {channel === 'email' ? 'email' : 'SMS'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            size="small"
            label={channel === 'email' ? 'Send to email' : 'Send to phone number'}
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          {supportsRecords && <RecordPicker api={api} typeKey={typeKey} noun={recordNoun} value={record} onChange={setRecord} />}
          <Alert severity="info" icon={<Iconify icon="mdi:shield-lock-outline" />}>
            Sends your current draft, marked <strong>[TEST]</strong>. Passwords, codes and private links are replaced with fake values.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton variant="contained" loading={busy} disabled={!to.trim()} onClick={send} startIcon={<Iconify icon="mdi:send" />}>
          Send test
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

TestSendDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  api: PropTypes.object,
  typeKey: PropTypes.string,
  channel: PropTypes.string,
  content: PropTypes.object,
  supportsRecords: PropTypes.bool,
  recordNoun: PropTypes.string,
};

// ----------------------------------------------------------------------

/** Two people edited the same template. */
export function ConflictDialog({ open, onReload, onOverwrite, by }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="mdi:account-multiple-outline" width={24} sx={{ color: 'warning.main' }} />
          <span>Someone else changed this</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {by ? `${by} saved` : 'Another person saved'} a newer version while you were editing. Load theirs, or keep yours and save it on top.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onReload}>
          Load their version
        </Button>
        <Button variant="contained" color="warning" onClick={onOverwrite}>
          Keep mine
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConflictDialog.propTypes = { open: PropTypes.bool, onReload: PropTypes.func, onOverwrite: PropTypes.func, by: PropTypes.string };

// ----------------------------------------------------------------------

export function ConfirmDialog({ open, title, message, confirmLabel, color = 'primary', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color={color}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.node,
  confirmLabel: PropTypes.string,
  color: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
};

// ----------------------------------------------------------------------

const SHORTCUTS = [
  ['Ctrl + S', 'Save the draft now'],
  ['Ctrl + Enter', 'Publish'],
  ['Ctrl + K', 'Command palette'],
  ['Ctrl + Shift + P', 'Show / hide the preview'],
  ['Ctrl + Shift + H', 'Version history'],
  ['Ctrl + /', 'This list'],
  ['{{', 'Insert a variable'],
  ['/', 'Insert a block or format (on an empty line)'],
];

export function ShortcutsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Keyboard shortcuts</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          {SHORTCUTS.map(([keys, label]) => (
            <Stack key={keys} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{label}</Typography>
              <Chip size="small" label={keys} sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Got it</Button>
      </DialogActions>
    </Dialog>
  );
}

ShortcutsDialog.propTypes = { open: PropTypes.bool, onClose: PropTypes.func };
