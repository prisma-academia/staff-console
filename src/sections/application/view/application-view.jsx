import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { Visibility, FileDownload } from '@mui/icons-material';
import { Chip, Card, alpha, Button, useTheme, Container, IconButton, Typography } from '@mui/material';

import { listApplications } from 'src/api/adminApplicationApi';

import { GenericTable } from 'src/components/generic-table';

import ViewModal from '../view.modal';
import ExportModal from '../export.modal';

const columns = [
  {
    id: 'fullName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '20%' },
    renderCell: (row) =>
      [row?.firstName, row?.lastName].filter(Boolean).join(' ') || '—',
  },
  { id: 'number', label: 'Application Number', cellSx: { width: '15%' } },
  {
    id: 'programme',
    label: 'Programme',
    cellSx: { width: '15%' },
    renderCell: (row) =>
      row?.programme?.name ?? row?.programme ?? '—',
  },
  { id: 'stateOfOrigin', label: 'State', cellSx: { width: '10%' } },
  { id: 'lgaOfOrigin', label: 'LGA', cellSx: { width: '10%' } },
  { id: 'email', label: 'Email', cellSx: { width: '15%' } },
  {
    id: 'status',
    label: 'Status',
    cellSx: { width: '10%' },
    renderCell: (row) => {
      const s = (row?.status || '').toLowerCase();
      if (s === 'paid') return <Chip label="Paid" color="success" size="small" />;
      if (s === 'rejected') return <Chip label="Rejected" color="error" size="small" />;
      return <Chip label="Not Paid" color="error" size="small" />;
    },
  },
  {
    id: 'action',
    label: 'Action',
    cellSx: { width: '5%' },
    align: 'center',
    renderCell: () => null,
  },
];

export default function ApplicationPage() {
  const theme = useTheme();
  const [selectedRow, setSelectedRow] = useState(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);
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
    queryKey: ['applications', queryParams],
    queryFn: async () => {
      const result = await listApplications(queryParams);
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

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setOpenViewModal(true);
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
  };

  const handleOpenExportModal = () => {
    setOpenExportModal(true);
  };

  const handleCloseExportModal = () => {
    setOpenExportModal(false);
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
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
          >
            <Visibility />
          </IconButton>
        ),
      };
    }
    return col;
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              View and export applications; download templates and upload student results
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleOpenExportModal}
          >
            Export
          </Button>
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
            noDataComponent={null}
            EmptyStateComponent={null}
            customTableHead={null}
            renderRow={null}
            onRowClick={handleRowClick}
            manualPagination
            count={pagination.total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            toolbarProps={{
              searchPlaceholder: 'Search applications...',
              toolbarTitle: 'Applications',
            }}
          />
        </Card>
      </Box>

      <ViewModal open={openViewModal} onClose={handleCloseViewModal} data={selectedRow} />

      <ExportModal open={openExportModal} onClose={handleCloseExportModal} />
    </Container>
  );
}
