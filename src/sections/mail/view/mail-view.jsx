import ReactQuill from 'react-quill';
import { useSnackbar } from 'notistack';
import 'react-quill/dist/quill.snow.css';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  List,
  Chip,
  Stack,
  Badge,
  Paper,
  Button,
  Avatar,
  Select,
  Divider,
  Tooltip,
  Toolbar,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  Pagination,
  FormControl,
  OutlinedInput,
  ListItemButton,
  InputAdornment,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';

import { fDate, fDateTime } from 'src/utils/format-time';

import { MailApi } from 'src/api';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    [{ color: [] }, { background: [] }],
    ['clean'],
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'link', 'color', 'background',
];

const FOLDERS = [
  { key: 'inbox', label: 'Inbox', icon: 'solar:inbox-bold-duotone' },
  { key: 'sent', label: 'Sent', icon: 'solar:upload-minimalistic-bold-duotone' },
  { key: 'draft', label: 'Drafts', icon: 'solar:document-bold-duotone' },
  { key: 'spam', label: 'Spam', icon: 'solar:shield-warning-bold-duotone' },
  { key: 'trash', label: 'Trash', icon: 'solar:trash-bin-trash-bold-duotone' },
  { key: 'archive', label: 'Archive', icon: 'solar:archive-bold-duotone' },
];

const getParticipantDisplay = (p) => {
  if (!p) return '';
  if (typeof p === 'string') return p;
  return p.name ? `${p.name} <${p.address}>` : p.address;
};

const getInitial = (p) => {
  if (!p) return '?';
  const src = typeof p === 'string' ? p : (p.name || p.address || '');
  return src.charAt(0).toUpperCase();
};

