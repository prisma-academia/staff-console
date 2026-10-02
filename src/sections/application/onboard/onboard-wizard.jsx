import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik, setNestedObjectValues } from 'formik';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import {
  listSessions,
  listProgrammes,
  onboardApplicant,
  getApplicationById,
  resendApplicantInvite,
  sendApplicationPaymentLink,
} from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';

import { STEPS, toPayload, REVIEW_STEP, STEP_SCHEMAS, PAYMENT_STEP, INITIAL_VALUES } from './constants';
import { ReviewStep, BioDataStep, ResultsStep, ApplicantStep, ExaminationsStep } from './onboard-steps';

// ----------------------------------------------------------------------

const unwrapList = (result) => result?.data ?? (Array.isArray(result) ? result : []);

export default function OnboardWizard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [created, setCreated] = useState(null); // { application, authorizationUrl, amount, inviteSent, paymentError }

  const { data: programmesResult, isLoading: programmesLoading } = useQuery({
    queryKey: ['app-programmes'],
    queryFn: () => listProgrammes(),
  });
  const { data: sessionsResult } = useQuery({
    queryKey: ['app-sessions'],
    queryFn: () => listSessions(),
  });

  const programmes = useMemo(
    () => unwrapList(programmesResult).filter((p) => p.status !== 'inactive'),
    [programmesResult]
  );
  const activeSession = useMemo(
    () => unwrapList(sessionsResult).find((s) => s.status === 'active'),
    [sessionsResult]
  );

  const formik = useFormik({
    initialValues: INITIAL_VALUES,
    // Only the current step's fields are validated; earlier steps were checked on Next.
    validationSchema: STEP_SCHEMAS[activeStep],
    validateOnMount: false,
    onSubmit: () => {},
  });

  const programme = programmes.find((p) => p._id === formik.values.programme);
  const applicationId = created?.application?._id;

  // Watch for the Paystack webhook flipping the application to paid.
  const { data: liveResult } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => getApplicationById(applicationId),
    enabled: Boolean(applicationId),
    refetchInterval: (query) => ((query.state.data?.data ?? query.state.data)?.status === 'paid' ? false : 5000),
  });
  const live = liveResult?.data ?? liveResult;
  const paid = live?.status === 'paid';

  const submit = useMutation({
    mutationFn: () => onboardApplicant(toPayload(formik.values)),
    onSuccess: (result) => {
      setCreated(result.data);
      setActiveStep(PAYMENT_STEP);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      enqueueSnackbar(`Application ${result.data.application.number} created`, { variant: 'success' });
      if (!result.data.inviteSent) {
        enqueueSnackbar('The invite email could not be sent; use "Resend invite".', { variant: 'warning' });
      }
    },
    onError: (err) => {
      const fieldError = err?.data?.errors?.[0];
      const message = fieldError ? `${fieldError.field}: ${fieldError.message}` : err?.message;
      enqueueSnackbar(message || 'Could not create the application', { variant: 'error' });
    },
  });

  const sendLink = useMutation({
    mutationFn: () => sendApplicationPaymentLink(applicationId),
    onSuccess: (result) => {
      setCreated((c) => ({ ...c, authorizationUrl: result.data.authorizationUrl, paymentError: undefined }));
      enqueueSnackbar(result.message, { variant: result.data?.emailFailed ? 'warning' : 'success' });
    },
    onError: (err) => enqueueSnackbar(err?.message || 'Could not create a payment link', { variant: 'error' }),
  });

  const resendInvite = useMutation({
    mutationFn: () => resendApplicantInvite(applicationId),
    onSuccess: (result) => enqueueSnackbar(result.message, { variant: 'success' }),
    onError: (err) => enqueueSnackbar(err?.message || 'Could not send the invite', { variant: 'error' }),
  });

  const handleNext = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length) {
      formik.setTouched(setNestedObjectValues(errors, true));
      return;
    }
    setActiveStep((step) => step + 1);
  };

  const handleBack = () => setActiveStep((step) => Math.max(0, step - 1));

  const startOver = () => {
    formik.resetForm({ values: INITIAL_VALUES });
    setCreated(null);
    setActiveStep(0);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(created.authorizationUrl);
      enqueueSnackbar('Payment link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Copy failed; open the checkout instead', { variant: 'error' });
    }
  };

  const renderPayment = () => {
    const { application } = created;
    return (
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Iconify icon="eva:checkmark-circle-2-fill" width={32} sx={{ color: 'success.main' }} />
          <Box>
            <Typography variant="h6">Application {application.number}</Typography>
            <Typography variant="body2" color="text.secondary">
              {application.firstName} {application.lastName} · {application.email}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {paid ? (
            <Chip color="success" label="Paid" icon={<Iconify icon="eva:checkmark-fill" />} />
          ) : (
            <Chip color="warning" label="Awaiting payment" icon={<CircularProgress size={14} color="inherit" />} />
          )}
        </Stack>

        <Alert severity={created.inviteSent ? 'success' : 'warning'}>
          {created.inviteSent
            ? `An email was sent to ${application.email} with a link to set a password${created.authorizationUrl ? ' and pay' : ''}.`
            : 'The invite email could not be sent. Resend it, or share the payment link directly.'}
        </Alert>

        {paid ? (
          <Alert severity="success">The application fee has been received. The application is complete.</Alert>
        ) : (
          <>
            <Typography variant="body1">
              Application fee: <strong>₦{Number(created.amount || 0).toLocaleString()}</strong>
            </Typography>
            {created.paymentError && (
              <Alert severity="error">Payment could not be started: {created.paymentError}. Use &quot;Email payment link&quot; to retry.</Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                disabled={!created.authorizationUrl}
                startIcon={<Iconify icon="eva:credit-card-fill" />}
                onClick={() => window.open(created.authorizationUrl, '_blank', 'noopener,noreferrer')}
              >
                Open Paystack checkout
              </Button>
              <Button variant="outlined" disabled={!created.authorizationUrl} startIcon={<Iconify icon="eva:copy-outline" />} onClick={copyLink}>
                Copy link
              </Button>
              <LoadingButton
                variant="outlined"
                loading={sendLink.isPending}
                startIcon={<Iconify icon="eva:email-outline" />}
                onClick={() => sendLink.mutate()}
              >
                Email payment link
              </LoadingButton>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              This page updates automatically once Paystack confirms the payment.
            </Typography>
          </>
        )}

        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          <Button color="inherit" onClick={() => navigate(`/application/${application._id}`)}>
            View application
          </Button>
          <LoadingButton color="inherit" loading={resendInvite.isPending} onClick={() => resendInvite.mutate()}>
            Resend invite
          </LoadingButton>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="inherit" startIcon={<Iconify icon="eva:person-add-outline" />} onClick={startOver}>
            Onboard another
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={3} sx={{ py: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button color="inherit" startIcon={<Iconify icon="eva:arrow-back-fill" />} onClick={() => navigate('/application')}>
            Back to applications
          </Button>
        </Stack>

        <Box>
          <Typography variant="h4" fontWeight={600}>
            Onboard applicant
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the application on the applicant&apos;s behalf. They receive an email to set a password and pay
            the application fee through Paystack.
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel>
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
          {programmesLoading && activeStep === 0 ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {activeStep === 0 && <ApplicantStep formik={formik} programmes={programmes} session={activeSession} />}
              {activeStep === 1 && <BioDataStep formik={formik} />}
              {activeStep === 2 && <ExaminationsStep formik={formik} />}
              {activeStep === 3 && <ResultsStep formik={formik} />}
              {activeStep === REVIEW_STEP && <ReviewStep values={formik.values} programme={programme} session={activeSession} />}
              {activeStep === PAYMENT_STEP && created && renderPayment()}
            </>
          )}

          {activeStep < PAYMENT_STEP && (
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button disabled={activeStep === 0 || submit.isPending} onClick={handleBack}>
                Back
              </Button>
              {activeStep < REVIEW_STEP ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <LoadingButton
                  variant="contained"
                  loading={submit.isPending}
                  disabled={!activeSession}
                  onClick={() => submit.mutate()}
                >
                  Create application
                </LoadingButton>
              )}
            </Stack>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
