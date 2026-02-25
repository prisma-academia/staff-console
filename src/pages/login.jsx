import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { LoginView } from 'src/sections/login';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Login | {config.appName}</title>
      </Helmet>

      <LoginView />
    </>
  );
}
