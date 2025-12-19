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

import { EventApi } from 'src/api';
// import config from 'src/config';
// import { useAuthStore } from 'src/store';

import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import AddCalenderModal from '../add-calender';
import CalenderTableRow from '../calender-table-row';
import { applyFilter, getComparator } from '../utils';
import CalenderTableHead from '../calender-table-head';
import CalenderTableToolbar from '../calender-table-toolbar';

// ----------------------------------------------------------------------

export default function CalenderPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('title');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { data, loading } = useQuery({
    queryKey: ['events'],
    queryFn: EventApi.getEvents,
  });

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = data.map((n) => n.title);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, title) => {
    const selectedIndex = selected.indexOf(title);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, title);
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
        <Typography variant="h4">Calender</Typography>
        <AddCalenderModal open={open} setOpen={setOpen} />
      </Stack>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Card>
          <CalenderTableToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <CalenderTableHead
                  order={order}
                  orderBy={orderBy}
                  rowCount={data?.length}
                  numSelected={selected.length}
                  onRequestSort={handleSort}
                  onSelectAllClick={handleSelectAllClick}
                  headLabel={[
                    { id: 'title', label: 'Title', align: 'left' },
                    { id: 'start', label: 'Start Date' },
                    { id: 'end', label: 'End Date' },
                    { id: 'category', label: 'Category' },
                    { id: 'classLevels', label: 'Class Levels' },
                    { id: 'programs', label: 'Programs' },
                    { id: 'createdBy', label: 'Created By' },
                  ]}
                />

                <TableBody>
                  {dataFiltered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <CalenderTableRow
                        key={row?._id}
                        id={row?._id}
                        title={row?.title}
                        start={row?.start}
                        end={row?.end}
                        category={row?.category}
                        classlevels={row?.classLevels?.map((level) => level.name).join(', ')}
                        programs={row?.programs?.map((prog) => prog.name).join(', ')}
                        createdBy={row?.createdBy}
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
      )}
    </Container>
  );
}
