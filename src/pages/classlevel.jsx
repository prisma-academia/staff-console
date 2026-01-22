import { Helmet } from 'react-helmet-async';

import { ClassLevelView } from 'src/sections/classlevel/view';

// ----------------------------------------------------------------------

export default function ClassLevelPage() {
  return (
    <>
      <Helmet>
        <title> Class Levels | AB NAIBI Console </title>
      </Helmet>

      <ClassLevelView />
    </>
  );
}
