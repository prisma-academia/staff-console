import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { Visibility, FileDownload } from '@mui/icons-material';
import { Chip, Card, alpha, Button, useTheme, Container, IconButton, Typography } from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import { GenericTable } from 'src/components/generic-table';

import ViewModal from '../view.modal';
import ExportModal from '../export.modal';

const columns = [
    { id: 'fullName', label: 'Full Name', align: 'left', cellSx: { width: '20%' } , renderCell: (row) => `${row?.firstName} ${row?.lastName}` }, // Full Name from application
    { id: 'number', label: 'Admission Number', cellSx: { width: '20%' } }, // Admission number
    { id: 'programme', label: 'Programme', cellSx: { width: '20%' } }, // Admission programme
    { id: 'stateOfOrigin', label: 'State', cellSx: { width: '20%' } }, // Admission state
    { id: 'lgaOfOrigin', label: 'LGA', cellSx: { width: '20%' } }, // Admission lga
    { id: 'email', label: 'Email', cellSx: { width: '20%' } }, // Admission email
    { id: 'status', label: 'Status', cellSx: { width: '20%' }, renderCell: (row) => row?.status === 'not paid' ? <Chip label="Not Paid" color="error" /> : <Chip label="Paid" color="success" /> },
    { id: 'action', label: 'Action', cellSx: { width: '20%' }, align: 'center', renderCell: (row) => null }, // Placeholder, will be set inside the component
]

export default function ApplicationPage() {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
  });

  async function getApplications() {
    const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
    const response = await fetch(`${config.applicationBaseUrl}${apiVersion}/application`, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message);
  }

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

  // Modify the action column to include our view button with onClick handler
  const columnsWithActions = columns.map(column => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <IconButton 
            color="primary" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from firing
              handleRowClick(row);
            }}
          >
            <Visibility />
          </IconButton>
        )
      };
    }
    return column;
  });

  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          pb: 5,
          pt: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Download templates and upload student results
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

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={data}
            columns={columnsWithActions}
            rowIdField="id"
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
            toolbarProps={{
              searchPlaceholder: "Search applications...",
              toolbarTitle: "Applications",
            }}
          />
        </Card>
      </Box>
      
      {/* View Modal */}
      <ViewModal 
        open={openViewModal} 
        onClose={handleCloseViewModal} 
        data={selectedRow}
      />

      {/* Export Modal */}
      <ExportModal
        open={openExportModal}
        onClose={handleCloseExportModal}
      />
    </Container>
  );
}
