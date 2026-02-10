import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Grid,
  Modal,
  Stack,
  Button,
  Switch,
  Backdrop,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';

import { courseApi, AssessmentApi } from 'src/api';

import CustomSelect from 'src/components/select';

const ASSESSMENT_TYPE_OPTIONS = [
  'Exam',
  'Quiz',
  'Assignment',
  'Project',
  'Test',
  'Midterm',
  'Final',
].map((t) => ({ _id: t, name: t }));

const EditAssessment = ({ open, setOpen, assessment }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: courseOptions } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
  });

  const courseSelectOptions = (courseOptions || []).map((c) => ({
    _id: c._id,
    name: c.name || c.title || c.code || c._id,
  }));

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => AssessmentApi.updateAssessment(id, data),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Assessment updated successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      formik.setSubmitting(false);
      const errorMessage = error.data?.message || error.message || 'Failed to update assessment';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    type: Yup.string()
      .required('Type is required')
      .oneOf(ASSESSMENT_TYPE_OPTIONS.map((o) => o._id), 'Invalid type'),
    maxScore: Yup.number()
      .required('Maximum score is required')
      .positive('Must be positive')
      .integer('Must be a whole number'),
    weight: Yup.number()
      .nullable()
      .min(0, 'Must be between 0 and 100')
      .max(100, 'Must be between 0 and 100'),
    courses: Yup.array().of(Yup.string()),
    dueDate: Yup.date().nullable(),
    isActive: Yup.boolean(),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: assessment?.name ?? '',
      description: assessment?.description ?? '',
      type: assessment?.type ?? '',
      maxScore: assessment?.maxScore ?? '',
      weight: assessment?.weight ?? '',
      courses: (assessment?.courses || []).map((c) => (typeof c === 'object' ? c._id : c)),
      dueDate: assessment?.dueDate
        ? new Date(assessment.dueDate).toISOString().slice(0, 16)
        : '',
      isActive: assessment?.isActive !== false,
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      const payload = {
        name: values.name,
        description: values.description || undefined,
        type: values.type,
        maxScore: Number(values.maxScore),
        weight: values.weight ? Number(values.weight) : undefined,
        courses: Array.isArray(values.courses) ? values.courses : [],
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
        isActive: values.isActive,
      };
      updateMutation.mutate({ id: assessment._id, data: payload });
    },
  });

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 640,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 3,
    maxHeight: '90vh',
    overflow: 'auto',
    borderRadius: 2,
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!assessment) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Edit Assessment
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={ASSESSMENT_TYPE_OPTIONS}
                    label="Type"
                    name="type"
                    formik={formik}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Score"
                    name="maxScore"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={formik.values.maxScore}
                    onChange={formik.handleChange}
                    error={formik.touched.maxScore && Boolean(formik.errors.maxScore)}
                    helperText={formik.touched.maxScore && formik.errors.maxScore}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Weight (%)"
                    name="weight"
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    value={formik.values.weight}
                    onChange={formik.handleChange}
                    error={formik.touched.weight && Boolean(formik.errors.weight)}
                    helperText={formik.touched.weight && formik.errors.weight}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    name="dueDate"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.dueDate}
                    onChange={formik.handleChange}
                    error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                    helperText={formik.touched.dueDate && formik.errors.dueDate}
                  />
                </Grid>
              </Grid>
              <CustomSelect
                data={courseSelectOptions}
                label="Courses (leave empty for global)"
                name="courses"
                formik={formik}
                multiple
                showSelectedCount
              />
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formik.values.isActive}
                    onChange={formik.handleChange}
                  />
                }
                label="Active"
              />
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                  Cancel
                </Button>
                <LoadingButton
                  loading={formik.isSubmitting}
                  variant="contained"
                  type="submit"
                  disabled={!formik.values.name || !formik.values.type || !formik.values.maxScore}
                >
                  Update Assessment
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

EditAssessment.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  assessment: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    maxScore: PropTypes.number,
    weight: PropTypes.number,
    courses: PropTypes.array,
    dueDate: PropTypes.string,
    isActive: PropTypes.bool,
  }),
};

export default EditAssessment;
