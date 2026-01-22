import PropTypes from 'prop-types';

import {
  Box,
  Card,
  Chip,
  Stack,
  Paper,
  Table,
  Divider,
  useTheme,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const gradeColors = {
  'A': 'success',
  'B': 'info',
  'C': 'warning',
  'D': 'error',
};

const getGpaColor = (gpa) => {
  if (gpa >= 3.5) return 'success';
  if (gpa >= 2.5) return 'info';
  return 'warning';
};

export default function AcademicTab({ student }) {
  const theme = useTheme();
  const academicResults = student?.results || [];

  return (
    <Card sx={{ boxShadow: theme.shadows[2] }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 3, py: 2 }}
        spacing={1}
      >
        <Iconify icon="mdi:school" color={theme.palette.primary.main} />
        <Typography variant="h6" fontWeight={600}>
          Academic Performance
        </Typography>
      </Stack>
      <Divider />

      {academicResults && academicResults.length > 0 ? (
        academicResults.map((semester, index) => (
          <Box key={index} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                {semester.session} - {semester.semester}
              </Typography>
              <Chip
                label={`GPA: ${semester.gpa}`}
                color={getGpaColor(semester.gpa)}
                size="small"
              />
            </Stack>

            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Course Title</TableCell>
                    <TableCell align="center">Credit Units</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Grade Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {semester.courses && semester.courses.map((course, courseIndex) => (
                    <TableRow key={courseIndex}>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell align="center">{course.credits}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={course.grade}
                          color={gradeColors[course.grade] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{course.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No academic records found.</Typography>
        </Box>
      )}
    </Card>
  );
}

AcademicTab.propTypes = {
  student: PropTypes.object,
};

