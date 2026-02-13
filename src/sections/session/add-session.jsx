import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Button,
  Backdrop,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import { SessionApi } from 'src/api';
import CustomSelect from 'src/components/select';

const SEMESTER_OPTIONS = [
  { name: 'First Semester', _id: 'First Semester' },
  { name: 'Second Semester', _id: 'Second Semester' },
];

const AddSession = ({ open, setOpen }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { mutate, isPending } = useMutation({
    mutationFn: SessionApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      enqueueSnackbar('Session created successfully', { variant: 'success' });
      formik.resetForm();
      setOpen(false);
    },
    onError: (error) => {
      const message = error.message || 'Failed to create session';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Session name is required'),
    code: Yup.string(),
    currentSemester: Yup.string()
      .oneOf(['First Semester', 'Second Semester'], 'Invalid semester')
      .default('First Semester'),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
    isCurrent: Yup.boolean(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
      currentSemester: 'First Semester',
      startDate: '',
      endDate: '',
      isCurrent: false,
    },
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        name: values.name.trim(),
        code: values.code?.trim() || undefined,
        currentSemester: values.currentSemester || 'First Semester',
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        isCurrent: Boolean(values.isCurrent),
      };
      mutate(payload);
    },
  });

  const handleModalClose = () => {
    setOpen(false);
    formik.resetForm();
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : 480,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      closeAfterTransition
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Add Academic Session
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Session name"
                    name="name"
                    placeholder="e.g. 2024/2025"
                    fullWidth
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Code (optional)"
                    name="code"
                    placeholder="e.g. 2024-25"
                    fullWidth
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    error={formik.touched.code && Boolean(formik.errors.code)}
                    helperText={formik.touched.code && formik.errors.code}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomSelect
                    data={SEMESTER_OPTIONS}
                    label="Current semester"
                    name="currentSemester"
                    formik={formik}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start date"
                    name="startDate"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.startDate}
                    onChange={formik.handleChange}
                    error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                    helperText={formik.touched.startDate && formik.errors.startDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End date"
                    name="endDate"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.endDate}
                    onChange={formik.handleChange}
                    error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                    helperText={formik.touched.endDate && formik.errors.endDate}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isCurrent"
                        checked={formik.values.isCurrent}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Set as current session (only one session can be current)"
                  />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                <Button onClick={handleModalClose}>Cancel</Button>
                <LoadingButton loading={isPending} variant="contained" type="submit">
                  Create Session
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

AddSession.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddSession;
