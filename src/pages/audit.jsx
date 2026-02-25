import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AuditView } from 'src/sections/audit/view';

// ----------------------------------------------------------------------

export default function AuditPage() {
  return (
    <>
      <Helmet>
        <title>Audit Logs | {config.appName}</title>
      </Helmet>

      <AuditView />
    </>
  );
}
