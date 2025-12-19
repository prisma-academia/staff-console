import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthStore } from 'src/store';

import Logo from 'src/components/logo';
import Can from 'src/components/permission/can';
import Scrollbar from 'src/components/scrollbar';

import { NAV } from './config-layout';
// import navConfig from './config-navigation';
import useNavConfig from './config-navigation';

// ----------------------------------------------------------------------

export default function Nav({ openNav, onCloseNav }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const navConfig = useNavConfig();
  const theme = useTheme();

  const upLg = useResponsive('up', 'lg');

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // const renderAccount = (
  //   <Box
  //     sx={{
  //       my: 3,
  //       mx: 2.5,
  //       py: 2,
  //       px: 2.5,
  //       display: 'flex',
  //       borderRadius: 1.5,
  //       alignItems: 'center',
  //       bgcolor: thm=> alpha(thm.palette.primary.main, 0.04),
  //     }}
  //   >
  //     <Avatar 
  //       src={user?.profilePic} 
  //       alt="photoURL"
  //       sx={{ 
  //         width: 44, 
  //         height: 44,
  //         border: `2px solid ${alpha(theme.palette.primary.main, 0.24)}`
  //       }}
  //     />

  //     <Box sx={{ ml: 2 }}>
  //       <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
  //         {user?.fullName}
  //       </Typography>

  //       <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.2 }}>
  //         {user?.role}
  //       </Typography>
  //     </Box>
  //   </Box>
  // );

  const renderMenu = (
    <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
      <Typography 
        variant="overline" 
        sx={{ 
          px: 2, 
          pt: 2, 
          pb: 1, 
          color: 'text.secondary',
          fontWeight: 600,
          letterSpacing: 1,
          fontSize: '0.7rem'
        }}
      >
        MAIN MENU
      </Typography>
      
      {navConfig.map((item) => (
        <Can key={item.title} do={item.permission}>
          <NavItem item={item} />
        </Can>
      ))}
    </Stack>
  );

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ pt: 3, pb: 2, px: 2.5, display: 'inline-flex' }}>
        <Logo />
      </Box>

      <Divider sx={{ borderStyle: 'solid', borderColor: alpha(theme.palette.grey[500], 0.12) }} />

      {/* {renderAccount} */}

      {renderMenu}

      <Box sx={{ flexGrow: 1 }} />

      {/* <Box sx={{ px: 2.5, pb: 3, mt: 10 }}>
        <Stack alignItems="center" spacing={3} sx={{ pt: 5, borderTop: `dashed 1px ${theme.palette.divider}` }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Need help?
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
              Contact Support
            </Typography>
          </Box>

          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                }}
              />
            }
          >
            <Avatar 
              alt="support"
              sx={{ 
                width: 32, 
                height: 32,
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            />
          </Badge>
        </Stack>
      </Box> */}
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.WIDTH },
      }}
    >
      {upLg ? (
        <Box
          sx={{
            height: 1,
            position: 'fixed',
            width: NAV.WIDTH,
            borderRight: thm=> `solid 1px ${alpha(thm.palette.grey[500], 0.12)}`,
            bgcolor: 'background.paper', 
            boxShadow: thm=> `0 0 16px 0 ${alpha(thm.palette.grey[500], 0.08)}`
          }}
        >
          {renderContent}
        </Box>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.WIDTH,
              bgcolor: 'background.paper',
              boxShadow: thm=> `0 0 16px 0 ${alpha(thm.palette.grey[500], 0.08)}`
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};

// ----------------------------------------------------------------------

function NavItem({ item }) {
  const pathname = usePathname();
  const theme = useTheme();
  const active = item.path === pathname;

  return (
    <ListItemButton
      component={RouterLink}
      href={item.path}
      sx={{
        minHeight: 48,
        borderRadius: 1,
        typography: 'body2',
        color: 'text.secondary',
        textTransform: 'capitalize',
        fontWeight: 'medium',
        mb: 0.5,
        ...(active && {
          color: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          fontWeight: 'medium',
          transition: theme.transitions.create(['background-color'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:before': {
            content: '""',
            width: 4,
            height: 24,
            borderRadius: '0 4px 4px 0',
            bgcolor: 'primary.main',
            position: 'absolute',
            left: 0,
          },
        }),
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: 2, display: 'flex' }}>
        {item.icon}
      </Box>

      <Box component="span">{item.title}</Box>
      
      {item.notifications && (
        <Badge
          badgeContent={item.notifications}
          color="error"
          sx={{ ml: 1 }}
        />
      )}
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.object,
};
