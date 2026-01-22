import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
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
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { classLevelApi } from 'src/api';

const EditClassLevel = ({ open, setOpen, classLevelId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch class level data
  const { data: classLevel, isLoading: isLoadingClassLevel } = useQuery({
    queryKey: ['classlevel', classLevelId],
    queryFn: () => classLevelApi.getClassLevelById(classLevelId),
    enabled: !!classLevelId && open,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => classLevelApi.updateClassLevel(classLevelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classlevels'] });
      queryClient.invalidateQueries({ queryKey: ['classlevel', classLevelId] });
      enqueueSnackbar('Class level updated successfully', { variant: 'success' });
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
    level: Yup.number().positive('Level must be a positive number'),
    set: Yup.number().positive('Set must be a positive number'),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: classLevel?.name || '',
      level: classLevel?.level || '',
      set: classLevel?.set || '',
    },
    validationSchema,
    onSubmit: (values) => {
      // Prepare payload - only include fields that have values
      const payload = {};

      if (values.name) payload.name = values.name;
      if (values.level) payload.level = Number(values.level);
      if (values.set) payload.set = Number(values.set);

      mutate(payload);
    },
  });

  // Reset form when class level data loads
  useEffect(() => {
    if (classLevel && open) {
      formik.resetForm({
        values: {
          name: classLevel.name || '',
          level: classLevel.level || '',
          set: classLevel.set || '',
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel, open]);

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
    maxWidth: '600px',
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
            Edit Class Level
          </Typography>
          {isLoadingClassLevel ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading class level data...</Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField 
                      label="Class Level Name" 
                      name="name" 
                      fullWidth 
                      placeholder="e.g., 100 level, 200 level"
                      value={formik.values.name} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)} 
                      helperText={formik.touched.name && formik.errors.name} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Level" 
                      name="level" 
                      type="number" 
                      fullWidth 
                      placeholder="e.g., 1, 2, 3"
                      value={formik.values.level} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.level && Boolean(formik.errors.level)} 
                      helperText={formik.touched.level && formik.errors.level}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Set" 
                      name="set" 
                      type="number" 
                      fullWidth 
                      placeholder="e.g., 1, 2, 3"
                      value={formik.values.set} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.set && Boolean(formik.errors.set)} 
                      helperText={formik.touched.set && formik.errors.set || 'Set/cohort identifier'}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button onClick={handleClose}>Cancel</Button>
                  <LoadingButton loading={isPending} variant="contained" type="submit">
                    Update Class Level
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

EditClassLevel.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  classLevelId: PropTypes.string.isRequired,
};

export default EditClassLevel;
