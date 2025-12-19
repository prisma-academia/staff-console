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

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import AddInstructorModal from '../add-instructor';
import { applyFilter, getComparator } from '../utils';
import InstructorTableRow from '../instructor-table-row';
import InstructorTableHead from '../instructor-table-head';
import InstructorTableToolbar from '../instructor-table-toolbar';


// ----------------------------------------------------------------------

export default function InstructorPage() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('fullname');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const token = useAuthStore((state) => state.token);
  const { data,loading } = useQuery({
    queryKey: ['instructors'],
    queryFn: getInstructor,
  });

  async function getInstructor() {
    const response = await fetch(`${config.baseUrl}/api/v1/instructor/instructors`, {
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
      const newSelecteds = data.map((n) => n.fullname);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, fullname) => {
    const selectedIndex = selected.indexOf(fullname);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, fullname);
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
        <Typography variant="h4">Instructors</Typography>
        <AddInstructorModal open={open} setOpen={setOpen}/>
      </Stack>
        {loading ? (<div>Loading...</div>)
        :
        (
          <Card>
        <InstructorTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <InstructorTableHead
                order={order}
                orderBy={orderBy}
                rowCount={data?.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: 'employeeId', label: 'ID', align: 'left' }, 
                  { id: 'fullname', label: 'Full Name' }, 
                  { id: 'department', label: 'Department' }, 
                  { id: 'phone', label: 'Phone Number' }, 
                  { id: 'gender', label: 'Gender' }, 
                  { id: '' }, // Extra action column
                ]}
              />

              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <InstructorTableRow
                      key={row._id}
                      id={row._id}
                      employeeId={row.employeeId}
                      fullname={`${row.personalInfo.firstName} ${row.personalInfo.lastName}`}
                      department={row.department}
                      phone={row?.contactInfo?.phone}
                      gender={row?.personalInfo?.gender}
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

