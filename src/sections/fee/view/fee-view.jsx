import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { FeeApi } from 'src/api';

import Scrollbar from 'src/components/scrollbar';

import AddFee from '../add-fee';
import EditFee from '../edit-fee';
import FeeDetails from '../fee-details';
import TableNoData from '../table-no-data';
import FeeTableRow from '../fee-table-row';
import FeeTableHead from '../fee-table-head';
import FeeTableToolbar from '../fee-table-toolbar';
import { applyFilter, getComparator } from '../utils';





// ----------------------------------------------------------------------

export default function FeePage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [open, setOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [viewingFee, setViewingFee] = useState(null);
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, loading } = useQuery({
    queryKey: ['fees'],
    queryFn: FeeApi.getFees,
  });

  const deleteFeeMutation = useMutation({
    mutationFn: FeeApi.deleteFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar({ message: 'Fee deleted successfully', variant: 'success' });
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred while deleting the fee';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  const handleDelete = (feeId, fee) => {
    const hasCompletedPayments =
      (fee?.payment?.made || 0) > 0 || (fee?.payment?.completedPayments?.length || 0) > 0;

    if (hasCompletedPayments) {
      enqueueSnackbar({
        message: 'Cannot delete fee with completed payments',
        variant: 'error',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteFeeMutation.mutate(feeId);
    }
  };


  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = (data || []).map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
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

  const handleCloseEdit = (value) => {
    if (!value) {
      setEditingFee(null);
    }
  };

  const calculatePaymentProgress = (fee) => {
    const expected = fee?.payment?.expected || 0;
    const made = fee?.payment?.made || 0;
    if (expected === 0) return 0;
    return Math.round((made / expected) * 100);
  };

  const dataFiltered = applyFilter({
    inputData: data || [],
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Fees</Typography>
        <AddFee open={open} setOpen={setOpen}/>
      </Stack>
      <EditFee open={Boolean(editingFee)} setOpen={handleCloseEdit} fee={editingFee} />
      <FeeDetails open={Boolean(viewingFee)} setOpen={(value) => !value && setViewingFee(null)} fee={viewingFee} />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Card>
          <FeeTableToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 1200 }}>
                <FeeTableHead
                  order={order}
                  orderBy={orderBy}
                  rowCount={data?.length}
                  numSelected={selected.length}
                  onRequestSort={handleSort}
                  onSelectAllClick={handleSelectAllClick}
                  headLabel={[
                    { id: 'name', label: 'Name', align: 'left' },
                    { id: 'amount', label: 'Amount' },
                    { id: 'status', label: 'Status' },
                    { id: 'studentCount', label: 'Students' },
                    { id: 'paymentExpected', label: 'Expected' },
                    { id: 'paymentMade', label: 'Paid' },
                    { id: 'paymentProgress', label: 'Progress' },
                    { id: 'createdAt', label: 'Created At' },
                    { id: '' }, // Extra action column
                  ]}
                />

                <TableBody>
                  {dataFiltered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <FeeTableRow
                      key={row._id}
                      id={row._id}
                      name={row.name}
                      amount={row?.amount}
                      status={row.status}
                      studentCount={row?.studentCount || 0}
                      paymentExpected={row?.payment?.expected || 0}
                      paymentMade={row?.payment?.made || 0}
                      paymentProgress={calculatePaymentProgress(row)}
                      createdAt={row?.createdAt}
                      selected={selected.indexOf(row._id) !== -1}
                      handleClick={(event) => handleClick(event, row._id)}
                      onEdit={() => setEditingFee(row)}
                      onDelete={() => handleDelete(row._id, row)}
                      onView={() => setViewingFee(row)}
                      hasCompletedPayments={
                        (row?.payment?.made || 0) > 0 ||
                        (row?.payment?.completedPayments?.length || 0) > 0
                      }
                    />
                  ))}

                  {notFound && <TableNoData query={filterName} />}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

        <TablePagination
          page={page}
          component="div"
          count={data?.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
        )
      }
      
    </Container>
  );
}

