import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import StudioGalleryView from 'src/sections/doc-studio/studio-gallery-view';

// ----------------------------------------------------------------------

export default function DocStudioPage() {
  return (
    <>
      <Helmet>
        <title>Template Studio | {config.appName}</title>
      </Helmet>

      <StudioGalleryView />
    </>
  );
}
