import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'form-input',
              icon && 'pl-11',
              error && 'border-status-error focus:border-status-error focus:shadow-[0_0_0_4px_rgba(211,47,47,0.1)]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-status-error font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-text-light">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
