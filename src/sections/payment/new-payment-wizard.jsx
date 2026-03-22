import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import Container from '@mui/material/Container';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import { alpha, useTheme } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { FeeApi, paymentApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STEPS = ['Details', 'Preview'];

const IMPLEMENTED_GATEWAYS = new Set(['Paystack']);

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const studentLabel = (s) => {
  if (!s) return '';
  const reg = s.regNumber || '';
  const name = [s.personalInfo?.firstName, s.personalInfo?.lastName].filter(Boolean).join(' ');
  return name ? `${reg} — ${name}` : reg || s._id;
};

const studentEmail = (s) => s?.email || s?.contactInfo?.email || '—';

export default function NewPaymentWizard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [feeId, setFeeId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gateway, setGateway] = useState('Paystack');

  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: FeeApi.getFees,
  });
  const feeList = useMemo(
    () => (Array.isArray(feesData) ? feesData : (feesData?.data ?? [])),
    [feesData]
  );

  const selectedFee = useMemo(
    () => feeList.find((f) => f._id === feeId) || null,
    [feeList, feeId]
  );

  const feeGatewayOptions = useMemo(() => {
    const g = selectedFee?.gateway;
    if (Array.isArray(g) && g.length) return g;
    return ['Paystack'];
  }, [selectedFee]);

  const {
    data: eligibleStudents = [],
    isLoading: eligibleLoading,
    isError: eligibleError,
    error: eligibleErr,
  } = useQuery({
    queryKey: ['fee-eligible-students', feeId],
    queryFn: () => FeeApi.getEligibleStudentsForPayment(feeId),
    enabled: Boolean(feeId),
  });

  const list = useMemo(
    () => (Array.isArray(eligibleStudents) ? eligibleStudents : []),
    [eligibleStudents]
  );

  const selectedStudent = useMemo(
    () => list.find((s) => s._id === studentId) || null,
    [list, studentId]
  );

  useEffect(() => {
    if (!selectedFee) return;
    const firstImplemented = feeGatewayOptions.find((g) => IMPLEMENTED_GATEWAYS.has(g));
    if (firstImplemented) {
      setGateway(firstImplemented);
    } else {
      setGateway(feeGatewayOptions[0] || 'Paystack');
    }
  }, [selectedFee, feeGatewayOptions]);

  useEffect(() => {
    setStudentId('');
  }, [feeId]);

  const { mutate: initializePayment, isPending: isInitializing } = useMutation({
    mutationFn: (body) => paymentApi.initializePaymentForStudent(body),
    onSuccess: (result) => {
      const url = result?.authorizationUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        const payer = result?.payment?.student;
        if (payer) {
          const uid = typeof payer === 'object' ? payer._id : payer;
          if (uid) queryClient.invalidateQueries({ queryKey: ['student', uid] });
        }
        enqueueSnackbar('Payment page opened in a new tab.', { variant: 'success' });
        navigate('/payment');
      } else {
        enqueueSnackbar('No payment URL returned', { variant: 'error' });
      }
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to initialize payment', { variant: 'error' });
    },
  });

  const canGoNext = () => {
    if (activeStep === 0) {
      return Boolean(
        feeId &&
          studentId &&
          IMPLEMENTED_GATEWAYS.has(gateway) &&
          selectedFee &&
          selectedStudent
      );
    }
    return true;
  };

  const handleNext = () => {
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const handleConfirm = () => {
    if (!feeId || !studentId) return;
    initializePayment({
      studentId,
      feeId,
      gateway,
    });
  };

  const renderStudentStep = () => {
    if (!feeId) {
      return <Alert severity="info">Select a fee first.</Alert>;
    }
    if (eligibleLoading) {
      return (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={32} />
        </Box>
      );
    }
    if (eligibleError) {
      return (
        <Alert severity="error">
          {eligibleErr?.message || 'Could not load eligible students'}
        </Alert>
      );
    }
    if (list.length === 0) {
      return (
        <Alert severity="warning">
          No eligible students for this fee (targeting, active status, email on file, or all have
          completed this fee).
        </Alert>
      );
    }
    return (
      <TextField
        select
        fullWidth
        label="Select student"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        size="small"
      >
        <MenuItem value="">
          <em>Choose a student</em>
        </MenuItem>
        {list.map((s) => (
          <MenuItem key={s._id} value={s._id}>
            {studentLabel(s)}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  const programName =
    typeof selectedStudent?.program === 'object' ? selectedStudent.program?.name : '—';
  const className =
    typeof selectedStudent?.classLevel === 'object'
      ? selectedStudent.classLevel?.name
      : '—';

  return (
    <Container maxWidth="md">
      <Stack spacing={3} sx={{ py: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            color="inherit"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={() => navigate('/payment')}
          >
            Back to payments
          </Button>
        </Stack>

        <Box>
          <Typography variant="h4" fontWeight={600}>
            New payment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter fee, student, and gateway on the first step, review on the second, then confirm to open
            checkout in a new tab.
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card
          sx={{
            p: 3,
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
              0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          {activeStep === 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Payment details
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Fee
              </Typography>
              {feesLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <TextField
                  select
                  fullWidth
                  label="Select fee"
                  value={feeId}
                  onChange={(e) => setFeeId(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">
                    <em>Choose a fee</em>
                  </MenuItem>
                  {feeList.map((fee) => (
                    <MenuItem key={fee._id} value={fee._id}>
                      {fee.name} — {formatCurrency(fee.amount)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Student
              </Typography>
              {renderStudentStep()}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Payment gateway
              </Typography>
              <FormControl>
                <FormLabel id="gateway-radio-label">Gateway</FormLabel>
                <RadioGroup
                  aria-labelledby="gateway-radio-label"
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                >
                  {feeGatewayOptions.map((g) => {
                    const implemented = IMPLEMENTED_GATEWAYS.has(g);
                    return (
                      <FormControlLabel
                        key={g}
                        value={g}
                        control={<Radio disabled={!implemented} />}
                        label={implemented ? g : `${g} (not configured)`}
                        disabled={!implemented}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>
              {!feeGatewayOptions.some((g) => IMPLEMENTED_GATEWAYS.has(g)) && (
                <Alert severity="error">
                  This fee has no supported payment gateway. Add Paystack to the fee or contact an
                  administrator.
                </Alert>
              )}
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Review
              </Typography>
              <Divider />
              <Typography variant="overline" color="text.secondary">
                Fee
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedFee?.name || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> {formatCurrency(selectedFee?.amount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Due:</strong> {formatDate(selectedFee?.dueDate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedFee?.feeType || '—'}
                </Typography>
                {selectedFee?.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {selectedFee.description}
                  </Typography>
                ) : null}
                {Array.isArray(selectedFee?.items) && selectedFee.items.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Line items
                    </Typography>
                    <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                      {selectedFee.items.map((item, idx) => (
                        <Typography key={idx} component="li" variant="body2">
                          {item.name} × {item.quantity} @ {formatCurrency(item.price)}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Typography variant="overline" color="text.secondary">
                Student
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Name:</strong>{' '}
                  {selectedStudent
                    ? [selectedStudent.personalInfo?.firstName, selectedStudent.personalInfo?.lastName]
                        .filter(Boolean)
                        .join(' ') || '—'
                    : '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Reg. no.:</strong> {selectedStudent?.regNumber || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Email (checkout):</strong> {studentEmail(selectedStudent)}
                </Typography>
                <Typography variant="body2">
                  <strong>Program:</strong> {programName}
                </Typography>
                <Typography variant="body2">
                  <strong>Class level:</strong> {className}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                <strong>Gateway:</strong> {gateway}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button disabled={activeStep === 0 || isInitializing} onClick={handleBack}>
              Back
            </Button>
            {activeStep < STEPS.length - 1 ? (
              <Button variant="contained" onClick={handleNext} disabled={!canGoNext()}>
                Next
              </Button>
            ) : (
              <LoadingButton
                variant="contained"
                onClick={handleConfirm}
                loading={isInitializing}
                disabled={
                  !feeId ||
                  !studentId ||
                  !IMPLEMENTED_GATEWAYS.has(gateway) ||
                  !selectedFee ||
                  !selectedStudent
                }
              >
                Confirm & open payment
              </LoadingButton>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
