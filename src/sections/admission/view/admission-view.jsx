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
  Typography
} from '@mui/material';

import { useAuthStore } from 'src/store';

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
        {`${row.application?.firstName} ${row.application?.lastName} ${row.application?.otherName || ''}`}
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
    )
  },
  { 
    id: 'programme', 
    label: 'Programme', 
    cellSx: { width: '20%' }, 
    renderCell: (row) => (
      <Typography variant="body2">
        {row.programme || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'status', 
    label: 'Status', 
    cellSx: { width: '15%' }, 
    renderCell: (row) => {
      const status = row?.status || 'pending';
      const statusConfig = {
        accepted: { label: 'Accepted', color: 'success' },
        pending: { label: 'Pending', color: 'warning' },
        rejected: { label: 'Rejected', color: 'error' },
      };
      const statusConfigValue = statusConfig[status.toLowerCase()] || { label: status, color: 'default' };
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
  { 
    id: 'offerDate', 
    label: 'Offer Date', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.offerDate ? new Date(row.offerDate).toLocaleDateString() : 'N/A'}
      </Typography>
    )
  },
  { id: 'action', label: 'Action', cellSx: { width: '5%' } },
];

export default function AdmissionPage() {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);
  const [openAdmsModal, setOpenAdmsModal] = useState(false);
  const [modalObj, setModalObj] = useState(null);

  const token = useAuthStore((state) => state.token);

  const handleOpen = (obj) => {
    setOpenModal(true);
    setModalObj(obj);
  };

  const handleClose = () => {
    setOpenModal(false);
    setModalObj(null);
  };

  async function getAdmissions() {
    const response = await fetch(`https://api.application.abnacnm.edu.ng/api/v1/admission`, {
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

  const { data, isLoading } = useQuery({
    queryKey: ['admissions'],
    queryFn: getAdmissions,
  });

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
    return column;
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
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              New Admission
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
            toolbarProps={{
              searchPlaceholder: 'Search admissions...',
              toolbarTitle: 'Admissions List',
            }}
          />
        </Card>
      </Box>

      <AddAdmission open={openAdmsModal} setOpen={setOpenAdmsModal}/>
    </Container>
  );
}
