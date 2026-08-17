// Mirrors the API's `program.type` enum (api/src/constants/program.js). Adding a
// type here and there is all that is needed for the programme forms, tables and
// filters to pick it up.
export const PROGRAM_TYPES = ['ND', 'Basic', 'Professional'];

// Shapes the types for <CustomSelect data={...} />, which requires { _id, name }.
export const programTypeOptions = PROGRAM_TYPES.map((type) => ({ _id: type, name: type }));

// e.g. "ND, Basic or Professional", for validation messages.
export const PROGRAM_TYPES_SENTENCE = PROGRAM_TYPES.reduce((sentence, type, index) => {
  if (index === 0) return type;
  return index === PROGRAM_TYPES.length - 1 ? `${sentence} or ${type}` : `${sentence}, ${type}`;
}, '');

const PROGRAM_TYPE_COLORS = {
  ND: 'primary',
  Basic: 'secondary',
  Professional: 'info',
};

// MUI palette colour for a type's chip. Unknown/missing types stay neutral.
export const getProgramTypeColor = (type) => PROGRAM_TYPE_COLORS[type] || 'default';
