import ReactQuill from 'react-quill';
import { useSnackbar } from 'notistack';
import 'react-quill/dist/quill.snow.css';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Tab,
  List,
  Chip,
  Tabs,
  Stack,
  Paper,
  Badge,
  Button,
  Avatar,
  Select,
  Dialog,
  Divider,
  Tooltip,
  Checkbox,
  Skeleton,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  InputAdornment,
} from '@mui/material';

import { fDateTime } from 'src/utils/format-time';

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
  return src.charAt(0).toUpperCase() || '?';
};

const formatMailDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isThisYear) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', html: '' });
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
        bcc: '',
        subject: `Re: ${replyMail.subject || ''}`,
        html: `<br/><hr/><p>On ${fDateTime(replyMail.createdAt)}, ${getParticipantDisplay(replyMail.from)} wrote:</p><blockquote>${replyMail.html || replyMail.text || ''}</blockquote>`,
      });
    } else {
      setComposeData({ to: '', cc: '', bcc: '', subject: '', html: '' });
    }
    setAttachments([]);
    setShowCcBcc(false);
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
        bcc: composeData.bcc ? JSON.stringify([{ address: composeData.bcc.trim() }]) : undefined,
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
        cc: composeData.cc ? JSON.stringify([{ address: composeData.cc.trim() }]) : undefined,
        bcc: composeData.bcc ? JSON.stringify([{ address: composeData.bcc.trim() }]) : undefined,
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

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* ── Sidebar ── */}
      <Paper
        elevation={0}
        sx={{
          width: 200,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          overflow: 'hidden',
          justifyContent: 'flex-start',
          gap: 1.5,
          p: 2,
        }}
      >
        {/* Account selector */}
        <FormControl fullWidth size="small">
          <InputLabel>Mailbox</InputLabel>
          <Select
            label="Mailbox"
            value={selectedMailboxEmail || ''}
            onChange={(e) => setSelectedMailboxEmail(e.target.value)}
          >
            {fromOptions.map((o) => (
              <MenuItem key={o.address} value={o.address}>
                {o.name !== o.address ? o.name : o.address}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Compose button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="solar:pen-new-round-bold-duotone" />}
          onClick={() => handleOpenCompose()}
          sx={{ borderRadius: 2 }}
        >
          Compose
        </Button>
      </Paper>

      {/* ── Main panel ── */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* Folder tabs */}
        <Tabs
          value={folder}
          onChange={(_, v) => handleFolderChange(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          {FOLDERS.map((f) => (
            <Tab
              key={f.key}
              value={f.key}
              label={
                f.key === 'inbox' && unreadCount > 0 ? (
                  <Badge badgeContent={unreadCount > 99 ? '99+' : unreadCount} color="primary" max={99}>
                    {f.label}
                  </Badge>
                ) : (
                  f.label
                )
              }
              icon={<Iconify icon={f.icon} width={18} />}
              iconPosition="start"
              sx={{ minHeight: 48, fontSize: '0.8125rem' }}
            />
          ))}
        </Tabs>

        {selectedMailId ? (
          /* ── Detail view ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Detail top bar */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <IconButton size="small" onClick={() => setSelectedMailId(null)}>
                <Iconify icon="eva:arrow-back-fill" />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1, ml: 0.5 }}>
                {selectedMail?.subject || '(no subject)'}
              </Typography>
              {selectedMail && (
                <>
                  <Tooltip title={selectedMail.starred ? 'Unstar' : 'Star'}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        starMutation.mutate({ id: selectedMail._id, starred: selectedMail.starred })
                      }
                      sx={{ color: selectedMail.starred ? 'warning.main' : 'text.secondary' }}
                    >
                      <Iconify
                        icon={
                          selectedMail.starred
                            ? 'solar:star-bold'
                            : 'solar:star-outline-bold-duotone'
                        }
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reply">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCompose(selectedMail)}
                    >
                      <Iconify icon="solar:reply-bold-duotone" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move to trash">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(selectedMail._id)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>

            {/* Detail content */}
            <Scrollbar sx={{ flexGrow: 1 }}>
              {loadingDetail && (
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton width="40%" height={24} />
                      <Skeleton width="60%" />
                    </Box>
                  </Stack>
                  <Skeleton height={200} />
                </Box>
              )}
              {!loadingDetail && selectedMail && (
                <Box sx={{ p: 3 }}>
                  {/* From block */}
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: 'primary.lighter',
                        color: 'primary.dark',
                        fontWeight: 700,
                      }}
                    >
                      {getInitial(selectedMail.from)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {getParticipantDisplay(selectedMail.from)}
                      </Typography>
                      {selectedMail.to?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          To: {selectedMail.to.map(getParticipantDisplay).join(', ')}
                        </Typography>
                      )}
                      {selectedMail.labels?.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                          {selectedMail.labels.map((l) => (
                            <Chip
                              key={l}
                              label={l}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {fDateTime(selectedMail.createdAt)}
                    </Typography>
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  {/* Body */}
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 2, mb: 3, '& a': { color: 'primary.main' } }}
                  >
                    {selectedMail.html ? (
                      <Box dangerouslySetInnerHTML={{ __html: selectedMail.html }} />
                    ) : (
                      <Typography sx={{ whiteSpace: 'pre-line' }}>
                        {selectedMail.text || '(no content)'}
                      </Typography>
                    )}
                  </Paper>

                  {/* Attachments */}
                  {selectedMail.attachments?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block', fontWeight: 600 }}
                      >
                        Attachments ({selectedMail.attachments.length})
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {selectedMail.attachments.map((att, i) => (
                          <Chip
                            key={i}
                            label={att.filename || att.originalName}
                            icon={<Iconify icon="solar:file-bold-duotone" />}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Quick reply bar */}
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Quick reply… (click to open compose)"
                      onFocus={() => handleOpenCompose(selectedMail)}
                      inputProps={{ readOnly: true }}
                      sx={{ cursor: 'pointer' }}
                    />
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenCompose(selectedMail)}
                    >
                      <Iconify icon="solar:reply-bold-duotone" />
                    </IconButton>
                  </Paper>
                </Box>
              )}
            </Scrollbar>
          </Box>
        ) : (
          /* ── List view ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search + pagination bar */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <Checkbox
                size="small"
                checked={selectedIds.length === mails.length && mails.length > 0}
                indeterminate={selectedIds.length > 0 && selectedIds.length < mails.length}
                onChange={toggleSelectAll}
                sx={{ mr: 0.5 }}
              />
              <TextField
                size="small"
                placeholder={`Search ${folder}…`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearch}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {pagination.total
                  ? `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, pagination.total)} of ${pagination.total}`
                  : ''}
              </Typography>
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={() => queryClient.invalidateQueries({ queryKey: mailsKey })}
                >
                  <Iconify icon="solar:refresh-bold-duotone" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Bulk action bar */}
            {hasSelection && (
              <Box
                sx={{
                  px: 2,
                  py: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
                  {selectedIds.length} selected
                </Typography>
                <Button size="small" onClick={() => bulkReadMutation.mutate(selectedIds)}>
                  Mark read
                </Button>
                <Button size="small" onClick={() => bulkUnreadMutation.mutate(selectedIds)}>
                  Mark unread
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                >
                  Delete
                </Button>
                <Button size="small" color="inherit" onClick={() => setSelectedIds([])}>
                  Clear
                </Button>
              </Box>
            )}

            {/* Mail list */}
            <Scrollbar sx={{ flexGrow: 1 }}>
              {loadingMails && (
                <List disablePadding>
                  {[...Array(6)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Skeleton variant="circular" width={36} height={36} sx={{ flexShrink: 0 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton width="35%" height={20} />
                        <Skeleton width="70%" height={16} />
                        <Skeleton width="50%" height={14} />
                      </Box>
                      <Skeleton width={40} height={14} />
                    </Box>
                  ))}
                </List>
              )}

              {!loadingMails && mails.length === 0 && (
                <Box
                  sx={{
                    py: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify
                    icon="solar:inbox-bold-duotone"
                    sx={{ width: 64, height: 64, color: 'text.disabled', mb: 1.5 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No messages
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {searchQuery ? 'No emails match your search' : `Your ${folder} is empty`}
                  </Typography>
                </Box>
              )}

              {!loadingMails && mails.length > 0 && (
                <List disablePadding>
                  {mails.map((mail) => {
                    const isUnread = mail.status === 'unread';
                    const isChecked = selectedIds.includes(mail._id);
                    const fromDisplay =
                      typeof mail.from === 'string'
                        ? mail.from
                        : mail.from?.name || mail.from?.address || '';
                    const initial = fromDisplay.charAt(0).toUpperCase() || '?';

                    return (
                      <Box
                        key={mail._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1.25,
                          gap: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          bgcolor: isUnread
                            ? alpha(theme.palette.primary.main, 0.04)
                            : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.grey[500], 0.08),
                            cursor: 'pointer',
                          },
                        }}
                        onClick={() => handleOpenMail(mail._id)}
                      >
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectId(mail._id);
                          }}
                          sx={{ flexShrink: 0 }}
                        />
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: 14,
                            fontWeight: 700,
                            bgcolor: 'primary.lighter',
                            color: 'primary.dark',
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 0.25 }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={isUnread ? 700 : 400}
                              noWrap
                              sx={{ flexGrow: 1, mr: 1 }}
                            >
                              {fromDisplay || '(no sender)'}
                            </Typography>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.5}
                              sx={{ flexShrink: 0 }}
                            >
                              {mail.attachmentCount > 0 && (
                                <Iconify
                                  icon="solar:paperclip-bold-duotone"
                                  sx={{ width: 14, height: 14, color: 'text.disabled' }}
                                />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: isUnread ? 'text.primary' : 'text.secondary',
                                  fontWeight: isUnread ? 600 : 400,
                                }}
                              >
                                {formatMailDate(mail.createdAt)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Stack direction="row" alignItems="center">
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                flexGrow: 1,
                                color: isUnread ? 'text.primary' : 'text.secondary',
                                fontWeight: isUnread ? 600 : 400,
                                fontSize: '0.8125rem',
                              }}
                            >
                              {mail.subject || '(no subject)'}
                            </Typography>
                          </Stack>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            starMutation.mutate({ id: mail._id, starred: mail.starred });
                          }}
                          sx={{
                            flexShrink: 0,
                            color: mail.starred ? 'warning.main' : 'text.disabled',
                          }}
                        >
                          <Iconify
                            icon={
                              mail.starred
                                ? 'solar:star-bold'
                                : 'solar:star-outline-bold-duotone'
                            }
                            sx={{ width: 18, height: 18 }}
                          />
                        </IconButton>
                      </Box>
                    );
                  })}
                </List>
              )}
            </Scrollbar>
          </Box>
        )}
      </Box>

      {/* ── Compose dialog ── */}
      <Dialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            height: '82vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Compose header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {composeData.subject.startsWith('Re:') ? 'Reply' : 'New Message'}
          </Typography>
          <IconButton size="small" onClick={() => setComposeOpen(false)}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>

        {/* Compose body */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 3, py: 2 }}>
          <Stack spacing={2}>
            {/* From */}
            <FormControl fullWidth size="small">
              <InputLabel>From</InputLabel>
              <Select
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

            {/* To */}
            <TextField
              fullWidth
              size="small"
              label="To"
              value={composeData.to}
              onChange={(e) => setComposeData((d) => ({ ...d, to: e.target.value }))}
            />

            {/* CC/BCC toggle */}
            {!showCcBcc ? (
              <Box>
                <Button
                  size="small"
                  color="inherit"
                  sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
                  onClick={() => setShowCcBcc(true)}
                >
                  + CC / BCC
                </Button>
              </Box>
            ) : (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="CC"
                  value={composeData.cc}
                  onChange={(e) => setComposeData((d) => ({ ...d, cc: e.target.value }))}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="BCC"
                  value={composeData.bcc}
                  onChange={(e) => setComposeData((d) => ({ ...d, bcc: e.target.value }))}
                />
              </>
            )}

            {/* Subject */}
            <TextField
              fullWidth
              size="small"
              label="Subject"
              value={composeData.subject}
              onChange={(e) => setComposeData((d) => ({ ...d, subject: e.target.value }))}
            />

            <Divider />

            {/* Editor */}
            <Box sx={{ minHeight: 220 }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={composeData.html}
                onChange={(val) => setComposeData((d) => ({ ...d, html: val }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your message…"
                style={{ height: 200 }}
              />
            </Box>

            {/* Attachment list */}
            {attachments.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {attachments.map((f, i) => (
                  <Chip
                    key={i}
                    label={f.name}
                    size="small"
                    icon={<Iconify icon="solar:file-bold-duotone" />}
                    onDelete={() =>
                      setAttachments((a) => a.filter((_, j) => j !== i))
                    }
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Compose footer */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <input
            type="file"
            multiple
            id="compose-attach-input"
            aria-label="Attach files"
            style={{ display: 'none' }}
            onChange={(e) =>
              setAttachments((a) => [...a, ...Array.from(e.target.files)])
            }
          />
          <Button
            component="label"
            htmlFor="compose-attach-input"
            startIcon={<Iconify icon="solar:paperclip-bold-duotone" />}
            color="inherit"
            sx={{ color: 'text.secondary' }}
          >
            Attach
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setComposeOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveDraft} disabled={isSendingMail} variant="outlined">
            Save draft
          </Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isSendingMail}
            startIcon={<Iconify icon="solar:plain-2-bold-duotone" />}
          >
            {isSendingMail ? 'Sending…' : 'Send'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
