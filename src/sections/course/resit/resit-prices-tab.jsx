import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Card,
  Stack,
  Alert,
  alpha,
  Button,
  Select,
  Checkbox,
  MenuItem,
  useTheme,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  InputAdornment,
} from '@mui/material';

import useActiveSession from 'src/hooks/use-active-session';

import { usePermissions } from 'src/utils/permissions';

import { ResitApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import { GenericTable } from 'src/components/generic-table';

import useResitCatalogue from './use-resit-catalogue';
import { formatPrice, SEMESTER_OPTIONS } from './resit-format';

// ----------------------------------------------------------------------

const EMPTY_FILTERS = { programId: '', classLevelId: '', semester: '' };

const toInput = (value) => (value === null || value === undefined ? '' : String(value));

/** '' clears a price (null); anything else must be a number of zero or more (NaN otherwise). */
const parseAmount = (text) => {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') return null;
  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? amount : NaN;
};

function PriceInput({ value, onChange, changed, invalid, disabled, label }) {
  return (
    <TextField
      size="small"
      type="number"
      value={value}
      placeholder="—"
      disabled={disabled}
      error={invalid}
      onChange={(event) => onChange(event.target.value)}
      // Scrolling the page over a focused box must not change the price
      onWheel={(event) => event.target.blur()}
      inputProps={{ min: 0, step: 'any', 'aria-label': label }}
      InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
      sx={{
        width: 150,
        ...(changed &&
          !invalid && {
            '& .MuiOutlinedInput-root': { bgcolor: (t) => alpha(t.palette.warning.main, 0.08) },
          }),
      }}
    />
  );
}

PriceInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  changed: PropTypes.bool,
  invalid: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
};

/**
 * Resit price of each course: an optional default and an optional price for the session picked
 * in the header (the session price wins). Edits are kept as drafts until saved together.
 */
