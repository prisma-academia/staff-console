import { Helmet } from 'react-helmet-async';

import { ProgramView } from 'src/sections/program/view';

// ----------------------------------------------------------------------

export default function ProgramPage() {
  return (
    <>
      <Helmet>
        <title> Programs | AB NAIBI Admission </title>
      </Helmet>

      <ProgramView />
    </>
  );
}
