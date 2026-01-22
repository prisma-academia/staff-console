import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { 
  Card, 
  Stack, 
  alpha, 
  Button,
  Tooltip,
  useTheme,
  Container,
  Typography,
  IconButton,
  LinearProgress
} from '@mui/material';

import { FeeApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddFee from '../add-fee';
import EditFee from '../edit-fee';
import FeeDetails from '../fee-details';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₦0';
  return `₦${Number(value).toLocaleString()}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const calculatePaymentProgress = (fee) => {
  const expected = fee?.payment?.expected || 0;
  const made = fee?.payment?.made || 0;
  if (expected === 0) return 0;
  return Math.round((made / expected) * 100);
};

export default function FeePage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [viewingFee, setViewingFee] = useState(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: FeeApi.getFees,
  });

  const deleteFeeMutation = useMutation({
    mutationFn: FeeApi.deleteFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar('Fee deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred while deleting the fee';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const handleDelete = (feeId, fee, e) => {
    e.stopPropagation();
    const hasCompletedPayments =
      (fee?.payment?.made || 0) > 0 || (fee?.payment?.completedPayments?.length || 0) > 0;

    if (hasCompletedPayments) {
      enqueueSnackbar('Cannot delete fee with completed payments', { variant: 'error' });
      return;
    }

    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  const handleEdit = (fee, e) => {
    e.stopPropagation();
    setEditingFee(fee);
  };

  const handleView = (fee, e) => {
    e.stopPropagation();
    setViewingFee(fee);
  };

  const columns = [
    { 
      id: 'name', 
      label: 'Name', 
      align: 'left',
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      )
    },
    { 
      id: 'amount', 
      label: 'Amount', 
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2">
          {formatCurrency(row.amount)}
        </Typography>
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      cellSx: { width: '10%' },
      renderCell: (row) => {
        const statusValue = (row.status || '').toLowerCase();
        const labelColor =
          (statusValue === 'pending' && 'error') ||
          (statusValue === 'overdue' && 'warning') ||
          'success';
        return <Label color={labelColor}>{row.status}</Label>;
      }
    },
    { 
      id: 'studentCount', 
      label: 'Students', 
      cellSx: { width: '10%' },
      renderCell: (row) => row.studentCount || 0
    },
    { 
      id: 'paymentExpected', 
      label: 'Expected', 
      cellSx: { width: '10%' },
      renderCell: (row) => formatCurrency(row.payment?.expected || 0)
    },
    { 
      id: 'paymentMade', 
      label: 'Paid', 
      cellSx: { width: '10%' },
      renderCell: (row) => formatCurrency(row.payment?.made || 0)
    },
    { 
      id: 'paymentProgress', 
      label: 'Progress', 
      cellSx: { width: '15%' },
      renderCell: (row) => {
        const progress = calculatePaymentProgress(row);
        const getProgressColor = (val) => {
          if (val === 100) return 'success';
          if (val > 50) return 'info';
          return 'warning';
        };
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={getProgressColor(progress)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
              {progress}%
            </Typography>
          </Box>
        );
      }
    },
    { 
      id: 'createdAt', 
      label: 'Created At', 
      cellSx: { width: '10%' },
      renderCell: (row) => formatDate(row.createdAt)
    },
    { 
      id: 'action', 
      label: '', 
      cellSx: { width: '10%' },
      renderCell: (row) => {
        const hasCompletedPayments =
          (row?.payment?.made || 0) > 0 || (row?.payment?.completedPayments?.length || 0) > 0;

        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="View Details">
              <IconButton onClick={(e) => handleView(row, e)} size="small">
                <Iconify icon="eva:eye-fill" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={hasCompletedPayments ? 'Cannot edit fee with completed payments' : 'Edit Fee'}>
              <span>
                <IconButton onClick={(e) => handleEdit(row, e)} size="small" disabled={hasCompletedPayments}>
                  <Iconify icon="eva:edit-fill" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={hasCompletedPayments ? 'Cannot delete fee with completed payments' : 'Delete Fee'}>
              <span>
                <IconButton
                  onClick={(e) => handleDelete(row._id, row, e)}
                  size="small"
                  disabled={hasCompletedPayments}
                  color="error"
                >
                  <Iconify icon="eva:trash-2-fill" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      }
    },
  ];

  const handleCloseEdit = (value) => {
    if (!value) {
      setEditingFee(null);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Fees Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage school fees, payments, and tracking
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpen(true)}
              sx={{ 
                px: 3,
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              Add Fee
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              sx={{ px: 3 }}
            >
              Export
            </Button>
          </Stack>
        </Box>

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={Array.isArray(data) ? data : []}
            columns={columns}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            onRowClick={(row) => setViewingFee(row)}
            toolbarProps={{
              searchPlaceholder: 'Search fees...',
              toolbarTitle: 'Fees List',
            }}
          />
        </Card>
      </Box>

      <AddFee open={open} setOpen={setOpen}/>
      <EditFee open={Boolean(editingFee)} setOpen={handleCloseEdit} fee={editingFee} />
      <FeeDetails open={Boolean(viewingFee)} setOpen={(value) => !value && setViewingFee(null)} fee={viewingFee} />
    </Container>
  );
}
