import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Chart, { useChart } from 'src/components/chart';

import { SERIES, fCount } from '../utils';

// ----------------------------------------------------------------------
// Shared mark rules: solid hairline grid, 2px lines, 4px rounded bar ends,
// a 2px surface gap between fills, legend only when there are 2+ series.

const SOLID_GRID = { strokeDashArray: 0, padding: { left: 4, right: 8 } };

/** Line/area over time. One y axis only. */
export function TrendChart({ categories, series, type = 'area', colors, valueFormat = fCount, height = 280 }) {
  const options = useChart({
    colors: colors || SERIES,
    grid: SOLID_GRID,
    // monotoneCubic never overshoots below zero the way 'smooth' does.
    stroke: { width: 2, curve: 'monotoneCubic' },
    fill: type === 'area' ? { type: 'gradient', gradient: { opacityFrom: 0.24, opacityTo: 0 } } : { type: 'solid' },
    markers: { size: 0, hover: { size: 5 } },
    legend: { show: series.length > 1 },
    xaxis: {
      categories,
      tickAmount: Math.min(categories.length, 8),
      labels: { rotate: 0, hideOverlappingLabels: true },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { formatter: (v) => valueFormat(v) }, forceNiceScale: true, min: 0 },
    tooltip: { shared: true, intersect: false, y: { formatter: (v) => valueFormat(v) } },
  });

  return <Chart dir="ltr" type={type} series={series} options={options} width="100%" height={height} />;
}

TrendChart.propTypes = {
  categories: PropTypes.array.isRequired,
  series: PropTypes.array.isRequired,
  type: PropTypes.oneOf(['area', 'line']),
  colors: PropTypes.array,
  valueFormat: PropTypes.func,
  height: PropTypes.number,
};

/**
 * Bars. A single series takes one hue for every bar; pass `colors` with
 * `distributed` only for ordered categories (an ordinal ramp).
 */
export function BarChart({
  categories,
  series,
  horizontal = false,
  stacked = false,
  distributed = false,
  colors,
  valueFormat = fCount,
  height = 280,
  max,
}) {
  const options = useChart({
    colors: colors || SERIES,
    chart: { stacked },
    grid: {
      ...SOLID_GRID,
      xaxis: { lines: { show: horizontal } },
      yaxis: { lines: { show: !horizontal } },
    },
    stroke: { show: true, width: 2, colors: ['#FFFFFF'] },
    plotOptions: {
      bar: {
        horizontal,
        distributed,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        columnWidth: series.length > 1 && !stacked ? '56%' : '42%',
        barHeight: series.length > 1 && !stacked ? '72%' : '60%',
      },
    },
    legend: { show: series.length > 1 },
    xaxis: {
      categories,
      // Long category runs (30 days) skip labels rather than rotating them.
      ...(!horizontal && categories.length > 12 && { tickAmount: 10, tickPlacement: 'on' }),
      labels: {
        trim: horizontal,
        rotate: 0,
        hideOverlappingLabels: true,
        ...(horizontal && { formatter: (v) => valueFormat(v) }),
      },
      ...(horizontal && max != null && { max }),
    },
    yaxis: {
      ...(!horizontal && { labels: { formatter: (v) => valueFormat(v) }, min: 0, forceNiceScale: true }),
      ...(!horizontal && max != null && { max }),
      ...(horizontal && { labels: { maxWidth: 180 } }),
    },
    tooltip: { shared: series.length > 1, intersect: false, y: { formatter: (v) => valueFormat(v) } },
  });

  const rows = Math.max(categories.length, 1);
  const autoHeight = horizontal ? Math.max(rows * (series.length > 1 && !stacked ? 44 : 34) + 60, 160) : height;

  return <Chart dir="ltr" type="bar" series={series} options={options} width="100%" height={autoHeight} />;
}

