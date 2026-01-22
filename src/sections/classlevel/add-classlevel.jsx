import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import React from 'react';
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
  useTheme,
  Backdrop,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

const AddClassLevel = ({ open, setOpen }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { mutate, isPending } = useMutation({
    mutationFn: classLevelApi.createClassLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classlevels'] });
      enqueueSnackbar('Class level added successfully', { variant: 'success' });
      formik.resetForm();
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
    name: Yup.string().required('Class level name is required'),
    level: Yup.number()
      .positive('Level must be a positive number')
      .required('Level is required'),
    set: Yup.number()
      .positive('Set must be a positive number')
      .required('Set is required'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      level: '',
      set: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        name: values.name,
        level: Number(values.level),
        set: Number(values.set),
      };

      mutate(payload);
    },
  });

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
    <>
      <Button onClick={() => setOpen(true)} variant="contained" color="inherit" startIcon={<Iconify icon="eva:plus-fill" />}>
        New Class Level
      </Button>
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
              Add New Class Level
            </Typography>
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
                    Add Class Level
                  </LoadingButton>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddClassLevel.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddClassLevel;
