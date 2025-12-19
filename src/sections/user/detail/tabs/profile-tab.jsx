import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Divider,
  useTheme,
  TextField,
  Typography,
} from '@mui/material';

import { userGroupApi } from 'src/api';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

const genderOptions = [
  { _id: 'Male', name: 'Male' },
  { _id: 'Female', name: 'Female' },
  { _id: 'Other', name: 'Other' },
];

export default function ProfileTab({ formik, editMode, isAddMode = false, roleOptions = [] }) {
  const theme = useTheme();

  const { data: userGroups = [] } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupApi.getGroups(),
  });

  const departments = useMemo(
    () => (userGroups || []).filter((group) => group.type === 'department'),
    [userGroups]
  );

  const nonDepartmentGroups = useMemo(
    () => (userGroups || []).filter((group) => group.type !== 'department'),
    [userGroups]
  );

  const getInitials = () => {
    const firstName = formik.values.firstName || '';
    const lastName = formik.values.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <Grid container spacing={3}>
      {/* Personal Information */}
      <Grid item xs={12}>
        <Card
          sx={{
            p: 3,
            boxShadow: (thm) => thm.shadows[2],
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Iconify icon="eva:person-fill" sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" fontWeight={600}>
              Personal Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            {!editMode && (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 48,
                  }}
                >
                  {getInitials()}
                </Avatar>
              </Grid>
            )}

            <Grid item xs={12} sm={4}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    First Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.firstName || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.lastName || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="middleName"
                  value={formik.values.middleName}
                  onChange={formik.handleChange}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Middle Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.middleName || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                  helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.dateOfBirth
                      ? new Date(formik.values.dateOfBirth).toLocaleDateString()
                      : '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              {editMode ? (
                <CustomSelect data={genderOptions} label="Gender" name="gender" formik={formik} />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.gender || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Card>
      </Grid>

      {/* Contact Information */}
      <Grid item xs={12}>
        <Card
          sx={{
            p: 3,
            boxShadow: (thm) => thm.shadows[2],
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Iconify icon="eva:email-fill" sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" fontWeight={600}>
              Contact Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.email || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Internal Email"
                  name="internalEmail"
                  value={formik.values.internalEmail}
                  onChange={formik.handleChange}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Internal Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.internalEmail || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.phone || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            {isAddMode && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Temporary Password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={formik.values.address}
                  onChange={formik.handleChange}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.address || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Card>
      </Grid>

      {/* Account Information */}
      <Grid item xs={12}>
        <Card
          sx={{
            p: 3,
            boxShadow: (thm) => thm.shadows[2],
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Iconify icon="eva:settings-fill" sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" fontWeight={600}>
              Account Information
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              {editMode ? (
                <CustomSelect data={roleOptions} label="Role" name="role" formik={formik} />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                    {formik.values.role || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                  {formik.values.status || '—'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              {editMode ? (
                <CustomSelect
                  data={departments}
                  label="Department"
                  name="department"
                  formik={formik}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.departmentName || '—'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              {editMode ? (
                <CustomSelect
                  data={nonDepartmentGroups}
                  label="User Groups"
                  name="groups"
                  formik={formik}
                  multiple
                  showSelectedCount
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    User Groups
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formik.values.groupsNames?.length > 0
                      ? formik.values.groupsNames.join(', ')
                      : '—'}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Card>
      </Grid>

      {/* Instructor Information */}
      {formik.values.role === 'instructor' && (
        <Grid item xs={12}>
          <Card
            sx={{
              p: 3,
              boxShadow: (thm) => thm.shadows[2],
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Iconify icon="eva:briefcase-fill" sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" fontWeight={600}>
                Instructor Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Employee ID"
                    name="employeeId"
                    value={formik.values.employeeId}
                    onChange={formik.handleChange}
                    error={formik.touched.employeeId && Boolean(formik.errors.employeeId)}
                    helperText={formik.touched.employeeId && formik.errors.employeeId}
                  />
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Employee ID
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formik.values.employeeId || '—'}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Hire Date"
                    name="hireDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.hireDate}
                    onChange={formik.handleChange}
                    error={formik.touched.hireDate && Boolean(formik.errors.hireDate)}
                    helperText={formik.touched.hireDate && formik.errors.hireDate}
                  />
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Hire Date
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formik.values.hireDate
                        ? new Date(formik.values.hireDate).toLocaleDateString()
                        : '—'}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Qualifications (comma-separated)"
                    name="qualifications"
                    multiline
                    rows={2}
                    value={formik.values.qualifications}
                    onChange={formik.handleChange}
                    placeholder="e.g., PhD in Computer Science, Master's in Education"
                  />
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Qualifications
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formik.values.qualifications || '—'}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}

ProfileTab.propTypes = {
  formik: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
  isAddMode: PropTypes.bool,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
};

