import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { TemplateView } from 'src/sections/template/view';

// ----------------------------------------------------------------------

export default function TemplatePage() {
  return (
    <>
      <Helmet>
        <title>Templates | {config.appName}</title>
      </Helmet>

      <TemplateView />
    </>
  );
}

