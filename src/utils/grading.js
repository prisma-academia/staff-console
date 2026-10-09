// Display helpers for grades and classes of award. Nothing here decides a
// grade: the API grades every score with the programme's grading scheme and
// sends the scheme along (bands highest first), so these only pick colours.

/** MUI palette key for a grade within a scheme: passes shade from green to amber, fails are red. */
export function gradeTone(grade, scheme) {
  if (!grade) return 'default';
  const bands = scheme?.bands || [];
  const band = bands.find((b) => b.grade === grade);
  if (!band) return 'default';
  if (!band.isPass) return 'error';
  const passing = bands.filter((b) => b.isPass);
  const rank = passing.findIndex((b) => b.grade === grade);
  const share = passing.length > 1 ? rank / (passing.length - 1) : 0;
  if (share < 0.34) return 'success';
  if (share < 0.67) return 'info';
  return 'warning';
}

/** Background shade for a grade cell. */
export function gradeBg(grade, scheme) {
  const tone = gradeTone(grade, scheme);
  return tone === 'default' ? 'grey.100' : `${tone}.lighter`;
}

/** MUI palette key for a class of award (Distinction ... Fail). */
export function classTone(classification, scheme) {
  if (!classification) return 'default';
  if (!classification.isPass) return 'error';
  const classes = (scheme?.classes || []).filter((c) => c.isPass);
  const rank = classes.findIndex((c) => c.name === classification.name);
  if (rank <= 0) return 'success';
  if (rank === 1) return 'info';
  return 'warning';
}

/** GPA to the scheme's decimals, or a dash when there is none. */
export function formatGpa(value, scheme) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(scheme?.gpaDecimals ?? 2);
}

export const RESULT_STATUS_COLORS = {
  draft: 'default',
  approved: 'info',
  published: 'success',
};

// ----------------------------------------------------------------------
// Course totals. These mirror api/src/lib/grading.js so the score sheet can
// show a live total and grade while scores are typed; the API recomputes
// everything when results are saved.

export const ASSESSMENT_TYPES = ['CA1', 'CA2', 'CA3', 'Exam'];

/** Ready-made splits. Each assessment is marked out of its weight, so raw marks add up to 100. */
export const SPLIT_PRESETS = [
  { id: 'ca40', label: 'CA 40 + Exam 60', rows: [['CA1', 40], ['Exam', 60]] },
  { id: 'ca30', label: 'CA 30 + Exam 70', rows: [['CA1', 30], ['Exam', 70]] },
  { id: '2ca40', label: 'CA1 20 + CA2 20 + Exam 60', rows: [['CA1', 20], ['CA2', 20], ['Exam', 60]] },
  { id: '2ca30', label: 'CA1 15 + CA2 15 + Exam 70', rows: [['CA1', 15], ['CA2', 15], ['Exam', 70]] },
  { id: '3ca40', label: 'CA1 10 + CA2 10 + CA3 20 + Exam 60', rows: [['CA1', 10], ['CA2', 10], ['CA3', 20], ['Exam', 60]] },
].map((preset) => ({
  ...preset,
  rows: preset.rows.map(([type, weight]) => ({ type, maxScore: weight, weight })),
}));

const roundTo = (value, decimals = 0, mode = 'round') => {
  if (value == null || Number.isNaN(Number(value))) return null;
  if (mode === 'none') return Number(value);
  const factor = 10 ** decimals;
  const scaled = Number((Number(value) * factor).toFixed(8));
  if (mode === 'floor' || mode === 'truncate') return Math.floor(scaled + 1e-9) / factor;
  return Math.round(scaled) / factor;
};

const idOf = (value) => (value && value._id ? value._id : value)?.toString();

