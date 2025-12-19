import React from 'react';
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
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
} from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

import { programApi, classLevelApi } from '../../api';

const CreateEventModal = ({ open, setOpen }) => {
  const token = useAuthStore((store) => store.token);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: programOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const addEvent = async (eventData) => {
    const response = await fetch(`${config.baseUrl}/api/v1/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      formik.setSubmitting(false);
      throw new Error(errorMessage);
    }

    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: addEvent,
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      enqueueSnackbar({ message: 'Event created successfully', variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    title: Yup.string().required('Event title is required'),
    description: Yup.string(),
    start: Yup.date().required('Event start time is required'),
    end: Yup.date().required('Event end time is required'),
    category: Yup.string(),
    classLevels: Yup.array(),
    programs: Yup.array(),
    url: Yup.string(),
    isPublic: Yup.boolean(),
    allDay: Yup.boolean(),
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      start: '',
      end: '',
      category: '',
      classLevels: [],
      programs: [],
      url: '',
      isPublic: false,
      allDay: false,
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      mutate(values);
    },
  });

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '60%',
    maxWidth: '800px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        color="inherit"
        startIcon={<Iconify icon="eva:plus-fill" />}
      >
        New Event
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        keepMounted={false}
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h5" align="center" gutterBottom>
              Create New Event
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Event Title"
                      name="title"
                      fullWidth
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      error={formik.touched.title && Boolean(formik.errors.title)}
                      helperText={formik.touched.title && formik.errors.title}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Location"
                      name="url"
                      fullWidth
                      value={formik.values.url}
                      onChange={formik.handleChange}
                      error={formik.touched.url && Boolean(formik.errors.url)}
                      helperText={formik.touched.url && formik.errors.url}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Description"
                      name="description"
                      fullWidth
                      multiline
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Start Time"
                      name="start"
                      type="datetime-local"
                      fullWidth
                      value={formik.values.start}
                      onChange={formik.handleChange}
                      error={formik.touched.start && Boolean(formik.errors.start)}
                      helperText={formik.touched.start && formik.errors.start}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="End Time"
                      name="end"
                      type="datetime-local"
                      fullWidth
                      value={formik.values.end}
                      onChange={formik.handleChange}
                      error={formik.touched.end && Boolean(formik.errors.end)}
                      helperText={formik.touched.end && formik.errors.end}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={[
                        { _id: '234', name: 'Departmental' },
                        { _id: '234ww', name: 'General' },
                      ]}
                      label="Category"
                      name="category"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={programOptions}
                      multiple
                      label="Programs"
                      name="programs"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={classLevelOptions}
                      multiple
                      label="Class Levels"
                      name="classLevels"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.isPublic}
                          onChange={formik.handleChange}
                          name="isPublic"
                          color="primary"
                        />
                      }
                      label="Is Public Event"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.allDay}
                          onChange={formik.handleChange}
                          name="allDay"
                          color="primary"
                        />
                      }
                      label="All Day Event"
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                    Create Event
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

CreateEventModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default CreateEventModal;
