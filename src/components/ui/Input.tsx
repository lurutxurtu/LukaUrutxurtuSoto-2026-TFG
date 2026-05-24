import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-2.5 bg-bg-tertiary border ${
            error ? 'border-neon-red focus:border-neon-red focus:ring-neon-red/30' : 'border-border focus:border-neon-pink focus:ring-neon-pink/30'
          } rounded-xl text-text-primary focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-neon-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
