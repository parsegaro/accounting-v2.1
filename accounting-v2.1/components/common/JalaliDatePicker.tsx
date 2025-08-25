import React, { useEffect, useRef, memo } from 'react';

// Make kamaDatepicker globally available for type checking
declare global {
  interface Window {
    kamaDatepicker: (id: string, options?: any) => void;
  }
}

interface JalaliDatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = memo(({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useRef(`datepicker-${Math.random().toString(36).substring(2, 9)}`).current;

  useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    let initInterval: number | undefined;

    const tryInit = () => {
      // Check if the library is loaded and if the element is not already initialized
      if (typeof window.kamaDatepicker === 'function' && !inputElement.getAttribute('data-kamadatepicker-initialized')) {
        if (initInterval) clearInterval(initInterval);
        
        try {
          window.kamaDatepicker(uniqueId, {
            buttonsColor: "blue",
            forceFarsiDigits: true,
            markToday: true,
            gotoToday: true,
            // When the picker closes, read the value and call the React onChange handler
            onClose: () => {
              if (inputRef.current) {
                // Only call if value has actually changed
                if(inputRef.current.value !== value) {
                  onChange(inputRef.current.value);
                }
              }
            }
          });
          // Mark as initialized to prevent re-initialization
          inputElement.setAttribute('data-kamadatepicker-initialized', 'true');
        } catch (error) {
          console.error("Failed to initialize kamaDatepicker:", error);
        }
      }
    };

    // Try to initialize immediately, and then set an interval as a fallback
    tryInit();
    initInterval = window.setInterval(tryInit, 200);

    // Cleanup
    return () => {
      if (initInterval) clearInterval(initInterval);
    };
    // We only want this effect to run once on mount, so dependencies are stable
  }, [uniqueId, value, onChange]);

  // This second useEffect ensures the input visually reflects the prop value if it changes externally
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      id={uniqueId}
      ref={inputRef}
      type="text"
      defaultValue={value} 
      placeholder="تاریخ را انتخاب کنید"
      className="form-input form-datepicker"
      autoComplete="off"
    />
  );
});

export default JalaliDatePicker;