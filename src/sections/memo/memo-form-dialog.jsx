import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import ReactQuill from 'react-quill';
import { useSnackbar } from 'notistack';
import 'react-quill/dist/quill.snow.css';
import React, { useMemo, useState, useEffect } from 'react';
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
  Divider,
  Backdrop,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';

import { toProgrammeOptions } from 'src/utils/format-programme';

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

const modules = {
  toolbar: {
    container: toolbarOptions,
  },
  clipboard: {
    matchVisual: false,
  },
};

const validationSchema = Yup.object({
  name: Yup.string().required('Title is required'),
  isPublic: Yup.boolean(),
  programs: Yup.array().min(1, 'At least one program is required'),
  classLevels: Yup.array().min(1, 'At least one class level is required'),
});

const toId = (value) => (value && typeof value === 'object' ? value._id : value);

const getInitialValues = (memo) => ({
  name: memo?.name || '',
  isPublic: Boolean(memo?.isPublic),
  programs: (memo?.programs || []).map(toId),
  classLevels: (memo?.classLevels || []).map(toId),
});

/** Creates a memo, or edits `memo` when one is passed. */
const MemoFormDialog = ({ open, setOpen, memo }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = Boolean(memo?._id);
  const [htmlContent, setHtmlContent] = useState('');

  // Load the memo's body each time the dialog opens (blank for a new memo)
  useEffect(() => {
    if (open) setHtmlContent(memo?.html || '');
  }, [open, memo]);

  const { data: programmeOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const programmeSelectData = useMemo(() => toProgrammeOptions(programmeOptions), [programmeOptions]);

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const { mutate } = useMutation({
    mutationFn: (data) => (isEdit ? MemoApi.updateMemo(memo._id, data) : MemoApi.createMemo(data)),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      enqueueSnackbar(isEdit ? 'Memo updated' : 'Memo created', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      formik.setSubmitting(false);
      enqueueSnackbar(error.data?.message || error.message || 'Failed to save memo', { variant: 'error' });
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(memo),
    validationSchema,
    onSubmit: (values) => {
      // Quill leaves "<p><br></p>" behind when cleared
      if (!htmlContent || !htmlContent.replace(/<[^>]*>/g, '').trim()) {
        formik.setErrors({ html: 'Content is required' });
        formik.setSubmitting(false);
        return;
      }

      formik.setSubmitting(true);
      mutate({ ...values, html: htmlContent });
    },
  });

  const handleClose = () => setOpen(false);

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
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      keepMounted={false}
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
            {isEdit ? 'Edit Memo' : 'Add New Memo'}
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
                <Grid item sm={6} xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.isPublic}
                        onChange={(e) => formik.setFieldValue('isPublic', e.target.checked)}
                        name="isPublic"
                      />
                    }
                    label="Public"
                  />
                  <FormHelperText>Public memos are shown to every student.</FormHelperText>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={programmeSelectData}
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
                <Button onClick={handleClose}>Cancel</Button>
                <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                  {isEdit ? 'Save Changes' : 'Add Memo'}
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

MemoFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  memo: PropTypes.object,
};

export default MemoFormDialog;
