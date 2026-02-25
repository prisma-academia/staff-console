import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { ProgramView } from 'src/sections/program/view';

// ----------------------------------------------------------------------

export default function ProgramPage() {
  return (
    <>
      <Helmet>
        <title>Programs | {config.appName}</title>
      </Helmet>

      <ProgramView />
    </>
  );
}
