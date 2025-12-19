import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Tab,
  Fade,
  Tabs,
  Modal,
  Stack,
  Paper,
  Alert,
  Button,
  Backdrop,
  useTheme,
  Typography,
  useMediaQuery,
} from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

import { courseApi } from '../../api';

const ResultTemplateModal = ({ open, setOpen }) => {
  const token = useAuthStore((store) => store.token);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  // const { data: programOptions } = useQuery({
  //   queryKey: ['programs'],
  //   queryFn: programApi.getPrograms,
  // });

  const { data: courseOptions } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
  });
  // Download template API call
  const downloadTemplate = async (data) => {
      const response = await fetch(`${config.baseUrl}/api/v1/result/template?courseId=${data.course}`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_template_${data.program}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
  
  };

  // Upload template API call
  const uploadTemplate = async (data) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('program', data.program);
    
    const response = await fetch(`${config.baseUrl}/api/v1/results/upload`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    return response.json();
  };

  // Download mutation
  const { mutate: downloadMutate, isPending: isDownloading } = useMutation({
    mutationFn: downloadTemplate,
    onSuccess: () => {
      downloadFormik.setSubmitting(false);
      enqueueSnackbar({ message: 'Template downloaded successfully', variant: 'success' });
    },
    onError: (error) => {
      downloadFormik.setSubmitting(false);
      const errorMessage = error.message || 'Failed to download template';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  // Upload mutation
  const { mutate: uploadMutate, isPending: isUploading } = useMutation({
    mutationFn: uploadTemplate,
    onSuccess: () => {
      uploadFormik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['results'] });
      enqueueSnackbar({ message: 'Results uploaded successfully', variant: 'success' });
      setOpen(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      uploadFormik.setSubmitting(false);
      const errorMessage = error.message || 'Failed to upload results';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  // Download form validation schema
  const downloadValidationSchema = Yup.object({
    course: Yup.string().required('Course is required to download template'),
  });

  // Upload form validation schema
  const uploadValidationSchema = Yup.object({
    course: Yup.string().required('Course is required'),
    file: Yup.mixed().required('Please select a file to upload'),
  });

  // Download form
  const downloadFormik = useFormik({
    initialValues: {
      course: '',
    },
    validationSchema: downloadValidationSchema,
    onSubmit: (values) => {
      console.log({values});
      downloadFormik.setSubmitting(true);
      downloadMutate(values);
    },
  });

  // Upload form
  const uploadFormik = useFormik({
    initialValues: {
      course: '',
      file: null,
    },
    validationSchema: uploadValidationSchema,
    onSubmit: (values) => {
      uploadFormik.setSubmitting(true);
      uploadMutate(values);
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      uploadFormik.setFieldValue('file', file);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
    p: 0,
    maxHeight: '90vh',
    overflow: 'hidden',
    borderRadius: 2,
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        color="primary"
        startIcon={<Iconify icon="eva:file-text-fill" />}
      >
        Result Templates
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
            <Paper elevation={0} sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, color: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <Typography variant="h5" align="center" fontWeight="bold">
                  Result Templates
                </Typography>
              </Box>
              
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Download Template" icon={<Iconify icon="eva:download-fill" />} iconPosition="start" />
                <Tab label="Upload Results" icon={<Iconify icon="eva:upload-fill" />} iconPosition="start" />
              </Tabs>
              
              <Box sx={{ p: 3, maxHeight: '70vh', overflow: 'auto' }}>
                {activeTab === 0 && (
                  <Box component="form" onSubmit={downloadFormik.handleSubmit}>
                    <Stack spacing={3}>
                      <Alert severity="info">
                        Select a program to download its result template. Fill the template with student results and upload it back.
                      </Alert>
                      
                      <CustomSelect
                        data={courseOptions}
                        label="Select Course"
                        name="course"
                        formik={downloadFormik}
                        fullWidth
                      />
                      
                      <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
                        <Button onClick={() => setOpen(false)} variant="outlined">
                          Cancel
                        </Button>
                        <LoadingButton 
                          loading={isDownloading} 
                          variant="contained" 
                          type="submit"
                          startIcon={<Iconify icon="eva:download-outline" />}
                          disabled={!downloadFormik.values.course}
                        >
                          Download Template
                        </LoadingButton>
                      </Stack>
                    </Stack>
                  </Box>
                )}
                
                {activeTab === 1 && (
                  <Box component="form" onSubmit={uploadFormik.handleSubmit}>
                    <Stack spacing={3}>
                      <Alert severity="info">
                        Upload a completed result template. Make sure you have used the correct format.
                      </Alert>
                      
                      <CustomSelect
                        data={courseOptions}
                        label="Select Course"
                        name="course"
                        formik={uploadFormik}
                        fullWidth
                      />
                      
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          border: '2px dashed',
                          borderColor: 'divider',
                          textAlign: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: 'primary.main',
                          },
                        }}
                        onClick={() => document.getElementById('result-file-input').click()}
                      >
                        <input
                          id="result-file-input"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        
                        <Iconify icon={selectedFile ? "eva:file-fill" : "eva:cloud-upload-fill"} width={40} height={40} />
                        
                        <Typography variant="h6" sx={{ mt: 2 }}>
                          {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Supports Excel files (.xlsx, .xls)'}
                        </Typography>
                        
                        {uploadFormik.touched.file && uploadFormik.errors.file && (
                          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                            {uploadFormik.errors.file}
                          </Typography>
                        )}
                      </Paper>
                      
                      <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
                        <Button onClick={() => setOpen(false)} variant="outlined">
                          Cancel
                        </Button>
                        <LoadingButton 
                          loading={isUploading} 
                          variant="contained" 
                          type="submit"
                          startIcon={<Iconify icon="eva:upload-outline" />}
                          disabled={!uploadFormik.values.course || !selectedFile}
                        >
                          Upload Results
                        </LoadingButton>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

ResultTemplateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default ResultTemplateModal;
