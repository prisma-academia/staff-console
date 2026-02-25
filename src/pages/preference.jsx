import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { PreferenceView } from 'src/sections/preference/view';

export default function PreferencePage() {
  return (
    <>
      <Helmet>
        <title>Preference | {config.appName}</title>
      </Helmet>

      <PreferenceView />
    </>
  );
}


