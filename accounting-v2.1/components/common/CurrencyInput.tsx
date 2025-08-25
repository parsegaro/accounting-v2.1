import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  readOnly?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onValueChange, className = '', readOnly = false }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const numericValue = parseInt(displayValue.replace(/,/g, ''), 10) || 0;
    if (numericValue !== value) {
       setDisplayValue(value > 0 ? value.toLocaleString('en-US') : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/,/g, ''), 10) || 0;
    
    setDisplayValue(numericValue > 0 ? numericValue.toLocaleString('en-US') : '');
    onValueChange(numericValue);
  };
  
  const handleBlur = () => {
    if (readOnly) return;
     if (displayValue === '') {
         onValueChange(0);
     }
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`form-input text-left ${className}`}
      dir="ltr"
      placeholder="0"
      readOnly={readOnly}
    />
  );
};

export default CurrencyInput;