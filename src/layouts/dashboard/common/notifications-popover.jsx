import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Card from '@mui/material/Card';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import { alpha, useTheme } from '@mui/material/styles';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import config from 'src/config';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function NotificationsPopover() {
  // TODO: Replace with actual API call to fetch notifications
  const [notifications, setNotifications] = useState([]);
  const theme = useTheme();

  const totalUnRead = notifications.filter((item) => item.isUnRead === true).length;

  const [open, setOpen] = useState(null);

  const handleOpen = (event) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        isUnRead: false,
      }))
    );
  };

  return (
    <>
      <IconButton 
        color={open ? 'primary' : 'default'} 
        onClick={handleOpen}
        sx={{
          color: 'text.primary',
          bgcolor: alpha(theme.palette.grey[500], 0.08),
          borderRadius: 1.5,
          width: 40,
          height: 40,
          '&:hover': {
            bgcolor: alpha(theme.palette.grey[500], 0.16)
          },
          ...(open && {
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }),
        }}
      >
        <Badge 
          badgeContent={totalUnRead} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              minWidth: '20px',
              height: '20px',
              p: 0,
              fontSize: '0.65rem',
              boxShadow: `0 0 0 1.5px ${theme.palette.background.paper}`,
            },
          }}
        >
          <Iconify width={22} height={22} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            ml: 0.75,
            width: 360,
            p: 0,
            overflow: 'inherit',
            boxShadow: thm=> `0 0 24px 0 ${alpha(thm.palette.grey[900], 0.1)}`,
            border: thm=> `solid 1px ${alpha(thm.palette.grey[500], 0.16)}`,
            '&:before': {
              content: '""',
              width: 12,
              height: 12,
              position: 'absolute',
              top: -6,
              right: 16,
              transform: 'rotate(45deg)',
              bgcolor: 'background.paper',
              borderTop: thm=> `solid 1px ${alpha(thm.palette.grey[500], 0.16)}`,
              borderLeft: thm=> `solid 1px ${alpha(thm.palette.grey[500], 0.16)}`,
            },
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          py: 2, 
          px: 2.5,
          bgcolor: alpha(theme.palette.primary.lighter, 0.2),
        }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              You have {totalUnRead} unread {totalUnRead === 1 ? 'message' : 'messages'}
            </Typography>
          </Box>

          {totalUnRead > 0 && (
            <Button 
              size="small" 
              color="primary" 
              variant="text"
              onClick={handleMarkAllAsRead}
              startIcon={<Iconify icon="eva:done-all-fill" width={16} height={16} />}
              sx={{ 
                typography: 'caption',
                fontWeight: 600,
                height: 30,
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider sx={{ borderColor: alpha(theme.palette.grey[500], 0.12) }} />

        <Scrollbar sx={{ height: { xs: 340, sm: 420 } }}>
          {notifications.length > 0 ? (
            <List disablePadding>
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </List>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <Card sx={{ textAlign: 'center', py: 4, px: 3, boxShadow: 'none' }}>
                <Box
                  component="img"
                  src={config.assets.illustrations.notFound}
                  sx={{ width: 140, mx: 'auto', mb: 2, opacity: 0.8 }}
                />
                <Typography variant="subtitle1" gutterBottom>
                  No Notifications Yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  You will be notified when there are new updates or activities.
                </Typography>
              </Card>
            </Box>
          )}
        </Scrollbar>

        {notifications.length > 0 && (
          <>
            <Divider sx={{ borderColor: alpha(theme.palette.grey[500], 0.12) }} />
            <Box sx={{ p: 1 }}>
              <Button 
                fullWidth 
                size="small" 
                color="inherit" 
                variant="text"
                sx={{ 
                  typography: 'subtitle2',
                  height: 40,
                  color: 'text.secondary',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                  }
                }}
              >
                View All
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}

// ----------------------------------------------------------------------

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    createdAt: PropTypes.instanceOf(Date),
    id: PropTypes.string,
    isUnRead: PropTypes.bool,
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    avatar: PropTypes.any,
  }),
};

function NotificationItem({ notification }) {
  const { avatar, title } = renderContent(notification);
  const theme = useTheme();

  return (
    <ListItemButton
      sx={{
        py: 1.5,
        px: 2.5,
        borderLeft: notification.isUnRead ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
        ...(notification.isUnRead && {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }),
        '&:hover': {
          bgcolor: alpha(theme.palette.grey[500], 0.08),
        }
      }}
    >
      <ListItemAvatar>
        <Avatar 
          sx={{ 
            bgcolor: thm=> alpha(thm.palette.primary.light, 0.12),
            color: 'primary.main'
          }}
        >
          {avatar}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={title}
        secondary={
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.disabled',
            }}
          >
            <Iconify icon="eva:clock-outline" sx={{ mr: 0.5, width: 16, height: 16 }} />
            {fToNow(notification.createdAt)}
          </Typography>
        }
        primaryTypographyProps={{
          variant: 'subtitle2',
          color: notification.isUnRead ? 'text.primary' : 'text.secondary',
        }}
        sx={{ 
          m: 0,
          '& .MuiListItemText-primary': {
            mb: 0.5
          },
        }}
      />
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function renderContent(notification) {
  const title = (
    <Typography variant="subtitle2">
      {notification.title}
      <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 0.5 }}>
        {notification.description}
      </Typography>
    </Typography>
  );

  if (notification.type === 'system_update') {
    return {
      avatar: <Iconify icon="eva:settings-2-fill" width={24} height={24} />,
      title,
    };
  }
  if (notification.type === 'student_registration') {
    return {
      avatar: <Iconify icon="eva:person-add-fill" width={24} height={24} />,
      title,
    };
  }
  if (notification.type === 'payment') {
    return {
      avatar: <Iconify icon="eva:credit-card-fill" width={24} height={24} />,
      title,
    };
  }
  if (notification.type === 'order_placed') {
    return {
      avatar: <img alt={notification.title} src={config.utils.buildImageUrl(config.assets.icons.notifications, 'ic_notification_package.svg')} />,
      title,
    };
  }
  if (notification.type === 'order_shipped') {
    return {
      avatar: <img alt={notification.title} src={config.utils.buildImageUrl(config.assets.icons.notifications, 'ic_notification_shipping.svg')} />,
      title,
    };
  }
  if (notification.type === 'mail') {
    return {
      avatar: <img alt={notification.title} src={config.utils.buildImageUrl(config.assets.icons.notifications, 'ic_notification_mail.svg')} />,
      title,
    };
  }
  if (notification.type === 'chat_message') {
    return {
      avatar: <img alt={notification.title} src={config.utils.buildImageUrl(config.assets.icons.notifications, 'ic_notification_chat.svg')} />,
      title,
    };
  }
  return {
    avatar: notification.avatar ? <img alt={notification.title} src={notification.avatar} /> : null,
    title,
  };
}
