import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { Box, Chip, Stack, TextField } from '@mui/material';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/old-select/select';

import { ACTOR_TYPES, ENTITY_TYPES, ACTION_TYPES, STATUS_TYPES } from './utils';

// ----------------------------------------------------------------------

export default function AuditTableToolbar({
  numSelected,
  filterName,
  onFilterName,
  entityType,
  onEntityTypeChange,
  actionType,
  onActionTypeChange,
  status,
  onStatusChange,
  actorType,
  onActorTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
}) {
  const entityTypeOptions = ENTITY_TYPES.map((type) => ({
    name: type,
    value: type,
  }));

  const actionTypeOptions = ACTION_TYPES.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: type,
  }));

  const statusOptions = STATUS_TYPES.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: type,
  }));

  const actorTypeOptions = ACTOR_TYPES.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: type,
  }));

  const hasActiveFilters = entityType || actionType || status || actorType || startDate || endDate;

  return (
    <Toolbar
      sx={{
        height: 'auto',
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(2, 1, 1, 3),
        gap: 2,
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography component="div" variant="subtitle1">
            {numSelected} selected
          </Typography>
        </Box>
      ) : (
        <>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
            <OutlinedInput
              value={filterName}
              onChange={onFilterName}
              placeholder="Search audit logs..."
              startAdornment={
                <InputAdornment position="start">
                  <Iconify
                    icon="eva:search-fill"
                    sx={{ color: 'text.disabled', width: 20, height: 20 }}
                  />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: 250, maxWidth: 400 }}
            />

            <Box sx={{ width: 180 }}>
              <CustomSelect
                list={entityTypeOptions}
                value={entityType || ''}
                setValue={onEntityTypeChange}
                label="Entity Type"
              />
            </Box>

            <Box sx={{ width: 150 }}>
              <CustomSelect
                list={actionTypeOptions}
                value={actionType || ''}
                setValue={onActionTypeChange}
                label="Action Type"
              />
            </Box>

            <Box sx={{ width: 150 }}>
              <CustomSelect
                list={statusOptions}
                value={status || ''}
                setValue={onStatusChange}
                label="Status"
              />
            </Box>

            <Box sx={{ width: 150 }}>
              <CustomSelect
                list={actorTypeOptions}
                value={actorType || ''}
                setValue={onActorTypeChange}
                label="Actor Type"
              />
            </Box>

            <TextField
              type="date"
              label="Start Date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
            />

            <TextField
              type="date"
              label="End Date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
            />

            {hasActiveFilters && (
              <Tooltip title="Clear all filters">
                <IconButton onClick={onClearFilters} color="error">
                  <Iconify icon="eva:close-circle-fill" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {hasActiveFilters && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Active filters:
              </Typography>
              {entityType && (
                <Chip
                  label={`Entity: ${entityType}`}
                  size="small"
                  onDelete={() => onEntityTypeChange('')}
                />
              )}
              {actionType && (
                <Chip
                  label={`Action: ${actionType}`}
                  size="small"
                  onDelete={() => onActionTypeChange('')}
                />
              )}
              {status && (
                <Chip
                  label={`Status: ${status}`}
                  size="small"
                  onDelete={() => onStatusChange('')}
                />
              )}
              {actorType && (
                <Chip
                  label={`Actor: ${actorType}`}
                  size="small"
                  onDelete={() => onActorTypeChange('')}
                />
              )}
              {startDate && (
                <Chip
                  label={`From: ${startDate}`}
                  size="small"
                  onDelete={() => onStartDateChange('')}
                />
              )}
              {endDate && (
                <Chip
                  label={`To: ${endDate}`}
                  size="small"
                  onDelete={() => onEndDateChange('')}
                />
              )}
            </Stack>
          )}
        </>
      )}
    </Toolbar>
  );
}

AuditTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  entityType: PropTypes.string,
  onEntityTypeChange: PropTypes.func,
  actionType: PropTypes.string,
  onActionTypeChange: PropTypes.func,
  status: PropTypes.string,
  onStatusChange: PropTypes.func,
  actorType: PropTypes.string,
  onActorTypeChange: PropTypes.func,
  startDate: PropTypes.string,
  onStartDateChange: PropTypes.func,
  endDate: PropTypes.string,
  onEndDateChange: PropTypes.func,
  onClearFilters: PropTypes.func,
};
