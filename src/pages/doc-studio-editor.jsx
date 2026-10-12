import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import StudioEditorView from 'src/sections/doc-studio/studio-editor-view';

// ----------------------------------------------------------------------

export default function DocStudioEditorPage() {
  return (
    <>
      <Helmet>
        <title>Edit template | {config.appName}</title>
      </Helmet>

      <StudioEditorView />
    </>
  );
}
