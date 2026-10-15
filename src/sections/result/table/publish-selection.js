// Which broadsheet results can be published. Mirrors the API rule in
// ResultController._publishReadiness; the API stays the source of truth.
//
// A result can be published when its score sheet is complete: the course's
// assessment setup is valid and every assessment has a score. Overrides
// (scores typed in on the broadsheet) count as complete. A draft whose scores
// changed after it was computed is out of date and must be computed again.

/** 'published' | 'ready' | 'incomplete' | 'stale' | 'none' */
export function rowState(row) {
  if (row.status === 'published') return 'published';
  if (!row.resultId) return 'none';
  if (row.isOverride) return 'ready';
  if (row.setupError || !row.complete) return 'incomplete';
  if (row.status === 'draft' && row.stale) return 'stale';
  return 'ready';
}

/** Why a row stops its student or course from being published, or null. */
export function rowBlocker(row) {
  switch (rowState(row)) {
    case 'incomplete':
      if (row.setupError) return 'assessment setup invalid';
      return row.missing?.length ? `missing ${row.missing.join(', ')}` : 'scores incomplete';
    case 'stale':
      return 'out of date, compute again';
    case 'none':
      if (row.calculatedScore != null)
        return row.complete
          ? 'not computed'
          : `missing ${(row.missing || []).join(', ') || 'scores'}`;
      return row.setupError ? 'assessment setup invalid' : 'no scores';
    default:
      return null;
  }
}

const rowsOf = (student) => [...(student.courses || []), ...(student.carryOvers || [])];

const inScope = (set, id) => !set || !set.size || set.has(id);

/**
 * Whether a set of rows is fully scored and has something left to publish.
 * @returns {{ eligible: boolean, ready: number, blockers: string[] }}
 */
function summariseRows(rows, label) {
  const blockers = [];
  let ready = 0;
  rows.forEach((row) => {
    const state = rowState(row);
    if (state === 'ready') ready += 1;
    const reason = rowBlocker(row);
    if (reason) blockers.push(`${label(row)}: ${reason}`);
  });
  return { eligible: ready > 0 && !blockers.length, ready, blockers };
}

/** A student's state over the courses in scope (all courses when none are selected). */
export function studentState(student, selectedCourses) {
  const rows = rowsOf(student).filter((row) => inScope(selectedCourses, row.courseId));
  return summariseRows(rows, (row) => row.courseCode);
}

/** A course's state over the students in scope (all students when none are selected). */
export function courseState(students, courseId, selectedStudents) {
  const rows = [];
  students.forEach((student) => {
    if (!inScope(selectedStudents, student.studentId)) return;
    const row = rowsOf(student).find((r) => r.courseId === courseId);
    if (row) rows.push({ ...row, regNumber: student.regNumber });
  });
  return summariseRows(rows, (row) => row.regNumber);
}

/** Tooltip of a publish checkbox: why it can't be selected, or what it selects. */
export function selectTip(state, checked) {
  if (checked || state.eligible) return 'Select to publish';
  if (!state.blockers.length) return 'Nothing left to publish';
  const list = state.blockers.slice(0, 6).join(' · ');
  return `Score sheet not complete: ${list}${state.blockers.length > 6 ? ` (+${state.blockers.length - 6} more)` : ''}`;
}

/**
 * What a publish would do for the selected students x courses (everything
 * when nothing is selected).
 * @returns {{ approved: number, draft: number, heldBack: number }}
 *   approved/draft: results ready to publish; heldBack: results that would be
 *   skipped because their score sheet is incomplete or the draft is out of date
 *   (drafts count only when approveDrafts is set).
 */
export function selectionSummary(
  students,
  { selectedStudents, selectedCourses, approveDrafts = false } = {}
) {
  const summary = { approved: 0, draft: 0, heldBack: 0 };
  students.forEach((student) => {
    if (!inScope(selectedStudents, student.studentId)) return;
    rowsOf(student).forEach((row) => {
      if (!inScope(selectedCourses, row.courseId)) return;
      if (row.status !== 'approved' && row.status !== 'draft') return;
      if (row.status === 'draft' && !approveDrafts) return;
      if (rowState(row) === 'ready') summary[row.status] += 1;
      else summary.heldBack += 1;
    });
  });
  return summary;
}
