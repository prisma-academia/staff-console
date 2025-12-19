import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paymentApi } from 'src/api';

import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import PaymentTableRow from '../payment-table-row';
import PaymentTableHead from '../payment-table-head';
import { applyFilter, getComparator } from '../utils';
import PaymentTableToolbar from '../payment-table-toolbar';



// ----------------------------------------------------------------------

export default function PaymentPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('user');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFee, setSelectedFee] = useState('');
  const [selectedRegNumber, setSelectedRegNumber] = useState('');

  const { data, loading } = useQuery({
    queryKey: ['payments', selectedUser, selectedFee, selectedRegNumber],
    queryFn: () => paymentApi.getPayments(
      selectedUser || undefined,
      selectedFee || undefined,
      selectedRegNumber || undefined
    ),
  });

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

  const dataFiltered = applyFilter({
    inputData: data || [],
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Payments</Typography>
      </Stack>
      {/* { console.log("payment",data)} */}
        {loading ? (<div>Loading...</div>)
        :
        (
          <Card>
        <PaymentTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
          selectedUser={selectedUser}
          selectedFee={selectedFee}
          selectedRegNumber={selectedRegNumber}
          onUserChange={setSelectedUser}
          onFeeChange={setSelectedFee}
          onRegNumberChange={setSelectedRegNumber}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <PaymentTableHead
                order={order}
                orderBy={orderBy}
                rowCount={data?.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: 'user', label: 'Full Name', align: 'left' }, 
                  { id: 'fee', label: 'Fee' }, 
                  { id: 'amount', label: 'Amount' }, 
                  { id: 'status', label: 'Status' }, 
                  { id: 'reference', label: 'Reference' }, 
                  { id: 'createdAt', label: 'Date' }, 
                  { id: '' }, // Extra action column
                ]}
              />

              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <PaymentTableRow
                      key={row._id}
                      payment={row}
                      selected={selected.indexOf(row._id) !== -1}
                      handleClick={(event) => handleClick(event, row._id)}
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

