import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Select,
  Checkbox,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
  ListItemText,
  FormHelperText,
} from '@mui/material';

const CustomSelect = ({
  data = [],
  formik,
  label,
  multiple = false,
  name,
  disabled = false,
  showSelectedCount = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on the search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return data || [];

    const normalizedQuery = searchQuery.toLowerCase();

    return (data || []).filter((item) => {
      const searchableFields = [
        item?.name,
        item?.regNumber,
        item?.registrationNumber,
        item?.searchValue,
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase());

      return searchableFields.some((field) => field.includes(normalizedQuery));
    });
  }, [searchQuery, data]);

  return (
    <FormControl
      disabled={disabled}
      fullWidth
      error={formik?.touched?.[name] && Boolean(formik?.errors?.[name])}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        name={name}
        multiple={multiple}
        value={formik?.values?.[name] || (multiple ? [] : '')}
        onChange={(e) => {
          if (multiple && Array.isArray(e.target.value)) {
            // Filter out empty strings from the selected values
            const filteredValue = e.target.value.filter((val) => val && val.trim() !== '');
            formik.setFieldValue(name, filteredValue);
          } else {
            formik.handleChange(e);
          }
        }}
        renderValue={(selected) => {
          if (Array.isArray(selected)) {
            // Filter out empty strings when counting or displaying
            const validSelected = selected.filter((val) => val && val.trim() !== '');
            if (showSelectedCount) {
              const count = validSelected.length;
              return count ? `${count} selected` : 'None selected';
            }
            return validSelected
              .map((id) => data.find((item) => item?._id === id)?.name)
              .filter(Boolean)
              .join(', ');
          }

          return data.find((item) => item?._id === selected)?.name || '';
        }}
        MenuProps={{
          PaperProps: {
            sx: { width: 250, paddingTop: 1 },
          },
          disableAutoFocusItem: true,
        }}
      >
        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Search..."
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            // Prevent Select from handling keyboard events
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent menu from closing when clicking on search field
            e.stopPropagation();
          }}
          sx={{ marginBottom: 1, mx: 2 }}
          autoFocus
        />

        {/* Filtered Options */}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((item) => (
            <MenuItem key={item?._id} value={item?._id}>
              {multiple && <Checkbox checked={formik?.values?.[name]?.includes(item?._id)} />}
              <ListItemText primary={item?.name} />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No results found</MenuItem>
        )}
      </Select>
      <FormHelperText>{formik?.touched?.[name] && formik?.errors?.[name]}</FormHelperText>
    </FormControl>
  );
};

// Define PropTypes for the component
CustomSelect.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      regNumber: PropTypes.string,
      registrationNumber: PropTypes.string,
      searchValue: PropTypes.string,
    })
  ).isRequired,
  formik: PropTypes.shape({
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    touched: PropTypes.object,
    errors: PropTypes.object,
  }).isRequired,
  label: PropTypes.string,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  showSelectedCount: PropTypes.bool,
};

export default CustomSelect;
