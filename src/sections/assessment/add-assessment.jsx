import * as Yup from 'yup';
import { useMemo } from 'react';
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

import { courseApi, programApi, AssessmentApi } from 'src/api';

import CustomSelect from 'src/components/select';

const ASSESSMENT_TYPE_OPTIONS = ['Exam', 'CA1', 'CA2', 'CA3'].map((t) => ({ _id: t, name: t }));

const AddAssessment = ({ open, setOpen, sessionId, programId, courseId }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programApi.getPrograms(),
  });
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.getCourses(),
  });

  const programList = Array.isArray(programs) ? programs : [];
  const courseList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses]);

  const createMutation = useMutation({
    mutationFn: AssessmentApi.createAssessment,
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Assessment created successfully', { variant: 'success' });
      setOpen(false);
      formik.resetForm();
    },
    onError: (error) => {
      formik.setSubmitting(false);
      const errorMessage = error.data?.message || error.message || 'Failed to create assessment';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
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
    isActive: Yup.boolean(),
    program: Yup.string().required('Program is required'),
    course: Yup.string().required('Course is required'),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      type: '',
      maxScore: '',
      weight: '',
      isActive: true,
      program: programId || '',
      course: courseId || '',
    },
    validationSchema,
    onSubmit: (values) => {
      const program = values.program || programId;
      const course = values.course || courseId;
      if (!program || !course) {
        enqueueSnackbar('Program and course are required', { variant: 'error' });
        return;
      }
      formik.setSubmitting(true);
      const payload = {
        program,
        course,
        type: values.type,
        maxScore: Number(values.maxScore),
        weight: values.weight ? Number(values.weight) : undefined,
        isActive: values.isActive,
      };
      createMutation.mutate(payload);
    },
  });

  const coursesForProgram = useMemo(
    () =>
      courseList.filter((c) =>
        (c.programs || []).some((p) => (typeof p === 'object' ? p?._id : p) === formik.values.program)
      ),
    [courseList, formik.values.program]
  );

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 720,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 3,
    maxHeight: '90vh',
    overflow: 'auto',
    borderRadius: 2,
  };

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
  };

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
            Add Assessment
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
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
                <CustomSelect
                  data={programList.map((p) => ({ _id: p._id, name: p.name || p.code || p._id }))}
                  label="Program"
                  name="program"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomSelect
                  data={coursesForProgram.map((c) => ({ _id: c._id, name: c.name || c.code || c._id }))}
                  label="Course"
                  name="course"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                  <Button onClick={handleClose} variant="outlined">
                    Cancel
                  </Button>
                  <LoadingButton
                    loading={formik.isSubmitting}
                    variant="contained"
                    type="submit"
                    disabled={
                      !formik.values.program ||
                      !formik.values.course ||
                      !formik.values.type ||
                      !formik.values.maxScore
                    }
                  >
                    Create Assessment
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

AddAssessment.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  sessionId: PropTypes.string,
  programId: PropTypes.string,
  courseId: PropTypes.string,
};

export default AddAssessment;
