import { useState } from 'react';

import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import Input from '@mui/material/Input';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, styled, useTheme } from '@mui/material/styles';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { bgBlur } from 'src/theme/css';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const HEADER_MOBILE = 64;
const HEADER_DESKTOP = 80;

const StyledSearchbar = styled('div')(({ theme }) => ({
  ...bgBlur({
    color: theme.palette.background.default,
  }),
  top: 0,
  left: 0,
  zIndex: 99,
  width: '100%',
  display: 'flex',
  position: 'absolute',
  alignItems: 'center',
  height: HEADER_MOBILE,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  padding: theme.spacing(0, 3),
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.grey[900], 0.08)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
  [theme.breakpoints.up('md')]: {
    height: HEADER_DESKTOP,
    padding: theme.spacing(0, 5),
  },
}));

const StyledSearchInput = styled(Input)(({ theme }) => ({
  fontWeight: 'normal',
  '& .MuiInputBase-input': {
    width: '100%',
    padding: theme.spacing(1, 0),
    fontSize: 16,
    transition: theme.transitions.create(['box-shadow', 'width'], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.shorter,
    }),
    '&::placeholder': {
      opacity: 0.7,
    },
  },
}));

// ----------------------------------------------------------------------

export default function Searchbar() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        {!open && (
          <IconButton 
            onClick={handleOpen}
            sx={{
              color: 'text.primary',
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              borderRadius: 1.5,
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[500], 0.16)
              }
            }}
          >
            <Iconify icon="eva:search-fill" width={22} height={22} />
          </IconButton>
        )}

        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
          <StyledSearchbar>
            <StyledSearchInput
              autoFocus
              fullWidth
              disableUnderline
              placeholder="Search…"
              startAdornment={
                <InputAdornment position="start">
                  <Iconify
                    icon="eva:search-fill"
                    sx={{ color: 'text.disabled', width: 20, height: 20 }}
                  />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mr: 2 }}>
                      ESC
                    </Typography>
                    <Button
                      onClick={handleClose}
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ 
                        boxShadow: 'none',
                        minWidth: 'auto',
                        px: 2,
                        height: 32,
                        borderRadius: 1,
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                </InputAdornment>
              }
              sx={{ mr: 1, fontWeight: 'fontWeightBold' }}
            />

            <Paper
              elevation={0}
              sx={{
                mt: 10,
                width: '100%',
                display: 'none',
                position: 'absolute',
                top: HEADER_MOBILE,
                left: 0,
                p: 3,
                boxShadow: `0 8px 24px 0 ${alpha(theme.palette.grey[900], 0.12)}`,
                borderRadius: 2,
                '& .MuiListSubheader-root': {
                  pl: 0,
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Quick Searches
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Students', 'Programs', 'Payments', 'Memos', 'Documents'].map((tag) => (
                  <Box 
                    key={tag} 
                    component="span" 
                    sx={{ 
                      px: 1.5, 
                      py: 0.75, 
                      borderRadius: 1,
                      fontSize: 12,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                      fontWeight: 'medium',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                      }
                    }}
                  >
                    {tag}
                  </Box>
                ))}
              </Box>
            </Paper>
          </StyledSearchbar>
        </Slide>
      </div>
    </ClickAwayListener>
  );
}
