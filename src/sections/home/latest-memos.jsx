import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fToNow, fDateTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import Panel from 'src/sections/dashboard/components/panel';

// ----------------------------------------------------------------------

const excerpt = (html) =>
  (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export default function LatestMemos({ memos, loading, error }) {
  let emptyText = 'No memos yet';
  if (error) emptyText = 'Memos could not be loaded';

  return (
    <Panel
      title="Latest memos"
      loading={loading}
      height={160}
      empty={!memos.length}
      emptyText={emptyText}
      action={
        <Button
          size="small"
          color="inherit"
          component={RouterLink}
          href="/memo"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          sx={{ flexShrink: 0 }}
        >
          All
        </Button>
      }
    >
      <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} spacing={1.5}>
        {memos.map((memo) => {
          const text = excerpt(memo.html);
          return (
            <Box key={memo._id}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1, minWidth: 0 }} noWrap title={memo.name}>
                  {memo.name}
                </Typography>
                {!memo.isPublic && (
                  <Label color="default" sx={{ flexShrink: 0 }}>
                    Unpublished
                  </Label>
                )}
              </Stack>
              {text && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {text}
                </Typography>
              )}
              <Tooltip title={fDateTime(memo.createdAt)} placement="bottom-start">
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5, width: 'fit-content' }}>
                  {fToNow(memo.createdAt)}
                </Typography>
              </Tooltip>
            </Box>
          );
        })}
      </Stack>
    </Panel>
  );
}

LatestMemos.propTypes = {
  memos: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.bool,
};
