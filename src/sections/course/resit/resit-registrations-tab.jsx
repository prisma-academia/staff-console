import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import {
  Card,
  Chip,
  Menu,
  Stack,
  Alert,
  alpha,
  Button,
  Select,
  Tooltip,
  MenuItem,
  useTheme,
  TextField,
  InputLabel,
  Typography,
  IconButton,
  FormControl,
  Autocomplete,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';
import useActiveSession from 'src/hooks/use-active-session';

import { usePermissions } from 'src/utils/permissions';

import { ResitApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import { formatDate, formatCurrency } from 'src/sections/fee/fee-format';

import useResitCatalogue from './use-resit-catalogue';
import { resitState, RESIT_STATES } from './resit-format';
import { WaiveResitDialog, CancelResitDialog } from './resit-action-dialogs';

// ----------------------------------------------------------------------

// sessionId: '' follows the header's session, 'all' lists every session
const FILTER_KEYS = ['sessionId', 'courseId', 'state'];
const ALL_SESSIONS = 'all';

/** Opens the resit score sheet for one of a paid registration's courses (a menu when it has several). */
function RecordScoreButton({ courses, onPick }) {
  const [anchorEl, setAnchorEl] = useState(null);
  if (!courses.length) return null;
  const pick = (course) => {
    setAnchorEl(null);
    onPick(course._id);
  };
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        startIcon={<Iconify icon="mdi:restore" width={16} />}
        onClick={(e) => (courses.length === 1 ? pick(courses[0]) : setAnchorEl(e.currentTarget))}
        sx={{ whiteSpace: 'nowrap' }}
      >
        Record score
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {courses.map((course) => (
          <MenuItem key={course._id} onClick={() => pick(course)}>
            {course.code} · {course.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

RecordScoreButton.propTypes = {
  courses: PropTypes.array.isRequired,
  onPick: PropTypes.func.isRequired,
};

/**
 * Students' resit registrations with their payment state. Unpaid ones can be waived or
 * cancelled; paid and waived ones open the resit score sheet for their courses.
 */
export default function ResitRegistrationsTab({ onRecordScores }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { check } = usePermissions();
  const canManage = check(PERMISSIONS.MANAGE_RESIT);
  const canViewStudent = check(PERMISSIONS.VIEW_STUDENT);
  const canRecord = check(PERMISSIONS.REVISE_RESULT) && Boolean(onRecordScores);
  const { sessionId: activeSessionId, sessions } = useActiveSession();
  const catalogue = useResitCatalogue();
  const [waiving, setWaiving] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const table = useServerTable({ filterKeys: FILTER_KEYS, defaultRowsPerPage: 25 });
  const { filters, search, setFilter, clearFilters } = table;

  const sessionValue = filters.sessionId || activeSessionId || ALL_SESSIONS;
  const params = {
    sessionId: sessionValue === ALL_SESSIONS ? '' : sessionValue,
    courseId: filters.courseId,
    state: filters.state,
    search,
    page: table.page + 1,
    limit: table.rowsPerPage,
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['resit', 'registrations', params],
    queryFn: () => ResitApi.getRegistrations(params),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const counts = data?.counts || {};
  const amounts = data?.amounts || { collected: 0, outstanding: 0 };

  const changeSession = (value) =>
    setFilter('sessionId', value === (activeSessionId || ALL_SESSIONS) ? '' : value);

  const toggleState = (value) => setFilter('state', filters.state === value ? '' : value);

  const columns = [
    {
      id: 'student',
      label: 'Student',
      renderCell: (row) => (
        <Stack sx={{ minWidth: 150 }}>
          <Typography variant="subtitle2" noWrap>
            {row.student?.name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.student?.regNumber || '—'}
            {sessionValue === ALL_SESSIONS && row.session?.name ? ` · ${row.session.name}` : ''}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'courses',
      label: 'Courses',
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ maxWidth: 260 }}>
          {(row.courses || []).map((entry) => (
            <Tooltip
              key={entry.course?._id || entry.result}
              title={[
                entry.course?.name,
                formatCurrency(entry.amount),
                entry.used ? `resit score recorded ${formatDate(entry.usedAt)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              <Chip
                size="small"
                label={entry.course?.code || 'Course'}
                variant={entry.used ? 'filled' : 'outlined'}
                color={entry.used ? 'success' : 'default'}
                icon={entry.used ? <Iconify icon="eva:checkmark-fill" width={14} /> : undefined}
              />
            </Tooltip>
          ))}
        </Stack>
      ),
    },
    {
      id: 'total',
      label: 'Total',
      align: 'right',
      renderCell: (row) => formatCurrency(row.total),
    },
    {
      id: 'state',
      label: 'State',
      renderCell: (row) => {
        const state = resitState(row.state);
        return (
          <Stack spacing={0.5} alignItems="flex-start">
            <Tooltip title={row.state === 'waived' && row.waiveReason ? row.waiveReason : ''}>
              <Label color={state.color}>{state.label}</Label>
            </Tooltip>
            {row.state === 'pending_payment' && row.paymentStarted && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Checkout started
              </Typography>
            )}
            {row.state === 'waived' && row.waivedAt && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {formatDate(row.waivedAt)}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      id: 'payment',
      label: 'Payment',
      renderCell: (row) =>
        row.payment ? (
          <Stack>
            <Typography
              variant="body2"
              noWrap
              title={row.payment.reference || ''}
              sx={{ maxWidth: 180 }}
            >
              {row.payment.reference || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {formatDate(row.payment.paidAt)}
            </Typography>
          </Stack>
        ) : (
          '—'
        ),
    },
    {
      id: 'createdBy',
      label: 'Registered by',
      renderCell: (row) => (row.createdByType === 'student' ? 'Student' : 'Staff'),
    },
    {
      id: 'createdAt',
      label: 'Date',
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
    ...(canManage || canRecord
      ? [
          {
            id: 'action',
            label: '',
            align: 'right',
            renderCell: (row) => {
              if ((row.state === 'paid' || row.state === 'waived') && canRecord) {
                const waiting = (row.courses || [])
                  .filter((entry) => !entry.used && entry.course?._id)
                  .map((entry) => entry.course);
                return <RecordScoreButton courses={waiting} onPick={onRecordScores} />;
              }
              return row.state === 'pending_payment' && canManage ? (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Waive the fee">
                    <IconButton size="small" onClick={() => setWaiving(row)}>
                      <Iconify icon="mdi:hand-coin-outline" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel registration">
                    <IconButton size="small" color="error" onClick={() => setCancelling(row)}>
                      <Iconify icon="eva:close-circle-outline" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : null;
            },
          },
        ]
      : []),
  ];

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexWrap="wrap"
        useFlexGap
      >
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Session</InputLabel>
          <Select
            value={sessionValue}
            label="Session"
            onChange={(e) => changeSession(e.target.value)}
          >
            <MenuItem value={ALL_SESSIONS}>All sessions</MenuItem>
            {sessions.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name || s.code}
                {s.isCurrent ? ' (current)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          value={catalogue.courses.find((course) => course.courseId === filters.courseId) || null}
          options={catalogue.courses}
          loading={catalogue.isLoading}
          getOptionLabel={(course) => `${course.code} · ${course.name}`}
          isOptionEqualToValue={(a, b) => a.courseId === b.courseId}
          onChange={(_, course) => setFilter('courseId', course ? course.courseId : '')}
          renderInput={(inputParams) => (
            <TextField {...inputParams} label="Course" placeholder="All courses" />
          )}
          sx={{ minWidth: 300 }}
        />
        {table.hasActiveFilters && (
          <Button color="inherit" size="small" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        {RESIT_STATES.map((state) => (
          <Chip
            key={state.value}
            label={`${state.label} · ${(counts[state.value] || 0).toLocaleString()}`}
            color={state.color}
            variant={filters.state === state.value ? 'filled' : 'outlined'}
            onClick={() => toggleState(state.value)}
          />
        ))}
        <Chip
          icon={<Iconify icon="eva:checkmark-circle-2-outline" width={18} />}
          label={`Collected ${formatCurrency(amounts.collected)}`}
          sx={{ bgcolor: alpha(theme.palette.success.main, 0.12) }}
        />
        <Chip
          icon={<Iconify icon="eva:clock-outline" width={18} />}
          label={`Outstanding ${formatCurrency(amounts.outstanding)}`}
          sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12) }}
        />
      </Stack>

      {data?.truncated && (
        <Alert severity="warning">
          Only the newest registrations are counted. Narrow the filters to see the rest.
        </Alert>
      )}

      <Card
        sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}
      >
        <GenericTable
          data={rows}
          columns={columns}
          rowIdField="_id"
          withToolbar
          withPagination
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          count={total}
          {...table.tableProps}
          onSortChange={null}
          minWidth={1000}
          onRowClick={
            canViewStudent
              ? (row) => row.student?._id && navigate(`/student/${row.student._id}`)
              : null
          }
          toolbarProps={{
            ...table.searchProps,
            searchPlaceholder: 'Search reg number or name...',
            toolbarTitle: `${total.toLocaleString()} registration${total === 1 ? '' : 's'}`,
          }}
        />
      </Card>

      <WaiveResitDialog registration={waiving} onClose={() => setWaiving(null)} />
      <CancelResitDialog registration={cancelling} onClose={() => setCancelling(null)} />
    </Stack>
  );
}

ResitRegistrationsTab.propTypes = {
  onRecordScores: PropTypes.func,
};
