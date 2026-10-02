import * as Yup from 'yup';

// Mirrors the applicant portal's form (application-site pages biodata, examination,
// o-levels) so staff-keyed applications pass the same server validation.

export const STEPS = ['Applicant', 'Bio-data', 'Examinations', 'O-level results', 'Review', 'Payment'];
export const PAYMENT_STEP = STEPS.length - 1;
export const REVIEW_STEP = PAYMENT_STEP - 1;

export const EXAM_TYPES = [
  { label: 'Primary School', value: 'primary' },
  { label: 'WAEC', value: 'WAEC' },
  { label: 'NECO', value: 'NECO' },
  { label: 'NABTECH', value: 'NABTECH' },
];

export const SUBJECTS = [
  'English Language',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'Literature in English',
  'History',
  'Geography',
  'Computer Science',
  'Economics',
  'Government',
  'Commerce',
  'Accounting',
  'Civic Education',
  'Agricultural Science',
  'Physical Education',
  'Health Education',
  'Home Economics',
  'Business Studies',
  'French',
  'Marketing',
  'Music',
  'Art',
  'Technical Drawing',
  'Religious Studies',
  'Social Studies',
  'Information Technology',
  'Food and Nutrition',
  'Further Mathematics',
  'Christian Religious Studies (CRS)',
  'Islamic Religious Studies (IRS)',
  'Theatre Arts',
  'Financial Accounting',
];

export const GRADES = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9', 'Awaiting Result'];

// The first five subjects are compulsory on the portal and cannot be changed.
export const FIXED_SUBJECTS = 5;

export const emptyExam = () => ({ school: '', examType: '', examNumber: '', examYear: '' });

export const INITIAL_VALUES = {
  email: '',
  programme: '',
  firstName: '',
  lastName: '',
  otherName: '',
  gender: '',
  religion: '',
  dob: '',
  nin: '',
  phoneNumber: '',
  stateOfOrigin: '',
  lgaOfOrigin: '',
  stateOfResidence: '',
  lgaOfResidence: '',
  address: '',
  photo: '',
  examinations: [emptyExam()],
  result: [
    { subject: 'English Language', result: '' },
    { subject: 'Mathematics', result: '' },
    { subject: 'Biology', result: '' },
    { subject: 'Chemistry', result: '' },
    { subject: 'Physics', result: '' },
    ...Array.from({ length: 4 }, () => ({ subject: '', result: '' })),
  ],
};

const digits11 = (label) =>
  Yup.string().matches(/^\d{11}$/, `${label} must be exactly 11 digits`);

export const STEP_SCHEMAS = [
  Yup.object({
    email: Yup.string().trim().email('Invalid email address').required('Email is required'),
    programme: Yup.string().required('Programme is required'),
  }),
  Yup.object({
    firstName: Yup.string().trim().min(2, 'At least 2 characters').max(50).required('First name is required'),
    lastName: Yup.string().trim().min(2, 'At least 2 characters').max(50).required('Last name is required'),
    otherName: Yup.string().trim().max(50),
    gender: Yup.string().oneOf(['Male', 'Female']).required('Gender is required'),
    religion: Yup.string().oneOf(['Islam', 'Christianity']).required('Religion is required'),
    dob: Yup.date().max(new Date(), "Date of birth can't be in the future").required('Date of birth is required'),
    nin: digits11('NIN'),
    phoneNumber: digits11('Phone number').required('Phone number is required'),
    stateOfOrigin: Yup.string().required('State of origin is required'),
    lgaOfOrigin: Yup.string().required('LGA of origin is required'),
    stateOfResidence: Yup.string().required('State of residence is required'),
    lgaOfResidence: Yup.string().required('LGA of residence is required'),
    address: Yup.string().trim().min(5, 'At least 5 characters').max(100).required('Address is required'),
    photo: Yup.string().required('Passport photo is required'),
  }),
  Yup.object({
    examinations: Yup.array()
      .of(
        Yup.object({
          school: Yup.string().trim().required('School is required'),
          examType: Yup.string().required('Exam type is required'),
          examNumber: Yup.string().when('examType', {
            is: (value) => value && value !== 'primary',
            then: (schema) => schema.trim().required('Exam number is required'),
            otherwise: (schema) => schema.optional(),
          }),
          examYear: Yup.string()
            .matches(/^(19|20)\d{2}$/, 'Enter a 4-digit year')
            .required('Year is required'),
        })
      )
      .min(1, 'At least one examination is required')
      .max(2, 'At most two examinations'),
  }),
  Yup.object({
    result: Yup.array()
      .of(
        Yup.object({
          subject: Yup.string().required('Subject is required'),
          result: Yup.string().oneOf(GRADES, 'Invalid grade').required('Grade is required'),
        })
      )
      .length(9, 'Exactly 9 subjects are required')
      .test('unique-subjects', 'Each subject must be unique', (rows = []) => {
        const subjects = rows.map((row) => row.subject).filter(Boolean);
        return new Set(subjects).size === subjects.length;
      }),
  }),
];

// Body for POST /onboard; the server fills in session, number and account.
export const toPayload = (values) => ({
  ...values,
  email: values.email.trim().toLowerCase(),
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  otherName: values.otherName.trim() || undefined,
  nin: values.nin || undefined,
  address: values.address.trim(),
  examinations: values.examinations.map(({ school, examType, examNumber, examYear }) => ({
    school: school.trim(),
    examType,
    examYear,
    ...(examNumber ? { examNumber: examNumber.trim() } : {}),
  })),
});
