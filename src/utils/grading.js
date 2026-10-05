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
