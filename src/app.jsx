/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';
import { SnackbarProvider } from 'notistack';

import Router from 'src/routes/sections';
import ThemeProvider from 'src/theme';
import config from 'src/config';

export default function App() {
  useScrollToTop();
  return (
    <ThemeProvider>
      <SnackbarProvider
        maxSnack={config.notifications.maxSnacks}
        anchorOrigin={config.notifications.getAnchorOrigin()}
      >
        <Router />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
