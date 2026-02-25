import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { ResultTableView } from 'src/sections/result/table';

// ----------------------------------------------------------------------

export default function ResultPage() {
  return (
    <>
      <Helmet>
        <title>Results | {config.appName}</title>
      </Helmet>

      <ResultTableView />
    </>
  );
}
