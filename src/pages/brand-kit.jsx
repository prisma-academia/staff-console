import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import BrandKitView from 'src/sections/doc-studio/brand-kit-view';

// ----------------------------------------------------------------------

export default function BrandKitPage() {
  return (
    <>
      <Helmet>
        <title>Brand Kit | {config.appName}</title>
      </Helmet>

      <BrandKitView />
    </>
  );
}
