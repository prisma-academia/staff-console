import PropTypes from 'prop-types';

import {
  Card,
  Grid,
  Stack,
  Divider,
  useTheme,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function MedicalTab({ formik, editMode, student }) {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
          <Stack direction="row" alignItems="center" mb={2} spacing={1}>
            <Iconify icon="mdi:medical-bag" color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={600}>
              Medical Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {editMode ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Blood Group"
                  name="medicalInfo.bloodGroup"
                  value={formik.values.medicalInfo.bloodGroup}
                  onChange={formik.handleChange}
                  error={formik.touched.medicalInfo?.bloodGroup && Boolean(formik.errors.medicalInfo?.bloodGroup)}
                  helperText={formik.touched.medicalInfo?.bloodGroup && formik.errors.medicalInfo?.bloodGroup}
                  size="small"
                  select
                >
                  <MenuItem value="">Select Blood Group</MenuItem>
                  {bloodGroupOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  name="medicalInfo.allergies"
                  value={Array.isArray(formik.values.medicalInfo.allergies) ? formik.values.medicalInfo.allergies.join(', ') : ''}
                  onChange={(e) => {
                    const {value} = e.target;
                    const allergies = value ? value.split(',').map(a => a.trim()).filter(a => a) : [];
                    formik.setFieldValue('medicalInfo.allergies', allergies);
                  }}
                  error={formik.touched.medicalInfo?.allergies && Boolean(formik.errors.medicalInfo?.allergies)}
                  helperText={formik.touched.medicalInfo?.allergies && formik.errors.medicalInfo?.allergies}
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Enter allergies separated by commas"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Blood Group
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.medicalInfo?.bloodGroup || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Allergies
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.medicalInfo?.allergies?.length > 0
                    ? student.medicalInfo.allergies.join(', ')
                    : 'None'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
          <Stack direction="row" alignItems="center" mb={2} spacing={1}>
            <Iconify icon="mdi:phone-alert" color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={600}>
              Emergency Contact
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {editMode ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  name="medicalInfo.emergencyContact.name"
                  value={formik.values.medicalInfo.emergencyContact.name}
                  onChange={formik.handleChange}
                  error={formik.touched.medicalInfo?.emergencyContact?.name && Boolean(formik.errors.medicalInfo?.emergencyContact?.name)}
                  helperText={formik.touched.medicalInfo?.emergencyContact?.name && formik.errors.medicalInfo?.emergencyContact?.name}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  name="medicalInfo.emergencyContact.relationship"
                  value={formik.values.medicalInfo.emergencyContact.relationship}
                  onChange={formik.handleChange}
                  error={formik.touched.medicalInfo?.emergencyContact?.relationship && Boolean(formik.errors.medicalInfo?.emergencyContact?.relationship)}
                  helperText={formik.touched.medicalInfo?.emergencyContact?.relationship && formik.errors.medicalInfo?.emergencyContact?.relationship}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  name="medicalInfo.emergencyContact.phone"
                  value={formik.values.medicalInfo.emergencyContact.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.medicalInfo?.emergencyContact?.phone && Boolean(formik.errors.medicalInfo?.emergencyContact?.phone)}
                  helperText={formik.touched.medicalInfo?.emergencyContact?.phone && formik.errors.medicalInfo?.emergencyContact?.phone}
                  size="small"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Contact Name
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.medicalInfo?.emergencyContact?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Relationship
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.medicalInfo?.emergencyContact?.relationship || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.medicalInfo?.emergencyContact?.phone || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Card>
      </Grid>
    </Grid>
  );
}

MedicalTab.propTypes = {
  formik: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
  student: PropTypes.object,
};

