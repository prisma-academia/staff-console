export const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
};

export function emptyRows(page, rowsPerPage, arrayLength) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

function descendingComparator(a, b, orderBy) {
  if (a[orderBy] === null) {
    return 1;
  }
  if (b[orderBy] === null) {
    return -1;
  }
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function applyFilter({ inputData, comparator, filterName, filterFunction }) {
  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (filterName && !filterFunction) {
    // Default filter function that checks all string fields
    inputData = inputData.filter((item) => 
      Object.keys(item).some((key) => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(filterName.toLowerCase());
        }
        if (typeof value === 'object' && value !== null) {
          // Handle nested objects
          return Object.values(value).some((nestedValue) =>
            String(nestedValue).toLowerCase().includes(filterName.toLowerCase())
          );
        }
        return false;
      })
    );
  } else if (filterFunction) {
    // Use custom filter function if provided
    inputData = inputData.filter(item => filterFunction(item, filterName));
  }

  return inputData;
} 