import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ResitApi } from 'src/api';

const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));

/**
 * Every course (from the resit price list, which needs only view_resit), plus the
 * programmes and class levels those courses belong to, for the Resits page filters.
 */
export default function useResitCatalogue() {
  const { data, isLoading } = useQuery({
    queryKey: ['resit', 'prices', 'catalogue'],
    queryFn: () => ResitApi.getPrices(),
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const courses = Array.isArray(data) ? data : [];
    const programmes = new Map();
    const classLevels = new Map();
    courses.forEach((course) => {
      (course.programs || []).forEach((p) => programmes.set(String(p._id), p));
      if (course.classLevel?._id) classLevels.set(String(course.classLevel._id), course.classLevel);
    });
    return {
      courses,
      programmes: [...programmes.values()].sort(byName),
      classLevels: [...classLevels.values()].sort(byName),
      isLoading,
    };
  }, [data, isLoading]);
}
