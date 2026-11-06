
import { MenuItem, Select } from '@mui/material';
import type { SelectformProps } from 'global';
import React, { forwardRef } from 'react';

const Selectform = forwardRef(({ onChange, children, value, className, name, label }: SelectformProps, ref) => {
  return (
    <div>
      {label && <div className="text-sm">{label}</div>}
      <Select
        ref={ref} // Use the forwarded ref here
        value={value}
        name={name}
        onChange={onChange}
        className={`${className} w-full`}
      >
        <MenuItem value={''}>--Select--</MenuItem>
        {children}
      </Select>
    </div>
  );
});

export default Selectform;