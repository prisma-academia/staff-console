import { Helmet } from 'react-helmet-async';

import { TemplateView } from 'src/sections/template/view';

// ----------------------------------------------------------------------

export default function TemplatePage() {
  return (
    <>
      <Helmet>
        <title> Templates | Template Management </title>
      </Helmet>

      <TemplateView />
    </>
  );
}

