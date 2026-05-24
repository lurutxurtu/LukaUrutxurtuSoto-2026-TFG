import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', isLoading, fullWidth = false, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    const widthStyle = fullWidth ? 'w-full' : '';

    const variants = {
      primary: 'bg-gradient-to-r from-neon-pink to-neon-pink-light text-white hover:shadow-[0_0_20px_rgba(255,45,138,0.4)]',
      secondary: 'bg-bg-tertiary border border-border text-text-primary hover:bg-border',
      danger: 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20 shadow-sm',
      success: 'bg-gradient-to-r from-neon-green to-[#32cd32] text-bg-primary hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${widthStyle} ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? <LoadingSpinner size="sm" className="justify-center" /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
