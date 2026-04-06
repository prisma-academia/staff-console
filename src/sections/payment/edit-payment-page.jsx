import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { paymentApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_VALUES = ['Pending', 'Completed', 'Failed', 'Overdue', 'Abandoned'];

const GATEWAY_OPTIONS = ['Paystack', 'Flutterwave', 'Paypal', 'Stripe'];

const validationSchema = Yup.object({
  amount: Yup.number()
    .typeError('Amount must be a number')
    .required('Amount is required')
    .min(0, 'Amount cannot be negative'),
  description: Yup.string().required('Description is required').trim(),
  status: Yup.string()
    .required('Status is required')
    .oneOf(STATUS_VALUES, 'Invalid status'),
  gateway: Yup.string().trim(),
  reference: Yup.string().trim(),
});

const refId = (x) => {
  if (x == null) return '';
  const id = typeof x === 'object' && x !== null ? x._id : x;
  return id != null ? String(id) : '';
};

const getStudentName = (payment) => {
  const student = payment?.student;
  if (!student) return '—';
  if (typeof student === 'string') return student;
  const fullName = [
    student?.personalInfo?.firstName,
    student?.personalInfo?.middleName,
    student?.personalInfo?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || student?.email || '—';
};

const getFeeName = (payment) => {
  if (!payment?.fee) return '—';
  if (typeof payment.fee === 'string') return payment.fee;
  return payment.fee?.name || '—';
};

function ReadOnlyContext({ payment }) {
  const student = payment?.student;
  const studentId = typeof student === 'object' ? refId(student) : '';

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Linked records (read-only)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Student
          </Typography>
          <Typography variant="body2">
            {studentId ? (
              <Link to={`/student/${studentId}`} style={{ color: 'inherit' }}>
                {getStudentName(payment)}
              </Link>
            ) : (
              getStudentName(payment)
            )}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Fee
          </Typography>
          <Typography variant="body2">{getFeeName(payment)}</Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

ReadOnlyContext.propTypes = {
  payment: PropTypes.object,
};

export default function EditPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentApi.getPaymentById(id),
    enabled: Boolean(id),
  });

  const { mutateAsync: savePayment, isPending: isSaving } = useMutation({
    mutationFn: (payload) => paymentApi.updatePayment(id, payload),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      amount: payment?.amount ?? '',
      description: payment?.description ?? '',
      status: payment?.status ?? 'Pending',
      gateway: payment?.gateway ?? '',
      reference: payment?.reference ?? '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          amount: typeof values.amount === 'string' ? Number(values.amount) : values.amount,
          description: values.description,
          status: values.status,
          gateway: (values.gateway || '').trim(),
          reference: (values.reference || '').trim(),
        };
        await savePayment(payload);
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['payment', id] });
        enqueueSnackbar('Payment updated successfully', { variant: 'success' });
        navigate(`/payment/${id}`);
      } catch (err) {
        enqueueSnackbar(err?.message || 'Failed to update payment', { variant: 'error' });
      }
    },
  });

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading payment…</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !payment) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Payment not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error?.message || 'The requested payment could not be loaded.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/payment')}>
            Back to payments
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
        <Box sx={{ pb: 5, pt: 4 }}>
          <Breadcrumbs sx={{ mb: 3 }}>
            <Link to="/payment" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                Payments
              </Typography>
            </Link>
            <Link to={`/payment/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                Payment details
              </Typography>
            </Link>
            <Typography color="text.primary">Edit</Typography>
          </Breadcrumbs>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Edit payment
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => navigate(`/payment/${id}`)}
            >
              Cancel
            </Button>
          </Stack>

          <ReadOnlyContext payment={payment} />

          <Card sx={{ p: 3 }} component="form" onSubmit={formik.handleSubmit} noValidate>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Payment fields
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="amount"
                  label="Amount"
                  type="number"
                  inputProps={{ step: 'any', min: 0 }}
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  helperText={formik.touched.amount && formik.errors.amount}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  name="status"
                  label="Status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                >
                  {STATUS_VALUES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  multiline
                  minRows={2}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  name="gateway"
                  label="Gateway"
                  value={formik.values.gateway || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {GATEWAY_OPTIONS.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="reference"
                  label="Reference"
                  value={formik.values.reference}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.reference && Boolean(formik.errors.reference)}
                  helperText={formik.touched.reference && formik.errors.reference}
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate(`/payment/${id}`)}>
                Discard
              </Button>
              <LoadingButton type="submit" variant="contained" loading={isSaving}>
                Save changes
              </LoadingButton>
            </Stack>
          </Card>
        </Box>
      </Container>
  );
}
