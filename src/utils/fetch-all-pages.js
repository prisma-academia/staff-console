// Walks a paginated list endpoint ({ data, pagination: { pages } }) and returns every row.
// Used by client-side exports of server-paginated tables.
export async function fetchAllPages(fetchPage, params = {}, { limit = 100, maxRows = 20000 } = {}) {
  const rows = [];
  let page = 1;
  let pages = 1;
  do {
    // Pages are fetched one after another so large exports don't flood the API.
    // eslint-disable-next-line no-await-in-loop
    const result = await fetchPage({ ...params, page, limit });
    rows.push(...(result?.data ?? []));
    pages = result?.pagination?.pages ?? 1;
    page += 1;
  } while (page <= pages && rows.length < maxRows);
  return rows.slice(0, maxRows);
}
