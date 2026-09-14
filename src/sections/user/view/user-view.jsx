import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { Box, Chip, Paper, Button, Divider, TableRow, TableCell, LinearProgress } from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import config from 'src/config';
import { UserApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import UserTableRow from '../user-table-row';
import UserTableHead from '../user-table-head';
import UserTableToolbar from '../user-table-toolbar';

// ----------------------------------------------------------------------

export default function UserPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const table = useServerTable({ defaultSortBy: 'firstName', defaultSortOrder: 'asc' });
  const { page, rowsPerPage, sortBy, sortOrder, search, queryParams, tableProps, searchProps } = table;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['users', 'page', queryParams],
    queryFn: () => UserApi.getUsersPage(queryParams),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const handleSort = (event, id) => {
    if (!id) return;
    const isAsc = sortBy === id && sortOrder === 'asc';
    setSelected([]);
    tableProps.onSortChange(id, isAsc ? 'desc' : 'asc');
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n._id);
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
    setSelected([]);
    tableProps.onPageChange(event, newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setSelected([]);
    tableProps.onRowsPerPageChange(event);
  };

  const { mutate: deleteBulkUsers } = useMutation({
    mutationFn: async (ids) => {
      const promises = ids.map(id => UserApi.deleteUser(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar(`${selected.length} users deleted successfully`, { variant: 'success' });
      setSelected([]);
    },
    onError: (mutationError) => {
      enqueueSnackbar(mutationError.message || 'Bulk delete failed', { variant: 'error' });
    }
  });

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} users?`)) {
      deleteBulkUsers(selected);
    }
  };

  const notFound = !isLoading && !rows.length && !!search;

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Users Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage system users, roles, and account statuses
            </Typography>
          </Box>
          <Can do={PERMISSIONS.ADD_USER}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => navigate('/user/new')}
            >
              New User
            </Button>
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
          {(isLoading || isFetching) && (
            <LinearProgress sx={{ borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
          )}

          <Box sx={{ p: 2 }}>
            <UserTableToolbar
              numSelected={selected.length}
              filterName={searchProps.filterName}
              onFilterName={searchProps.onFilterName}
            />
          </Box>

          <Divider />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset', minHeight: 400 }}>
              <Table sx={{ minWidth: 800 }}>
                <UserTableHead
                  order={sortOrder}
                  orderBy={sortBy}
                  rowCount={rows.length}
                  numSelected={selected.length}
                  onRequestSort={handleSort}
                  onSelectAllClick={handleSelectAllClick}
                  headLabel={[
                    { id: 'firstName', label: 'Full Name', align: 'left' },
                    { id: 'email', label: 'Email' },
                    { id: 'gender', label: 'Gender' },
                    { id: 'role', label: 'Role' },
                    { id: 'status', label: 'Status' },
                    { id: 'lastLogin', label: 'Last Login' },
                    { id: '' },
                  ]}
                />

                <TableBody>
                  {error && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 3, color: 'error.main' }}>
                        {error.message || String(error)}
                      </TableCell>
                    </TableRow>
                  )}
                  {isLoading && rows.length === 0 ? (
                    Array.from(new Array(5)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={8} sx={{ height: 72 }}>
                          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ width: '100%', height: 10, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {rows.map((row) => (
                        <UserTableRow
                          key={row._id}
                          row={row}
                          selected={selected.indexOf(row._id) !== -1}
                          handleClick={(event) => handleClick(event, row._id)}
                        />
                      ))}
                    </>
                  )}

                  {notFound && <TableNoData query={search} />}

                  {!isLoading && !error && rows.length === 0 && !search && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 5 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box 
                            component="img" 
                            src={config.assets.illustrations.notFound} 
                            sx={{ height: 100, mx: 'auto', opacity: 0.8 }} 
                          />
                          <Typography variant="h6" paragraph mt={2}>
                            No Users Found
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Try adjusting your filters or add a new user
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <Box sx={{ position: 'relative' }}>
            <TablePagination
              page={page}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
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
                    <Can do={PERMISSIONS.DELETE_USER}>
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


