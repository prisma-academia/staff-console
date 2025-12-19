import { Helmet } from 'react-helmet-async';

import { PreferenceView } from 'src/sections/preference/view';

export default function PreferencePage() {
  return (
    <>
      <Helmet>
        <title> Preference | AB NAIBI Admission </title>
      </Helmet>

      <PreferenceView />
    </>
  );
}


