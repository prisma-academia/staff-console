import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { ClassLevelView } from 'src/sections/classlevel/view';

// ----------------------------------------------------------------------

export default function ClassLevelPage() {
  return (
    <>
      <Helmet>
        <title>Class Levels | {config.appName}</title>
      </Helmet>

      <ClassLevelView />
    </>
  );
}
