import React from 'react';
import PropTypes from 'prop-types';

import {Select, MenuItem, InputLabel, FormControl } from '@mui/material';

function CustomSelect({ list, value, setValue, label }) {
  return (
    <FormControl size="small">
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={(e) => setValue(e.target.value)}>
        <MenuItem disabled value="">
          <em>None</em>
        </MenuItem>
        {list.map((li, index) => (
          <MenuItem key={index} value={li.value}>{li.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
CustomSelect.propTypes = {
  list: PropTypes.array,
  value: PropTypes.any,
  setValue: PropTypes.func,
  label: PropTypes.string,
};

export default CustomSelect;
