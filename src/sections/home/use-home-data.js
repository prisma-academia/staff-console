import { useQuery } from '@tanstack/react-query';

import { PERMISSIONS } from 'src/permissions/constants';
import { UserApi, MemoApi, AuditApi, AnalyticsApi, AssessmentApi } from 'src/api';
import { getAnalytics as getAdmissionAnalytics } from 'src/api/adminApplicationApi';

// ----------------------------------------------------------------------

const STALE = 2 * 60 * 1000;

// Every query is gated on the permission its endpoint checks: a 403 opens the global
// "Access denied" modal, so the home page must never ask for what the user cannot see.

export const useMyProfile = () =>
  useQuery({ queryKey: ['user-profile-me'], queryFn: () => UserApi.getMe() });

export const useMyActivity = (limit = 8) =>
  useQuery({
    queryKey: ['audit-me', { limit, skip: 0 }],
    queryFn: () => AuditApi.getMyAuditLogs({ limit, skip: 0 }),
    select: (data) => (Array.isArray(data) ? data : data?.data || []),
  });

/** One call for finance, students, academics and operations (GET /analytics). */
export const useAnalyticsSummary = (sessionId, { enabled }) =>
  useQuery({
    queryKey: ['dashboard', 'summary', sessionId],
    queryFn: () => AnalyticsApi.getSummary(sessionId),
    staleTime: STALE,
    enabled,
  });

/** Same cache entry as the dashboard's admissions tab (active admission session). */
export const useAdmissionsSummary = ({ enabled }) =>
  useQuery({
    queryKey: ['dashboard', 'admissions', ''],
    queryFn: async () => {
      const result = await getAdmissionAnalytics({});
      if (!result?.ok) throw new Error(result?.message || 'Could not load admissions analytics');
      return result.data;
    },
    staleTime: STALE,
    retry: 1,
    enabled,
  });

/** The user's own courses for the session; shares the assessment hub's "mine" cache entry. */
export const useMyCourses = (sessionId, { enabled }) =>
  useQuery({
    queryKey: ['assessment-overview', sessionId, '', '', '', true],
    queryFn: () =>
      AssessmentApi.getCourseOverview({ sessionId, programId: '', classLevelId: '', semester: '', mine: 'true' }),
    staleTime: STALE,
    enabled: enabled && Boolean(sessionId),
  });

export const useLatestMemos = ({ enabled }) =>
  useQuery({
    queryKey: ['memos', 'home'],
    queryFn: () => MemoApi.getMemosPage({ page: 1, limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }),
    select: (data) => data?.data ?? [],
    staleTime: STALE,
    enabled,
  });

// ----------------------------------------------------------------------

/** Which data sources this user may load, derived once from their permissions. */
export function homeAccess(check, checkAny) {
  return {
    analytics: check(PERMISSIONS.VIEW_ANALYTICS),
    admissions: checkAny([PERMISSIONS.VIEW_APPLICATION, PERMISSIONS.VIEW_ADMISSION]),
    courses: check(PERMISSIONS.VIEW_ASSESSMENT_SCORES),
    memos: check(PERMISSIONS.VIEW_MEMO),
    audit: check(PERMISSIONS.VIEW_AUDIT),
    dashboard: check(PERMISSIONS.VIEW_DASHBOARD),
  };
}
