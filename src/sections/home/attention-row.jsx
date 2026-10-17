import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { RouterLink } from 'src/routes/components';

import Iconify from 'src/components/iconify';

import Panel from 'src/sections/dashboard/components/panel';

import { SEVERITY } from './attention';

// ----------------------------------------------------------------------

const VISIBLE = 5;

function AttentionItem({ item }) {
  const sev = SEVERITY[item.severity];
  return (
    <ListItemButton
      component={RouterLink}
      href={item.href}
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 1,
        alignItems: 'center',
        gap: 2,
        '&:hover .attention-cta': { color: 'primary.main' },
      }}
    >
      <Typography
        variant="h5"
        component="div"
        sx={{ width: { xs: 64, sm: 84 }, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}
        noWrap
      >
        {item.value}
      </Typography>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box component="span" title={sev.word} sx={{ display: 'flex', color: `${sev.color}.main`, flexShrink: 0 }}>
            <Iconify icon={sev.icon} width={18} />
          </Box>
          <Typography variant="subtitle2" noWrap>
            {item.title}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }} noWrap>
          {item.detail}
        </Typography>
      </Box>

      <Stack
        className="attention-cta"
        direction="row"
        alignItems="center"
        spacing={0.25}
        sx={{ color: 'text.secondary', flexShrink: 0, transition: 'color 150ms ease-out', display: { xs: 'none', sm: 'flex' } }}
      >
        <Typography variant="body2" fontWeight={600}>
          {item.cta}
        </Typography>
        <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
      </Stack>
      <Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ color: 'text.disabled', display: { sm: 'none' }, flexShrink: 0 }} />
    </ListItemButton>
  );
}

AttentionItem.propTypes = { item: PropTypes.object.isRequired };

/** Work waiting on this user across the modules they can act in. */
export default function AttentionRow({ items, loading, partial }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, VISIBLE);
  const urgent = items.filter((i) => i.severity === 'critical').length;

  let subheader = 'Nothing waiting on you';
  if (loading) subheader = 'Checking your modules…';
  else if (items.length) {
    subheader = `${items.length} ${items.length === 1 ? 'item' : 'items'}${urgent ? ` · ${urgent} urgent` : ''} · most urgent first`;
  }

  let body;
  if (loading) {
    body = (
      <Stack spacing={1.5} sx={{ px: 1.5, py: 0.5 }}>
        {[0, 1, 2].map((k) => (
          <Stack key={k} direction="row" spacing={2} alignItems="center">
            <Skeleton variant="text" width={64} sx={{ fontSize: '1.5rem' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="45%" />
              <Skeleton variant="text" width="70%" />
            </Box>
          </Stack>
        ))}
      </Stack>
    );
  } else if (!items.length) {
    body = (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1.5, py: 1.5 }}>
        <Iconify icon="solar:check-circle-bold" width={28} sx={{ color: 'success.main', flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle2">You&apos;re all caught up</Typography>
          <Typography variant="body2" color="text.secondary">
            Approvals, score sheets and other work you can act on will appear here.
          </Typography>
        </Box>
      </Stack>
    );
  } else {
    body = (
      <List disablePadding sx={{ mx: -1 }}>
        {shown.map((item) => (
          <AttentionItem key={item.key} item={item} />
        ))}
      </List>
    );
  }

  return (
    <Panel
      title="Needs your attention"
      subheader={subheader}
      action={
        items.length > VISIBLE && !loading ? (
          <Button size="small" color="inherit" onClick={() => setExpanded((v) => !v)} sx={{ flexShrink: 0 }}>
            {expanded ? 'Show fewer' : `Show all ${items.length}`}
          </Button>
        ) : null
      }
    >
      {body}
      {partial && !loading && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5, px: 0.5 }}>
          Some figures could not be loaded, so this list may be incomplete.
        </Typography>
      )}
    </Panel>
  );
}

AttentionRow.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  partial: PropTypes.bool,
};
