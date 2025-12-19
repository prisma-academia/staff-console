import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef, useState, useEffect } from 'react';

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
  Divider,
  Tooltip,
  Toolbar,
  TextField,
  Typography,
  IconButton,
  OutlinedInput,
  ListItemButton,
  InputAdornment,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';

import { fDate, fDateTime } from 'src/utils/format-time';

import config from 'src/config';
import mailService from 'src/services/mailService';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

// Custom toolbar configuration for ReactQuill
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image',
  'color', 'background',
  'align',
  'clean'
];

// ----------------------------------------------------------------------

export default function MailView() {
  const theme = useTheme();
  const quillRef = useRef(null);
  
  // View states
  const [view, setView] = useState('list'); // 'list', 'detail', 'compose'
  const [selectedMail, setSelectedMail] = useState(null);
  const [mails, setMails] = useState([]);
  const [activeFilter, setActiveFilter] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Compose email state
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    subject: '',
    content: '',
    isReply: false,
  });
  const [attachments, setAttachments] = useState([]);

  // Load emails on component mount and when filter changes
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const filters = {
          folder: activeFilter !== 'all' ? activeFilter : undefined,
          search: searchQuery || undefined,
        };
        const data = await mailService.getEmails(filters);
        setMails(data);
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [activeFilter, searchQuery]);

  const handleOpenCompose = (isReply = false, replyToMail = null) => {
    if (isReply && replyToMail) {
      setComposeData({
        to: replyToMail.from,
        cc: '',
        subject: `Re: ${replyToMail.subject}`,
        content: `<br/><br/><hr/><p>On ${fDateTime(replyToMail.createdAt)}, ${replyToMail.from} wrote:</p><blockquote>${replyToMail.html || replyToMail.text}</blockquote>`,
        isReply: true,
      });
    } else {
      setComposeData({
        to: '',
        cc: '',
        subject: '',
        content: '',
        isReply: false,
      });
    }
    setView('compose');
  };

  const handleSelectMail = async (mail) => {
    setSelectedMail(mail);
    setView('detail');
    
    // Mark as read if it's new
    if (mail.status === 'new') {
      try {
        await mailService.updateEmailStatus(mail.id, 'read');
        // Update the local state
        setMails(
          mails.map((m) => (m.id === mail.id ? { ...m, status: 'read' } : m))
        );
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  };

  const handleBack = () => {
    if (view === 'detail' || view === 'compose') {
      setView('list');
      setSelectedMail(null);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setView('list');
    setSelectedMail(null);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDeleteMail = async (mailId) => {
    try {
      await mailService.deleteEmail(mailId);
      setMails(mails.filter((mail) => mail.id !== mailId));
      if (selectedMail && selectedMail.id === mailId) {
        setView('list');
        setSelectedMail(null);
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      const emailData = {
        from: 'admin@abnaibi.edu', // This would be the current user's email
        to: composeData.to,
        cc: composeData.cc ? composeData.cc.split(',').map(cc => cc.trim()) : [],
        subject: composeData.subject,
        text: composeData.content.replace(/<[^>]*>?/gm, ''), // Strip HTML for text version
        html: composeData.content,
        attachments,
      };
      
      const sentEmail = await mailService.sendEmail(emailData);
      setMails([sentEmail, ...mails]);
      setView('list');
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const draftData = {
        from: 'admin@abnaibi.edu', // This would be the current user's email
        to: composeData.to,
        cc: composeData.cc ? composeData.cc.split(',').map(cc => cc.trim()) : [],
        subject: composeData.subject,
        text: composeData.content.replace(/<[^>]*>?/gm, ''), // Strip HTML for text version
        html: composeData.content,
        attachments,
      };
      
      const savedDraft = await mailService.saveDraft(draftData);
      setMails([savedDraft, ...mails]);
      setView('list');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachFile = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newAttachments = files.map(file => ({
      originalName: file.name,
      size: file.size,
      file,
    }));

    setAttachments([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleComposeChange = (field, value) => {
    setComposeData({
      ...composeData,
      [field]: value,
    });
  };

  // Get unread count for inbox
  const unreadCount = mails.filter(
    (mail) => mail.status === 'new' && mail.to === 'admin@abnaibi.edu'
  ).length;

  // Render mail list view
  const renderMailList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Card sx={{ boxShadow: 0, mb: 3 }}>
        <Toolbar
          sx={{
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => handleOpenCompose()}
              sx={{ px: 2.5 }}
            >
              Compose
            </Button>
            
            <OutlinedInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search emails..."
              startAdornment={
                <InputAdornment position="start">
                  <Iconify
                    icon="eva:search-fill"
                    sx={{ color: 'text.disabled', width: 20, height: 20 }}
                  />
                </InputAdornment>
              }
              sx={{
                width: 280,
                transition: theme.transitions.create(['box-shadow', 'width']),
                '&.Mui-focused': { width: 320, boxShadow: theme.customShadows.z8 },
                '& fieldset': {
                  borderWidth: `1px !important`,
                  borderColor: `${alpha(theme.palette.grey[500], 0.32)} !important`,
                },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => window.location.reload()}>
              <Iconify icon="solar:refresh-bold-duotone" />
            </IconButton>
            <IconButton>
              <Iconify icon="solar:filter-bold-duotone" />
            </IconButton>
          </Stack>
        </Toolbar>
      </Card>

      {/* Navigation tabs */}
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ 
          mb: 3, 
          px: 1, 
          py: 1, 
          borderRadius: 1,
          bgcolor: 'background.neutral',
          overflow: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <Button
          startIcon={<Iconify icon="solar:inbox-bold-duotone" />}
          color={activeFilter === 'inbox' ? 'primary' : 'inherit'}
          onClick={() => handleFilterChange('inbox')}
          sx={{ 
            px: 2, 
            borderRadius: 1,
            bgcolor: activeFilter === 'inbox' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: activeFilter === 'inbox' 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.grey[500], 0.08)
            }
          }}
        >
          Inbox
          {unreadCount > 0 && (
            <Badge
              color="error"
              badgeContent={unreadCount}
              max={99}
              sx={{ ml: 1 }}
            />
          )}
        </Button>
        
        <Button
          startIcon={<Iconify icon="solar:upload-minimalistic-bold-duotone" />}
          color={activeFilter === 'sent' ? 'primary' : 'inherit'}
          onClick={() => handleFilterChange('sent')}
          sx={{ 
            px: 2, 
            borderRadius: 1,
            bgcolor: activeFilter === 'sent' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: activeFilter === 'sent' 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.grey[500], 0.08)
            }
          }}
        >
          Sent
        </Button>
        
        <Button
          startIcon={<Iconify icon="solar:document-bold-duotone" />}
          color={activeFilter === 'draft' ? 'primary' : 'inherit'}
          onClick={() => handleFilterChange('draft')}
          sx={{ 
            px: 2, 
            borderRadius: 1,
            bgcolor: activeFilter === 'draft' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: activeFilter === 'draft' 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.grey[500], 0.08)
            }
          }}
        >
          Drafts
        </Button>
        
        <Button
          startIcon={<Iconify icon="solar:shield-warning-bold-duotone" />}
          color={activeFilter === 'spam' ? 'primary' : 'inherit'}
          onClick={() => handleFilterChange('spam')}
          sx={{ 
            px: 2, 
            borderRadius: 1,
            bgcolor: activeFilter === 'spam' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: activeFilter === 'spam' 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.grey[500], 0.08)
            }
          }}
        >
          Spam
        </Button>
        
        <Button
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
          color={activeFilter === 'trash' ? 'primary' : 'inherit'}
          onClick={() => handleFilterChange('trash')}
          sx={{ 
            px: 2, 
            borderRadius: 1,
            bgcolor: activeFilter === 'trash' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: activeFilter === 'trash' 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.grey[500], 0.08)
            }
          }}
        >
          Trash
        </Button>
        
        <Button
          startIcon={<Iconify icon="solar:sort-by-time-bold-duotone" />}
          color={activeFilter === 'all' ? 'primary' : 'inherit'}
          onClick={() => handleFilterChange('all')}
          sx={{ 
            px: 2, 
            borderRadius: 1,
            bgcolor: activeFilter === 'all' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: activeFilter === 'all' 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.grey[500], 0.08)
            }
          }}
        >
          All Mail
        </Button>
      </Stack>
      
      {/* Email List */}
      <Card sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {loading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {!loading && mails.length === 0 && (
          <Box
            sx={{
              p: 5,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Box
              component="img"
              src={config.assets.illustrations.notFound}
              sx={{ height: 240, mb: 3 }}
            />
            <Typography variant="h6" gutterBottom>
              No emails found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {searchQuery
                ? 'No emails match your search criteria'
                : 'There are no emails in this folder'}
            </Typography>
          </Box>
        )}
        {!loading && mails.length > 0 && (
          <Scrollbar sx={{ height: 'calc(100vh - 280px)' }}>
            <List disablePadding>
              {mails.map((mail) => {
                const isUnread = mail.status === 'new';
                return (
                  <ListItemButton
                    key={mail.id}
                    sx={{
                      p: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.32)}`,
                      cursor: 'pointer',
                      ...(isUnread && {
                        bgcolor: alpha(theme.palette.grey[500], 0.08),
                      }),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.grey[500], 0.12),
                      },
                    }}
                    onClick={() => handleSelectMail(mail)}
                  >
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      <ListItemAvatar>
                        <Avatar
                          alt={mail.from.split('@')[0]}
                          sx={{
                            ...(isUnread && {
                              border: `solid 2px ${theme.palette.primary.main}`,
                            }),
                          }}
                        />
                      </ListItemAvatar>

                      <Box sx={{ flexGrow: 1, minWidth: 0, pr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{
                              flexGrow: 1,
                              ...(isUnread && {
                                fontWeight: 'fontWeightBold',
                              }),
                            }}
                          >
                            {mail.from === 'admin@abnaibi.edu' ? mail.to.split('@')[0] : mail.from.split('@')[0]}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {mail.attachments.length > 0 && (
                              <Iconify
                                icon="solar:paperclip-bold-duotone"
                                sx={{ 
                                  width: 18, 
                                  height: 18, 
                                  mr: 1, 
                                  color: isUnread ? 'primary.main' : 'text.disabled',
                                }}
                              />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: isUnread ? 'text.primary' : 'text.secondary',
                                fontWeight: isUnread ? 'fontWeightMedium' : 'fontWeightRegular',
                              }}
                            >
                              {fDate(mail.createdAt)}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            mb: 0.5,
                            fontWeight: isUnread ? 'fontWeightMedium' : 'fontWeightRegular',
                            color: isUnread ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {mail.subject}
                        </Typography>

                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                          }}
                        >
                          {mail.text.slice(0, 120)}...
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          </Scrollbar>
        )}
      </Card>
    </Box>
  );

  // Render mail detail view
  const renderMailDetail = () => {
    if (!selectedMail) return null;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Card sx={{ mb: 3, boxShadow: 0 }}>
          <Toolbar
            sx={{
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Back">
                <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                  <Iconify icon="solar:arrow-left-bold-duotone" width={24} />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" noWrap>
                {selectedMail.subject}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Reply">
                <IconButton onClick={() => handleOpenCompose(true, selectedMail)}>
                  <Iconify icon="solar:reply-bold-duotone" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Forward">
                <IconButton>
                  <Iconify icon="solar:forward-bold-duotone" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton onClick={() => handleDeleteMail(selectedMail.id)}>
                  <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                </IconButton>
              </Tooltip>
              <Tooltip title="More options">
                <IconButton>
                  <Iconify icon="solar:menu-dots-bold-duotone" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </Card>

        {/* Email content */}
        <Card sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
          <Stack spacing={3}>
            {/* Email metadata */}
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  alt={selectedMail.from.split('@')[0]}
                  sx={{ width: 48, height: 48 }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" noWrap>
                      {selectedMail.from.split('@')[0]}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                      &lt;{selectedMail.from}&gt;
                    </Typography>
                    <Chip 
                      label={selectedMail.status.charAt(0).toUpperCase() + selectedMail.status.slice(1)} 
                      size="small"
                      color={selectedMail.status === 'new' ? 'info' : 'default'}
                      sx={{ ml: 1, height: 22, fontSize: '0.75rem' }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      To:
                    </Typography>
                    <Typography variant="body2">
                      {selectedMail.to}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {fDateTime(selectedMail.createdAt)}
                  </Typography>
                </Box>
              </Stack>

              <Divider />
            </Stack>

            {/* Email body */}
            <Box sx={{ typography: 'body1' }}>
              {selectedMail.html ? (
                <Box dangerouslySetInnerHTML={{ __html: selectedMail.html }} />
              ) : (
                <Typography sx={{ whiteSpace: 'pre-line' }}>{selectedMail.text}</Typography>
              )}
            </Box>

            {/* Attachments */}
            {selectedMail.attachments.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2">
                  Attachments ({selectedMail.attachments.length})
                </Typography>
                <Stack spacing={1}>
                  {selectedMail.attachments.map((attachment, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          bgcolor: (th) => alpha(th.palette.primary.main, 0.08),
                        }}
                      >
                        <Iconify
                          icon="solar:file-bold-duotone"
                          sx={{ width: 24, height: 24, color: 'primary.main' }}
                        />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {attachment.originalName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {(attachment.size / 1000).toFixed(1)} KB
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Preview">
                          <IconButton size="small">
                            <Iconify icon="solar:eye-bold-duotone" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <Iconify icon="solar:download-bold-duotone" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* Quick reply */}
            <Paper
              sx={{
                p: 3,
                mt: 3,
                borderRadius: 2,
                bgcolor: 'background.neutral',
                border: `solid 1px ${alpha(theme.palette.grey[500], 0.12)}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Reply
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Write a reply..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Iconify icon="solar:gallery-add-bold-duotone" />}
                >
                  Add Files
                </Button>
                <Button 
                  variant="contained"
                  onClick={() => handleOpenCompose(true, selectedMail)}
                >
                  Reply
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Card>
      </Box>
    );
  };

  // Render compose view
  const renderComposeView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card sx={{ mb: 3, boxShadow: 0 }}>
        <Toolbar
          sx={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Back">
              <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                <Iconify icon="solar:arrow-left-bold-duotone" width={24} />
              </IconButton>
            </Tooltip>
            <Typography variant="h6" noWrap>
              {composeData.isReply ? 'Reply' : 'New Message'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:file-text-bold-duotone" />}
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:airplane-bold-duotone" />}
              onClick={handleSendEmail}
            >
              Send
            </Button>
          </Stack>
        </Toolbar>
      </Card>

      {/* Compose Form */}
      <Card sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={3} sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            label="To"
            value={composeData.to}
            onChange={(e) => handleComposeChange('to', e.target.value)}
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
            onChange={(e) => handleComposeChange('cc', e.target.value)}
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
            onChange={(e) => handleComposeChange('subject', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:document-text-bold-duotone" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flexGrow: 1 }}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={composeData.content}
              onChange={(content) => handleComposeChange('content', content)}
              modules={modules}
              formats={formats}
              placeholder="Write your message..."
              style={{ 
                height: '300px', 
                display: 'flex', 
                flexDirection: 'column',
              }}
            />
          </Box>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">
                Attachments ({attachments.length})
              </Typography>
              <Stack spacing={1}>
                {attachments.map((attachment, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        bgcolor: (thm) => alpha(thm.palette.primary.main, 0.08),
                      }}
                    >
                      <Iconify
                        icon="solar:file-bold-duotone"
                        sx={{ width: 24, height: 24, color: 'primary.main' }}
                      />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {attachment.originalName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {(attachment.size / 1000).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleRemoveAttachment(index)}>
                      <Iconify icon="solar:close-circle-bold-duotone" sx={{ color: 'text.disabled' }} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Actions */}
          <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
            <Box>
              <input
                type="file"
                multiple
                id="attachment-input"
                aria-label="Attach files"
                style={{ display: 'none' }}
                onChange={handleAttachFile}
              />
              <Button
                component="label"
                htmlFor="attachment-input"
                variant="outlined"
                startIcon={<Iconify icon="solar:paperclip-bold-duotone" />}
                sx={{ mr: 1 }}
              >
                Attach Files
              </Button>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleBack}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSendEmail}>
                Send
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      {view === 'list' && renderMailList()}
      {view === 'detail' && renderMailDetail()}
      {view === 'compose' && renderComposeView()}
    </Box>
  );
}

