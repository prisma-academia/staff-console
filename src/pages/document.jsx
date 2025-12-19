import { Helmet } from 'react-helmet-async';

import { DocumentView } from 'src/sections/document/view';

// ----------------------------------------------------------------------

export default function DocumentPage() {
  return (
    <>
      <Helmet>
        <title> Documents | AB NAIBI Admission </title>
      </Helmet>

      <DocumentView />
    </>
  );
}
