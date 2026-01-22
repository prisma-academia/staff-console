import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import TablePagination from '@mui/material/TablePagination';

import config from 'src/config';

import Scrollbar from 'src/components/scrollbar';

import TableHead from './table-head';
import TableNoData from './table-no-data';
import TableToolbar from './table-toolbar';
import TableEmptyRows from './table-empty-rows';
import { emptyRows, applyFilter, getComparator } from './utils';

export default function GenericTable({
  data = [],
  isLoading = false,
  columns = [],
  rowIdField = 'id',
  withCheckbox = true,
  withToolbar = true,
  withPagination = true,
  selectable = true,
  toolbarProps = {},
  initialSort = {
    orderBy: '',
    order: 'asc',
  },
  initialRowsPerPage = 5,
  emptyRowsHeight = 53,
  noDataComponent = null,
  EmptyStateComponent = null,
  customTableHead = null,
  renderRow = null,
  onRowClick = null,
  onSelectionChange = null,
  filterFunction = null,
  placeholderRowCount = 5,
  // Manual pagination props
  manualPagination = false,
  count = 0,
  page: manualPage = 0,
  rowsPerPage: manualRowsPerPage = 5,
  onPageChange = null,
  onRowsPerPageChange = null,
}) {
  const theme = useTheme();
  
  const [internalPage, setInternalPage] = useState(0);
  const [order, setOrder] = useState(initialSort.order);
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(initialSort.orderBy);
  const [filterName, setFilterName] = useState('');
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(initialRowsPerPage);

  const page = manualPagination ? manualPage : internalPage;
  const rowsPerPage = manualPagination ? manualRowsPerPage : internalRowsPerPage;

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleSelectAllClick = (event) => {
    if (!selectable) return;
    
    if (event.target.checked) {
      const newSelecteds = data.map((n) => n[rowIdField]);
      setSelected(newSelecteds);
      if (onSelectionChange) onSelectionChange(newSelecteds);
      return;
    }
    setSelected([]);
    if (onSelectionChange) onSelectionChange([]);
  };

  const handleClick = (event, id) => {
    if (!selectable) return;
    
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
    if (onSelectionChange) onSelectionChange(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    if (manualPagination) {
      if (onPageChange) onPageChange(event, newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (manualPagination) {
      if (onRowsPerPageChange) onRowsPerPageChange(event);
    } else {
      setInternalPage(0);
      setInternalRowsPerPage(newRowsPerPage);
    }
  };

  const handleFilterByName = (event) => {
    if (!manualPagination) {
      setInternalPage(0);
    }
    setFilterName(event.target.value);
  };

  // Only apply client-side filtering and sorting if NOT manual pagination
  // If manual pagination, assume data is already filtered/sorted by parent
  const processedData = manualPagination 
    ? data 
    : applyFilter({
        inputData: data || [],
        comparator: getComparator(order, orderBy),
        filterName,
        filterFunction,
      });

  const notFound = !processedData.length && !!filterName;
  const isEmptyData = !isLoading && data.length === 0;

  const emptyRowsCount = withPagination
    ? emptyRows(page, rowsPerPage, manualPagination ? count : processedData.length)
    : 0;

  // For manual pagination, data is already sliced. For client-side, we slice it.
  const visibleRows = manualPagination 
    ? processedData 
    : processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
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
      
      {withToolbar && (
        <>
          <Box sx={{ p: 2 }}>
            <TableToolbar
              numSelected={selected.length}
              filterName={filterName}
              onFilterName={handleFilterByName}
              {...toolbarProps}
            />
          </Box>
          <Divider />
        </>
      )}

      <Scrollbar>
        <TableContainer sx={{ overflow: 'unset', minHeight: 400 }}>
          <Table sx={{ minWidth: 800 }}>
            {customTableHead || (
              <TableHead
                order={order}
                orderBy={orderBy}
                rowCount={manualPagination ? count : (data?.length || 0)}
                headLabel={columns}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                withCheckbox={withCheckbox && selectable}
              />
            )}

            <TableBody>
              {isLoading && visibleRows.length === 0 ? (
                Array.from(new Array(placeholderRowCount)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={columns.length + (withCheckbox ? 1 : 0)} sx={{ height: 72 }}>
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
                  {visibleRows.map((row) => {
                    const id = row[rowIdField];
                    const isItemSelected = selected.indexOf(id) !== -1;
                    
                    const rowClickHandler = onRowClick 
                      ? (e) => {
                          if (e.target.closest('button, a, input[type="checkbox"]')) return;
                          onRowClick(row, e);
                        }
                      : undefined;
                      
                    return renderRow 
                      ? renderRow({
                          row,
                          selected: isItemSelected,
                          handleClick: (e) => handleClick(e, id),
                          onClick: rowClickHandler,
                        })
                      : (
                        <TableRow 
                          hover 
                          key={id} 
                          tabIndex={-1}
                          role="checkbox" 
                          selected={isItemSelected}
                          onClick={rowClickHandler}
                        >
                          {withCheckbox && selectable && (
                            <TableCell padding="checkbox">
                              <Checkbox 
                                checked={isItemSelected} 
                                onChange={(e) => handleClick(e, id)} 
                              />
                            </TableCell>
                          )}
                          
                          {columns.map((column) => (
                            <TableCell 
                              key={column.id} 
                              align={column.align || 'left'}
                              sx={column.cellSx}
                            >
                              {column.renderCell 
                                ? column.renderCell(row) 
                                : row[column.id]
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                  })}

                  {notFound && (
                    noDataComponent || (
                      <TableNoData 
                        query={filterName} 
                        colSpan={columns.length + (withCheckbox ? 1 : 0)} 
                      />
                    )
                  )}
                  
                  {emptyRowsCount > 0 && (
                    <TableEmptyRows 
                      emptyRows={emptyRowsCount} 
                      height={emptyRowsHeight} 
                      colSpan={columns.length + (withCheckbox ? 1 : 0)} 
                    />
                  )}
                  
                  {isEmptyData && !filterName && (
                    EmptyStateComponent || (
                      <TableRow>
                        <TableCell align="center" colSpan={columns.length + (withCheckbox ? 1 : 0)} sx={{ py: 5 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <img 
                              src={config.assets.illustrations.notFound} 
                              alt="No data"
                              style={{ 
                                height: 100, 
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                opacity: 0.8
                              }} 
                            />
                            <Box mt={2}>
                              <Box fontWeight="fontWeightBold" fontSize="h6.fontSize" mb={1}>
                                No Data Available
                              </Box>
                              <Box color="text.secondary">
                                No records found
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {withPagination && (
        <TablePagination
          page={page}
          component="div"
          count={manualPagination ? count : processedData.length}
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
      )}
    </Paper>
  );
}

GenericTable.propTypes = {
  data: PropTypes.array,
  isLoading: PropTypes.bool,
  columns: PropTypes.array,
  rowIdField: PropTypes.string,
  withCheckbox: PropTypes.bool,
  withToolbar: PropTypes.bool,
  withPagination: PropTypes.bool,
  selectable: PropTypes.bool,
  toolbarProps: PropTypes.object,
  initialSort: PropTypes.shape({
    orderBy: PropTypes.string,
    order: PropTypes.oneOf(['asc', 'desc']),
  }),
  initialRowsPerPage: PropTypes.number,
  emptyRowsHeight: PropTypes.number,
  noDataComponent: PropTypes.node,
  EmptyStateComponent: PropTypes.node,
  customTableHead: PropTypes.node,
  renderRow: PropTypes.func,
  onRowClick: PropTypes.func,
  onSelectionChange: PropTypes.func,
  filterFunction: PropTypes.func,
  placeholderRowCount: PropTypes.number,
  manualPagination: PropTypes.bool,
  count: PropTypes.number,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
};
