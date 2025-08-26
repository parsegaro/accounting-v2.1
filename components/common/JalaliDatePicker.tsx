import React, { useEffect } from 'react';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TextField } from '@mui/material';

interface JalaliDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  label?: string;
}

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({ value, onChange, label }) => {
  useEffect(() => {
    // If the component mounts with no value, initialize it to the current date and time.
    if (!value) {
      onChange(new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount to set the initial value

  const handleDateChange = (newValue: Date | null) => {
    if (newValue) {
      onChange(newValue.toISOString());
    } else {
      onChange(null);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFnsJalali}>
      <DateTimePicker
        label={label || "Select Date"}
        value={value ? new Date(value) : null} // Use null if value is not set yet
        onChange={handleDateChange}
        renderInput={(params) => (
          <TextField
            {...params}
            // Apply the custom class to the input element for consistent styling
            inputProps={{
              ...params.inputProps,
              className: `${params.inputProps?.className || ''} form-input`,
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default JalaliDatePicker;