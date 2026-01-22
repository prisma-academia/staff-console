import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { 
  Chip, 
  Card, 
  Stack, 
  alpha, 
  Avatar, 
  Button, 
  useTheme,
  Container,
  IconButton,
  Typography
} from '@mui/material';

import config from 'src/config';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddStudent from '../add-student';
import { StudentApi } from '../../../api';
import BulkUploadModal from '../bulk-upload/bulk-upload-modal';

const columns = [
  { 
    id: 'picture', 
    label: '', 
    cellSx: { width: '5%' }, 
    renderCell: (row) => {
      let avatarSrc;
      if (row?.picture) {
        avatarSrc = config.utils.isAbsoluteUrl(row.picture) 
          ? row.picture 
          : config.utils.buildImageUrl(config.upload.baseUrl || `${config.baseUrl}/uploads`, row.picture);
      }
      return (
        <Avatar 
          src={avatarSrc} 
          sx={{ 
            width: 40, 
            height: 40,
            border: '2px solid #f5f5f5'
          }}
        />
      );
    }
  },
  {
    id: 'fullName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Stack>
        <Typography variant="subtitle2" noWrap>
          {row.personalInfo?.firstName} {row.personalInfo?.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {row.contactInfo?.email}
        </Typography>
      </Stack>
    ),
  },
  { 
    id: 'regNumber', 
    label: 'Reg Number', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2" fontWeight={500}>
        {row.regNumber}
      </Typography>
    )
  },
  { 
    id: 'program', 
    label: 'Program', 
    cellSx: { width: '20%' }, 
    renderCell: (row) => (
      <Typography variant="body2">
        {row.program?.name || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'classLevel', 
    label: 'Class', 
    cellSx: { width: '15%' }, 
    renderCell: (row) => (
      <Typography variant="body2">
        {row.classLevel?.name || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'status', 
    label: 'Status', 
    cellSx: { width: '10%' }, 
    renderCell: (row) => {
      const status = row?.status || 'pending';
      const statusConfig = {
        active: { label: 'Active', color: 'success' },
        pending: { label: 'Pending', color: 'warning' },
        disable: { label: 'Disabled', color: 'error' },
      };
      const statusConfigValue = statusConfig[status] || { label: status, color: 'default' };
      return (
        <Chip 
          label={statusConfigValue.label} 
          color={statusConfigValue.color} 
          size="small" 
          sx={{ borderRadius: 1 }} 
        />
      );
    }
  },
  { id: 'action', label: 'Action', cellSx: { width: '15%' } },
];

export default function StudentView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
  });

  const handleRowClick = (row) => {
    navigate(`/student/${row._id}`);
  };



  const handleOpenAddModal = () => {
    setOpenAddModal(true);
  };


  // Modify the action column to include our view button with onClick handler
  const columnsWithActions = columns.map((column) => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <Stack direction="row" spacing={1}>
            <IconButton
              color="primary"
              size="small"
              sx={{ 
                boxShadow: `0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click from firing
                handleRowClick(row);
              }}
            >
              <Iconify icon="eva:eye-fill" />
            </IconButton>
          </Stack>
        ),
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
              Student Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              View and manage student information
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenAddModal}
              sx={{ 
                px: 3,
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              Add Student
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Iconify icon="mdi:upload-multiple" />}
              onClick={() => setOpenBulkUploadModal(true)}
              sx={{ 
                px: 3,
                boxShadow: theme.customShadows.secondary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              Bulk Upload
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
            data={data}
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
            toolbarProps={{
              searchPlaceholder: 'Search students...',
              toolbarTitle: 'Students',
            }}
          />
        </Card>
      </Box>

      {/* Add Student Modal */}
      <AddStudent
        open={openAddModal}
        setOpen={setOpenAddModal}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={openBulkUploadModal}
        setOpen={setOpenBulkUploadModal}
      />
    </Container>
  );
}
