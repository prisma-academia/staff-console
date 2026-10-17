import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Divider,
  useTheme,
  TableRow,
  MenuItem,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  LinearProgress,
  TableContainer,
} from '@mui/material';

import useActiveSession from 'src/hooks/use-active-session';

import { FeeApi, paymentApi, StudentApi } from 'src/api';

import Iconify from 'src/components/iconify';
import ExportMenu from 'src/components/export/export-menu';

const statusColors = {
  active: 'success',
  pending: 'warning',
  disable: 'error',
  Completed: 'success',
  Processing: 'warning',
  Failed: 'error',
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
};

const ALL_SESSIONS = 'all';

// ----------------------------------------------------------------------

function SummaryTile({ label, value, color, caption }) {
  return (
    <Box sx={{ flex: 1, minWidth: 160, p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" color={color ? `${color}.main` : 'text.primary'} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Box>
  );
}

SummaryTile.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
  color: PropTypes.string,
  caption: PropTypes.node,
};

function FeeTypeRow({ row }) {
  const share = row.expected > 0 ? Math.min(100, (row.outstanding / row.expected) * 100) : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2} sx={{ mb: 0.75 }}>
        <Typography variant="subtitle2">{row.feeType}</Typography>
        <Typography variant="body2" color={row.outstanding > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 600 }}>
          {row.outstanding > 0 ? `${formatCurrency(row.outstanding)} outstanding` : 'Fully paid'}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={share}
        color={row.outstanding > 0 ? 'error' : 'success'}
        aria-label={`${row.feeType}: ${Math.round(share)}% outstanding`}
        sx={{ height: 8, borderRadius: 1 }}
      />
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
        {formatCurrency(row.paid)} paid of {formatCurrency(row.expected)}
        {row.unpaidCount > 0 ? ` · ${row.unpaidCount} unpaid fee${row.unpaidCount === 1 ? '' : 's'}` : ''}
      </Typography>
    </Box>
  );
}

FeeTypeRow.propTypes = {
  row: PropTypes.object.isRequired,
};

// ----------------------------------------------------------------------

