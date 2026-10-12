import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Alert,
  Button,
  Avatar,
  Tooltip,
  Skeleton,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { brandApi } from 'src/api/docStudioApi';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';

import TemplateCard from './template-card';
import { useStudioCatalogue } from './use-catalogue';
import { CHANNEL_META, CHANNEL_ORDER } from './studio-meta';

// ----------------------------------------------------------------------

/** The Brand Kit at a glance: every document wears it. */
function BrandHero({ onOpen }) {
  const theme = useTheme();
  const { data, isLoading } = useQuery({ queryKey: ['doc-studio', 'brand'], queryFn: brandApi.get, staleTime: 60 * 1000 });
  const brand = data?.effective;
  const colours = brand ? [brand.colors.primary, brand.colors.accent, brand.colors.heading, brand.colors.body, brand.colors.muted] : [];
  const published = data?.published;

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        color: 'common.white',
        background: brand
          ? `linear-gradient(120deg, ${brand.colors.primary} 0%, ${alpha(brand.colors.primary, 0.82)} 45%, ${theme.palette.grey[900]} 140%)`
          : theme.palette.grey[800],
      }}
    >
      <Box sx={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', bgcolor: alpha('#fff', 0.08) }} />
      <Box sx={{ position: 'absolute', right: 80, bottom: -90, width: 180, height: 180, borderRadius: '50%', bgcolor: alpha('#fff', 0.06) }} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} sx={{ position: 'relative' }}>
        <Avatar src={brand?.assets?.logoUrl || undefined} variant="rounded" sx={{ width: 72, height: 72, bgcolor: 'common.white', p: 0.75, '& img': { objectFit: 'contain' } }}>
          <Iconify icon="mdi:school-outline" width={36} sx={{ color: 'grey.600' }} />
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="overline" sx={{ opacity: 0.8 }}>
            Brand Kit {published ? `· v${published.version}` : '· from institution settings'}
          </Typography>
          {isLoading ? (
            <Skeleton width={280} height={36} sx={{ bgcolor: alpha('#fff', 0.2) }} />
          ) : (
            <Typography variant="h4" noWrap>
              {brand?.identity?.fullName || brand?.identity?.name}
            </Typography>
          )}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            {colours.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ p: 0.5, borderRadius: 5, bgcolor: 'common.white' }}>
                {colours.map((colour, index) => (
                  <Tooltip key={`${colour}-${index}`} title={colour}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: colour, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
                  </Tooltip>
                ))}
              </Stack>
            )}
            {brand && (
              <Typography variant="caption" sx={{ opacity: 0.85, pl: 1 }}>
                {brand.signatories.length} signator{brand.signatories.length === 1 ? 'y' : 'ies'} · {brand.typography.fontFamily}
              </Typography>
            )}
            {data?.draft && <Chip size="small" label="Unpublished brand changes" sx={{ bgcolor: alpha('#fff', 0.2), color: 'common.white' }} />}
          </Stack>
        </Box>
        <Button variant="contained" onClick={onOpen} startIcon={<Iconify icon="mdi:palette-outline" />} sx={{ bgcolor: 'common.white', color: 'grey.900', '&:hover': { bgcolor: 'grey.200' }, flexShrink: 0 }}>
          Edit Brand Kit
        </Button>
      </Stack>
    </Card>
  );
}

BrandHero.propTypes = { onOpen: PropTypes.func };

// ----------------------------------------------------------------------

/**
 * Template Studio home: every document, public page, email and SMS the system
 * produces, as live thumbnails rendered by the real engine.
 */
