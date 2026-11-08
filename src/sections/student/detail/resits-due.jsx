import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Box, Chip, Alert, Stack, Button, Tooltip, AlertTitle, Typography } from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { ResitApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';

import { formatPrice } from 'src/sections/resit/resit-format';
import RegisterResitDialog from 'src/sections/resit/register-resit-dialog';

// ----------------------------------------------------------------------

/** Where a failed course stands for its resit, from GET /resit/students/:id. */
export function resitDueState(course) {
  const state = course.registration?.state;
  if (state === 'paid') return { label: 'Paid', color: 'success', ready: true };
  if (state === 'waived') return { label: 'Fee waived', color: 'info', ready: true };
  if (state === 'pending_payment') {
    return {
      label: course.registration.paymentStarted ? 'Paying' : 'Awaiting payment',
      color: 'warning',
      ready: false,
    };
  }
  if (course.price === null || course.price === undefined) {
    return { label: 'No resit fee', color: 'default', ready: true };
  }
  return { label: `Not registered · ${formatPrice(course.price)}`, color: 'error', ready: false };
}

/**
 * Courses a student failed and has not passed yet, each with its resit state, plus the
 * actions that move it on: register (and pay or waive), then record the resit score.
 * Falls back to plain course codes for staff who can't see resits.
 */
export default function ResitsDue({ student, outstanding }) {
  const navigate = useNavigate();
  const { check } = usePermissions();
  const canViewResits = check(PERMISSIONS.VIEW_RESIT);
  const canRegister = check(PERMISSIONS.MANAGE_RESIT);
  const canRecord = check(PERMISSIONS.REVISE_RESULT);
  const [registerOpen, setRegisterOpen] = useState(false);
  const studentId = student?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['resit', 'student', studentId],
    queryFn: () => ResitApi.getStudent(studentId),
    enabled: canViewResits && Boolean(studentId) && outstanding.length > 0,
  });
  const courses = data?.courses || [];
  const registrable = courses.some((c) => c.canRegister);

  if (!outstanding.length) return null;

  const plain = !canViewResits || (!isLoading && !courses.length);

  return (
    <Alert
      severity="warning"
      icon={<Iconify icon="mdi:restore" width={22} />}
      sx={{ mt: 2, '& .MuiAlert-message': { width: '100%' } }}
    >
      <AlertTitle sx={{ mb: 1 }}>
        {outstanding.length === 1 ? '1 course to resit' : `${outstanding.length} courses to resit`}
      </AlertTitle>

      {plain && (
        <Typography variant="body2">
          {outstanding
            .map((c) => `${c.code}${c.attempts > 1 ? ` (${c.attempts} attempts)` : ''}`)
            .join(', ')}
        </Typography>
      )}

      {!plain && (
        <Stack spacing={1}>
          {isLoading && (
            <Typography variant="body2" color="text.secondary">
              Checking resit payments...
            </Typography>
          )}
          {courses.map((course) => {
            const state = resitDueState(course);
            return (
              <Stack
                key={course.resultId}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} component="span">
                    {course.course?.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="span">
                    {' '}
                    · {course.course?.name} · failed {course.score} {course.grade} in{' '}
                    {course.session?.name} {course.semester}
                  </Typography>
                </Box>
                <Chip size="small" label={state.label} color={state.color} variant="outlined" />
                {canRecord && state.ready && (
                  <Tooltip title="Enter the resit score on the Resits page">
                    <Button
                      size="small"
                      color="inherit"
                      endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                      onClick={() =>
                        navigate(`/resit?tab=scores&course=${course.course?._id || ''}`)
                      }
                    >
                      Record score
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}

      {canRegister && canViewResits && registrable && (
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => setRegisterOpen(true)}
          sx={{ mt: 1.5 }}
        >
          Register for resits
        </Button>
      )}

      {canRegister && (
        <RegisterResitDialog
          open={registerOpen}
          initialStudent={student}
          onClose={() => setRegisterOpen(false)}
        />
      )}
    </Alert>
  );
}

ResitsDue.propTypes = {
  student: PropTypes.object,
  outstanding: PropTypes.array.isRequired,
};
