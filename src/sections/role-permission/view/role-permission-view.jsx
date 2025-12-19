import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { Box, Chip, Paper, Divider, TableRow, TableCell, LinearProgress } from '@mui/material';

import config from 'src/config';
import { RolePermissionApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import TableEmptyRows from '../table-empty-rows';
import AddRolePermission from '../add-role-permission';
import { emptyRows, applyFilter, getComparator } from '../utils';
import RolePermissionTableRow from '../role-permission-table-row';
import RolePermissionTableHead from '../role-permission-table-head';
import RolePermissionTableToolbar from '../role-permission-table-toolbar';

// ----------------------------------------------------------------------

export default function RolePermissionView() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('role');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => RolePermissionApi.getRolePermissions(),
  });

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = data.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const { mutate: deleteBulkRolePermissions } = useMutation({
    mutationFn: async (ids) => {
      const promises = ids.map(id => RolePermissionApi.deleteRolePermission(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      enqueueSnackbar(`${selected.length} role permissions deleted successfully`, { variant: 'success' });
      setSelected([]);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Bulk delete failed', { variant: 'error' });
    }
  });

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} role permissions?`)) {
      deleteBulkRolePermissions(selected);
    }
  };

  const dataFiltered = applyFilter({
    inputData: data || [],
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Role Permission Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage role permissions and access controls
            </Typography>
          </Box>
          <Can do="add_role_permission">
            <AddRolePermission open={openAddModal} setOpen={setOpenAddModal} />
          </Can>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: `0 0 24px 0 ${alpha(theme.palette.grey[900], 0.1)}`
          }}
        >
          {isLoading && <LinearProgress sx={{ borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />}

          <Box sx={{ p: 2 }}>
            <RolePermissionTableToolbar
              numSelected={selected.length}
              filterName={filterName}
              onFilterName={handleFilterByName}
            />
          </Box>

          <Divider />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset', minHeight: 400 }}>
              <Table sx={{ minWidth: 800 }}>
                <RolePermissionTableHead
                  order={order}
                  orderBy={orderBy}
                  rowCount={data?.length || 0}
                  numSelected={selected.length}
                  onRequestSort={handleSort}
                  onSelectAllClick={handleSelectAllClick}
                  headLabel={[
                    { id: 'role', label: 'Role', align: 'left' },
                    { id: 'permissions', label: 'Permissions' },
                    { id: 'isActive', label: 'Status' },
                    { id: 'createdBy', label: 'Created By' },
                    { id: 'createdAt', label: 'Created At' },
                    { id: '' },
                  ]}
                />

                <TableBody>
                  {isLoading ? (
                    Array.from(new Array(5)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6} sx={{ height: 72 }}>
                          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ width: '100%', height: 10, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                          <RolePermissionTableRow
                            key={row._id}
                            row={row}
                            selected={selected.indexOf(row._id) !== -1}
                            handleClick={(event) => handleClick(event, row._id)}
                          />
                        ))}
                    </>
                  )}

                  {!isLoading && notFound && <TableNoData query={filterName} />}

                  {!isLoading && dataFiltered.length === 0 && !filterName && (
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 5 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box 
                            component="img" 
                            src={config.assets.illustrations.notFound} 
                            sx={{ height: 100, mx: 'auto', opacity: 0.8 }} 
                          />
                          <Typography variant="h6" paragraph mt={2}>
                            No Role Permissions Found
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Try adjusting your filters or add a new role permission
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading && <TableEmptyRows height={72} emptyRows={emptyRows(page, rowsPerPage, dataFiltered.length)} />}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <Box sx={{ position: 'relative' }}>
            <TablePagination
              page={page}
              component="div"
              count={dataFiltered?.length || 0}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              rowsPerPageOptions={[5, 10, 25]}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ 
                borderTop: `1px solid ${theme.palette.divider}`,
                '& .MuiTablePagination-toolbar': {
                  height: 64,
                }
              }}
            />

            {selected.length > 0 && (
              <Box 
                sx={{
                  px: 2,
                  py: 1.5,
                  top: 0,
                  position: 'absolute',
                  width: '100%',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderTop: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Chip 
                  label={`${selected.length} selected`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
                <Box>
                  <Stack direction="row" spacing={1}>
                    <Can do="delete_role_permission">
                      <Chip 
                        icon={<Iconify icon="eva:trash-2-outline" />} 
                        label="Delete" 
                        color="error" 
                        size="small"
                        onClick={handleBulkDelete}
                        sx={{ '& .MuiChip-label': { px: 1 } }}
                      />
                    </Can>
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

