import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { bgBlur } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

import Searchbar from './common/searchbar';
import { NAV, HEADER } from './config-layout';
import AccountPopover from './common/account-popover';
import NotificationsPopover from './common/notifications-popover';

// ----------------------------------------------------------------------

export default function Header({ onOpenNav }) {
  const theme = useTheme();
  const pathname = usePathname();
  
  // Get current page title from pathname
  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const lgUp = useResponsive('up', 'lg');

  const renderContent = (
    <>
      {!lgUp && (
        <IconButton 
          onClick={onOpenNav} 
          sx={{ 
            mr: 2,
            color: 'text.primary',
            bgcolor: alpha(theme.palette.grey[500], 0.08), 
            '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.16) },
            width: 40,
            height: 40
          }}
        >
          <Iconify icon="eva:menu-2-fill" />
        </IconButton>
      )}
      
      {!lgUp && (
        <Box sx={{ mr: 2, display: { xs: 'inline-flex', lg: 'none' } }}>
          <Logo />
        </Box>
      )}
      
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {getPageTitle()}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
        <Searchbar />
        
        {/* <Button
          startIcon={<Iconify icon="eva:plus-fill" />}
          variant="contained"
          color="primary"
          sx={{ 
            display: { xs: 'none', sm: 'flex' },
            height: 40,
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              bgcolor: alpha(theme.palette.primary.main, 0.8),
            },
          }}
        >
          New
        </Button> */}
        
        <NotificationsPopover />
        <AccountPopover />
      </Stack>
    </>
  );

  return (
    <AppBar
      sx={{
        boxShadow: 'none',
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        transition: theme.transitions.create(['height'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(lgUp && {
          width: `calc(100% - ${NAV.WIDTH}px)`,
          height: HEADER.H_DESKTOP,
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { lg: 5 },
        }}
      >
        {renderContent}
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  onOpenNav: PropTypes.func,
};
