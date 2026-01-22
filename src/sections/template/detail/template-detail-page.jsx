import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Tab,
  Tabs,
  Chip,
  Grid,
  Card,
  Stack,
  Paper,
  Table,
  Alert,
  Button,
  Select,
  Switch,
  useTheme,
  MenuItem,
  TableRow,
  Container,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  CardContent,
  LinearProgress,
  FormControlLabel,
} from '@mui/material';

import { TemplateApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import TabPanel from './tab-panel';

// ----------------------------------------------------------------------

function a11yProps(index) {
  return {
    id: `template-tab-${index}`,
    'aria-controls': `template-tabpanel-${index}`,
  };
}

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

export default function TemplateDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [variables, setVariables] = useState([]);

  const { data: template, isLoading, isError } = useQuery({
    queryKey: ['template', id],
    queryFn: () => TemplateApi.getTemplateById(id),
    enabled: !!id && id !== 'new',
  });

  // Initialize variables when template loads
  useMemo(() => {
    if (template?.variables) {
      setVariables(template.variables);
    }
  }, [template]);

  const { mutate: updateTemplate, isPending } = useMutation({
    mutationFn: (templateData) => TemplateApi.updateTemplate(id, templateData),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      enqueueSnackbar('Template updated successfully', { variant: 'success' });
      setEditMode(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to update template', { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: template?.name || '',
      type: template?.type || '',
      category: template?.category || '',
      subject: template?.subject || '',
      content: template?.content || '',
      variables: template?.variables || [],
      description: template?.description || '',
      isActive: template?.isActive ?? true,
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      const payload = {
        ...values,
        variables: variables.filter(v => v.name.trim() !== ''),
      };
      updateTemplate(payload);
    },
  });

  const handleBack = () => {
    navigate('/template');
  };

  const handleEditToggle = () => {
    if (editMode) {
      formik.resetForm();
      setVariables(template?.variables || []);
    }
    setEditMode(!editMode);
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

  // Generate sample data for preview
  const generateSampleData = () => {
    const sample = {
      institution: {
        institution: {
          name: 'Academia University',
          fullName: 'Academia University of Technology',
        },
      },
      logoUrl: 'https://example.com/logo.png',
      logoWidth: 100,
      logoHeight: 100,
    };

    // Add sample values for template variables
    if (template?.variables) {
      template.variables.forEach((variable) => {
        const varName = variable.name;
        if (varName.includes('.')) {
          // Handle nested properties
          const parts = varName.split('.');
          let current = sample;
          for (let i = 0; i < parts.length - 1; i += 1) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = `Sample ${parts[parts.length - 1]}`;
        } else {
          sample[varName] = `Sample ${varName}`;
        }
      });
    }

    return sample;
  };

  // Simple EJS renderer for preview (basic implementation)
  const renderPreview = (content, data) => {
    try {
      // Replace EJS tags with actual values
      let rendered = content;
      
      // Handle <%= variable %> syntax
      rendered = rendered.replace(/<%=([^%]+)%>/g, (match, expression) => {
        const trimmed = expression.trim();
        const value = getNestedValue(data, trimmed);
        return value !== undefined ? String(value) : '';
      });

      // Handle <%- variable %> syntax (unescaped HTML)
      rendered = rendered.replace(/<%-([^%]+)%>/g, (match, expression) => {
        const trimmed = expression.trim();
        const value = getNestedValue(data, trimmed);
        return value !== undefined ? String(value) : '';
      });

      // Handle <% code %> blocks (basic if statements)
      rendered = rendered.replace(/<% if\s*\(([^)]+)\)\s*{[\s\S]*?%>([\s\S]*?)<% }[\s\S]*?%>/g, (match, condition, contentBlock) => {
        const condValue = getNestedValue(data, condition.trim());
        return condValue ? contentBlock : '';
      });

      return rendered;
    } catch (error) {
      return `<div style="color: red;">Error rendering preview: ${error.message}</div>`;
    }
  };

  const getNestedValue = (obj, path) => path.split('.').reduce((current, prop) => current?.[prop], obj);

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !template) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">Template not found</Alert>
          <Button onClick={handleBack} sx={{ mt: 2 }}>
            Back to Templates
          </Button>
        </Box>
      </Container>
    );
  }

  const sampleData = generateSampleData();
  const previewContent = renderPreview(template.content, sampleData);
  const previewSubject = template.type === 'email' && template.subject
    ? renderPreview(template.subject, sampleData)
    : null;

  return (
    <>
      <Helmet>
        <title> Template Details | Template Management </title>
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
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Typography variant="h4" fontWeight={700}>
                    {template.name}
                  </Typography>
                  <Label color={template.type === 'email' ? 'info' : 'secondary'}>
                    {template.type.toUpperCase()}
                  </Label>
                  <Label color={template.isActive ? 'success' : 'error'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {template.description || 'No description'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton onClick={handleBack} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Iconify icon="eva:arrow-back-fill" />
                </IconButton>
                <Can do="edit_template">
                  <Button
                    variant={editMode ? 'outlined' : 'contained'}
                    startIcon={<Iconify icon={editMode ? 'eva:close-fill' : 'eva:edit-fill'} />}
                    onClick={handleEditToggle}
                  >
                    {editMode ? 'Cancel Edit' : 'Edit'}
                  </Button>
                </Can>
              </Stack>
            </Stack>
          </Box>

          {/* Tabs */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Overview" {...a11yProps(0)} />
                <Tab label="Preview" {...a11yProps(1)} />
                <Tab label="Variables" {...a11yProps(2)} />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              {editMode ? (
                <Box component="form" onSubmit={formik.handleSubmit}>
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
                        helperText={formik.touched.content && formik.errors.content}
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
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.isActive}
                            onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                          />
                        }
                        label="Active"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={handleEditToggle}>
                      Cancel
                    </Button>
                    <Can do="edit_template">
                      <LoadingButton
                        variant="contained"
                        type="submit"
                        loading={formik.isSubmitting || isPending}
                        startIcon={<Iconify icon="eva:save-fill" />}
                      >
                        Save Changes
                      </LoadingButton>
                    </Can>
                  </Box>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {template.name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Type
                    </Typography>
                    <Label color={template.type === 'email' ? 'info' : 'secondary'}>
                      {template.type.toUpperCase()}
                    </Label>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Category
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {template.category}
                    </Typography>
                  </Grid>

                  {template.type === 'email' && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Subject
                      </Typography>
                      <Typography variant="body1">
                        {template.subject || '-'}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Content
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {template.content}
                    </Paper>
                  </Grid>

                  {template.description && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {template.description}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Label color={template.isActive ? 'success' : 'error'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {template.createdAt ? new Date(template.createdAt).toLocaleString() : '-'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Updated At
                    </Typography>
                    <Typography variant="body1">
                      {template.updatedAt ? new Date(template.updatedAt).toLocaleString() : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            {/* Preview Tab */}
            <TabPanel value={tabValue} index={1}>
              <Stack spacing={3}>
                {template.type === 'email' && previewSubject && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Subject Preview
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1">{previewSubject}</Typography>
                    </Paper>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Content Preview
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      bgcolor: 'background.paper',
                      minHeight: 200,
                    }}
                  >
                    {template.type === 'email' ? (
                      <Box dangerouslySetInnerHTML={{ __html: previewContent }} />
                    ) : (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {previewContent}
                      </Typography>
                    )}
                  </Paper>
                </Box>

                <Alert severity="info">
                  This is a preview with sample data. Actual rendering may vary based on the EJS engine implementation.
                </Alert>
              </Stack>
            </TabPanel>

            {/* Variables Tab */}
            <TabPanel value={tabValue} index={2}>
              {editMode ? (
                <Stack spacing={2}>
                  {variables.map((variable, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2">Variable {index + 1}</Typography>
                            {variables.length > 1 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeVariable(index)}
                              >
                                <Iconify icon="eva:trash-2-outline" />
                              </IconButton>
                            )}
                          </Box>

                          <TextField
                            size="small"
                            fullWidth
                            label="Variable Name"
                            value={variable.name}
                            onChange={(e) => updateVariable(index, 'name', e.target.value)}
                          />

                          <TextField
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            value={variable.description}
                            onChange={(e) => updateVariable(index, 'description', e.target.value)}
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

                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="eva:plus-fill" />}
                    onClick={addVariable}
                  >
                    Add Variable
                  </Button>
                </Stack>
              ) : (
                <Box>
                  {template.variables && template.variables.length > 0 ? (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Variable Name</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="center">Required</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {template.variables.map((variable, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {variable.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {variable.description || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {variable.required ? (
                                <Chip label="Yes" color="error" size="small" />
                              ) : (
                                <Chip label="No" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert severity="info">No variables defined for this template.</Alert>
                  )}
                </Box>
              )}
            </TabPanel>
          </Card>
        </Box>
      </Container>
    </>
  );
}

