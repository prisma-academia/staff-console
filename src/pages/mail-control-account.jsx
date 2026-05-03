import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { MailControlAccountDetailView } from 'src/sections/mail-control/view';

export default function MailControlAccountPage() {
  return (
    <>
      <Helmet>
        <title>Mail account | {config.appName}</title>
      </Helmet>
      <MailControlAccountDetailView />
    </>
  );
}
