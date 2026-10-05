import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { GradingSchemeView } from 'src/sections/grading-scheme/view';

// ----------------------------------------------------------------------

export default function GradingSchemePage() {
  return (
    <>
      <Helmet>
        <title>Grading Schemes | {config.appName}</title>
      </Helmet>

      <GradingSchemeView />
    </>
  );
}
