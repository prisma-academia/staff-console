import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';

import { alpha } from '@mui/material/styles';
import { Box, Card, Stack, Tooltip, Skeleton, Typography, CardActionArea } from '@mui/material';

import { studioApi } from 'src/api/docStudioApi';

import Iconify from 'src/components/iconify';
import { timeAgo } from 'src/components/doc-studio/hooks';

import { StatusChip, CHANNEL_META } from './studio-meta';

// ----------------------------------------------------------------------

// Thumbnails are real server renders (sample data, live template). Limit how
// many are in flight so opening the gallery does not stampede the servers.
let running = 0;
const queue = [];
function throttle(task) {
  return new Promise((resolve, reject) => {
    const start = () => {
      running += 1;
      task().then(resolve, reject).finally(() => {
        running -= 1;
        if (queue.length) queue.shift()();
      });
    };
    if (running < 4) start();
    else queue.push(start);
  });
}

function useVisible(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || visible) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: '200px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, visible]);
  return visible;
}

const THUMB_H = 210;

function ScaledFrame({ html, pageWidth, scripts }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(300);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const scale = width / pageWidth;
  return (
    <Box ref={ref} sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Box
        component="iframe"
        title="thumbnail"
        srcDoc={html}
        tabIndex={-1}
        scrolling="no"
        sandbox={scripts ? 'allow-scripts' : ''}
        sx={{ width: pageWidth, height: THUMB_H / scale, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none', bgcolor: 'common.white' }}
      />
    </Box>
  );
}

ScaledFrame.propTypes = { html: PropTypes.string, pageWidth: PropTypes.number, scripts: PropTypes.bool };

function Thumbnail({ item }) {
  const ref = useRef(null);
  const visible = useVisible(ref);
  const { data, isLoading, error } = useQuery({
    queryKey: ['doc-studio', 'thumb', item.service, item.key, item.publishedHash, item.brandVersion],
    queryFn: () => throttle(() => studioApi(item.service).preview({ key: item.key })),
    enabled: visible,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });

  return (
    <Box ref={ref} sx={{ position: 'relative', height: THUMB_H, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08), overflow: 'hidden' }}>
      {(isLoading || !visible) && <Skeleton variant="rectangular" height={THUMB_H} animation="wave" />}
      {error && (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 1, color: 'text.disabled' }}>
          <Iconify icon="mdi:image-broken-variant" width={32} />
        </Stack>
      )}
      {data && item.channel === 'print' && (
        <Box sx={{ position: 'absolute', inset: '14px 14px 0', boxShadow: (theme) => theme.customShadows?.z8, borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
          <ScaledFrame html={data.html} pageWidth={794} scripts />
        </Box>
      )}
      {data && item.channel === 'web' && (
        <Box sx={{ position: 'absolute', inset: '14px 14px 0', borderRadius: '8px 8px 0 0', overflow: 'hidden', boxShadow: (theme) => theme.customShadows?.z8 }}>
          <ScaledFrame html={data.html} pageWidth={860} />
        </Box>
      )}
      {data && item.channel === 'email' && (
        <Stack sx={{ position: 'absolute', inset: 14 }} spacing={1}>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z1 }}>
            <Typography variant="caption" fontWeight={700} noWrap display="block">
              {data.subject}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: 11 }}>
              {data.preheader || data.text}
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', flexGrow: 1, borderRadius: 1, overflow: 'hidden', boxShadow: (theme) => theme.customShadows?.z8 }}>
            <ScaledFrame html={data.html} pageWidth={640} />
          </Box>
        </Stack>
      )}
      {data && item.channel === 'sms' && (
        <Stack justifyContent="center" sx={{ position: 'absolute', inset: 18 }}>
          <Box sx={{ maxWidth: '88%', px: 1.5, py: 1, borderRadius: '16px', borderBottomLeftRadius: 4, bgcolor: '#e5e5ea', color: '#000', fontSize: 12, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {data.text}
          </Box>
          {data.sms && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {data.sms.segments} SMS · {data.sms.encoding}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}

Thumbnail.propTypes = { item: PropTypes.object };

// ----------------------------------------------------------------------

export default function TemplateCard({ item, onOpen }) {
  const meta = CHANNEL_META[item.channel] || CHANNEL_META.print;
  const failing = item.health?.failures24h > 0;
  return (
    <Card sx={{ height: 1, transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: (theme) => theme.customShadows?.z16 } }}>
      <CardActionArea onClick={onOpen} sx={{ height: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative' }}>
          <Thumbnail item={item} />
          <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 10, left: 10 }}>
            <Box sx={{ px: 1, py: 0.25, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'background.paper', boxShadow: (theme) => theme.customShadows?.z8, typography: 'caption', fontWeight: 700 }}>
              <Iconify icon={meta.icon} width={14} sx={{ color: `${meta.color}.main` }} />
              {meta.label}
            </Box>
          </Stack>
          {failing && (
            <Tooltip title={`Failed to render ${item.health.failures24h}× in the last day — the built-in default was used. ${item.health.lastError || ''}`}>
              <Box sx={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderRadius: '50%', bgcolor: 'error.main', boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette.error.main, 0.25)}` }} />
            </Tooltip>
          )}
        </Box>
        <Stack spacing={0.75} sx={{ p: 2, flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon={item.icon} width={20} sx={{ color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1 }}>
              {item.title}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
            {item.description}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
            <StatusChip status={item.status} version={item.version} />
            <Box sx={{ flexGrow: 1 }} />
            {item.updatedAt && (
              <Tooltip title={item.updatedBy?.name ? `by ${item.updatedBy.name}` : ''}>
                <Typography variant="caption" color="text.disabled" noWrap>
                  {timeAgo(item.updatedAt)}
                </Typography>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

TemplateCard.propTypes = { item: PropTypes.object, onOpen: PropTypes.func };
