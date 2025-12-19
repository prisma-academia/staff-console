import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import { fShortenNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export default function AppWidgetSummary({ 
  title, 
  total, 
  icon, 
  color = 'primary', 
  sx, 
  trend = null,
  chartData = [],
  ...other 
}) {
  const theme = useTheme();
  const getColorGradient = () => {
    if (color === 'primary') {
      return `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`;
    }
    if (color === 'info') {
      return `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.2)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`;
    }
    if (color === 'success') {
      return `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`;
    }
    if (color === 'warning') {
      return `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.2)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`;
    }
    if (color === 'error') {
      return `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.2)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`;
    }
    return `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.2)} 0%, ${alpha(theme.palette.grey[700], 0.1)} 100%)`;
  };
  
  const getIconColor = () => theme.palette[color]?.main || theme.palette.primary.main;
  
  const calculateProgress = () => {
    if (!chartData || chartData.length === 0) return 70;
    
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min;
    
    if (range === 0) return 50;
    
    const current = chartData[chartData.length - 1] - min;
    return (current / range) * 100;
  };

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 3,
        boxShadow: thm=> `0 2px 16px 0 ${alpha(thm.palette.grey[500], 0.08)}`,
        background: getColorGradient(),
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          width: 210,
          height: 210,
          borderRadius: '50%',
          top: -60,
          right: -60,
          background: `linear-gradient(140deg, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0)} 100%)`,
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          bottom: -40,
          left: -40,
          background: `linear-gradient(140deg, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0)} 100%)`,
        },
        ...sx,
      }}
      {...other}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        <Box>
          <Typography variant="h5" paragraph sx={{ mb: 0.5, color: 'text.primary', fontWeight: 700 }}>
            {fShortenNumber(total)}
          </Typography>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
          
          {trend && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Box 
                component="span" 
                sx={{ 
                  color: trend > 0 ? 'success.main' : 'error.main',
                  display: 'inline-flex',
                  alignItems: 'center',
                  typography: 'caption',
                  fontWeight: 600,
                }}
              >
                <Box component="span" sx={{ display: 'inline-flex', mr: 0.5 }}>
                  {trend > 0 ? (
                    <Box component="span" sx={{ display: 'inline-flex' }}>
                      <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1 }}>↑</Box>
                    </Box>
                  ) : (
                    <Box component="span" sx={{ display: 'inline-flex' }}>
                      <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1 }}>↓</Box>
                    </Box>
                  )}
                </Box>
                {Math.abs(trend)}%
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                vs. last period
              </Typography>
            </Stack>
          )}
        </Box>
        
        {icon && (
          <Box 
            sx={{ 
              p: 1.5,
              width: 60,
              height: 60,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: getIconColor(),
              bgcolor: thm=> alpha(thm.palette[color]?.main || thm.palette.primary.main, 0.08),
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
      
      {chartData.length > 0 && (
        <Box sx={{ position: 'relative', zIndex: 1, mt: 'auto' }}>
          <LinearProgress
            variant="determinate"
            value={calculateProgress()}
            color={color}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: thm=> alpha(thm.palette.grey[500], 0.12),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
          />
        </Box>
      )}
    </Card>
  );
}

AppWidgetSummary.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  sx: PropTypes.object,
  title: PropTypes.string,
  total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  trend: PropTypes.number,
  chartData: PropTypes.array,
};
