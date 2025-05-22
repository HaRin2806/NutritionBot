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
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">{icon}</span>
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
            w-full rounded-lg border transition-colors duration-200
            ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2
            ${error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-400 dark:focus:border-red-400' 
              : 'border-gray-300 focus:ring-mint-500 focus:border-mint-500 dark:border-gray-600 dark:focus:ring-mint-400 dark:focus:border-mint-400'
            }
            ${disabled || readOnly 
              ? 'bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
              : 'bg-white dark:bg-gray-700 dark:text-white'
            }
            focus:outline-none focus:ring-2 
            placeholder-gray-400 dark:placeholder-gray-500
            ${inputClassName}
          `}
          {...props}
        />
      </div>
      
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;