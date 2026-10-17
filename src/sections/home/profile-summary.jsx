import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fDate, fDateTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import { fullName, roleLabel, initialsOf } from './home-header';

// ----------------------------------------------------------------------

function Row({ label, children }) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Stack>
  );
}

Row.propTypes = { label: PropTypes.string, children: PropTypes.node };

/** Slim account card; the full permission list sits behind an expander. */
export default function ProfileSummary({ user, loading, error }) {
  const [showPermissions, setShowPermissions] = useState(false);

  if (loading) {
    return (
      <Card sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton width="60%" />
            <Skeleton width="80%" />
          </Box>
        </Stack>
        <Skeleton variant="rounded" height={96} sx={{ mt: 2 }} />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card sx={{ p: 2.5 }}>
        <Typography variant="body2" color="error">
          {error?.message || 'Your profile could not be loaded'}
        </Typography>
      </Card>
    );
  }

  const isAdmin = user.role === 'admin';
  const permissions = (user.permission || []).map((p) => (typeof p === 'string' ? p : p.action)).filter(Boolean);
  const groups = (user.groups || []).map((g) => (typeof g === 'object' ? g.name : g)).filter(Boolean);
  const department = typeof user.department === 'object' ? user.department?.name : null;

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={user.picture} alt={fullName(user)} sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '0.95rem', fontWeight: 600 }}>
          {initialsOf(user)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {fullName(user)}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

      <Stack spacing={1.25}>
        <Row label="Role">
          <Box component="span" sx={{ textTransform: 'capitalize' }}>
            {roleLabel(user.role)}
          </Box>
        </Row>
        <Row label="Status">
          <Label color={user.status === 'active' ? 'success' : 'default'}>{user.status || '—'}</Label>
        </Row>
        {department && <Row label="Department">{department}</Row>}
        {groups.length > 0 && <Row label="Groups">{groups.join(', ')}</Row>}
        {user.internalEmail && <Row label="Internal email">{user.internalEmail}</Row>}
        {user.phone && <Row label="Phone">{user.phone}</Row>}
        {user.address && <Row label="Address">{user.address}</Row>}
        {user.dateOfBirth && <Row label="Date of birth">{fDate(user.dateOfBirth)}</Row>}
        {user.gender && <Row label="Gender">{user.gender}</Row>}
        {user.lastLogin && <Row label="Last sign-in">{fDateTime(user.lastLogin)}</Row>}
      </Stack>

      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

      {isAdmin ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="eva:shield-fill" width={18} sx={{ color: 'primary.main' }} />
          <Typography variant="body2">Administrator — every permission</Typography>
        </Stack>
      ) : (
        <>
          <Button
            fullWidth
            color="inherit"
            onClick={() => setShowPermissions((v) => !v)}
            aria-expanded={showPermissions}
            endIcon={<Iconify icon={showPermissions ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} />}
            sx={{ justifyContent: 'space-between' }}
          >
            View my permissions ({permissions.length})
          </Button>
          <Collapse in={showPermissions} unmountOnExit>
            {permissions.length ? (
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ pt: 1.5 }}>
                {permissions.map((perm) => (
                  <Chip key={perm} label={perm.replace(/_/g, ' ')} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pt: 1.5 }}>
                No permissions assigned. Ask an administrator for access to the modules you need.
              </Typography>
            )}
          </Collapse>
        </>
      )}
    </Card>
  );
}

ProfileSummary.propTypes = {
  user: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.object,
};
