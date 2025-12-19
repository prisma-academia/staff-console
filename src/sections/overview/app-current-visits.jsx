import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, styled, useTheme } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';
import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

const CHART_HEIGHT = 380;
const LEGEND_HEIGHT = 100;

const StyledChart = styled(Chart)(({ theme }) => ({
  height: CHART_HEIGHT,
  '& .apexcharts-canvas, .apexcharts-inner, svg, foreignObject': {
    height: `100% !important`,
  },
  '& .apexcharts-legend': {
    height: LEGEND_HEIGHT,
    borderTop: `solid 1px ${alpha(theme.palette.grey[500], 0.12)}`,
    top: `calc(${CHART_HEIGHT - LEGEND_HEIGHT}px) !important`,
  },
}));

// ----------------------------------------------------------------------

export default function AppCurrentVisits({ title, subheader, chart, ...other }) {
  const theme = useTheme();
  const [viewType, setViewType] = useState('pie');

  const { colors, series, options } = chart;

  const chartSeries = series.map((i) => i.value);

  const chartOptions = useChart({
    chart: {
      sparkline: {
        enabled: true,
      },
      background: 'transparent',
      fontFamily: theme.typography.fontFamily,
    },
    colors,
    labels: series.map((i) => i.label),
    stroke: {
      colors: [theme.palette.background.paper],
    },
    fill: {
      opacity: 0.8,
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.8,
        opacityTo: 0.6,
      },
    },
    legend: {
      floating: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontWeight: 500,
      markers: {
        radius: 4,
        width: 12,
        height: 12,
      },
      itemMargin: {
        horizontal: 10,
      },
      fontFamily: theme.typography.fontFamily,
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily,
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false,
      },
      formatter: (value, opts) => 
        // const name = opts.w.globals.labels[opts.seriesIndex];
         `${value}%`
      ,
    },
    tooltip: {
      fillSeriesColor: false,
      style: {
        fontSize: '12px',
        fontFamily: theme.typography.fontFamily,
      },
      y: {
        formatter: (value) => fNumber(value),
        title: {
          formatter: (seriesName) => `${seriesName}`,
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: false,
          },
        },
      },
    },
    ...options,
  });

  const chartPieOptions = {
    ...chartOptions,
    chart: {
      ...chartOptions.chart,
      type: 'pie',
    },
  };

  const chartDonutOptions = {
    ...chartOptions,
    chart: {
      ...chartOptions.chart,
      type: 'donut',
    },
    plotOptions: {
      ...chartOptions.plotOptions,
      pie: {
        ...chartOptions.plotOptions?.pie,
        donut: {
          ...chartOptions.plotOptions?.pie?.donut,
          labels: {
            show: true,
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 600,
              formatter: (val) => fNumber(val),
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return fNumber(sum);
              },
            },
          },
        },
      },
    },
  };

  return (
    <Card
      {...other}
      sx={{
        height: '100%',
        boxShadow: thm=> `0 2px 16px 0 ${alpha(thm.palette.grey[500], 0.08)}`,
        borderRadius: 3,
        ...other.sx
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        }
        subheader={subheader}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tabs
              value={viewType}
              onChange={(e, newValue) => setViewType(newValue)}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                },
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              <Tab value="pie" label="Pie" />
              <Tab value="donut" label="Donut" />
            </Tabs>
            
            <IconButton size="small" sx={{ p: 0.75 }}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        }
        sx={{
          padding: 3,
          '& .MuiCardHeader-action': {
            alignSelf: 'center',
          },
        }}
      />

      <Box sx={{ p: 3, pb: 5, position: 'relative' }}>
        <StyledChart
          dir="ltr"
          type={viewType === 'pie' ? 'pie' : 'donut'}
          series={chartSeries}
          options={viewType === 'pie' ? chartPieOptions : chartDonutOptions}
          width="100%"
          height={280}
        />
      </Box>
    </Card>
  );
}

AppCurrentVisits.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
};