BarChart.propTypes = {
  categories: PropTypes.array.isRequired,
  series: PropTypes.array.isRequired,
  horizontal: PropTypes.bool,
  stacked: PropTypes.bool,
  distributed: PropTypes.bool,
  colors: PropTypes.array,
  valueFormat: PropTypes.func,
  height: PropTypes.number,
  max: PropTypes.number,
};

/** Part-to-whole at a glance; callers fold to at most six slices. */
export function DonutChart({ slices, colors, valueFormat = fCount, totalLabel = 'Total', height = 300 }) {
  const options = useChart({
    colors: colors || SERIES,
    labels: slices.map((s) => s.label),
    stroke: { width: 2, colors: ['#FFFFFF'] },
    legend: { show: true, position: 'bottom', horizontalAlign: 'center' },
    tooltip: { fillSeriesColor: false, y: { formatter: (v) => valueFormat(v), title: { formatter: (s) => `${s}` } } },
    plotOptions: {
      pie: {
        donut: {
          size: '74%',
          labels: {
            value: { formatter: (v) => valueFormat(Number(v)) },
            total: { showAlways: true, label: totalLabel, formatter: (w) => valueFormat(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) },
          },
        },
      },
    },
  });

  return <Chart dir="ltr" type="donut" series={slices.map((s) => s.value)} options={options} width="100%" height={height} />;
}

DonutChart.propTypes = {
  slices: PropTypes.array.isRequired,
  colors: PropTypes.array,
  valueFormat: PropTypes.func,
  totalLabel: PropTypes.string,
  height: PropTypes.number,
};

/**
 * Ranked list with an inline meter: the compact way to show top-N with exact
 * values, readable without hovering.
 */
export function RankList({ rows, color = SERIES[0], valueFormat = fCount, max }) {
  const top = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <Stack spacing={1.75}>
      {rows.map((row, index) => (
        <Box key={row.key || row.label}>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ width: 18, flexShrink: 0 }}>
              {index + 1}
            </Typography>
            <Tooltip title={row.label} placement="top-start" enterDelay={400}>
              <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                {row.label}
              </Typography>
            </Tooltip>
            <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {row.display ?? valueFormat(row.value)}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 3.25 }}>
            <Box sx={{ flexGrow: 1, height: 6, borderRadius: 1, bgcolor: 'grey.200', overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${Math.min((row.value / top) * 100, 100)}%`,
                  height: 1,
                  borderRadius: 1,
                  bgcolor: row.color || color,
                }}
              />
            </Box>
            {row.caption && (
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 64, textAlign: 'right' }}>
                {row.caption}
              </Typography>
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

RankList.propTypes = {
  rows: PropTypes.array.isRequired,
  color: PropTypes.string,
  valueFormat: PropTypes.func,
  max: PropTypes.number,
};

/** Horizontal funnel: each stage's bar is its share of the first stage. */
export function Funnel({ stages, colors }) {
  const first = stages[0]?.count || 0;
  return (
    <Stack spacing={1.5}>
      {stages.map((stage, i) => {
        const share = first ? (stage.count / first) * 100 : 0;
        const prev = i > 0 ? stages[i - 1].count : null;
        const step = prev ? Math.round((stage.count / prev) * 1000) / 10 : null;
        return (
          <Stack key={stage.stage} direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="body2" sx={{ width: 76, flexShrink: 0 }}>
              {stage.stage}
            </Typography>
            <Box sx={{ flexGrow: 1, height: 28, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${Math.max(share, stage.count ? 1.5 : 0)}%`,
                  height: 1,
                  borderRadius: 1,
                  bgcolor: colors[i],
                  transition: 'width 400ms ease',
                }}
              />
            </Box>
            <Box sx={{ width: 96, flexShrink: 0, textAlign: 'right' }}>
              <Typography variant="subtitle2" component="div" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {fCount(stage.count)}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                {step == null ? '100%' : `${step}% of prev.`}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

Funnel.propTypes = { stages: PropTypes.array.isRequired, colors: PropTypes.array.isRequired };
