import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { MailAccountView } from 'src/sections/mail-account/view';

export default function MailAccountPage() {
  return (
    <>
      <Helmet>
        <title>Mail Accounts | {config.appName}</title>
      </Helmet>

      <MailAccountView />
    </>
  );
}
