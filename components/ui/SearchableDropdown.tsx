import React, { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string;
  [key: string]: any; // Allow extra payload
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: Option) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  onBlur?: (value: string) => void;
}

export function SearchableDropdown({ options, value, onChange, onSelect, placeholder, name, required, onBlur }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        name={name}
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Only open dropdown if there is at least 1 character typed
          setIsOpen(e.target.value.length > 0);
        }}
        onFocus={() => {
          if (value.length > 0) setIsOpen(true);
        }}
        onBlur={() => {
          if (onBlur) onBlur(value);
        }}
        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
          <ul className="py-1">
            {filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                onClick={() => {
                  onSelect(opt);
                  setIsOpen(false);
                }}
                className="px-4 py-3 text-gray-800 hover:bg-indigo-50 cursor-pointer transition-colors text-sm font-medium"
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
