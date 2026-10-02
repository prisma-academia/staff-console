import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { formatDate, sessionLabel, formatCurrency } from '../fee-format';

const STUDENT_CHIP_LIMIT = 30;

function Field({ label, children, xs = 12, sm = 6, md = 4 }) {
  return (
    <Grid item xs={xs} sm={sm} md={md}>
      <Typography variant="caption" color="text.secondary" component="div">
        {label}
      </Typography>
      <Box sx={{ mt: 0.5, typography: 'body2' }}>{children}</Box>
    </Grid>
  );
}

Field.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
};

function ChipList({ items, empty, getLabel }) {
  if (!items?.length) {
    return (
      <Typography variant="body2" color="text.disabled">
        {empty}
      </Typography>
    );
  }
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
      {items.map((item, index) => (
        <Chip key={item?._id || index} size="small" variant="outlined" label={getLabel(item)} />
      ))}
    </Stack>
  );
}

ChipList.propTypes = {
  items: PropTypes.array,
  empty: PropTypes.string,
  getLabel: PropTypes.func,
};

export default function FeeInfoTab({ fee }) {
  const students = fee.students || [];
  const gateways = Array.isArray(fee.gateway) ? fee.gateway : [fee.gateway].filter(Boolean);
  const untargeted = !fee.programs?.length && !fee.classLevels?.length && !students.length;

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      <Grid container spacing={2.5}>
        <Field label="Fee type">{fee.feeType || '—'}</Field>
        <Field label="Session">{sessionLabel(fee.session) || '—'}</Field>
        <Field label="Semester">{fee.semester || '—'}</Field>
        <Field label="Amount per student">{formatCurrency(fee.amount)}</Field>
        <Field label="Due date">{formatDate(fee.dueDate)}</Field>
        <Field label="Active">{fee.isActive === false ? 'No' : 'Yes'}</Field>
        <Field label="Payment gateway(s)">
          <ChipList items={gateways} empty="None" getLabel={(g) => g} />
        </Field>
        <Field label="Created">
          {formatDate(fee.createdAt)}
          {fee.createdBy && ` by ${[fee.createdBy.firstName, fee.createdBy.lastName].filter(Boolean).join(' ')}`}
        </Field>
        {fee.description && (
          <Field label="Description" sm={12} md={12}>
            {fee.description}
          </Field>
        )}
      </Grid>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Who pays this fee
        </Typography>
        {untargeted ? (
          <Typography variant="body2" color="text.secondary">
            Not targeted — applies to every student who is not disabled.
          </Typography>
        ) : (
          <Grid container spacing={2.5}>
            <Field label="Programmes" md={6}>
              <ChipList items={fee.programs} empty="Any programme" getLabel={(p) => p?.name || p?.code || p} />
            </Field>
            <Field label="Class levels" md={6}>
              <ChipList items={fee.classLevels} empty="Any class level" getLabel={(c) => c?.name || c} />
            </Field>
            {students.length > 0 && (
              <Field label={`Individually added students (${students.length})`} sm={12} md={12}>
                <ChipList
                  items={students.slice(0, STUDENT_CHIP_LIMIT)}
                  empty=""
                  getLabel={(s) => s?.regNumber || [s?.personalInfo?.firstName, s?.personalInfo?.lastName].join(' ')}
                />
                {students.length > STUDENT_CHIP_LIMIT && (
                  <Typography variant="caption" color="text.secondary">
                    and {students.length - STUDENT_CHIP_LIMIT} more — see the Students tab
                  </Typography>
                )}
              </Field>
            )}
          </Grid>
        )}
      </Box>

      {fee.items?.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Items
          </Typography>
          <TableContainer sx={{ maxHeight: 360, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" stickyHeader sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fee.items.map((item, index) => (
                  <TableRow key={item._id || index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.quantity * item.price)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(fee.amount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}

FeeInfoTab.propTypes = {
  fee: PropTypes.object.isRequired,
};
