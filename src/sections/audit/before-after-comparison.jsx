import { useMemo } from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>null</Typography>;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (value instanceof Date) {
      return format(new Date(value), 'PPpp');
    }
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
};

const getFieldStatus = (key, before, after) => {
  if (!(key in before) && key in after) {
    return 'added';
  }
  if (key in before && !(key in after)) {
    return 'removed';
  }
  if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
    return 'changed';
  }
  return 'unchanged';
};

export default function BeforeAfterComparison({ before, after }) {
  const theme = useTheme();

  const { fields, allKeys } = useMemo(() => {
    const beforeObj = before || {};
    const afterObj = after || {};
    const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    
    const fieldData = Array.from(keys).map((key) => ({
      key,
      beforeValue: beforeObj[key],
      afterValue: afterObj[key],
      status: getFieldStatus(key, beforeObj, afterObj),
    }));

    return {
      fields: fieldData,
      allKeys: Array.from(keys),
    };
  }, [before, after]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'added':
        return theme.palette.success.main;
      case 'removed':
        return theme.palette.error.main;
      case 'changed':
        return theme.palette.warning.main;
      default:
        return 'transparent';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'added':
        return alpha(theme.palette.success.main, 0.1);
      case 'removed':
        return alpha(theme.palette.error.main, 0.1);
      case 'changed':
        return alpha(theme.palette.warning.main, 0.1);
      default:
        return 'transparent';
    }
  };

  if (!before && !after) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  if (!before) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Created Data
        </Typography>
        <Box sx={{ mt: 2 }}>
          {allKeys.map((key) => (
            <Box key={key} sx={{ mb: 2, p: 2, bgcolor: getStatusBg('added'), borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {key}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {formatValue(after[key])}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  if (!after) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Deleted Data
        </Typography>
        <Box sx={{ mt: 2 }}>
          {allKeys.map((key) => (
            <Box key={key} sx={{ mb: 2, p: 2, bgcolor: getStatusBg('removed'), borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {key}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {formatValue(before[key])}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Paper sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: `2px solid ${theme.palette.error.main}`, pb: 1 }}>
          Before
        </Typography>
        <Box sx={{ mt: 2 }}>
          {fields.map((field) => (
            <Box
              key={field.key}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: field.status === 'removed' || field.status === 'changed' ? getStatusBg(field.status) : 'transparent',
                borderLeft: field.status !== 'unchanged' ? `3px solid ${getStatusColor(field.status)}` : 'none',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {field.key}
                {field.status !== 'unchanged' && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: getStatusColor(field.status), textTransform: 'uppercase' }}>
                    ({field.status})
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {formatValue(field.beforeValue)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: `2px solid ${theme.palette.success.main}`, pb: 1 }}>
          After
        </Typography>
        <Box sx={{ mt: 2 }}>
          {fields.map((field) => (
            <Box
              key={field.key}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: field.status === 'added' || field.status === 'changed' ? getStatusBg(field.status) : 'transparent',
                borderLeft: field.status !== 'unchanged' ? `3px solid ${getStatusColor(field.status)}` : 'none',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {field.key}
                {field.status !== 'unchanged' && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: getStatusColor(field.status), textTransform: 'uppercase' }}>
                    ({field.status})
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {formatValue(field.afterValue)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}

BeforeAfterComparison.propTypes = {
  before: PropTypes.object,
  after: PropTypes.object,
};
