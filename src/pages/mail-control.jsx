import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { MailControlView } from 'src/sections/mail-control/view';

export default function MailControlPage() {
  return (
    <>
      <Helmet>
        <title>Mail control | {config.appName}</title>
      </Helmet>
      <MailControlView />
    </>
  );
}
