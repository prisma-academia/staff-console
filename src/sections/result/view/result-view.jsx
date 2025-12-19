import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
import { EventApi } from 'src/api';
// import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import AddResultModal from '../add-result';
import ResultTableRow from '../result-table-row';
import ResultTableHead from '../result-table-head';
import { applyFilter, getComparator } from '../utils';
import ResultTableToolbar from '../result-table-toolbar';

// ----------------------------------------------------------------------

export default function ResultPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('title');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();

  const { data, isLoading } = useQuery({
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
              Results Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Download templates and upload student results
            </Typography>
          </Box>
          <AddResultModal open={open} setOpen={setOpen} />
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
            <ResultTableToolbar
              numSelected={selected.length}
              filterName={filterName}
              onFilterName={handleFilterByName}
            />
          </Box>

          <Divider />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset', minHeight: 400 }}>
              <Table sx={{ minWidth: 800 }}>
                <ResultTableHead
                  order={order}
                  orderBy={orderBy}
                  rowCount={data?.length || 0}
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
                  {isLoading ? (
                    Array.from(new Array(5)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={8} sx={{ height: 72 }}>
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center'
                          }}>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: 10, 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: 1
                              }} 
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {dataFiltered
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                          <ResultTableRow
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
                    </>
                  )}

                  {!isLoading && notFound && <TableNoData query={filterName} />}
                  
                  {!isLoading && dataFiltered.length === 0 && !filterName && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 5 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box 
                            component="img" 
                            src={config.assets.illustrations.notFound} 
                            sx={{ 
                              height: 100, 
                              mx: 'auto',
                              opacity: 0.8
                            }} 
                          />
                          <Typography variant="h6" paragraph mt={2}>
                            No Results Available
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Get started by downloading a result template
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
              count={data?.length || 0}
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
                    <Chip 
                      icon={<Iconify icon="eva:trash-2-outline" />} 
                      label="Delete" 
                      color="error" 
                      size="small"
                      onClick={() => {}}
                      sx={{ 
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
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