export default function StudioGalleryView() {
  const navigate = useNavigate();
  const { check } = usePermissions();
  const catalogue = useStudioCatalogue();
  const { data: brandState } = useQuery({ queryKey: ['doc-studio', 'brand'], queryFn: brandApi.get, staleTime: 60 * 1000 });
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState('all');
  const [area, setArea] = useState('all');

  const brandVersion = brandState?.published?.version || 0;
  const areas = useMemo(() => Array.from(new Set(catalogue.types.map((item) => item.area))).sort(), [catalogue.types]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalogue.types
      .filter((item) => channel === 'all' || item.channel === channel)
      .filter((item) => area === 'all' || item.area === area)
      .filter((item) => !needle || `${item.title} ${item.description} ${item.area} ${item.audience || ''}`.toLowerCase().includes(needle))
      .map((item) => ({ ...item, brandVersion }));
  }, [catalogue.types, channel, area, query, brandVersion]);

  const counts = useMemo(() => {
    const out = { all: catalogue.types.length };
    catalogue.types.forEach((item) => {
      out[item.channel] = (out[item.channel] || 0) + 1;
    });
    return out;
  }, [catalogue.types]);

  const pending = catalogue.types.filter((item) => item.status === 'draft' || item.status === 'changes').length;
  const failing = catalogue.types.filter((item) => item.health?.failures24h > 0).length;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Template Studio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 680 }}>
            Every document, public page, email and text message the system sends — written once, filled in for every student, applicant and payment.
            Edits save as drafts; nothing changes for anyone until you publish.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {pending > 0 && <Chip color="warning" icon={<Iconify icon="mdi:pencil-outline" width={16} />} label={`${pending} with unpublished changes`} />}
          {failing > 0 && <Chip color="error" icon={<Iconify icon="mdi:alert-circle-outline" width={16} />} label={`${failing} failing to render`} />}
        </Stack>
      </Stack>

      {check(PERMISSIONS.VIEW_DOC_STUDIO) && (
        <Box sx={{ mb: 3 }}>
          <BrandHero onOpen={() => navigate('/studio/brand')} />
        </Box>
      )}

      {catalogue.engineSkew && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The core api and the admissions api are running different template-engine versions — a deploy is probably half done. Previews may differ until both are updated.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ mb: 3 }}>
        <TextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates…"
          sx={{ width: { xs: 1, md: 300 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="mdi:magnify" width={20} /></InputAdornment> }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`All · ${counts.all || 0}`} color={channel === 'all' ? 'primary' : 'default'} variant={channel === 'all' ? 'filled' : 'outlined'} onClick={() => setChannel('all')} />
          {CHANNEL_ORDER.map((id) => (
            <Chip
              key={id}
              icon={<Iconify icon={CHANNEL_META[id].icon} width={16} />}
              label={`${CHANNEL_META[id].plural} · ${counts[id] || 0}`}
              color={channel === id ? 'primary' : 'default'}
              variant={channel === id ? 'filled' : 'outlined'}
              onClick={() => setChannel(id)}
            />
          ))}
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <TextField select size="small" value={area} onChange={(event) => setArea(event.target.value)} SelectProps={{ native: true }} sx={{ minWidth: 180 }}>
          <option value="all">All areas</option>
          {areas.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </TextField>
      </Stack>

      {catalogue.services
        .filter((service) => service.error)
        .map((service) => (
          <Alert key={service.id} severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => service.refetch()}>Retry</Button>}>
            {service.label} templates could not be loaded: {service.error.message}
          </Alert>
        ))}

      {catalogue.isLoading && (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }, (_, index) => (
            <Grid key={index} item xs={12} sm={6} md={4} xl={3}>
              <Skeleton variant="rounded" height={320} />
            </Grid>
          ))}
        </Grid>
      )}

      {CHANNEL_ORDER.map((id) => {
        const items = filtered.filter((item) => item.channel === id);
        if (!items.length) return null;
        const meta = CHANNEL_META[id];
        return (
          <Box key={id} sx={{ mb: 5 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1, display: 'grid', placeItems: 'center', color: `${meta.color}.main`, bgcolor: (theme) => alpha(theme.palette[meta.color].main, 0.12) }}>
                <Iconify icon={meta.icon} width={20} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                  {meta.plural}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {meta.blurb}
                </Typography>
              </Box>
            </Stack>
            <Grid container spacing={3}>
              {items.map((item) => (
                <Grid key={`${item.service}:${item.key}`} item xs={12} sm={6} md={4} xl={3}>
                  <TemplateCard item={item} onOpen={() => navigate(`/studio/${item.service}/${item.key}`)} />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}

      {!catalogue.isLoading && !filtered.length && (
        <Stack alignItems="center" spacing={1} sx={{ py: 8, color: 'text.secondary' }}>
          <Iconify icon="mdi:file-search-outline" width={48} />
          <Typography>No template matches your filters.</Typography>
        </Stack>
      )}
    </Box>
  );
}
