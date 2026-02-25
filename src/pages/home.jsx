import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { HomeView } from 'src/sections/home/view';

// ----------------------------------------------------------------------

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Home | {config.appName}</title>
      </Helmet>

      <HomeView />
    </>
  );
}
