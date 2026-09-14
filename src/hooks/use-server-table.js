import { useSearchParams } from 'react-router-dom';
import { useMemo, useState, useEffect, useCallback } from 'react';

const DEBOUNCE_MS = 300;

const isEmpty = (value) => value === undefined || value === null || value === '';

/**
 * State for a server-paginated table: page, page size, sort, debounced search and filters.
 * Everything lives in the URL search params so a refresh or back navigation keeps the view.
 *
 * Returns `queryParams` for the list request, `filterParams` (filters + search, no paging)
 * for the export request, and `tableProps` / `searchProps` to spread onto GenericTable.
 */
export default function useServerTable({
  filterKeys = [],
  defaultSortBy = 'createdAt',
  defaultSortOrder = 'desc',
  defaultRowsPerPage = 10,
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1) - 1;
  const rowsPerPage = parseInt(searchParams.get('limit'), 10) || defaultRowsPerPage;
  const sortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortOrder = ['asc', 'desc'].includes(searchParams.get('sortOrder'))
    ? searchParams.get('sortOrder')
    : defaultSortOrder;
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);

  const update = useCallback(
    (changes, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([key, value]) => {
            if (isEmpty(value)) next.delete(key);
            else next.set(key, String(value));
          });
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (searchInput.trim() === search) return undefined;
    const timer = setTimeout(() => update({ search: searchInput.trim() }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search, update]);

  const filterKeyString = filterKeys.join(',');

  const filters = useMemo(
    () =>
      Object.fromEntries(
        filterKeyString
          .split(',')
          .filter(Boolean)
          .map((key) => [key, searchParams.get(key) || ''])
      ),
    [searchParams, filterKeyString]
  );

  const filterParams = useMemo(() => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (!isEmpty(value)) params[key] = value;
    });
    if (search) params.search = search;
    return params;
  }, [filters, search]);

  const queryParams = useMemo(
    () => ({ ...filterParams, page: page + 1, limit: rowsPerPage, sortBy, sortOrder }),
    [filterParams, page, rowsPerPage, sortBy, sortOrder]
  );

  const setFilter = useCallback((key, value) => update({ [key]: value }), [update]);
  const setFilters = useCallback((values) => update(values), [update]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    update(
      Object.fromEntries([...filterKeyString.split(',').filter(Boolean), 'search'].map((key) => [key, '']))
    );
  }, [update, filterKeyString]);

  const activeFilterCount = Object.values(filters).filter((value) => !isEmpty(value)).length;

  const tableProps = {
    manualPagination: true,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    onPageChange: (event, newPage) => update({ page: newPage + 1 }, false),
    onRowsPerPageChange: (event) => update({ limit: parseInt(event.target.value, 10) }),
    onSortChange: (field, order) => update({ sortBy: field, sortOrder: order }),
  };

  const searchProps = {
    filterName: searchInput,
    onFilterName: (event) => setSearchInput(event.target.value),
  };

  return {
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    search,
    filters,
    filterParams,
    queryParams,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0 || Boolean(search),
    setFilter,
    setFilters,
    clearFilters,
    tableProps,
    searchProps,
  };
}
