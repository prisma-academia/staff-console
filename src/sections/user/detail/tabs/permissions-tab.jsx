import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Divider,
  Checkbox,
  useTheme,
  TextField,
  Typography,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { PERMISSION_CATEGORIES } from '../../permissions-config';

export default function PermissionsTab({ formik, editMode }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCount = formik.values.permission?.length || 0;

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return PERMISSION_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return PERMISSION_CATEGORIES.map((category) => ({
      ...category,
      permissions: category.permissions.filter(
        (perm) =>
          perm.label.toLowerCase().includes(query) ||
          perm.id.toLowerCase().includes(query) ||
          category.label.toLowerCase().includes(query)
      ),
    })).filter((category) => category.permissions.length > 0);
  }, [searchQuery]);

  const handleSelectAllCategory = (category) => {
    const categoryPermissionIds = category.permissions.map((p) => p.id);
    const allSelected = categoryPermissionIds.every((id) =>
      formik.values.permission.includes(id)
    );

    if (allSelected) {
      // Deselect all in category
      const newPermissions = formik.values.permission.filter(
        (id) => !categoryPermissionIds.includes(id)
      );
      formik.setFieldValue('permission', newPermissions);
    } else {
      // Select all in category
      const newPermissions = [
        ...new Set([...formik.values.permission, ...categoryPermissionIds]),
      ];
      formik.setFieldValue('permission', newPermissions);
    }
  };

  const handleTogglePermission = (permissionId) => {
    const currentPermissions = formik.values.permission || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((p) => p !== permissionId)
      : [...currentPermissions, permissionId];
    formik.setFieldValue('permission', newPermissions);
  };

  if (!editMode) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 3 }}>
          User Permissions
        </Typography>
        <Chip
          label={`${selectedCount} permission${selectedCount !== 1 ? 's' : ''} assigned`}
          color="primary"
          sx={{ mb: 3 }}
        />
        <Grid container spacing={2}>
          {PERMISSION_CATEGORIES.map((category) => (
            <Grid item xs={12} key={category.label}>
              <Card
                sx={{
                  p: 2,
                  boxShadow: (thm) => thm.shadows[1],
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  {category.label}
                </Typography>
                <Stack direction="row" flexWrap="wrap" spacing={1}>
                  {category.permissions
                    .filter((perm) => formik.values.permission?.includes(perm.id))
                    .map((perm) => (
                      <Chip key={perm.id} label={perm.label} size="small" color="primary" />
                    ))}
                  {category.permissions.filter((perm) =>
                    formik.values.permission?.includes(perm.id)
                  ).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No permissions assigned
                    </Typography>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Manage Permissions</Typography>
        <Chip
          label={`${selectedCount} permission${selectedCount !== 1 ? 's' : ''} selected`}
          color="primary"
          variant="outlined"
        />
      </Stack>

      <TextField
        fullWidth
        placeholder="Search permissions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {filteredCategories.map((category) => {
            const categorySelectedCount = category.permissions.filter((perm) =>
              formik.values.permission?.includes(perm.id)
            ).length;
            const allSelected =
              categorySelectedCount === category.permissions.length && category.permissions.length > 0;

            return (
              <Grid item xs={12} key={category.label}>
                <Card
                  sx={{
                    p: 2.5,
                    boxShadow: (thm) => thm.shadows[2],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {category.label}
                      </Typography>
                      <Chip
                        label={`${categorySelectedCount}/${category.permissions.length}`}
                        size="small"
                        color={allSelected ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </Stack>
                    <Button
                      size="small"
                      variant={allSelected ? 'outlined' : 'contained'}
                      onClick={() => handleSelectAllCategory(category)}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1.5}>
                    {category.permissions.map((perm) => (
                      <Grid item xs={12} sm={6} md={4} key={perm.id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formik.values.permission?.includes(perm.id) || false}
                              onChange={() => handleTogglePermission(perm.id)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ userSelect: 'none' }}>
                              {perm.label}
                            </Typography>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {filteredCategories.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Iconify icon="eva:search-fill" sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No permissions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search query
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

PermissionsTab.propTypes = {
  formik: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
};

