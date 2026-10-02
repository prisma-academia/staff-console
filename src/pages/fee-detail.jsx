import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import config from 'src/config';
import { FeeApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import EditFee from 'src/sections/fee/edit-fee';
import FeeDetailsContent from 'src/sections/fee/fee-details-content';
import { formatDate, sessionLabel, feeStatusColor, formatCurrency } from 'src/sections/fee/fee-format';

export default function FeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [editOpen, setEditOpen] = useState(false);

  const { data: fee, isLoading } = useQuery({
    queryKey: ['fee', id],
    queryFn: () => FeeApi.getFeeById(id),
    enabled: !!id,
  });

  const hasPayments = (fee?.payment?.paidStudents || 0) > 0;

  const deleteMutation = useMutation({
    mutationFn: () => FeeApi.deleteFee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar('Fee deleted successfully', { variant: 'success' });
      navigate('/fee');
    },
    onError: (error) => enqueueSnackbar(error.message || 'Failed to delete fee', { variant: 'error' }),
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this fee?')) deleteMutation.mutate();
  };

  return (
    <>
      <Helmet>
        <title>{fee?.name ? `${fee.name} | Fees` : 'Fee Details'} | {config.appName}</title>
      </Helmet>
      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: { xs: 2, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'flex-start' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <IconButton onClick={() => navigate('/fee')} aria-label="Back to fees" sx={{ mt: 0.25 }}>
                <Iconify icon="eva:arrow-back-fill" />
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" fontWeight="700" sx={{ wordBreak: 'break-word' }}>
                  {fee?.name || 'Fee details'}
                </Typography>
                {fee && (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {fee.session && (
                      <Chip size="small" icon={<Iconify icon="solar:calendar-linear" width={16} />} label={sessionLabel(fee.session)} />
                    )}
                    <Label color={feeStatusColor(fee.status)}>{fee.status}</Label>
                    {fee.isActive === false && <Label color="default">Inactive</Label>}
                    <Typography variant="body2" color="text.secondary">
                      {[fee.feeType, fee.semester, `${formatCurrency(fee.amount)} per student`, `due ${formatDate(fee.dueDate)}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>

            {fee && (
              <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:edit-fill" />}
                  onClick={() => setEditOpen(true)}
                  sx={{ flexGrow: { xs: 1, md: 0 } }}
                >
                  Edit
                </Button>
                <Tooltip title={hasPayments ? 'Cannot delete a fee with completed payments' : ''}>
                  <span style={{ display: 'flex', flexGrow: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Iconify icon="eva:trash-2-fill" />}
                      disabled={hasPayments || deleteMutation.isPending}
                      onClick={handleDelete}
                      sx={{ flexGrow: 1 }}
                    >
                      Delete
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            )}
          </Stack>

          <FeeDetailsContent feeDetails={fee} isLoading={isLoading} />
        </Box>
      </Container>

      {fee && <EditFee open={editOpen} setOpen={setEditOpen} fee={fee} />}
    </>
  );
}
