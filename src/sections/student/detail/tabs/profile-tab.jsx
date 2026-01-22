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
import CustomSelect from 'src/components/select';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const stateOptions = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

export default function ProfileTab({ formik, editMode, student, programs, classLevels }) {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Academic Information - Only show when in edit mode */}
      {editMode && (
        <Grid item xs={12}>
          <Card sx={{ p: 3, boxShadow: theme.shadows[2] }}>
            <Stack direction="row" alignItems="center" mb={2} spacing={1}>
              <Iconify icon="mdi:school" color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight={600}>
                Academic Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <CustomSelect
                  data={programs || []}
                  label="Program"
                  name="program"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <CustomSelect
                  data={classLevels || []}
                  label="Class Level"
                  name="classLevel"
                  formik={formik}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      )}

      {/* Personal Information */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
          <Stack direction="row" alignItems="center" mb={2} spacing={1}>
            <Iconify icon="mdi:account" color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={600}>
              Personal Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {editMode ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="personalInfo.firstName"
                  value={formik.values.personalInfo.firstName}
                  onChange={formik.handleChange}
                  error={formik.touched.personalInfo?.firstName && Boolean(formik.errors.personalInfo?.firstName)}
                  helperText={formik.touched.personalInfo?.firstName && formik.errors.personalInfo?.firstName}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="personalInfo.lastName"
                  value={formik.values.personalInfo.lastName}
                  onChange={formik.handleChange}
                  error={formik.touched.personalInfo?.lastName && Boolean(formik.errors.personalInfo?.lastName)}
                  helperText={formik.touched.personalInfo?.lastName && formik.errors.personalInfo?.lastName}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="personalInfo.middleName"
                  value={formik.values.personalInfo.middleName}
                  onChange={formik.handleChange}
                  error={formik.touched.personalInfo?.middleName && Boolean(formik.errors.personalInfo?.middleName)}
                  helperText={formik.touched.personalInfo?.middleName && formik.errors.personalInfo?.middleName}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Gender"
                  name="personalInfo.gender"
                  value={formik.values.personalInfo.gender}
                  onChange={formik.handleChange}
                  error={formik.touched.personalInfo?.gender && Boolean(formik.errors.personalInfo?.gender)}
                  helperText={formik.touched.personalInfo?.gender && formik.errors.personalInfo?.gender}
                  size="small"
                  select
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  name="personalInfo.dateOfBirth"
                  value={formik.values.personalInfo.dateOfBirth || ''}
                  onChange={formik.handleChange}
                  error={formik.touched.personalInfo?.dateOfBirth && Boolean(formik.errors.personalInfo?.dateOfBirth)}
                  helperText={formik.touched.personalInfo?.dateOfBirth && formik.errors.personalInfo?.dateOfBirth}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="contactInfo.email"
                  value={formik.values.contactInfo.email}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo?.email && Boolean(formik.errors.contactInfo?.email)}
                  helperText={formik.touched.contactInfo?.email && formik.errors.contactInfo?.email}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="contactInfo.phone"
                  value={formik.values.contactInfo.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo?.phone && Boolean(formik.errors.contactInfo?.phone)}
                  helperText={formik.touched.contactInfo?.phone && formik.errors.contactInfo?.phone}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  name="contactInfo.state"
                  value={formik.values.contactInfo.state}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo?.state && Boolean(formik.errors.contactInfo?.state)}
                  helperText={formik.touched.contactInfo?.state && formik.errors.contactInfo?.state}
                  size="small"
                  select
                >
                  <MenuItem value="">Select State</MenuItem>
                  {stateOptions.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="LGA"
                  name="contactInfo.lga"
                  value={formik.values.contactInfo.lga}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo?.lga && Boolean(formik.errors.contactInfo?.lga)}
                  helperText={formik.touched.contactInfo?.lga && formik.errors.contactInfo?.lga}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="contactInfo.address"
                  value={formik.values.contactInfo.address}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo?.address && Boolean(formik.errors.contactInfo?.address)}
                  helperText={formik.touched.contactInfo?.address && formik.errors.contactInfo?.address}
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.personalInfo?.firstName} {student?.personalInfo?.middleName} {student?.personalInfo?.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.personalInfo?.gender || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {formatDate(student?.personalInfo?.dateOfBirth)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.contactInfo?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.contactInfo?.phone || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Enrollment Date
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {formatDate(student?.enrollmentDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.contactInfo?.address ? `${student.contactInfo.address}, ${student.contactInfo.lga || ''}, ${student.contactInfo.state || ''}` : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Card>
      </Grid>

      {/* Guardian Information */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
          <Stack direction="row" alignItems="center" mb={2} spacing={1}>
            <Iconify icon="mdi:account-supervisor" color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={600}>
              Guardian Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {editMode ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Guardian Name"
                  name="guardianInfo.guardianName"
                  value={formik.values.guardianInfo.guardianName}
                  onChange={formik.handleChange}
                  error={formik.touched.guardianInfo?.guardianName && Boolean(formik.errors.guardianInfo?.guardianName)}
                  helperText={formik.touched.guardianInfo?.guardianName && formik.errors.guardianInfo?.guardianName}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Relationship"
                  name="guardianInfo.relationship"
                  value={formik.values.guardianInfo.relationship}
                  onChange={formik.handleChange}
                  error={formik.touched.guardianInfo?.relationship && Boolean(formik.errors.guardianInfo?.relationship)}
                  helperText={formik.touched.guardianInfo?.relationship && formik.errors.guardianInfo?.relationship}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="guardianInfo.guardianPhone"
                  value={formik.values.guardianInfo.guardianPhone}
                  onChange={formik.handleChange}
                  error={formik.touched.guardianInfo?.guardianPhone && Boolean(formik.errors.guardianInfo?.guardianPhone)}
                  helperText={formik.touched.guardianInfo?.guardianPhone && formik.errors.guardianInfo?.guardianPhone}
                  size="small"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Guardian Name
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.guardianInfo?.guardianName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Relationship
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.guardianInfo?.relationship || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {student?.guardianInfo?.guardianPhone || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Card>
      </Grid>
    </Grid>
  );
}

ProfileTab.propTypes = {
  formik: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
  student: PropTypes.object,
  programs: PropTypes.array,
  classLevels: PropTypes.array,
};

