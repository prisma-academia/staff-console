import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import ReactQuill from 'react-quill';
import React, { useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Grid,
  Modal,
  Stack,
  Button,
  Divider,
  Backdrop,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import CustomSelect from 'src/components/select';

import { MemoApi, programApi, classLevelApi } from '../../api';

const toolbarOptions = [
  [{ header: '1' }, { header: '2' }, { font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
];

const AddDocumentModal = ({ open, setOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [htmlContent, setHtmlContent] = useState('');

  const { data: programmeOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Title is required'),
    isPublic: Yup.boolean(),
    programs: Yup.array().min(1, 'At least one program is required'),
    classLevels: Yup.array().min(1, 'At least one class level is required'),
  });

  const { mutate } = useMutation({
    mutationFn: MemoApi.createMemo,
    onSuccess: () => {
      formik.setSubmitting(false);
      setOpen(false);
    },
    onError: () => {
      formik.setSubmitting(false);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      isPublic: false,
      programs: [],
      classLevels: [],
    },
    validationSchema,
    onSubmit: (values) => {
      if (!htmlContent) {
        formik.setErrors({ html: 'Content is required' });
        formik.setSubmitting(false);
        return;
      }

      formik.setSubmitting(true);
      mutate({ ...values, html: htmlContent });
    },
  });

  const modules = {
    toolbar: {
      container: toolbarOptions,
    },
    clipboard: {
      matchVisual: false,
    },
  };

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
        New Memo
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h5" align="center" gutterBottom>
              Add New Memo
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={4}>
                <Grid container spacing={2}>
                  <Grid item sm={6} xs={12}>
                    <TextField
                      label="Title"
                      name="name"
                      fullWidth
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={programmeOptions}
                      multiple
                      label="Program"
                      name="programs"
                      formik={formik}
                    />
                    {formik.touched.programs && formik.errors.programs && (
                      <Typography color="error" variant="caption">
                        {formik.errors.programs}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={classLevelOptions}
                      multiple
                      label="Class Level"
                      name="classLevels"
                      formik={formik}
                    />
                    {formik.touched.classLevels && formik.errors.classLevels && (
                      <Typography color="error" variant="caption">
                        {formik.errors.classLevels}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Content
                    </Typography>
                    <Box
                      sx={{
                        '.quill': {
                          display: 'flex',
                          flexDirection: 'column',
                          height: '300px',
                          backgroundColor: 'background.paper',
                        },
                        '.ql-container': {
                          flexGrow: 1,
                          overflow: 'auto',
                          border: `1px solid ${theme.palette.divider}`,
                        },
                        '.ql-editor': {
                          minHeight: '100%',
                        },
                        '.ql-toolbar': {
                          border: `1px solid ${theme.palette.divider}`,
                          borderBottom: 'none',
                          backgroundColor: 'background.paper',
                        },
                        img: {
                          maxWidth: '100%',
                          height: 'auto',
                        },
                      }}
                    >
                      <ReactQuill
                        theme="snow"
                        value={htmlContent}
                        onChange={setHtmlContent}
                        modules={modules}
                        preserveWhitespace
                      />
                    </Box>
                    {formik.errors.html && (
                      <Typography color="error" variant="caption">
                        {formik.errors.html}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                <Divider />
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                    Add Memo
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

AddDocumentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddDocumentModal;
