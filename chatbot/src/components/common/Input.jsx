import React from 'react';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label = '',
  error = '',
  icon = null,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  readOnly = false,
  helpText = '',
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full rounded-lg border
            ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-mint-500 focus:border-mint-500'}
            ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            transition duration-150 ease-in-out
            focus:outline-none focus:ring-2 
            ${inputClassName}
          `}
          style={!error ? { boxShadow: '0 0 0 0 rgba(54, 179, 126, 0.1)' } : {}}
          {...props}
        />
      </div>
      
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;