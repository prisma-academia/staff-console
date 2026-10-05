import { useQuery } from '@tanstack/react-query';

import { AnalyticsApi } from 'src/api';
import { getAnalytics as getAdmissionAnalytics } from 'src/api/adminApplicationApi';

const STALE = 2 * 60 * 1000;

// Each dashboard section is its own query, so the overview and the detail tabs
// share one cache entry per section and session.

export const useFinance = (session) =>
  useQuery({ queryKey: ['dashboard', 'finance', session], queryFn: () => AnalyticsApi.getFinance(session), staleTime: STALE });

export const useStudents = (session) =>
  useQuery({ queryKey: ['dashboard', 'students', session], queryFn: () => AnalyticsApi.getStudents(session), staleTime: STALE });

export const useAcademics = (session) =>
  useQuery({ queryKey: ['dashboard', 'academics', session], queryFn: () => AnalyticsApi.getAcademics(session), staleTime: STALE });

export const useOperations = () =>
  useQuery({ queryKey: ['dashboard', 'operations'], queryFn: () => AnalyticsApi.getOperations(), staleTime: STALE });

/**
 * Admissions live in application-api, whose sessions are separate from the
 * academic sessions; '' asks it for its active admission session.
 */
export const useAdmissions = (admissionSessionId = '') =>
  useQuery({
    queryKey: ['dashboard', 'admissions', admissionSessionId],
    queryFn: async () => {
      const result = await getAdmissionAnalytics(admissionSessionId ? { sessionId: admissionSessionId } : {});
      if (!result?.ok) throw new Error(result?.message || 'Could not load admissions analytics');
      return result.data;
    },
    staleTime: STALE,
    retry: 1,
  });
