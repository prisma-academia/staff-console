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

import { useAuthStore } from 'src/store';

import Scrollbar from 'src/components/scrollbar';

// import AddAdmission from '../add-admission';
import TableNoData from '../table-no-data';
import AddAdmission from '../add-admission';
import AddStudentModal from '../add-student';
import { applyFilter, getComparator } from '../utils';
import AdmissionTableRow from '../admission-table-row';
import AdmissionTableHead from '../admission-table-head';
import AdmissionTableToolbar from '../admission-table-toolbar';

// ----------------------------------------------------------------------

export default function AdmissionPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('number');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);
  const [openAdmsModal, setOpenAdmsModal] = useState(false);
  const [modalObj, setModalObj] = useState(null);

  const token = useAuthStore((state) => state.token);
  const handleOpen = (obj) => {
    setOpenModal(true);
    setModalObj(obj);
  };
  const handleClose = (obj) => {
    setOpenModal(false);
    setModalObj(null);
  };
  const { data } = useQuery({
    queryKey: ['admissions'],
    queryFn: getAdmissions,
  });

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

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = data.map((n) => n.number);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, number) => {
    const selectedIndex = selected.indexOf(number);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, number);
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
      {modalObj && <AddStudentModal open={openModal} handleClose={handleClose} object={modalObj} />}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Admissions</Typography>

        <AddAdmission open={openAdmsModal} setOpen={setOpenAdmsModal}/>
      </Stack>

      <Card>
        <AdmissionTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <AdmissionTableHead
                order={order}
                orderBy={orderBy}
                rowCount={data?.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: 'fullName', label: 'Full Name', align: 'left' }, // Full Name from application
                  { id: 'number', label: 'Admission Number' }, // Admission number
                  { id: 'programme', label: 'Programme' }, // Admission programme
                  { id: 'status', label: 'Status' }, // Admission status
                  { id: 'offerDate', label: 'Offer Date' }, // Admission offer date
                  { id: '' },
                ]}
              />

              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <AdmissionTableRow
                      key={row._id}
                      id={row._id}
                      fullName={`${row.application?.firstName} ${row.application?.lastName} ${row.application?.otherName || ''}`} // Full Name from application
                      number={row.number} // Admission number
                      programme={row.programme} // Programme
                      status={row.status} // Admission status
                      offerDate={new Date(row.offerDate)} // Offer Date formatted
                      object={row}
                      selected={selected.indexOf(row._id) !== -1}
                      handleClick={(event) => handleClick(event, row._id)}
                      handleOpen={handleOpen}
                    />
                  ))}

                {/* <TableEmptyRows height={77} emptyRows={emptyRows(page, rowsPerPage, data.length)} /> */}

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
    </Container>
  );
}
