import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import React, { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Button,
  useTheme,
  Backdrop,
  Checkbox,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
} from '@mui/material';

import { programApi, userGroupApi } from 'src/api';

import CustomSelect from 'src/components/select';

const EditProgram = ({ open, setOpen, programId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch program data
  const { data: program, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => programApi.getProgramById(programId),
    enabled: !!programId && open,
  });

  // Fetch departments for dropdown
  const { data: userGroups = [] } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupApi.getGroups(),
  });

  const departments = useMemo(
    () => (userGroups || []).filter((group) => group.type === 'department'),
    [userGroups]
  );

  const programTypes = [
    { _id: 'ND', name: 'ND' },
    { _id: 'Basic', name: 'Basic' },
  ];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => programApi.updateProgram(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      enqueueSnackbar('Program updated successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      // Handle different error types
      let errorMessage = 'An error occurred';
      
      if (error.data?.errors && Array.isArray(error.data.errors)) {
        // Validation errors (422)
        const fieldErrors = error.data.errors.map((err) => err.message).join(', ');
        errorMessage = fieldErrors;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string(),
    code: Yup.string(),
    type: Yup.string().oneOf(['ND', 'Basic'], 'Program type must be either ND or Basic'),
    durationInYears: Yup.number().positive('Duration must be a positive number'),
    totalCreditsRequired: Yup.number().positive('Total credits must be a positive number'),
    department: Yup.string().nullable(),
    school: Yup.string().nullable(),
    currentSet: Yup.string().nullable(),
    isActive: Yup.boolean(),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: program?.name || '',
      code: program?.code || '',
      type: program?.type || '',
      department: program?.department?._id || program?.department || '',
      durationInYears: program?.durationInYears || '',
      totalCreditsRequired: program?.totalCreditsRequired || '',
      school: program?.school || '',
      currentSet: program?.currentSet || '01',
      isActive: program?.isActive !== undefined ? program.isActive : true,
    },
    validationSchema,
    onSubmit: (values) => {
      // Prepare payload - only include fields that have values
      const payload = {};

      if (values.name) payload.name = values.name;
      if (values.code) payload.code = values.code;
      if (values.type) payload.type = values.type;
      if (values.durationInYears) payload.durationInYears = Number(values.durationInYears);
      if (values.totalCreditsRequired) payload.totalCreditsRequired = Number(values.totalCreditsRequired);
      
      // Optional fields
      if (values.department) {
        payload.department = values.department;
      } else if (values.department === '') {
        // Allow clearing department by setting to null
        payload.department = null;
      }
      
      if (values.school !== undefined) {
        if (values.school.trim()) {
          payload.school = values.school.trim();
        } else {
          payload.school = null;
        }
      }
      
      if (values.currentSet !== undefined) {
        if (values.currentSet.trim()) {
          payload.currentSet = values.currentSet.trim();
        } else {
          payload.currentSet = '01';
        }
      }
      
      if (values.isActive !== undefined) {
        payload.isActive = values.isActive;
      }

      mutate(payload);
    },
  });

  // Reset form when program data loads
  useEffect(() => {
    if (program && open) {
      formik.resetForm({
        values: {
          name: program.name || '',
          code: program.code || '',
          type: program.type || '',
          department: program.department?._id || program.department || '',
          durationInYears: program.durationInYears || '',
          totalCreditsRequired: program.totalCreditsRequired || '',
          school: program.school || '',
          currentSet: program.currentSet || '01',
          isActive: program.isActive !== undefined ? program.isActive : true,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, open]);

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '60%',
    maxWidth: '700px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
    borderRadius: 2,
  };

  return (
    <Modal 
      open={open} 
      onClose={handleClose} 
      closeAfterTransition 
      BackdropComponent={Backdrop} 
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h5" align="center" gutterBottom>
            Edit Program
          </Typography>
          {isLoadingProgram ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading program data...</Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField 
                      label="Program Name" 
                      name="name" 
                      fullWidth 
                      value={formik.values.name} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)} 
                      helperText={formik.touched.name && formik.errors.name} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Program Code" 
                      name="code" 
                      fullWidth 
                      value={formik.values.code} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.code && Boolean(formik.errors.code)} 
                      helperText={formik.touched.code && formik.errors.code} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={programTypes}
                      label="Program Type"
                      name="type"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Duration (Years)" 
                      name="durationInYears" 
                      type="number" 
                      fullWidth 
                      value={formik.values.durationInYears} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.durationInYears && Boolean(formik.errors.durationInYears)} 
                      helperText={formik.touched.durationInYears && formik.errors.durationInYears}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Total Credits Required" 
                      name="totalCreditsRequired" 
                      type="number" 
                      fullWidth 
                      value={formik.values.totalCreditsRequired} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.totalCreditsRequired && Boolean(formik.errors.totalCreditsRequired)} 
                      helperText={formik.touched.totalCreditsRequired && formik.errors.totalCreditsRequired}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={departments}
                      label="Department"
                      name="department"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="School" 
                      name="school" 
                      fullWidth 
                      value={formik.values.school} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.school && Boolean(formik.errors.school)} 
                      helperText={formik.touched.school && formik.errors.school} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Current Set" 
                      name="currentSet" 
                      fullWidth 
                      value={formik.values.currentSet} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.currentSet && Boolean(formik.errors.currentSet)} 
                      helperText={formik.touched.currentSet && formik.errors.currentSet || 'Defaults to "01" if not specified'} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formik.values.isActive}
                          onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                          name="isActive"
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button onClick={handleClose}>Cancel</Button>
                  <LoadingButton loading={isPending} variant="contained" type="submit">
                    Update Program
                  </LoadingButton>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

EditProgram.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  programId: PropTypes.string.isRequired,
};

export default EditProgram;