export default function MailView() {
  const theme = useTheme();
  const quillRef = useRef(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();

  const [folder, setFolder] = useState('inbox');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMailId, setSelectedMailId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', subject: '', html: '' });
  const [composeFrom, setComposeFrom] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSendingMail, setIsSendingMail] = useState(false);

  const userEmail = user?.email || '';
  const LIMIT = 20;

  const [selectedMailboxEmail, setSelectedMailboxEmail] = useState('');

  const { data: mailAccountRows = [] } = useQuery({
    queryKey: ['mail-accounts-mailbox'],
    queryFn: MailApi.getMailAccounts,
  });

  const fromOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    const add = (address, name) => {
      const a = (address || '').toLowerCase();
      if (!a || seen.has(a)) return;
      seen.add(a);
      list.push({ address, name: name || address });
    };
    if (userEmail) {
      add(userEmail, user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : userEmail);
    }
    mailAccountRows.forEach((acc) => add(acc.email, acc.name));
    return list;
  }, [userEmail, user, mailAccountRows]);

  useEffect(() => {
    if (!userEmail) return;
    setSelectedMailboxEmail((prev) => {
      const want = prev || userEmail;
      if (!fromOptions.length) return want;
      const ok = fromOptions.some((o) => o.address.toLowerCase() === want.toLowerCase());
      if (ok) return want;
      return fromOptions.some((o) => o.address.toLowerCase() === userEmail.toLowerCase())
        ? userEmail
        : fromOptions[0].address;
    });
  }, [userEmail, fromOptions]);

  useEffect(() => {
    setPage(1);
    setSelectedMailId(null);
    setSelectedIds([]);
  }, [selectedMailboxEmail, folder, searchQuery]);

  const mailsKey = ['mails', folder, page, searchQuery, selectedMailboxEmail];

  const { data: mailsResult, isLoading: loadingMails } = useQuery({
    queryKey: mailsKey,
    queryFn: () =>
      searchQuery
        ? MailApi.searchMails({ folder, q: searchQuery, page, limit: LIMIT, email: selectedMailboxEmail })
        : MailApi.getMails({ folder, page, limit: LIMIT, email: selectedMailboxEmail }),
    keepPreviousData: true,
    enabled: Boolean(selectedMailboxEmail),
  });

  const mails = mailsResult?.data || [];
  const pagination = mailsResult?.pagination || {};
  const totalPages = pagination.pages || 1;

  const { data: statsData } = useQuery({
    queryKey: ['mail-stats', selectedMailboxEmail],
    queryFn: () => MailApi.getStats(selectedMailboxEmail),
    enabled: Boolean(selectedMailboxEmail),
  });
  const unreadCount = statsData?.unread ?? 0;

  const { data: selectedMailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['mail-detail', selectedMailId, selectedMailboxEmail],
    queryFn: () => MailApi.getMailById(selectedMailId, selectedMailboxEmail),
    enabled: Boolean(selectedMailId && selectedMailboxEmail),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mailsKey }),
  });
  const selectedMail = selectedMailData;

  const invalidateMails = () => {
    queryClient.invalidateQueries({ queryKey: ['mails'] });
    queryClient.invalidateQueries({ queryKey: ['mail-stats'] });
  };

  const starMutation = useMutation({
    mutationFn: ({ id, starred }) => (starred ? MailApi.unstar(id) : MailApi.star(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mailsKey }),
  });

  const markReadMutation = useMutation({ mutationFn: (id) => MailApi.markRead(id) });

  const deleteMutation = useMutation({
    mutationFn: (id) => MailApi.deleteMail(id),
    onSuccess: (_, id) => {
      invalidateMails();
      if (selectedMailId === id) setSelectedMailId(null);
      enqueueSnackbar('Mail moved to trash', { variant: 'success' });
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const bulkReadMutation = useMutation({
    mutationFn: (ids) => MailApi.bulkRead(ids),
    onSuccess: () => { invalidateMails(); setSelectedIds([]); },
  });

  const bulkUnreadMutation = useMutation({
    mutationFn: (ids) => MailApi.bulkUnread(ids),
    onSuccess: () => { invalidateMails(); setSelectedIds([]); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => MailApi.bulkDelete(ids),
    onSuccess: () => {
      invalidateMails();
      setSelectedIds([]);
      enqueueSnackbar('Mails moved to trash', { variant: 'success' });
    },
  });

  const handleFolderChange = (f) => {
    setFolder(f);
    setPage(1);
    setSelectedMailId(null);
    setSelectedIds([]);
    setSearchQuery('');
    setSearchInput('');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
      setPage(1);
    }
  };

  const handleOpenMail = (id) => {
    setSelectedMailId(id);
    markReadMutation.mutate(id);
  };

  const handleOpenCompose = (replyMail = null) => {
    const defaultFrom = fromOptions.some((o) => o.address.toLowerCase() === selectedMailboxEmail.toLowerCase())
      ? selectedMailboxEmail
      : (fromOptions[0]?.address || userEmail);
    setComposeFrom(defaultFrom);
    if (replyMail) {
      const fromAddr = typeof replyMail.from === 'string' ? replyMail.from : replyMail.from?.address || '';
      setComposeData({
        to: fromAddr,
        cc: '',
        subject: `Re: ${replyMail.subject || ''}`,
        html: `<br/><hr/><p>On ${fDateTime(replyMail.createdAt)}, ${getParticipantDisplay(replyMail.from)} wrote:</p><blockquote>${replyMail.html || replyMail.text || ''}</blockquote>`,
      });
    } else {
      setComposeData({ to: '', cc: '', subject: '', html: '' });
    }
    setAttachments([]);
    setComposeOpen(true);
  };

  const handleSend = async () => {
    const fromAddr = (composeFrom || selectedMailboxEmail || userEmail).trim();
    if (!composeData.to || !fromAddr) {
      enqueueSnackbar('To and from addresses are required', { variant: 'warning' });
      return;
    }
    const fromMeta = fromOptions.find((o) => o.address.toLowerCase() === fromAddr.toLowerCase());
    const fromName = fromMeta?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : fromAddr);
    setIsSendingMail(true);
    try {
      await MailApi.sendMail({
        from: JSON.stringify({ address: fromAddr, name: fromName }),
        to: JSON.stringify([{ address: composeData.to.trim() }]),
        cc: composeData.cc ? JSON.stringify([{ address: composeData.cc.trim() }]) : undefined,
        subject: composeData.subject,
        html: composeData.html,
        text: composeData.html.replace(/<[^>]*>/g, ''),
        attachments,
      });
      enqueueSnackbar('Email sent successfully', { variant: 'success' });
      setComposeOpen(false);
      invalidateMails();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to send email', { variant: 'error' });
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleSaveDraft = async () => {
    const fromAddr = (composeFrom || selectedMailboxEmail || userEmail).trim();
    const fromMeta = fromOptions.find((o) => o.address.toLowerCase() === fromAddr.toLowerCase());
    const fromName = fromMeta?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : fromAddr);
    setIsSendingMail(true);
    try {
      await MailApi.saveDraft({
        from: JSON.stringify({ address: fromAddr, name: fromName }),
        to: composeData.to ? JSON.stringify([{ address: composeData.to.trim() }]) : undefined,
        subject: composeData.subject,
        html: composeData.html,
        text: composeData.html.replace(/<[^>]*>/g, ''),
        attachments,
      });
      enqueueSnackbar('Draft saved', { variant: 'success' });
      setComposeOpen(false);
      invalidateMails();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to save draft', { variant: 'error' });
    } finally {
      setIsSendingMail(false);
    }
  };

  const toggleSelectId = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === mails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mails.map((m) => m._id));
    }
  };

  const hasSelection = selectedIds.length > 0;

  if (composeOpen) {
    return (
      <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ mb: 2, boxShadow: 0 }}>
          <Toolbar sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Back">
                <IconButton onClick={() => setComposeOpen(false)}>
                  <Iconify icon="solar:arrow-left-bold-duotone" width={24} />
                </IconButton>
              </Tooltip>
              <Typography variant="h6">
                {composeData.subject.startsWith('Re:') ? 'Reply' : 'New Message'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:file-text-bold-duotone" />}
                onClick={handleSaveDraft}
                disabled={isSendingMail}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:airplane-bold-duotone" />}
                onClick={handleSend}
                disabled={isSendingMail}
              >
                {isSendingMail ? 'Sending...' : 'Send'}
              </Button>
            </Stack>
          </Toolbar>
        </Card>

        <Card sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="compose-from-label">From</InputLabel>
              <Select
                labelId="compose-from-label"
                label="From"
                value={composeFrom || fromOptions[0]?.address || ''}
                onChange={(e) => setComposeFrom(e.target.value)}
              >
                {fromOptions.map((o) => (
                  <MenuItem key={o.address} value={o.address}>
                    {o.name !== o.address ? `${o.name} <${o.address}>` : o.address}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="To"
              value={composeData.to}
              onChange={(e) => setComposeData((d) => ({ ...d, to: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:user-bold-duotone" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Cc"
              value={composeData.cc}
              onChange={(e) => setComposeData((d) => ({ ...d, cc: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:users-group-rounded-bold-duotone" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Subject"
              value={composeData.subject}
              onChange={(e) => setComposeData((d) => ({ ...d, subject: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:document-text-bold-duotone" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ flexGrow: 1, minHeight: 300 }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={composeData.html}
                onChange={(val) => setComposeData((d) => ({ ...d, html: val }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your message..."
                style={{ height: 280 }}
              />
            </Box>
            {attachments.length > 0 && (
              <Stack spacing={1} sx={{ mt: 4 }}>
                <Typography variant="subtitle2">Attachments ({attachments.length})</Typography>
                {attachments.map((f, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ p: 1.5, borderRadius: 1, border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}` }}
                  >
                    <Iconify icon="solar:file-bold-duotone" sx={{ color: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>{f.name}</Typography>
                    <IconButton size="small" onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))}>
                      <Iconify icon="solar:close-circle-bold" sx={{ color: 'text.disabled' }} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
              <Box>
                <input
                  type="file"
                  multiple
                  id="attach-input"
                  aria-label="Attach files"
                  style={{ display: 'none' }}
                  onChange={(e) => setAttachments((a) => [...a, ...Array.from(e.target.files)])}
                />
                <Button
                  component="label"
                  htmlFor="attach-input"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:paperclip-bold-duotone" />}
                >
                  Attach Files
                </Button>
              </Box>
              <Button variant="outlined" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Box>
    );
  }

  if (selectedMailId) {
    return (
      <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ mb: 2, boxShadow: 0 }}>
          <Toolbar sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Back">
                <IconButton onClick={() => setSelectedMailId(null)}>
                  <Iconify icon="solar:arrow-left-bold-duotone" width={24} />
                </IconButton>
              </Tooltip>
              {!loadingDetail && selectedMail && (
                <Typography variant="h6" noWrap>{selectedMail.subject || '(no subject)'}</Typography>
              )}
            </Stack>
            {!loadingDetail && selectedMail && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Reply">
                  <IconButton onClick={() => { setSelectedMailId(null); handleOpenCompose(selectedMail); }}>
                    <Iconify icon="solar:reply-bold-duotone" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={selectedMail.starred ? 'Unstar' : 'Star'}>
                  <IconButton onClick={() => starMutation.mutate({ id: selectedMail._id, starred: selectedMail.starred })}>
                    <Iconify
                      icon={selectedMail.starred ? 'solar:star-bold' : 'solar:star-outline-bold-duotone'}
                      sx={{ color: selectedMail.starred ? 'warning.main' : 'text.secondary' }}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Move to trash">
                  <IconButton onClick={() => deleteMutation.mutate(selectedMail._id)}>
                    <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Toolbar>
        </Card>

        <Card sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
          {loadingDetail && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 5 }}>
              <CircularProgress />
            </Box>
          )}
          {!loadingDetail && selectedMail && (
            <Stack spacing={3}>
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                  {getInitial(selectedMail.from)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="subtitle1">
                      {getParticipantDisplay(selectedMail.from)}
                    </Typography>
                    <Chip
                      label={selectedMail.status}
                      size="small"
                      color={selectedMail.status === 'unread' ? 'info' : 'default'}
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Stack>
                  {selectedMail.to?.length > 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      To: {selectedMail.to.map(getParticipantDisplay).join(', ')}
                    </Typography>
                  )}
                  {selectedMail.labels?.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                      {selectedMail.labels.map((l) => (
                        <Chip key={l} label={l} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ))}
                    </Stack>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                  {fDateTime(selectedMail.createdAt)}
                </Typography>
              </Stack>

              <Divider />

              <Box sx={{ typography: 'body1' }}>
                {selectedMail.html ? (
                  <Box dangerouslySetInnerHTML={{ __html: selectedMail.html }} />
                ) : (
                  <Typography sx={{ whiteSpace: 'pre-line' }}>{selectedMail.text || '(no content)'}</Typography>
                )}
              </Box>

              {selectedMail.attachments?.length > 0 && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2">
                    Attachments ({selectedMail.attachments.length})
                  </Typography>
                  {selectedMail.attachments.map((att, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}` }}
                    >
                      <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                        <Iconify icon="solar:file-bold-duotone" sx={{ color: 'primary.main' }} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>{att.filename || att.originalName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{att.mimeType}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}

              <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'background.neutral', border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Quick Reply</Typography>
                <TextField fullWidth multiline rows={3} placeholder="Write a reply..." sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }} />
                <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5 }}>
                  <Button
                    variant="contained"
                    onClick={() => { setSelectedMailId(null); handleOpenCompose(selectedMail); }}
                  >
                    Open Full Reply
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      <Card sx={{ boxShadow: 0, mb: 2 }}>
        <Toolbar sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="mailbox-select-label">Mailbox</InputLabel>
              <Select
                labelId="mailbox-select-label"
                label="Mailbox"
                value={selectedMailboxEmail || userEmail}
                onChange={(e) => setSelectedMailboxEmail(e.target.value)}
              >
                {fromOptions.map((o) => (
                  <MenuItem key={o.address} value={o.address}>
                    {o.name !== o.address ? `${o.name} <${o.address}>` : o.address}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => handleOpenCompose()}
            >
              Compose
            </Button>
            <OutlinedInput
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search emails… (Enter)"
              startAdornment={
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                </InputAdornment>
              }
              sx={{
                width: 280,
                '& fieldset': {
                  borderWidth: '1px !important',
                  borderColor: `${alpha(theme.palette.grey[500], 0.32)} !important`,
                },
              }}
            />
          </Stack>
          <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: mailsKey })}>
            <Iconify icon="solar:refresh-bold-duotone" />
          </IconButton>
        </Toolbar>
      </Card>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ mb: 2, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'background.neutral', overflowX: 'auto', flexShrink: 0 }}
      >
        {FOLDERS.map((f) => (
          <Button
            key={f.key}
            size="small"
            startIcon={<Iconify icon={f.icon} />}
            color={folder === f.key ? 'primary' : 'inherit'}
            onClick={() => handleFolderChange(f.key)}
            sx={{
              px: 1.5,
              borderRadius: 1,
              whiteSpace: 'nowrap',
              bgcolor: folder === f.key ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            }}
          >
            {f.label}
            {f.key === 'inbox' && unreadCount > 0 && (
              <Badge color="error" badgeContent={unreadCount} max={99} sx={{ ml: 1 }} />
            )}
          </Button>
        ))}
      </Stack>

      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {hasSelection && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
              {selectedIds.length} selected
            </Typography>
            <Button size="small" onClick={() => bulkReadMutation.mutate(selectedIds)}>Mark Read</Button>
            <Button size="small" onClick={() => bulkUnreadMutation.mutate(selectedIds)}>Mark Unread</Button>
            <Button size="small" color="error" onClick={() => bulkDeleteMutation.mutate(selectedIds)}>Delete</Button>
            <Button size="small" onClick={() => setSelectedIds([])}>Clear</Button>
          </Stack>
        )}

        {loadingMails && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
            <CircularProgress />
          </Box>
        )}
        {!loadingMails && mails.length === 0 && (
          <Box sx={{ p: 5, display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }}>
            <Iconify icon="solar:inbox-bold-duotone" sx={{ width: 80, height: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No emails</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {searchQuery ? 'No emails match your search' : `No emails in ${folder}`}
            </Typography>
          </Box>
        )}
        {!loadingMails && mails.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Checkbox
                size="small"
                checked={selectedIds.length === mails.length && mails.length > 0}
                indeterminate={selectedIds.length > 0 && selectedIds.length < mails.length}
                onChange={toggleSelectAll}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {pagination.total || 0} emails
              </Typography>
            </Box>

            <Scrollbar sx={{ flexGrow: 1 }}>
              <List disablePadding>
                {mails.map((mail) => {
                  const isUnread = mail.status === 'unread';
                  const isChecked = selectedIds.includes(mail._id);
                  const fromDisplay = typeof mail.from === 'string' ? mail.from : (mail.from?.name || mail.from?.address || '');

                  return (
                    <ListItemButton
                      key={mail._id}
                      sx={{
                        p: 2,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.32)}`,
                        bgcolor: isUnread ? alpha(theme.palette.grey[500], 0.06) : 'transparent',
                        '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.12) },
                      }}
                      onClick={() => handleOpenMail(mail._id)}
                    >
                      <Checkbox
                        size="small"
                        checked={isChecked}
                        onClick={(e) => { e.stopPropagation(); toggleSelectId(mail._id); }}
                        sx={{ mr: 1 }}
                      />
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.dark' }}>
                          {getInitial(mail.from)}
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0, pr: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{ fontWeight: isUnread ? 'fontWeightBold' : 'fontWeightRegular' }}
                          >
                            {fromDisplay}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                            {mail.attachmentCount > 0 && (
                              <Iconify icon="solar:paperclip-bold-duotone" sx={{ width: 16, height: 16, color: 'text.disabled' }} />
                            )}
                            <Typography variant="caption" sx={{ color: isUnread ? 'text.primary' : 'text.secondary' }}>
                              {fDate(mail.createdAt)}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ mb: 0.25, fontWeight: isUnread ? 'fontWeightMedium' : 'fontWeightRegular', color: isUnread ? 'text.primary' : 'text.secondary' }}
                        >
                          {mail.subject || '(no subject)'}
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          {(mail.text || '').slice(0, 100)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); starMutation.mutate({ id: mail._id, starred: mail.starred }); }}
                        sx={{ flexShrink: 0, ml: 0.5 }}
                      >
                        <Iconify
                          icon={mail.starred ? 'solar:star-bold' : 'solar:star-outline-bold-duotone'}
                          sx={{ color: mail.starred ? 'warning.main' : 'text.disabled', width: 18, height: 18 }}
                        />
                      </IconButton>
                    </ListItemButton>
                  );
                })}
              </List>
            </Scrollbar>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => { setPage(p); setSelectedIds([]); }}
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Card>
    </Box>
  );
}
