import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { usePermissions } from 'src/utils/permissions';

import useNavConfig from 'src/layouts/dashboard/config-navigation';

// ----------------------------------------------------------------------

const VISIBLE = 8;

// Day-to-day work first; setup and administration last. Unlisted paths keep nav order.
const PRIORITY = [
  '/assessment/scores',
  '/assessment',
  '/result',
  '/student',
  '/application',
  '/admission',
  '/payment',
  '/fee',
  '/memo',
  '/mail',
  '/course',
  '/document',
  '/dashboard',
  '/calender',
  '/application/onboard',
  '/user',
  '/audit',
];

const rankOf = (path) => {
  const i = PRIORITY.indexOf(path);
  return i === -1 ? PRIORITY.length : i;
};

/** Nav items may carry one permission, a list (any of), or `anyOf`. */
function allowed(item, check, checkAny) {
  if (item.public) return true;
  const list = [item.permission, item.permissions, item.anyOf].flat().filter(Boolean);
  if (!list.length) return false;
  return list.length === 1 ? check(list[0]) : checkAny(list);
}

/** The modules this user can open, as tiles, derived from the sidebar config. */
export default function QuickActions() {
  const navConfig = useNavConfig();
  const { check, checkAny } = usePermissions();
  const [expanded, setExpanded] = useState(false);

  const modules = useMemo(() => {
    const flat = navConfig.flatMap((item) => (item.children ? item.children : [item]));
    return flat
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.path && item.path !== '/' && allowed(item, check, checkAny))
      .sort((x, y) => rankOf(x.path) - rankOf(y.path) || x.index - y.index);
    // check/checkAny are rebuilt every render; the permission list itself is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navConfig]);

  if (!modules.length) return null;

  const shown = expanded ? modules : modules.slice(0, VISIBLE);

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">Quick actions</Typography>
          <Typography variant="body2" color="text.secondary">
            Modules you have access to
          </Typography>
        </Box>
        {modules.length > VISIBLE && (
          <Button size="small" color="inherit" onClick={() => setExpanded((v) => !v)} sx={{ flexShrink: 0 }}>
            {expanded ? 'Show fewer' : `All ${modules.length}`}
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        {shown.map((item) => (
          <ButtonBase
            key={item.path}
            component={RouterLink}
            href={item.path}
            sx={{
              p: 1.5,
              gap: 1.25,
              minHeight: 96,
              borderRadius: 1.5,
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              transition: 'background-color 150ms ease-out, border-color 150ms ease-out',
              '& .tile-icon': { transition: 'background-color 150ms ease-out' },
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.32),
                '& .tile-icon': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16) },
              },
              '&:focus-visible': { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
            }}
          >
            <Box
              className="tile-icon"
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '& .component-iconify': { width: 22, height: 22 },
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
              {item.title}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Card>
  );
}