export default function PaymentsTab({ student }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState('');
  // null until the user picks one: follows the header's active session ('' there means all).
  const [feeSession, setFeeSession] = useState(null);

  const studentId = student?._id;
  const paymentHistory = useMemo(() => student?.payments || [], [student]);

  const { sessionId, sessions } = useActiveSession();
  const selectedSession = feeSession ?? (sessionId || ALL_SESSIONS);

  const { data: fees = [] } = useQuery({
    queryKey: ['fees', 'options', sessionId],
    queryFn: () => FeeApi.getFees({ session: sessionId }),
    enabled: createModalOpen,
  });
  const feeList = Array.isArray(fees) ? fees : (fees?.data ?? []);

  const {
    data: statement,
    isLoading: statementLoading,
    error: statementError,
  } = useQuery({
    queryKey: ['student-fees', studentId, selectedSession],
    queryFn: () => StudentApi.getStudentFees(studentId, selectedSession),
    enabled: Boolean(studentId),
  });

  const summary = statement?.summary;
  const totals = summary?.totals || { expected: 0, paid: 0, outstanding: 0 };
  const byFeeType = summary?.byFeeType || [];
  const bySession = summary?.bySession || [];
  const unpaidFees = useMemo(() => (statement?.fees || []).filter((fee) => !fee.isPaid), [statement]);

  const sessionName = useMemo(() => {
    const names = new Map(sessions.map((s) => [s._id, s.name || s.code]));
    return (id) => (id ? names.get(typeof id === 'object' ? id._id : id) : null);
  }, [sessions]);

  const { mutate: initializePayment, isPending: isInitializing } = useMutation({
    mutationFn: (body) => paymentApi.initializePaymentForStudent(body),
    onSuccess: (data) => {
      const url = data?.authorizationUrl;
      if (url) {
        setCreateModalOpen(false);
        setSelectedFeeId('');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['student', student?._id] });
        queryClient.invalidateQueries({ queryKey: ['student-fees', student?._id] });
        window.open(url, '_blank', 'noopener,noreferrer');
        enqueueSnackbar('Payment page opened in a new tab.', { variant: 'success' });
      } else {
        enqueueSnackbar('No payment URL returned', { variant: 'error' });
      }
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to initialize payment', { variant: 'error' });
    },
  });

  const handleCreatePayment = () => {
    if (!student?._id || !selectedFeeId) {
      enqueueSnackbar('Please select a fee', { variant: 'warning' });
      return;
    }
    initializePayment({
      studentId: student._id,
      feeId: selectedFeeId,
      gateway: 'Paystack',
    });
  };

  const fetchPaymentRows = async () => ({
    columns: [
      { key: 'description', label: 'Description' },
      { key: 'feeType', label: 'Fee Type' },
      { key: 'session', label: 'Session' },
      { key: 'amount', label: 'Amount (NGN)' },
      { key: 'date', label: 'Date' },
      { key: 'reference', label: 'Reference' },
      { key: 'status', label: 'Status' },
    ],
    rows: paymentHistory.map((payment) => ({
      description: payment.description || '',
      feeType: payment.fee?.feeType || '',
      session: sessionName(payment.session || payment.fee?.session) || '',
      amount: payment.amount ?? '',
      date: payment.createdAt ? new Date(payment.createdAt).toISOString().slice(0, 10) : '',
      reference: payment.reference || '',
      status: payment.status || '',
    })),
  });

  const studentLabel = student?.regNumber || [student?.personalInfo?.firstName, student?.personalInfo?.lastName].filter(Boolean).join(' ');
  const scopeLabel = selectedSession === ALL_SESSIONS ? 'All sessions' : sessionName(selectedSession) || 'Selected session';

  return (
    <Card sx={{ boxShadow: theme.shadows[2] }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 3, py: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="mdi:cash" color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={600}>
            Fees &amp; Payments
          </Typography>
        </Stack>

        <TextField
          select
          size="small"
          label="Session"
          value={selectedSession}
          onChange={(e) => setFeeSession(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value={ALL_SESSIONS}>All sessions</MenuItem>
          {sessions.map((s) => (
            <MenuItem key={s._id} value={s._id}>
              {s.name || s.code}
              {s.isCurrent ? ' (current)' : ''}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Divider />

      <Box sx={{ p: 3 }}>
        {statementError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {statementError?.message || 'Could not load fees'}
          </Alert>
        )}

        {statementLoading ? (
          <Stack direction="row" spacing={2}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={88} sx={{ flex: 1 }} />
            ))}
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <SummaryTile label="Expected" value={formatCurrency(totals.expected)} caption={scopeLabel} />
            <SummaryTile label="Paid" value={formatCurrency(totals.paid)} color="success" />
            <SummaryTile
              label="Outstanding"
              value={formatCurrency(totals.outstanding)}
              color={totals.outstanding > 0 ? 'error' : 'success'}
              caption={unpaidFees.length ? `${unpaidFees.length} unpaid fee${unpaidFees.length === 1 ? '' : 's'}` : 'Nothing owed'}
            />
          </Stack>
        )}

        {!statementLoading && byFeeType.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              By fee type
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              {byFeeType.map((row) => (
                <FeeTypeRow key={row.feeType} row={row} />
              ))}
            </Box>
          </Box>
        )}

        {!statementLoading && selectedSession === ALL_SESSIONS && bySession.length > 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              By session
            </Typography>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell align="right">Expected</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bySession.map((row) => (
                    <TableRow key={row.session?._id || 'none'}>
                      <TableCell>{row.session?.name || 'No session'}</TableCell>
                      <TableCell align="right">{formatCurrency(row.expected)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.paid)}</TableCell>
                      <TableCell align="right" sx={{ color: row.outstanding > 0 ? 'error.main' : 'text.primary', fontWeight: 600 }}>
                        {formatCurrency(row.outstanding)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {!statementLoading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
              Unpaid fees
            </Typography>
            {unpaidFees.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No unpaid fees for {scopeLabel.toLowerCase()}.
              </Typography>
            ) : (
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fee</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Due date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unpaidFees.map((fee) => (
                      <TableRow key={fee._id}>
                        <TableCell>
                          <Typography variant="body2">{fee.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fee.feeType}
                          </Typography>
                        </TableCell>
                        <TableCell>{fee.session?.name || 'No session'}</TableCell>
                        <TableCell>{formatDate(fee.dueDate)}</TableCell>
                        <TableCell align="right">{formatCurrency(fee.amount)}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={fee.isOverdue ? 'Overdue' : 'Due'}
                            color={fee.isOverdue ? 'error' : 'warning'}
                            variant={fee.isOverdue ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Box>
      <Divider />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 3, py: 2 }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Payment History
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<Iconify icon="mdi:plus" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create payment
          </Button>
          <ExportMenu
            fetchRows={fetchPaymentRows}
            title={`Payments${studentLabel ? ` - ${studentLabel}` : ''}`}
            fileBase={`payments-${String(studentLabel || 'student').replace(/[^\w.-]+/g, '-')}`}
            count={paymentHistory.length}
            disabled={paymentHistory.length === 0}
          />
        </Stack>
      </Stack>
      <Divider />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
              <TableCell>Description</TableCell>
              <TableCell>Fee Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Date</TableCell>
              <TableCell align="center">Reference</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentHistory && paymentHistory.length > 0 ? (
              paymentHistory.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{payment.fee?.feeType || 'N/A'}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell align="center">{formatDate(payment.createdAt)}</TableCell>
                  <TableCell align="center">{payment.reference || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={payment.status?.toUpperCase() || 'N/A'}
                      color={statusColors[payment.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No payment records found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createModalOpen} onClose={() => !isInitializing && setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a fee to initialize payment. You will be redirected to the payment gateway to complete the transaction.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="create-payment-fee-label">Fee</InputLabel>
            <Select
              labelId="create-payment-fee-label"
              label="Fee"
              value={selectedFeeId}
              onChange={(e) => setSelectedFeeId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select fee</em>
              </MenuItem>
              {feeList.map((fee) => (
                <MenuItem key={fee._id} value={fee._id}>
                  {fee.name} — ₦{typeof fee.amount === 'number' ? fee.amount.toLocaleString() : fee.amount}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} disabled={isInitializing}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleCreatePayment}
            loading={isInitializing}
            disabled={!selectedFeeId}
          >
            Continue to payment
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

PaymentsTab.propTypes = {
  student: PropTypes.object,
};
