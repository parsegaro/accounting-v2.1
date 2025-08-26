import React from 'react';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField } from '@mui/material';

interface JalaliDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  label?: string;
}

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({ value, onChange, label }) => {
  const handleDateChange = (newValue: Date | null) => {
    if (newValue) {
      const isoString = newValue.toISOString().split('T')[0]; // YYYY-MM-DD
      onChange(isoString);
    } else {
      onChange(null);
    }
  };

  const dateValue = value ? new Date(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFnsJalali}>
      <DatePicker
        label={label || "Select Date"}
        value={dateValue}
        onChange={handleDateChange}
        renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
  );
};

export default JalaliDatePicker;