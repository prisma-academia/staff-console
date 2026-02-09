import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { 
  Tab, 
  Tabs, 
  Chip, 
  Paper, 
  Stack, 
  alpha,
  Divider,
  Popover,
  useTheme,
  MenuItem,
  Container,
  Typography,
  IconButton
} from '@mui/material';

import { AuditApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import { AuditStatsView } from './audit-stats-view';
import AuditTableToolbar from '../audit-table-toolbar';
import { formatActor, formatEntityId, isFailedOperation } from '../utils';

// ----------------------------------------------------------------------

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

const AuditActionMenu = ({ row }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const { mutate: deleteAuditLog } = useMutation({
    mutationFn: () => AuditApi.deleteAuditLog(row._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      enqueueSnackbar('Audit log deleted successfully', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleViewDetails = () => {
    navigate(`/audit/${row._id}`);
    handleCloseMenu();
  };

  const handleViewActorHistory = () => {
    const actorId = typeof row.actor === 'object' ? row.actor._id : row.actor;
    navigate(`/audit?actor=${actorId}`);
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this audit log?')) {
      deleteAuditLog();
    }
  };

  return (
    <>
      <IconButton onClick={handleOpenMenu}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>
      <Popover
        open={!!open}
        anchorEl={open}
        onClose={(e) => { e.stopPropagation(); handleCloseMenu(); }}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 200 },
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
          View Details
        </MenuItem>

        <MenuItem onClick={handleViewActorHistory}>
          <Iconify icon="eva:person-fill" sx={{ mr: 2 }} />
          View Actor History
        </MenuItem>

        <Can do="delete_audit">
          <Divider sx={{ borderStyle: 'dashed' }} />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        </Can>
      </Popover>
    </>
  );
};

AuditActionMenu.propTypes = {
  row: PropTypes.object.isRequired,
};

export default function AuditView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [order] = useState('desc');
  const [orderBy] = useState('timestamp');
  const [filterName, setFilterName] = useState(searchParams.get('search') || '');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [tabValue, setTabValue] = useState(0);
  
  // Filter states
  const [entityType, setEntityType] = useState(searchParams.get('entityType') || '');
  const [actionType, setActionType] = useState(searchParams.get('actionType') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [actorType, setActorType] = useState(searchParams.get('actorType') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  
  const theme = useTheme();

  // Build query params for API
  const queryParams = useMemo(() => {
    let sortValue = '';
    if (orderBy === 'timestamp') {
      sortValue = order === 'desc' ? '-timestamp' : 'timestamp';
    } else {
      sortValue = `${order === 'desc' ? '-' : ''}${orderBy}`;
    }
    
    const params = {
      limit: rowsPerPage,
      skip: page * rowsPerPage,
      sort: sortValue,
    };

    if (entityType) params.entityType = entityType;
    if (actionType) params.actionType = actionType;
    if (status) params.status = status;
    if (actorType) params.actorType = actorType;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (searchParams.get('actor')) params.actor = searchParams.get('actor');
    if (searchParams.get('entityId')) params.entityId = searchParams.get('entityId');

    return params;
  }, [page, rowsPerPage, order, orderBy, entityType, actionType, status, actorType, startDate, endDate, searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', queryParams],
    queryFn: () => AuditApi.getAuditLogs(queryParams),
  });

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleClearFilters = () => {
    setEntityType('');
    setActionType('');
    setStatus('');
    setActorType('');
    setStartDate('');
    setEndDate('');
    setFilterName('');
    setPage(0);
    setSearchParams({});
  };

  const columns = [
    { 
      id: 'timestamp', 
      label: 'Timestamp', 
      align: 'left',
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Typography variant="body2" sx={{ minWidth: 160 }}>
          {row.timestamp ? format(new Date(row.timestamp), 'PPpp') : 'N/A'}
        </Typography>
      )
    },
    { id: 'entityType', label: 'Entity Type', cellSx: { width: '10%' } },
    { 
      id: 'entityId', 
      label: 'Entity ID', 
      cellSx: { width: '10%' },
      renderCell: (row) => {
        if (isFailedOperation(row.entityId)) {
          return (
            <Chip
              label="Failed Operation"
              color="warning"
              size="small"
              sx={{ fontFamily: 'monospace' }}
            />
          );
        }
        return (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.entityId ? `${formatEntityId(row.entityId).substring(0, 8)  }...` : 'N/A'}
          </Typography>
        );
      }
    },
    { 
      id: 'actionType', 
      label: 'Action', 
      cellSx: { width: '10%' },
      renderCell: (row) => {
        const getActionTypeColor = (type) => {
          switch (type) {
            case 'create': return 'success';
            case 'update': return 'info';
            case 'delete': return 'error';
            case 'view': return 'default';
            default: return 'default';
          }
        };
        return (
          <Chip
            label={row.actionType}
            color={getActionTypeColor(row.actionType)}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        );
      }
    },
    { 
      id: 'actor', 
      label: 'Actor', 
      cellSx: { width: '20%' },
      renderCell: (row) => (
        <Stack>
          <Typography variant="body2">{formatActor(row.actor)}</Typography>
          {typeof row.actor === 'object' && row.actor?.email && (
            <Typography variant="caption" color="text.secondary" display="block">
              {row.actor.email}
            </Typography>
          )}
        </Stack>
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Label color={row.status === 'success' ? 'success' : 'error'}>
          {row.status}
        </Label>
      )
    },
    { 
      id: 'action', 
      label: '', 
      cellSx: { width: '5%' },
      renderCell: (row) => <AuditActionMenu row={row} />
    },
  ];

  const auditLogs = Array.isArray(data) ? data : data?.data || [];

  const pagination = Array.isArray(data)
    ? { total: data.length, limit: rowsPerPage, skip: page * rowsPerPage, pages: Math.ceil(data.length / rowsPerPage) }
    : data?.pagination || { total: 0, limit: rowsPerPage, skip: 0, pages: 0 };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Audit Logs
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              View and manage system audit logs and activity history
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: `0 0 24px 0 ${alpha(theme.palette.grey[900], 0.1)}`
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Audit Logs" />
              <Tab label="Statistics" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2 }}>
              <AuditTableToolbar
                filterName={filterName}
                onFilterName={handleFilterByName}
                entityType={entityType}
                onEntityTypeChange={setEntityType}
                actionType={actionType}
                onActionTypeChange={setActionType}
                status={status}
                onStatusChange={setStatus}
                actorType={actorType}
                onActorTypeChange={setActorType}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
              />
            </Box>
            
            <Divider />

            <GenericTable
              data={auditLogs}
              columns={columns}
              rowIdField="_id"
              withCheckbox
              withToolbar={false} // Custom toolbar used above
              withPagination
              selectable
              isLoading={isLoading}
              
              // Server-side pagination
              manualPagination
              count={pagination.total}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              
              onRowClick={(row) => navigate(`/audit/${row._id}`)}
              emptyRowsHeight={72}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <AuditStatsView
              entityType={entityType}
              startDate={startDate}
              endDate={endDate}
            />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}
