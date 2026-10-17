import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';

import { UserApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

function greeting(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const fullName = (user) =>
  [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ');

export const initialsOf = (user) =>
  `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

export const roleLabel = (role) => (role ? String(role).replace(/[_-]/g, ' ') : 'Staff');

function Fact({ icon, label, value, loading }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Iconify icon={icon} width={20} sx={{ color: 'text.disabled', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" component="div" noWrap>
          {label}
        </Typography>
        <Typography variant="subtitle2" component="div" noWrap>
          {loading ? <Skeleton width={120} /> : value}
        </Typography>
      </Box>
    </Stack>
  );
}

Fact.propTypes = { icon: PropTypes.string, label: PropTypes.string, value: PropTypes.node, loading: PropTypes.bool };

/**
 * Greeting, role, the session the console is scoped to, and today's date. The avatar
 * opens the account menu (photo, profile, password).
 */
export default function HomeHeader({ user, loading, session, sessionId, sessionReady, onEditProfile, onChangePassword }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const now = new Date();

  const upload = useMutation({
    mutationFn: (file) => UserApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-me'] });
      enqueueSnackbar('Profile picture updated', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to upload picture', { variant: 'error' });
    },
  });

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = '';
  };

  const pick = (action) => () => {
    setAnchorEl(null);
    action();
  };

  const department = typeof user?.department === 'object' ? user.department?.name : null;
  const semester = session?.currentSemester;
  let sessionValue = 'All sessions';
  if (session) sessionValue = `${session.name}${semester ? ` · ${semester}` : ''}`;
  else if (sessionId) sessionValue = '—';

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={{ xs: 2.5, md: 3 }}
      sx={{ mb: { xs: 3, md: 4 } }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureChange} style={{ display: 'none' }} />
        {loading ? (
          <Skeleton variant="circular" width={56} height={56} sx={{ flexShrink: 0 }} />
        ) : (
          <ButtonBase
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={Boolean(anchorEl)}
            sx={{
              position: 'relative',
              borderRadius: '50%',
              flexShrink: 0,
              '&:focus-visible': { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
            }}
          >
            <Avatar
              src={user?.picture}
              alt={fullName(user)}
              sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 600, fontSize: '1.25rem' }}
            >
              {initialsOf(user)}
            </Avatar>
            {upload.isPending && (
              <CircularProgress size={56} thickness={2.5} sx={{ position: 'absolute', inset: 0, color: 'primary.main' }} />
            )}
            <Box
              sx={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                color: 'text.secondary',
                boxShadow: (theme) => theme.customShadows.z4,
              }}
            >
              <Iconify icon="eva:chevron-down-fill" width={16} />
            </Box>
          </ButtonBase>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ letterSpacing: -0.5 }}>
            {loading ? <Skeleton width={280} /> : `${greeting(now)}${user?.firstName ? `, ${user.firstName}` : ''}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, textTransform: 'capitalize' }} noWrap>
            {loading ? <Skeleton width={160} /> : [roleLabel(user?.role), department].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={{ xs: 2.5, sm: 3 }}
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ flexShrink: 0, maxWidth: 1 }}
      >
        <Fact icon="solar:calendar-mark-bold-duotone" label="Academic session" value={sessionValue} loading={!sessionReady} />
        <Fact icon="solar:sun-2-bold-duotone" label="Today" value={format(now, 'EEEE, d MMM yyyy')} />
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 240, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {fullName(user)}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={pick(() => fileInputRef.current?.click())} disabled={upload.isPending}>
          <ListItemIcon>
            <Iconify icon="eva:camera-fill" width={20} />
          </ListItemIcon>
          {user?.picture ? 'Change photo' : 'Upload photo'}
        </MenuItem>
        <MenuItem onClick={pick(onEditProfile)}>
          <ListItemIcon>
            <Iconify icon="eva:edit-fill" width={20} />
          </ListItemIcon>
          Edit profile
        </MenuItem>
        <MenuItem onClick={pick(onChangePassword)}>
          <ListItemIcon>
            <Iconify icon="eva:lock-fill" width={20} />
          </ListItemIcon>
          Change password
        </MenuItem>
      </Menu>
    </Stack>
  );
}

HomeHeader.propTypes = {
  user: PropTypes.object,
  loading: PropTypes.bool,
  session: PropTypes.object,
  sessionId: PropTypes.string,
  sessionReady: PropTypes.bool,
  onEditProfile: PropTypes.func.isRequired,
  onChangePassword: PropTypes.func.isRequired,
};
