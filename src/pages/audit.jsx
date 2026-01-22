import { Helmet } from 'react-helmet-async';

import { AuditView } from 'src/sections/audit/view';

// ----------------------------------------------------------------------

export default function AuditPage() {
  return (
    <>
      <Helmet>
        <title> Audit Logs | AB NAIBI Admission </title>
      </Helmet>

      <AuditView />
    </>
  );
}
