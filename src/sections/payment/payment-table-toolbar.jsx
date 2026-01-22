import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { Box, Chip, Stack, TextField } from '@mui/material';

import { FeeApi, StudentApi } from 'src/api';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/old-select/select';

// ----------------------------------------------------------------------

export default function PaymentTableToolbar({
  numSelected,
  filterName,
  onFilterName,
  selectedUser,
  selectedFee,
  selectedRegNumber,
  onUserChange,
  onFeeChange,
  onRegNumberChange,
}) {
  const { data: users } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
  });

  const { data: fees } = useQuery({
    queryKey: ['fees'],
    queryFn: FeeApi.getFees,
  });

  const userOptions =
    users?.map((user) => ({
      name: `${user?.personalInfo?.firstName || ''} ${user?.personalInfo?.lastName || ''}`.trim() || user?.email || 'Unknown',
      value: user._id,
    })) || [];

  const feeOptions =
    fees?.map((fee) => ({
      name: fee.name || 'Unknown',
      value: fee._id,
    })) || [];

  const handleClearUser = () => {
    onUserChange('');
  };

  const handleClearFee = () => {
    onFeeChange('');
  };

  const handleClearRegNumber = () => {
    onRegNumberChange('');
  };
  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
          <OutlinedInput
            value={filterName}
            onChange={onFilterName}
            placeholder="Search payment..."
            startAdornment={
              <InputAdornment position="start">
                <Iconify
                  icon="eva:search-fill"
                  sx={{ color: 'text.disabled', width: 20, height: 20 }}
                />
              </InputAdornment>
            }
            sx={{ flex: 1, maxWidth: 300 }}
          />
          <Box sx={{ width: 200 }}>
            <CustomSelect
              list={userOptions}
              value={selectedUser}
              setValue={onUserChange}
              label="Filter by User"
            />
          </Box>
          {selectedUser && (
            <Chip
              label={`User: ${userOptions.find((u) => u.value === selectedUser)?.name || ''}`}
              onDelete={handleClearUser}
              size="small"
            />
          )}
          <Box sx={{ width: 200 }}>
            <CustomSelect
              list={feeOptions}
              value={selectedFee}
              setValue={onFeeChange}
              label="Filter by Fee"
            />
          </Box>
          {selectedFee && (
            <Chip
              label={`Fee: ${feeOptions.find((f) => f.value === selectedFee)?.name || ''}`}
              onDelete={handleClearFee}
              size="small"
            />
          )}
          <TextField
            size="small"
            label="Registration Number"
            value={selectedRegNumber}
            onChange={(e) => onRegNumberChange(e.target.value)}
            placeholder="e.g., BNS/2024/001"
            sx={{ width: 200 }}
          />
          {selectedRegNumber && (
            <Chip
              label={`Reg: ${selectedRegNumber}`}
              onDelete={handleClearRegNumber}
              size="small"
            />
          )}
        </Stack>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
            <Iconify icon="eva:trash-2-fill" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <Iconify icon="ic:round-filter-list" />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

PaymentTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  selectedUser: PropTypes.string,
  selectedFee: PropTypes.string,
  selectedRegNumber: PropTypes.string,
  onUserChange: PropTypes.func,
  onFeeChange: PropTypes.func,
  onRegNumberChange: PropTypes.func,
};
