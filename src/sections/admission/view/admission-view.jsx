import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import {
  Chip,
  Card,
  Stack,
  alpha,
  Button,
  useTheme,
  Container,
  IconButton,
  Typography,
} from '@mui/material';

import { listAdmissions } from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddAdmission from '../add-admission';
import AddStudentModal from '../add-student';

const columns = [
  {
    id: 'fullName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '25%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {[row.application?.firstName, row.application?.lastName, row.application?.otherName]
          .filter(Boolean)
          .join(' ') || '—'}
      </Typography>
    ),
  },
  {
    id: 'number',
    label: 'Admission Number',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2" fontWeight={500}>
        {row.number}
      </Typography>
    ),
  },
  {
    id: 'programme',
    label: 'Programme',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.programme?.name ?? row.programme ?? 'N/A'}
      </Typography>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    cellSx: { width: '15%' },
    renderCell: (row) => {
      const status = (row?.status || 'pending').toLowerCase();
      const statusConfig = {
        accepted: { label: 'Accepted', color: 'success' },
        offered: { label: 'Offered', color: 'info' },
        pending: { label: 'Pending', color: 'warning' },
        declined: { label: 'Declined', color: 'error' },
      };
      const config = statusConfig[status] || { label: row?.status || 'Pending', color: 'default' };
      return <Chip label={config.label} color={config.color} size="small" sx={{ borderRadius: 1 }} />;
    },
  },
  {
    id: 'offerDate',
    label: 'Offer Date',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.offerDate ? new Date(row.offerDate).toLocaleDateString() : 'N/A'}
      </Typography>
    ),
  },
  { id: 'action', label: 'Action', cellSx: { width: '5%' } },
];

export default function AdmissionPage() {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [openAdmsModal, setOpenAdmsModal] = useState(false);
  const [modalObj, setModalObj] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');

  const queryParams = {
    page: page + 1,
    limit: rowsPerPage,
    sortBy,
    sortOrder,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', queryParams],
    queryFn: async () => {
      const result = await listAdmissions(queryParams);
      if (!result.ok) throw new Error(result.message);
      return result;
    },
  });

  const rows = data?.data?.data ?? [];
  const pagination = data?.data?.pagination ?? {
    total: 0,
    page: 1,
    limit: rowsPerPage,
    pages: 0,
  };

  const handleOpen = (obj) => {
    setOpenModal(true);
    setModalObj(obj);
  };

  const handleClose = () => {
    setOpenModal(false);
    setModalObj(null);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const columnsWithActions = columns.map((col) => {
    if (col.id === 'action') {
      return {
        ...col,
        renderCell: (row) => (
          <Stack direction="row" spacing={1}>
            <IconButton
              color="primary"
              size="small"
              sx={{
                boxShadow: `0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpen(row);
              }}
            >
              <Iconify icon="eva:edit-fill" />
            </IconButton>
          </Stack>
        ),
      };
    }
    return col;
  });

  return (
    <Container maxWidth="xl">
      {modalObj && <AddStudentModal open={openModal} handleClose={handleClose} object={modalObj} />}

      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Admissions
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage student admissions and enrollments
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenAdmsModal(true)}
              sx={{
                px: 3,
                boxShadow: theme.customShadows?.primary,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              New Admission
            </Button>
            <Button variant="outlined" startIcon={<Iconify icon="eva:download-fill" />} sx={{ px: 3 }} disabled>
              Export
            </Button>
          </Stack>
        </Box>

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          <GenericTable
            data={rows}
            columns={columnsWithActions}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            manualPagination
            count={pagination.total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            toolbarProps={{
              searchPlaceholder: 'Search admissions...',
              toolbarTitle: 'Admissions List',
            }}
          />
        </Card>
      </Box>

      <AddAdmission open={openAdmsModal} setOpen={setOpenAdmsModal} />
    </Container>
  );
}
