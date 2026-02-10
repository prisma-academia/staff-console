import { Helmet } from 'react-helmet-async';

import { ResultBuilderView } from 'src/sections/result/builder';

// ----------------------------------------------------------------------

export default function ResultBuilderPage() {
  return (
    <>
      <Helmet>
        <title>Result Builder | Prepare student results</title>
      </Helmet>
      <ResultBuilderView />
    </>
  );
}
