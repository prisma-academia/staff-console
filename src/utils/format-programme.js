// Renders a programme as "Basic Nursing (Basic)". Falls back to code/_id when
// name is missing, and omits the suffix for programmes without a type.
export const formatProgrammeLabel = (programme) => {
  const name = programme?.name || programme?.code || programme?._id || '';
  return programme?.type ? `${name} (${programme.type})` : name;
};

// Shapes a programme list for <CustomSelect data={...} />, which requires { _id, name }.
// Tolerates undefined/non-array input, since several callers pass raw query data.
export const toProgrammeOptions = (programmes) =>
  (Array.isArray(programmes) ? programmes : []).map((p) => ({
    _id: p?._id,
    name: formatProgrammeLabel(p),
  }));
