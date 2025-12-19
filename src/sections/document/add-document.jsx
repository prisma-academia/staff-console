import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Grid,
  Modal,
  Stack,
  Button,
  Backdrop,
  useTheme,
  Checkbox,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
} from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import CustomSelect from 'src/components/select';

import { programApi, classLevelApi } from '../../api';

const AddDocumentFileModal = ({ open, setOpen }) => {
  const token = useAuthStore((store) => store.token);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: programmeOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const addDocumentFile = async (formData) => {
    const response = await fetch(`${config.baseUrl}/api/v1/document`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      formik.setSubmitting(false);
      throw new Error(errorMessage);
    }

    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: addDocumentFile,
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['documentFiles'] });
      enqueueSnackbar({ message: 'Document file added successfully', variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    title: Yup.string().required('Document title is required'),
    description: Yup.string(),
    tags: Yup.array(),
    isPublic: Yup.boolean(),
    programs: Yup.array(),
    classLevels: Yup.array(),
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      tags: [],
      isPublic: false,
      programs: [],
      classLevels: [],
    },
    validationSchema,
    onSubmit: (values) => {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('tags', JSON.stringify(values.tags));
        formData.append('isPublic', values.isPublic);
        formData.append('programs', JSON.stringify(values.programs));
        formData.append('classLevels', JSON.stringify(values.classLevels));

        mutate(formData);
      } else {
        formik.setSubmitting(false);
        enqueueSnackbar({ message: 'Please select a file', variant: 'error' });
      }
    },
  });

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) setSelectedFile(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: 'application/pdf, image/*',
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
      <Button onClick={() => setOpen(true)} variant="contained" color="inherit">
        New Document File
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
              Add New Document File
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={4}>
                <Grid container spacing={2}>
                  <Grid item sm={6} xs={12}>
                    <TextField
                      label="Title"
                      name="title"
                      fullWidth
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      error={formik.touched.title && Boolean(formik.errors.title)}
                      helperText={formik.touched.title && formik.errors.title}
                    />
                  </Grid>
                  <Grid item sm={6} xs={12}>
                    <CustomSelect
                      label="Tags"
                      name="tags"
                      formik={formik}
                      multiple
                      options={formik.values.tags}
                      placeholder="Select or add tags"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      name="description"
                      fullWidth
                      multiline
                      rows={4}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">File Upload</Typography>
                    <Box
                      {...getRootProps()}
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <input {...getInputProps()} />
                      <Typography variant="body2">
                        {selectedFile ? selectedFile.name : 'Drag & drop a file here or click to select'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={programmeOptions}
                      multiple
                      label="Program"
                      name="programs"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={classLevelOptions}
                      multiple
                      label="Class Level"
                      name="classLevels"
                      formik={formik}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formik.values.isPublic}
                          onChange={formik.handleChange}
                          name="isPublic"
                        />
                      }
                      label="Is Public"
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                    Add Document File
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

AddDocumentFileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddDocumentFileModal;