export default function ResitPricesTab() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const canEdit = check(PERMISSIONS.MANAGE_RESIT_PRICE);
  const { sessionId, session } = useActiveSession();
  const catalogue = useResitCatalogue();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  // courseId -> { row, defaultPrice?, sessionPrice? } (input text); row = the loaded values
  const [drafts, setDrafts] = useState({});
  const [selected, setSelected] = useState([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [serverErrors, setServerErrors] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // A new list starts on its first page with nothing selected
  useEffect(() => {
    setPage(0);
    setSelected([]);
  }, [filters, search, sessionId]);

  // Session prices belong to one session: drafts don't carry over when the header changes
  useEffect(() => {
    setDrafts({});
    setServerErrors([]);
  }, [sessionId]);

  const params = { sessionId, ...filters, search };
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['resit', 'prices', params],
    queryFn: () => ResitApi.getPrices(params),
    placeholderData: keepPreviousData,
  });
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const pageRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const sessionName = session ? session.name || session.code : '';

  const valueOf = (row, field) => {
    const draft = drafts[row.courseId];
    return draft && draft[field] !== undefined ? draft[field] : toInput(row[field]);
  };

  const setValue = (row, field, text) =>
    setDrafts((prev) => ({
      ...prev,
      [row.courseId]: { ...(prev[row.courseId] || { row }), [field]: text },
    }));

  // Changed prices ready to send, and the inputs that can't be saved
  const { changes, invalid } = useMemo(() => {
    const list = [];
    const bad = new Set();
    Object.entries(drafts).forEach(([courseId, draft]) => {
      [
        ['defaultPrice', null],
        ['sessionPrice', sessionId || null],
      ].forEach(([field, priceSession]) => {
        if (draft[field] === undefined) return;
        if (field === 'sessionPrice' && !sessionId) return;
        const amount = parseAmount(draft[field]);
        if (Number.isNaN(amount)) {
          bad.add(`${courseId}:${field}`);
          return;
        }
        if (amount === (draft.row[field] ?? null)) return;
        list.push({ courseId, sessionId: priceSession, amount, field });
      });
    });
    return { changes: list, invalid: bad };
  }, [drafts, sessionId]);

  const changedKeys = useMemo(
    () => new Set(changes.map((c) => `${c.courseId}:${c.field}`)),
    [changes]
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      ResitApi.savePrices(
        changes.map(({ courseId, sessionId: priceSession, amount }) => ({
          courseId,
          sessionId: priceSession,
          amount,
        }))
      ),
    onSuccess: async (result) => {
      // Wait for the fresh prices so the inputs don't flash the old values
      await queryClient.invalidateQueries({ queryKey: ['resit'] });
      setDrafts({});
      setServerErrors([]);
      setSelected([]);
      const saved = result?.saved ?? 0;
      const cleared = result?.cleared ?? 0;
      enqueueSnackbar(`${saved} price(s) saved${cleared ? `, ${cleared} cleared` : ''}`, {
        variant: 'success',
      });
    },
    onError: (saveError) => {
      setServerErrors(Array.isArray(saveError?.data?.errors) ? saveError.data.errors : []);
      enqueueSnackbar(saveError.message || 'Could not save the prices', { variant: 'error' });
    },
  });

  const discard = () => {
    setDrafts({});
    setServerErrors([]);
  };

  const applyToSelected = (field) => {
    if (Number.isNaN(parseAmount(bulkPrice))) return;
    const byId = new Map(rows.map((row) => [String(row.courseId), row]));
    setDrafts((prev) => {
      const next = { ...prev };
      selected.forEach((id) => {
        const row = byId.get(String(id));
        if (row) next[row.courseId] = { ...(next[row.courseId] || { row }), [field]: bulkPrice };
      });
      return next;
    });
  };

  const effectiveOf = (row) => {
    const own = sessionId ? parseAmount(valueOf(row, 'sessionPrice')) : null;
    const fallback = parseAmount(valueOf(row, 'defaultPrice'));
    if (own !== null && !Number.isNaN(own)) return { amount: own, source: 'session' };
    if (fallback !== null && !Number.isNaN(fallback))
      return { amount: fallback, source: 'default' };
    return null;
  };

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const toggleRow = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const columns = [
    ...(canEdit
      ? [
          {
            id: 'select',
            label: (
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={selected.length > 0 && !allSelected}
                disabled={!rows.length}
                onChange={() => setSelected(allSelected ? [] : rows.map((row) => row.courseId))}
                inputProps={{ 'aria-label': 'Select every listed course' }}
              />
            ),
            cellSx: { width: 48 },
            renderCell: (row) => (
              <Checkbox
                size="small"
                checked={selected.includes(row.courseId)}
                onChange={() => toggleRow(row.courseId)}
                inputProps={{ 'aria-label': `Select ${row.code}` }}
              />
            ),
          },
        ]
      : []),
    {
      id: 'course',
      label: 'Course',
      renderCell: (row) => (
        <Stack sx={{ minWidth: 180 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="subtitle2" noWrap>
              {row.code}
            </Typography>
            {!row.isActive && <Label color="default">Inactive</Label>}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'classLevel',
      label: 'Class level',
      renderCell: (row) => (
        <Stack>
          <Typography variant="body2" noWrap>
            {row.classLevel?.name || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.semester || ''}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'defaultPrice',
      label: 'Default price',
      renderCell: (row) =>
        canEdit ? (
          <PriceInput
            label={`${row.code} default price`}
            value={valueOf(row, 'defaultPrice')}
            onChange={(text) => setValue(row, 'defaultPrice', text)}
            changed={changedKeys.has(`${row.courseId}:defaultPrice`)}
            invalid={invalid.has(`${row.courseId}:defaultPrice`)}
          />
        ) : (
          formatPrice(row.defaultPrice)
        ),
    },
    {
      id: 'sessionPrice',
      label: sessionName ? `${sessionName} price` : 'Session price',
      renderCell: (row) => {
        if (!sessionId) return '—';
        return canEdit ? (
          <PriceInput
            label={`${row.code} ${sessionName} price`}
            value={valueOf(row, 'sessionPrice')}
            onChange={(text) => setValue(row, 'sessionPrice', text)}
            changed={changedKeys.has(`${row.courseId}:sessionPrice`)}
            invalid={invalid.has(`${row.courseId}:sessionPrice`)}
          />
        ) : (
          formatPrice(row.sessionPrice)
        );
      },
    },
    {
      id: 'effective',
      label: 'Effective price',
      renderCell: (row) => {
        const effective = effectiveOf(row);
        if (!effective) {
          return (
            <Typography variant="caption" color="text.secondary">
              No price: can&apos;t be registered
            </Typography>
          );
        }
        return (
          <Stack>
            <Typography variant="subtitle2">{formatPrice(effective.amount)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {effective.source === 'session' ? `${sessionName} price` : 'Default price'}
            </Typography>
          </Stack>
        );
      },
    },
  ];

  const filterSelect = (key, label, options, minWidth = 180) => (
    <FormControl size="small" sx={{ minWidth }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={filters[key]}
        label={label}
        onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
      >
        <MenuItem value="">All</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const unsaved = changes.length + invalid.size;

  const toolbarActions = canEdit ? (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      {unsaved > 0 && (
        <Typography variant="body2" color={invalid.size ? 'error.main' : 'text.secondary'}>
          {invalid.size
            ? `${invalid.size} price(s) not valid`
            : `${changes.length} unsaved change${changes.length === 1 ? '' : 's'}`}
        </Typography>
      )}
      <Button
        color="inherit"
        onClick={discard}
        disabled={!Object.keys(drafts).length || saveMutation.isPending}
      >
        Discard
      </Button>
      <LoadingButton
        variant="contained"
        loading={saveMutation.isPending}
        disabled={!changes.length || invalid.size > 0}
        onClick={() => saveMutation.mutate()}
      >
        Save prices
      </LoadingButton>
    </Stack>
  ) : null;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {sessionName ? (
          <>
            Prices for <strong>{sessionName}</strong> (the session picked in the header).{' '}
          </>
        ) : null}
        A session price wins over the default. A course with neither can&apos;t be registered for a
        resit, and its resits need no payment.
      </Typography>

      {!sessionId && (
        <Alert severity="info">
          All sessions is picked in the header. Pick a session there to see and set its own prices;
          default prices apply to every session without one.
        </Alert>
      )}

      {serverErrors.length > 0 && (
        <Alert severity="error" onClose={() => setServerErrors([])}>
          Some prices were not saved:
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {serverErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexWrap="wrap"
        useFlexGap
      >
        {filterSelect(
          'programId',
          'Programme',
          catalogue.programmes.map((p) => ({ value: p._id, label: p.name })),
          220
        )}
        {filterSelect(
          'classLevelId',
          'Class level',
          catalogue.classLevels.map((c) => ({ value: c._id, label: c.name }))
        )}
        {filterSelect(
          'semester',
          'Semester',
          SEMESTER_OPTIONS.map((s) => ({ value: s, label: s }))
        )}
        {(filters.programId || filters.classLevelId || filters.semester) && (
          <Button color="inherit" size="small" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </Button>
        )}
      </Stack>

      {canEdit && selected.length > 0 && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
            {selected.length} selected
          </Typography>
          <TextField
            size="small"
            type="number"
            label="Price"
            placeholder="Blank clears"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            onWheel={(e) => e.target.blur()}
            error={Number.isNaN(parseAmount(bulkPrice))}
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
            sx={{ width: { sm: 180 } }}
          />
          <Button
            variant="outlined"
            onClick={() => applyToSelected('defaultPrice')}
            disabled={Number.isNaN(parseAmount(bulkPrice))}
          >
            Set default price
          </Button>
          {sessionId && (
            <Button
              variant="outlined"
              onClick={() => applyToSelected('sessionPrice')}
              disabled={Number.isNaN(parseAmount(bulkPrice))}
            >
              Set {sessionName} price
            </Button>
          )}
          <Button color="inherit" onClick={() => setSelected([])}>
            Clear selection
          </Button>
        </Stack>
      )}

      <Card
        sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}
      >
        <GenericTable
          data={pageRows}
          columns={columns}
          rowIdField="courseId"
          withToolbar
          withPagination
          manualPagination
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          count={rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          minWidth={900}
          toolbarProps={{
            filterName: searchInput,
            onFilterName: (event) => setSearchInput(event.target.value),
            searchPlaceholder: 'Search course code or title...',
            toolbarTitle: `${rows.length.toLocaleString()} course${rows.length === 1 ? '' : 's'}`,
            customActions: toolbarActions,
          }}
        />
      </Card>
    </Stack>
  );
}
