export const PERMISSION_CATEGORIES = [
  {
    label: 'Student Management',
    permissions: [
      { id: 'add_student', label: 'Add Student' },
      { id: 'edit_student', label: 'Edit Student' },
      { id: 'delete_student', label: 'Delete Student' },
      { id: 'view_student', label: 'View Student' },
      { id: 'view_reg_number', label: 'View Registration Number' },
    ],
  },
  {
    label: 'Fee Management',
    permissions: [
      { id: 'add_fee', label: 'Add Fee' },
      { id: 'edit_fee', label: 'Edit Fee' },
      { id: 'delete_fee', label: 'Delete Fee' },
      { id: 'view_fee', label: 'View Fee' },
      { id: 'view_student_fee', label: 'View Student Fee' },
    ],
  },
  {
    label: 'Payment Management',
    permissions: [
      { id: 'add_payment', label: 'Add Payment' },
      { id: 'edit_payment', label: 'Edit Payment' },
      { id: 'delete_payment', label: 'Delete Payment' },
      { id: 'view_payment', label: 'View Payment' },
      { id: 'initialize_payment', label: 'Initialize Payment' },
    ],
  },
  {
    label: 'Application & Admission Management',
    permissions: [
      { id: 'view_application', label: 'View Application' },
      { id: 'edit_application', label: 'Edit Application' },
      { id: 'export_application', label: 'Export Application' },
      { id: 'view_admission', label: 'View Admission' },
      { id: 'add_admission', label: 'Add Admission' },
      { id: 'edit_admission', label: 'Edit Admission' },
    ],
  },
  {
    label: 'Application Sessions & Programmes',
    permissions: [
      { id: 'view_app_session', label: 'View App Session' },
      { id: 'add_app_session', label: 'Add App Session' },
      { id: 'edit_app_session', label: 'Edit App Session' },
      { id: 'delete_app_session', label: 'Delete App Session' },
      { id: 'view_app_programme', label: 'View App Programme' },
      { id: 'add_app_programme', label: 'Add App Programme' },
      { id: 'edit_app_programme', label: 'Edit App Programme' },
      { id: 'delete_app_programme', label: 'Delete App Programme' },
    ],
  },
  {
    label: 'Program Management',
    permissions: [
      { id: 'add_program', label: 'Add Program' },
      { id: 'edit_program', label: 'Edit Program' },
      { id: 'delete_program', label: 'Delete Program' },
      { id: 'view_program', label: 'View Program' },
    ],
  },
  {
    label: 'Course Management',
    permissions: [
      { id: 'add_course', label: 'Add Course' },
      { id: 'edit_course', label: 'Edit Course' },
      { id: 'delete_course', label: 'Delete Course' },
      { id: 'view_course', label: 'View Course' },
      { id: 'view_course_form', label: 'View Course Form' },
    ],
  },
  {
    label: 'Instructor Management',
    permissions: [
      { id: 'add_instructor', label: 'Add Instructor' },
      { id: 'edit_instructor', label: 'Edit Instructor' },
      { id: 'delete_instructor', label: 'Delete Instructor' },
      { id: 'view_instructor', label: 'View Instructor' },
    ],
  },
  {
    label: 'Class Level Management',
    permissions: [
      { id: 'add_classlevel', label: 'Add Class Level' },
      { id: 'edit_classlevel', label: 'Edit Class Level' },
      { id: 'delete_classlevel', label: 'Delete Class Level' },
      { id: 'view_classlevel', label: 'View Class Level' },
    ],
  },
  {
    label: 'Session Management',
    permissions: [
      { id: 'add_session', label: 'Add Session' },
      { id: 'edit_session', label: 'Edit Session' },
      { id: 'delete_session', label: 'Delete Session' },
      { id: 'view_session', label: 'View Session' },
    ],
  },
  {
    label: 'Result Management',
    permissions: [
      { id: 'add_result', label: 'Add Result' },
      { id: 'edit_result', label: 'Edit Result' },
      { id: 'delete_result', label: 'Delete Result' },
      { id: 'view_result', label: 'View Result' },
      { id: 'view_result_template', label: 'View Result Template' },
      { id: 'build_result', label: 'Build Result' },
      { id: 'export_result', label: 'Export Result' },
    ],
  },
  {
    label: 'Memo Management',
    permissions: [
      { id: 'add_memo', label: 'Add Memo' },
      { id: 'edit_memo', label: 'Edit Memo' },
      { id: 'delete_memo', label: 'Delete Memo' },
      { id: 'view_memo', label: 'View Memo' },
      { id: 'view_student_memo', label: 'View Student Memo' },
    ],
  },
  {
    label: 'Document Management',
    permissions: [
      { id: 'add_document', label: 'Add Document' },
      { id: 'edit_document', label: 'Edit Document' },
      { id: 'delete_document', label: 'Delete Document' },
      { id: 'view_document', label: 'View Document' },
    ],
  },
  {
    label: 'Event Management',
    permissions: [
      { id: 'add_event', label: 'Add Event' },
      { id: 'edit_event', label: 'Edit Event' },
      { id: 'delete_event', label: 'Delete Event' },
      { id: 'view_event', label: 'View Event' },
      { id: 'view_student_event', label: 'View Student Event' },
    ],
  },
  {
    label: 'Analytics',
    permissions: [
      { id: 'view_analytics', label: 'View Analytics' },
    ],
  },
  {
    label: 'User Management',
    permissions: [
      { id: 'add_user', label: 'Add User' },
      { id: 'edit_user', label: 'Edit User' },
      { id: 'delete_user', label: 'Delete User' },
      { id: 'view_user', label: 'View User' },
      { id: 'reset_user_password', label: 'Reset User Password' },
      { id: 'assign_admin_role', label: 'Assign Admin Role' },
    ],
  },
  {
    label: 'User Group Management',
    permissions: [
      { id: 'add_user_group', label: 'Add User Group' },
      { id: 'edit_user_group', label: 'Edit User Group' },
      { id: 'delete_user_group', label: 'Delete User Group' },
      { id: 'view_user_group', label: 'View User Group' },
    ],
  },
  {
    label: 'Role Permission Management',
    permissions: [
      { id: 'add_role_permission', label: 'Add Role Permission' },
      { id: 'edit_role_permission', label: 'Edit Role Permission' },
      { id: 'delete_role_permission', label: 'Delete Role Permission' },
      { id: 'view_role_permission', label: 'View Role Permission' },
    ],
  },
  {
    label: 'Settings',
    permissions: [
      { id: 'view_settings', label: 'View Settings' },
      { id: 'edit_settings', label: 'Edit Settings' },
      { id: 'reset_settings', label: 'Reset Settings' },
    ],
  },
  {
    label: 'Audit',
    permissions: [
      { id: 'view_audit', label: 'View Audit' },
      { id: 'delete_audit', label: 'Delete Audit' },
    ],
  },
  {
    label: 'Assessment Management',
    permissions: [
      { id: 'add_assessment', label: 'Add Assessment' },
      { id: 'edit_assessment', label: 'Edit Assessment' },
      { id: 'delete_assessment', label: 'Delete Assessment' },
      { id: 'view_assessment', label: 'View Assessment' },
      { id: 'view_assessment_scores', label: 'View Assessment Scores' },
      { id: 'edit_assessment_scores', label: 'Edit Assessment Scores' },
    ],
  },
  {
    label: 'Score Management',
    permissions: [
      { id: 'add_score', label: 'Add Score' },
      { id: 'edit_score', label: 'Edit Score' },
      { id: 'delete_score', label: 'Delete Score' },
      { id: 'view_score', label: 'View Score' },
    ],
  },
  {
    label: 'Template Management',
    permissions: [
      { id: 'add_template', label: 'Add Template' },
      { id: 'edit_template', label: 'Edit Template' },
      { id: 'delete_template', label: 'Delete Template' },
      { id: 'view_template', label: 'View Template' },
    ],
  },
  {
    label: 'Mail',
    permissions: [
      { id: 'view_mails', label: 'View Mails' },
      { id: 'compose_mail', label: 'Compose Mail' },
      { id: 'delete_mail', label: 'Delete Mail' },
    ],
  },
  {
    label: 'Mail Account Management',
    permissions: [
      { id: 'view_mail_accounts', label: 'View Mail Accounts' },
      { id: 'add_mail_account', label: 'Add Mail Account' },
      { id: 'edit_mail_account', label: 'Edit Mail Account' },
      { id: 'delete_mail_account', label: 'Delete Mail Account' },
      { id: 'assign_mail_account', label: 'Assign Mail Account' },
    ],
  },
];

