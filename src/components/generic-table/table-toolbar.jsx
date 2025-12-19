import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import Iconify from 'src/components/iconify';

export default function GenericTableToolbar({ 
  numSelected, 
  filterName, 
  onFilterName, 
  searchPlaceholder = "Search...",
  toolbarTitle = "",
  customActions = null,
  customSelectedActions = null,
  showDefaultDeleteAction = true,
  onDelete = () => {},
}) {
  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <>
          {toolbarTitle && (
            <Typography variant="h6" id="tableTitle" component="div">
              {toolbarTitle}
            </Typography>
          )}
          {onFilterName && (
            <OutlinedInput
              value={filterName}
              onChange={onFilterName}
              placeholder={searchPlaceholder}
              startAdornment={
                <InputAdornment position="start">
                  <Iconify
                    icon="eva:search-fill"
                    sx={{ color: 'text.disabled', width: 20, height: 20 }}
                  />
                </InputAdornment>
              }
            />
          )}
        </>
      )}

      {numSelected > 0 ? (
        customSelectedActions || (
          showDefaultDeleteAction && (
            <Tooltip title="Delete">
              <IconButton onClick={onDelete}>
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </Tooltip>
          )
        )
      ) : (
        customActions || (
          <Tooltip title="Filter list">
            <IconButton>
              <Iconify icon="ic:round-filter-list" />
            </IconButton>
          </Tooltip>
        )
      )}
    </Toolbar>
  );
}

GenericTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  toolbarTitle: PropTypes.string,
  customActions: PropTypes.node,
  customSelectedActions: PropTypes.node,
  showDefaultDeleteAction: PropTypes.bool,
  onDelete: PropTypes.func,
}; 