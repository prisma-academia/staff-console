import PropTypes from 'prop-types';

import Badge from '@mui/material/Badge';
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
  onDelete = null,
  onFilterClick = null,
  filterCount = 0,
}) {
  return (
    <Toolbar
      sx={{
        minHeight: 96,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'space-between',
        py: { xs: 1, sm: 0 },
        pl: { xs: 2, sm: 3 },
        pr: 1,
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
          showDefaultDeleteAction && onDelete && (
            <Tooltip title="Delete">
              <IconButton onClick={onDelete}>
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </Tooltip>
          )
        )
      ) : (
        customActions || (
          onFilterClick && (
            <Tooltip title="Advanced filters">
              <IconButton onClick={onFilterClick}>
                <Badge color="primary" badgeContent={filterCount} invisible={!filterCount}>
                  <Iconify icon="ic:round-filter-list" />
                </Badge>
              </IconButton>
            </Tooltip>
          )
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
  onFilterClick: PropTypes.func,
  filterCount: PropTypes.number,
};