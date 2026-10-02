import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { FeeApi } from 'src/api';

import { ExportMenu } from 'src/components/export';
import { GenericTable } from 'src/components/generic-table';

import FeeProgress from '../fee-progress';
import { formatCurrency } from '../fee-format';

const GROUP_LABELS = { program: 'Programme', classLevel: 'Class level' };

// Expected vs collected per programme or class level. Clicking a row opens the
// Students tab filtered to that group.
export default function FeeBreakdownTab({ fee, groupBy, onGroupByChange, onSelectGroup }) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['fee', fee._id, 'breakdown', groupBy],
    queryFn: () => FeeApi.getFeeBreakdown(fee._id, { groupBy }),
  });
  const rows = (data?.data ?? []).map((row) => ({ ...row, rowId: String(row._id ?? 'none') }));

  const columns = [
    {
      id: 'name',
      label: GROUP_LABELS[groupBy],
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      ),
    },
    { id: 'students', label: 'Students', align: 'right', renderCell: (row) => row.students.toLocaleString() },
    { id: 'paidStudents', label: 'Paid', align: 'right', renderCell: (row) => row.paidStudents.toLocaleString() },
    { id: 'expected', label: 'Expected', align: 'right', renderCell: (row) => formatCurrency(row.expected) },
    { id: 'made', label: 'Collected', align: 'right', renderCell: (row) => formatCurrency(row.made) },
    { id: 'outstanding', label: 'Outstanding', align: 'right', renderCell: (row) => formatCurrency(row.outstanding) },
    { id: 'progress', label: 'Progress', renderCell: (row) => <FeeProgress value={row.progress} /> },
  ];

  const exportColumns = [
    { key: 'name', label: GROUP_LABELS[groupBy] },
    { key: 'students', label: 'Students' },
    { key: 'paidStudents', label: 'Paid' },
    { key: 'expected', label: 'Expected' },
    { key: 'made', label: 'Collected' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'progress', label: 'Progress %' },
  ];

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap sx={{ p: 2 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={groupBy}
          onChange={(e, value) => value && onGroupByChange(value)}
        >
          <ToggleButton value="program">By programme</ToggleButton>
          <ToggleButton value="classLevel">By class level</ToggleButton>
        </ToggleButtonGroup>
        <ExportMenu
          title={`${fee.name} — by ${GROUP_LABELS[groupBy].toLowerCase()}`}
          fileBase={`${String(fee.name || 'fee').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-breakdown`}
          count={rows.length}
          fetchRows={async () => ({ columns: exportColumns, rows })}
        />
      </Stack>

      <GenericTable
        data={rows}
        columns={columns}
        rowIdField="rowId"
        withToolbar={false}
        withPagination={rows.length > 10}
        initialRowsPerPage={25}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        maxHeight="max(320px, calc(100vh - 480px))"
        onRowClick={(row) => row._id && onSelectGroup(groupBy, row._id)}
      />
    </>
  );
}

FeeBreakdownTab.propTypes = {
  fee: PropTypes.object.isRequired,
  groupBy: PropTypes.oneOf(['program', 'classLevel']).isRequired,
  onGroupByChange: PropTypes.func.isRequired,
  onSelectGroup: PropTypes.func.isRequired,
};
