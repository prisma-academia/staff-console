import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import { MenuItem, TextField } from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { GradingSchemeApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

// ----------------------------------------------------------------------

/**
 * Picks a programme's grading scheme. Empty means "use the default scheme".
 * Users who cannot view schemes see the current one read-only (no request is
 * made, so no permission error pops up).
 */
export default function GradingSchemeSelect({ formik, name = 'gradingScheme', current = null }) {
  const { check } = usePermissions();
  const canView = check(PERMISSIONS.VIEW_GRADING_SCHEME);

  const { data: schemes = [] } = useQuery({
    queryKey: ['grading-schemes'],
    queryFn: () => GradingSchemeApi.getSchemes(),
    enabled: canView,
  });

  const defaultScheme = schemes.find((s) => s.isDefault);
  const options = schemes.filter((s) => s.isActive || s._id === formik.values[name]);
  const selected = schemes.find((s) => s._id === formik.values[name]);

  if (!canView) {
    return (
      <TextField
        fullWidth
        disabled
        label="Grading scheme"
        value={current?.name ? `${current.name} (${current.code})` : 'Default scheme'}
      />
    );
  }

  let helperText = 'How this programme’s results are graded';
  if (selected) helperText = `${selected.maxPoint}-point · pass mark ${selected.passMark}`;
  else if (defaultScheme) helperText = `Uses the default: ${defaultScheme.name}`;
  else if (schemes.length) helperText = 'No default scheme exists: results cannot be computed until a scheme is chosen';
  else helperText = 'Create a grading scheme first (Grading Schemes page)';

  return (
    <TextField
      select
      fullWidth
      label="Grading scheme"
      name={name}
      value={formik.values[name] || ''}
      onChange={(e) => formik.setFieldValue(name, e.target.value)}
      helperText={helperText}
      error={!formik.values[name] && !defaultScheme}
    >
      <MenuItem value="">
        <em>{defaultScheme ? `Default (${defaultScheme.name})` : 'None'}</em>
      </MenuItem>
      {options.map((s) => (
        <MenuItem key={s._id} value={s._id}>
          {s.name} ({s.code})
        </MenuItem>
      ))}
    </TextField>
  );
}

GradingSchemeSelect.propTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string,
  current: PropTypes.object,
};
