import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import { alpha, useTheme } from '@mui/material/styles';

import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const MENU_OPTIONS = [
  {
    label: 'Home',
    icon: 'eva:home-fill',
    path: '/',
  },
  {
    label: 'Profile',
    icon: 'eva:person-fill',
    path: '/profile',
  },
  {
    label: 'Settings',
    icon: 'eva:settings-2-fill',
    path: '/settings',
  },
];

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const [open, setOpen] = useState(null);
  const logOut = useAuthStore((obj) => obj.logOut);
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();

  const handleOpen = (event) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleMenuClick = (path) => {
    // Navigate to path
    handleClose();
  };

  const handleLogout = () => {
    handleClose();
    logOut();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          width: 40,
          height: 40,
          padding: 0,
          background: thm=> alpha(thm.palette.grey[500], 0.08),
          ...(open && {
            background: thm=>
              `linear-gradient(135deg, ${thm.palette.primary.light} 0%, ${thm.palette.primary.main} 100%)`,
          }),
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color="success"
          invisible={!user?.isOnline}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: 'success.main',
              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            },
          }}
        >
          <Avatar
            src={user?.profilePic}
            alt={user?.fullName}
            sx={{
              width: 36,
              height: 36,
              border: thm=> `solid 2px ${thm.palette.background.default}`,
            }}
          >
            {user?.fullName?.charAt(0).toUpperCase()}
          </Avatar>
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
            p: 0,
            mt: 1,
            ml: 0.75,
            width: 220,
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
        <Box sx={{ pt: 2, pb: 1.5, px: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={user?.profilePic}
              alt={user?.fullName}
              sx={{ 
                width: 40, 
                height: 40,
                border: thm=> `solid 2px ${alpha(thm.palette.primary.main, 0.2)}`,
                boxShadow: thm=> `0 0 16px ${alpha(thm.palette.primary.main, 0.1)}`
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap fontWeight={600}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ borderStyle: 'solid', borderColor: thm=> alpha(thm.palette.grey[500], 0.12) }} />

        <Box sx={{ py: 1 }}>
          {MENU_OPTIONS.map((option) => (
            <MenuItem 
              key={option.label} 
              onClick={() => handleMenuClick(option.path)}
              sx={{ 
                py: 1, 
                px: 2.5,
                '&:hover': {
                  bgcolor: thm=> alpha(thm.palette.primary.main, 0.04)
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Iconify icon={option.icon} width={20} height={20} color={theme.palette.primary.main} />
              </ListItemIcon>
              <Typography variant="body2">{option.label}</Typography>
            </MenuItem>
          ))}
        </Box>

        <Divider sx={{ borderStyle: 'solid', borderColor: thm=> alpha(thm.palette.grey[500], 0.12), m: 0 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ 
            py: 1.5, 
            px: 2.5, 
            color: 'error.main',
            '&:hover': {
              bgcolor: thm=> alpha(thm.palette.error.main, 0.04)
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Iconify icon="eva:log-out-fill" width={20} height={20} color={theme.palette.error.main} />
          </ListItemIcon>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Popover>
    </>
  );
}
