import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { MailView } from 'src/sections/mail/view';

// ----------------------------------------------------------------------

export default function MailPage() {
  return (
    <>
      <Helmet>
        <title>Mail | {config.appName}</title>
      </Helmet>
    
      <MailView />
    </>
  );
}
