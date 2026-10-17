import { PERMISSIONS } from 'src/permissions/constants';

import { fPct, fCount, fNaira, fNairaShort } from 'src/sections/dashboard/utils';

// ----------------------------------------------------------------------

/**
 * Mirrors courseStage() in sections/assessment/view/assessment-hub-view.jsx, so the
 * home chunk does not pull in the whole assessment hub. Keep the two in step.
 */
function courseStage(course) {
  const results = course.results || { draft: 0, approved: 0, published: 0 };
  if (!course.setup?.ok) return 'setup';
  if (!course.students) return 'no-students';
  if (results.published && results.published >= course.students) return 'published';
  if (results.approved + results.published >= course.students) return 'approved';
  if (results.draft + results.approved + results.published > 0) return 'drafted';
  if (course.scoresComplete >= course.students) return 'scored';
  if (course.scoresStarted > 0) return 'scoring';
  return 'ready';
}

export const SEVERITY = {
  critical: { rank: 0, color: 'error', icon: 'solar:danger-circle-bold', word: 'Urgent' },
  warning: { rank: 1, color: 'warning', icon: 'solar:danger-triangle-bold', word: 'Needs action' },
  info: { rank: 2, color: 'info', icon: 'solar:info-circle-bold', word: 'For review' },
};

const plural = (n, one, many) => (n === 1 ? one : many);

const COMPUTE = [PERMISSIONS.COMPUTE_RESULT];
const ASSESSMENT_SETUP = [PERMISSIONS.ADD_ASSESSMENT, PERMISSIONS.EDIT_ASSESSMENT];

/**
 * Work waiting on this user, most severe first. Each item is gated on the permission
 * that lets the user act on it, and links to the module where they would do so.
 *
 * Sources (any may be missing): `summary` from GET /analytics, `admissions` from the
 * application service, `courses` from the user's own assessment overview.
 */
