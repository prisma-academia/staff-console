import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { programApi, classLevelApi } from 'src/api';

import FeeProgress from './fee-progress';
import { formatCurrency } from './fee-format';
import FeeInfoTab from './detail/fee-info-tab';
import FeeStudentsTab from './detail/fee-students-tab';
import FeeBreakdownTab from './detail/fee-breakdown-tab';

const TABS = ['students', 'breakdown', 'details'];
// Students-tab URL params cleared when drilling in from the breakdown.
const STUDENT_PARAMS = ['page', 'search', 'status', 'program', 'classLevel'];

const asList = (data) => (Array.isArray(data) ? data : data?.data ?? []);
const toOptions = (items) => items.map((i) => ({ value: i._id, label: i.name || i.code }));

function Kpi({ label, value, caption, children }) {
  return (
    <Card sx={{ p: 2, height: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
      {children}
    </Card>
  );
}

Kpi.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
  caption: PropTypes.node,
  children: PropTypes.node,
};

export default function FeeDetailsContent({ feeDetails, isLoading }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'students';
  const groupBy = searchParams.get('groupBy') === 'classLevel' ? 'classLevel' : 'program';

  const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: () => programApi.getPrograms() });
  const { data: classLevels } = useQuery({ queryKey: ['classLevels'], queryFn: () => classLevelApi.getClassLevels() });

  const updateParams = (changes) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true }
    );

  if (isLoading || !feeDetails) {
    return isLoading ? (
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={6} md={3} key={i}>
            <Skeleton variant="rounded" height={96} />
          </Grid>
        ))}
        <Grid item xs={12}>
          <Skeleton variant="rounded" height={420} />
        </Grid>
      </Grid>
    ) : null;
  }

  const stats = feeDetails.payment || {};
  const studentCount = feeDetails.studentCount || 0;
  const paidStudents = stats.paidStudents || 0;

  // Filter options: the fee's own targeting when it has one, otherwise everything.
  const programOptions = toOptions(feeDetails.programs?.length ? feeDetails.programs : asList(programs));
  const classLevelOptions = toOptions(feeDetails.classLevels?.length ? feeDetails.classLevels : asList(classLevels));

  const handleSelectGroup = (key, id) =>
    updateParams({
      ...Object.fromEntries(STUDENT_PARAMS.map((p) => [p, ''])),
      tab: 'students',
      [key]: id,
    });

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Kpi
            label="Students"
            value={studentCount.toLocaleString()}
            caption={`${paidStudents.toLocaleString()} paid · ${(studentCount - paidStudents).toLocaleString()} unpaid`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Expected" value={formatCurrency(stats.expected)} caption={`${formatCurrency(feeDetails.amount)} × ${studentCount.toLocaleString()}`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Collected" value={formatCurrency(stats.made)}>
            <Box sx={{ mt: 1 }}>
              <FeeProgress value={stats.progress || 0} minWidth={0} />
            </Box>
          </Kpi>
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Outstanding" value={formatCurrency(stats.outstanding)} caption="Expected minus collected" />
        </Grid>
      </Grid>

      <Card>
        <Tabs
          value={tab}
          onChange={(e, value) => updateParams({ tab: value })}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: 2 }}
        >
          <Tab value="students" label="Students" />
          <Tab value="breakdown" label="Breakdown" />
          <Tab value="details" label="Details" />
        </Tabs>
        <Divider />

        {tab === 'students' && (
          <FeeStudentsTab fee={feeDetails} programOptions={programOptions} classLevelOptions={classLevelOptions} />
        )}
        {tab === 'breakdown' && (
          <FeeBreakdownTab
            fee={feeDetails}
            groupBy={groupBy}
            onGroupByChange={(value) => updateParams({ groupBy: value })}
            onSelectGroup={handleSelectGroup}
          />
        )}
        {tab === 'details' && <FeeInfoTab fee={feeDetails} />}
      </Card>
    </>
  );
}

FeeDetailsContent.propTypes = {
  feeDetails: PropTypes.object,
  isLoading: PropTypes.bool,
};