/** See checkAssessmentSetup in the API: all weighted (adding up to 100) or none weighted. */
export function checkAssessmentSetup(assessments) {
  const list = (assessments || []).filter(Boolean);
  const errors = [];
  const warnings = [];
  if (!list.length) return { ok: false, mode: 'none', totalWeight: 0, shares: [], errors: ['No assessments are set up'], warnings };

  const types = new Set();
  list.forEach((a) => {
    if (!a.type) errors.push('Choose a type for every assessment');
    else if (types.has(a.type)) errors.push(`${a.type} is listed more than once`);
    else types.add(a.type);
    if (!(Number(a.maxScore) > 0)) errors.push(`${a.type || 'Assessment'}: "marked out of" must be more than 0`);
  });

  const weighted = list.filter((a) => Number(a.weight) > 0);
  const totalWeight = roundTo(weighted.reduce((sum, a) => sum + Number(a.weight), 0), 2);
  let mode = weighted.length ? 'weighted' : 'raw-sum';
  if (weighted.length && weighted.length < list.length) {
    mode = 'invalid';
    const missing = list.filter((a) => !(Number(a.weight) > 0)).map((a) => a.type || 'the new row');
    errors.push(`Give ${missing.join(', ')} a weight too, or clear every weight to add up raw marks`);
  } else if (mode === 'weighted' && Math.abs(totalWeight - 100) > 1e-6) {
    errors.push(`Weights add up to ${totalWeight}%; they must add up to 100%`);
  }

  let shares = [];
  if (mode === 'weighted') {
    shares = list.map((a) => ({ type: a.type, share: roundTo((Number(a.weight) / (totalWeight || 1)) * 100, 2) }));
  } else if (mode === 'raw-sum') {
    const max = list.reduce((sum, a) => sum + (Number(a.maxScore) || 0), 0);
    shares = list.map((a) => ({ type: a.type, share: max > 0 ? roundTo(((Number(a.maxScore) || 0) / max) * 100, 2) : 0 }));
    if (list.length > 1 && new Set(list.map((a) => Number(a.maxScore))).size === 1) {
      warnings.push(`Every assessment is marked out of ${list[0].maxScore}, so each counts ${shares[0].share}% of the total`);
    }
  }
  if (!types.has('Exam')) warnings.push('There is no Exam assessment');

  return { ok: errors.length === 0, mode, totalWeight, shares, errors, warnings };
}

/** The 0-100 course total from assessment scores (missing scores count as 0). */
export function courseTotal(assessments, scores) {
  const list = (assessments || []).filter((a) => a && a.maxScore > 0);
  const scoreOf = (a) => {
    const value = scores ? scores[idOf(a)] : undefined;
    return value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value);
  };
  const missing = list.filter((a) => scoreOf(a) == null).map((a) => a.type);
  if (!list.length || !list.some((a) => scoreOf(a) != null)) return { total: null, complete: false, missing };

  const weightedCount = list.filter((a) => Number(a.weight) > 0).length;
  if (weightedCount && weightedCount < list.length) return { total: null, complete: false, missing, invalid: true };

  let total;
  if (weightedCount) {
    let weighted = 0;
    let weightSum = 0;
    list.forEach((a) => {
      weighted += (((scoreOf(a) ?? 0) / a.maxScore) * 100) * Number(a.weight);
      weightSum += Number(a.weight);
    });
    total = weighted / weightSum;
  } else {
    const marks = list.reduce((sum, a) => sum + (scoreOf(a) ?? 0), 0);
    const max = list.reduce((sum, a) => sum + a.maxScore, 0);
    total = (marks / max) * 100;
  }
  return { total: roundTo(total, 2), complete: missing.length === 0, missing };
}

/** Grades a 0-100 total with a summarised scheme (bands highest first). */
export function gradeScore(score, scheme) {
  if (score == null || !scheme) return null;
  const { mode = 'round', decimals = 0 } = scheme.scoreRounding || {};
  const rounded = roundTo(Math.min(100, Math.max(0, Number(score))), decimals, mode);
  const band = [...(scheme.bands || [])].sort((a, b) => b.minScore - a.minScore).find((b) => rounded >= b.minScore - 1e-9);
  return band ? { score: rounded, grade: band.grade, point: band.point, isPass: !!band.isPass, remark: band.remark || '' } : null;
}

/** "CA1 /20 · CA2 /20 · Exam /60" */
export function describeSplit(assessments) {
  return (assessments || [])
    .map((a) => `${a.type} /${a.maxScore}${a.weight && Number(a.weight) !== Number(a.maxScore) ? ` (${a.weight}%)` : ''}`)
    .join(' · ');
}

const TYPE_ORDER = { CA1: 1, CA2: 2, CA3: 3, Exam: 4 };
/** CA1, CA2, CA3, Exam */
export const byAssessmentOrder = (a, b) => (TYPE_ORDER[a.type] || 9) - (TYPE_ORDER[b.type] || 9);