export function buildAttention({ check, checkAny, summary, admissions, courses }) {
  const items = [];
  const push = (item) => items.push(item);

  // Results pipeline (institution-wide, needs analytics)
  const a = summary?.academics?.summary;
  if (a) {
    if (a.draft > 0 && check(PERMISSIONS.APPROVE_RESULT)) {
      push({
        key: 'results-draft',
        severity: 'warning',
        value: fCount(a.draft),
        title: `${plural(a.draft, 'Result', 'Results')} awaiting approval`,
        detail: 'Computed drafts this session, not yet approved',
        href: '/result',
        cta: 'Review',
      });
    }
    if (a.approved > 0 && check(PERMISSIONS.PUBLISH_RESULT)) {
      push({
        key: 'results-approved',
        severity: 'info',
        value: fCount(a.approved),
        title: `Approved ${plural(a.approved, 'result', 'results')} not published`,
        detail: 'Students cannot see them until they are published',
        href: '/result',
        cta: 'Publish',
      });
    }
    const unset = (a.courseCount || 0) - (a.coursesWithAssessments || 0);
    if (unset > 0 && checkAny(ASSESSMENT_SETUP)) {
      push({
        key: 'courses-setup',
        severity: 'info',
        value: fCount(unset),
        title: `${plural(unset, 'Course has', 'Courses have')} no assessment setup`,
        detail: 'Scores cannot be entered until the split is set',
        href: '/assessment?filter=setup',
        cta: 'Set up',
      });
    }
  }

  // Fees and payments
  const f = summary?.finance?.summary;
  if (f && checkAny([PERMISSIONS.VIEW_FEE, PERMISSIONS.VIEW_PAYMENT])) {
    const feeHref = check(PERMISSIONS.VIEW_FEE) ? '/fee' : '/payment';
    if (f.overdueFeeCount > 0) {
      push({
        key: 'fees-overdue',
        severity: 'critical',
        value: fNairaShort(f.overdueOutstanding),
        title: 'Overdue and unpaid',
        detail: `${fCount(f.overdueFeeCount)} ${plural(f.overdueFeeCount, 'fee is', 'fees are')} past the due date · ${fNaira(f.overdueOutstanding)}`,
        href: feeHref,
        cta: 'Open fees',
      });
    }
    if (f.expected > 0 && f.collectionRate < 50) {
      push({
        key: 'fees-collection',
        severity: f.collectionRate < 25 ? 'critical' : 'warning',
        value: fPct(f.collectionRate),
        title: 'Fee collection rate',
        detail: `${fNairaShort(f.outstanding)} of ${fNairaShort(f.expected)} still outstanding this session`,
        href: feeHref,
        cta: 'Open fees',
      });
    }
    if (f.pendingPayments > 0 && check(PERMISSIONS.VIEW_PAYMENT)) {
      push({
        key: 'payments-pending',
        severity: 'info',
        value: fCount(f.pendingPayments),
        title: `Unfinished ${plural(f.pendingPayments, 'checkout', 'checkouts')}`,
        detail: 'Payments started but not completed at the gateway',
        href: '/payment',
        cta: 'Check',
      });
    }
  }

  // Students and staff accounts
  const s = summary?.students?.summary;
  if (s?.awaitingActivation > 0 && check(PERMISSIONS.VIEW_STUDENT)) {
    push({
      key: 'students-inactive',
      severity: 'warning',
      value: fCount(s.awaitingActivation),
      title: `${plural(s.awaitingActivation, 'Student', 'Students')} not activated`,
      detail: 'Accounts still in setup — they cannot use the portal',
      href: '/student',
      cta: 'Open',
    });
  }
  const o = summary?.operations?.summary;
  if (o?.pendingStaff > 0 && check(PERMISSIONS.VIEW_USER)) {
    push({
      key: 'staff-pending',
      severity: 'info',
      value: fCount(o.pendingStaff),
      title: `Staff ${plural(o.pendingStaff, 'account', 'accounts')} pending`,
      detail: 'Invited but not yet activated',
      href: '/user',
      cta: 'Open',
    });
  }
  if (o?.failedActionsLast30Days > 0 && check(PERMISSIONS.VIEW_AUDIT)) {
    push({
      key: 'audit-failures',
      severity: 'info',
      value: fCount(o.failedActionsLast30Days),
      title: `Failed ${plural(o.failedActionsLast30Days, 'action', 'actions')} in 30 days`,
      detail: 'Recorded in the audit log',
      href: '/audit',
      cta: 'Inspect',
    });
  }

  // Admissions (active admission session)
  const ad = admissions?.summary;
  if (ad) {
    const canApplications = check(PERMISSIONS.VIEW_APPLICATION);
    const canAdmissions = check(PERMISSIONS.VIEW_ADMISSION);
    const awaitingDecision = (ad.paid || 0) - (ad.offered || 0);
    if (awaitingDecision > 0) {
      push({
        key: 'applications-review',
        severity: 'warning',
        value: fCount(awaitingDecision),
        title: `Paid ${plural(awaitingDecision, 'applicant', 'applicants')} awaiting a decision`,
        detail: admissions.session?.name ? `No offer issued yet · ${admissions.session.name}` : 'No admission offer issued yet',
        href: canApplications ? '/application' : '/admission',
        cta: 'Review',
      });
    }
    const pendingOffers = (ad.offered || 0) - (ad.accepted || 0);
    if (pendingOffers > 0 && canAdmissions) {
      push({
        key: 'offers-pending',
        severity: 'info',
        value: fCount(pendingOffers),
        title: `${plural(pendingOffers, 'Offer', 'Offers')} not yet accepted`,
        detail: 'Acceptance fee not paid',
        href: '/admission',
        cta: 'Open',
      });
    }
    if (ad.daysToClose != null && ad.daysToClose >= 0 && ad.daysToClose <= 14) {
      push({
        key: 'applications-closing',
        severity: 'warning',
        value: `${ad.daysToClose}d`,
        title: ad.daysToClose === 0 ? 'Applications close today' : `Applications close in ${ad.daysToClose} ${plural(ad.daysToClose, 'day', 'days')}`,
        detail: admissions.session?.name || 'Active admission session',
        href: check(PERMISSIONS.VIEW_APP_SESSION) ? '/application/sessions' : '/application',
        cta: 'Open',
      });
    }
  }

  // The user's own courses (score sheets)
  if (Array.isArray(courses) && courses.length) {
    const byStage = courses.reduce((acc, c) => {
      const stage = courseStage(c);
      (acc[stage] = acc[stage] || []).push(c);
      return acc;
    }, {});
    const outstanding = [...(byStage.ready || []), ...(byStage.scoring || [])];
    if (outstanding.length && check(PERMISSIONS.EDIT_ASSESSMENT_SCORES)) {
      const missing = outstanding.reduce((n, c) => n + Math.max((c.students || 0) - (c.scoresComplete || 0), 0), 0);
      push({
        key: 'scores-outstanding',
        severity: 'warning',
        value: fCount(outstanding.length),
        title: `${plural(outstanding.length, 'Score sheet', 'Score sheets')} incomplete`,
        detail: `${outstanding.slice(0, 3).map((c) => c.code).join(', ')}${outstanding.length > 3 ? '…' : ''} · ${fCount(missing)} ${plural(missing, 'student', 'students')} without full scores`,
        href: '/assessment?filter=scoring&mine=true',
        cta: 'Enter scores',
      });
    }
    const scored = byStage.scored || [];
    if (scored.length && checkAny(COMPUTE)) {
      push({
        key: 'courses-compute',
        severity: 'info',
        value: fCount(scored.length),
        title: `${plural(scored.length, 'Course', 'Courses')} ready to compute`,
        detail: 'Every student is scored — compute draft results next',
        href: '/assessment?filter=scored&mine=true',
        cta: 'Compute',
      });
    }
    const setup = byStage.setup || [];
    if (setup.length && !a && checkAny(ASSESSMENT_SETUP)) {
      push({
        key: 'my-courses-setup',
        severity: 'info',
        value: fCount(setup.length),
        title: `${plural(setup.length, 'Course needs', 'Courses need')} assessment setup`,
        detail: setup.slice(0, 3).map((c) => c.code).join(', '),
        href: '/assessment?filter=setup&mine=true',
        cta: 'Set up',
      });
    }
  }

  return items.sort((x, y) => SEVERITY[x.severity].rank - SEVERITY[y.severity].rank);
}
