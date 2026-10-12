import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import { SERVICES, studioApi } from 'src/api/docStudioApi';

/**
 * Both services' template catalogues, merged. A service that is down only
 * degrades its own section — the rest of the Studio keeps working.
 */
export function useStudioCatalogue() {
  const ids = Object.keys(SERVICES);
  const results = useQueries({
    queries: ids.flatMap((id) => [
      { queryKey: ['doc-studio', 'types', id], queryFn: () => studioApi(id).listTypes(), staleTime: 30 * 1000, retry: 1 },
      { queryKey: ['doc-studio', 'engine', id], queryFn: () => studioApi(id).engine(), staleTime: 5 * 60 * 1000, retry: 0 },
    ]),
  });

  return useMemo(() => {
    const services = ids.map((id, index) => {
      const types = results[index * 2];
      const engine = results[index * 2 + 1];
      return {
        id,
        label: SERVICES[id].label,
        types: (types.data || []).map((type) => ({ ...type, service: id })),
        isLoading: types.isLoading,
        error: types.error,
        refetch: types.refetch,
        engine: engine.data,
      };
    });
    const hashes = services.map((service) => service.engine?.engineHash).filter(Boolean);
    return {
      services,
      types: services.flatMap((service) => service.types),
      isLoading: services.some((service) => service.isLoading),
      // Two different engine builds = a partial deploy; previews may differ.
      engineSkew: hashes.length > 1 && new Set(hashes).size > 1,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((result) => result.dataUpdatedAt + String(result.status)).join('|')]);
}
