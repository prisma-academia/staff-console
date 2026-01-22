import * as Yup from 'yup';
import { useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Card,
  Stack,
  Button,
  Select,
  Switch,
  Divider,
  useTheme,
  MenuItem,
  Container,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  CardContent,
  FormControlLabel,
} from '@mui/material';

import { TemplateApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .matches(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens only'),
  type: Yup.string().oneOf(['email', 'sms']).required('Type is required'),
  category: Yup.string().required('Category is required'),
  subject: Yup.string().when('type', {
    is: 'email',
    then: (schema) => schema.required('Subject is required for email templates'),
    otherwise: (schema) => schema,
  }),
  content: Yup.string().required('Content is required'),
  variables: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Variable name is required'),
      description: Yup.string(),
      required: Yup.boolean(),
    })
  ),
  description: Yup.string(),
  isActive: Yup.boolean(),
});

export default function TemplateAddPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [variables, setVariables] = useState([{ name: '', description: '', required: false }]);

  const { mutate: createTemplate, isPending } = useMutation({
    mutationFn: (templateData) => TemplateApi.createTemplate(templateData),
    onSuccess: (data) => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      enqueueSnackbar('Template created successfully', { variant: 'success' });
      if (data?._id) {
        navigate(`/template/${data._id}`);
      } else {
        navigate('/template');
      }
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to create template', { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      type: '',
      category: '',
      subject: '',
      content: '',
      variables: [],
      description: '',
      isActive: true,
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      const payload = {
        ...values,
        variables: variables.filter(v => v.name.trim() !== ''),
      };
      createTemplate(payload);
    },
  });

  const handleBack = () => {
    navigate('/template');
  };

  const addVariable = () => {
    setVariables([...variables, { name: '', description: '', required: false }]);
  };

  const removeVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index, field, value) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  return (
    <>
      <Helmet>
        <title> Add New Template | Template Management </title>
      </Helmet>

      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: 4 }}>
          {/* Header Section */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: (thm) => thm.shadows[2],
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Add New Template
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new email or SMS template with EJS syntax
                </Typography>
              </Box>
              <IconButton onClick={handleBack} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Iconify icon="eva:arrow-back-fill" />
              </IconButton>
            </Stack>
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Left Column - Main Form */}
              <Grid item xs={12} md={8}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Template Name"
                          name="name"
                          value={formik.values.name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.name && Boolean(formik.errors.name)}
                          helperText={formik.touched.name && formik.errors.name}
                          placeholder="e.g., welcome-email"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={formik.touched.type && Boolean(formik.errors.type)}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            name="type"
                            value={formik.values.type}
                            label="Type"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          >
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="sms">SMS</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={formik.touched.category && Boolean(formik.errors.category)}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            name="category"
                            value={formik.values.category}
                            label="Category"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          >
                            <MenuItem value="welcome">Welcome</MenuItem>
                            <MenuItem value="password-reset">Password Reset</MenuItem>
                            <MenuItem value="notification">Notification</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {formik.values.type === 'email' && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Subject"
                            name="subject"
                            value={formik.values.subject}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.subject && Boolean(formik.errors.subject)}
                            helperText={formik.touched.subject && formik.errors.subject}
                            placeholder="e.g., Welcome to <%= institution.institution.name %>!"
                          />
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={12}
                          label="Content (EJS Template)"
                          name="content"
                          value={formik.values.content}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.content && Boolean(formik.errors.content)}
                          helperText={
                            formik.touched.content && formik.errors.content
                              ? formik.errors.content
                              : 'Use EJS syntax: <%= variableName %> for output, <% code %> for logic'
                          }
                          placeholder="<div><h1>Hello <%= userName %>!</h1></div>"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          name="description"
                          value={formik.values.description}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Optional description of this template"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column - Variables & Settings */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    position: { md: 'sticky' },
                    top: { md: 24 },
                    maxHeight: { md: 'calc(100vh - 120px)' },
                    overflow: { md: 'auto' },
                  }}
                >
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Variables</Typography>
                        <Button size="small" startIcon={<Iconify icon="eva:plus-fill" />} onClick={addVariable}>
                          Add
                        </Button>
                      </Box>
                      <Divider sx={{ mb: 2 }} />

                      <Stack spacing={2}>
                        {variables.map((variable, index) => (
                          <Card key={index} variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2">Variable {index + 1}</Typography>
                                  {variables.length > 1 && (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeVariable(index)}
                                    >
                                      <Iconify icon="eva:trash-2-outline" width={16} />
                                    </IconButton>
                                  )}
                                </Box>

                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Variable Name"
                                  value={variable.name}
                                  onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                  placeholder="e.g., userName"
                                />

                                <TextField
                                  size="small"
                                  fullWidth
                                  multiline
                                  rows={2}
                                  label="Description"
                                  value={variable.description}
                                  onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                  placeholder="Optional description"
                                />

                                <FormControlLabel
                                  control={
                                    <Switch
                                      size="small"
                                      checked={variable.required}
                                      onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                                    />
                                  }
                                  label="Required"
                                />
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Settings
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.isActive}
                            onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                          />
                        }
                        label="Active"
                      />
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box
              sx={{
                mt: 4,
                p: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: (thm) => thm.shadows[1],
              }}
            >
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button variant="outlined" color="inherit" onClick={handleBack}>
                  Cancel
                </Button>
                <Can do="add_template">
                  <LoadingButton
                    variant="contained"
                    type="submit"
                    loading={formik.isSubmitting || isPending}
                    startIcon={<Iconify icon="eva:save-fill" />}
                  >
                    Create Template
                  </LoadingButton>
                </Can>
              </Stack>
            </Box>
          </form>
        </Box>
      </Container>
    </>
  );
}

