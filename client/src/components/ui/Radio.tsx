import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id: customId,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="flex flex-col space-y-1 text-left">
        <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              type="radio"
              id={id}
              disabled={disabled}
              checked={checked}
              aria-invalid={Boolean(error)}
              className={cn(
                'peer h-4 w-4 shrink-0 rounded-full border border-slate-300 bg-white transition-colors cursor-pointer appearance-none',
                'checked:border-blue-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                'disabled:bg-slate-100 disabled:border-slate-300 disabled:cursor-not-allowed',
                error && 'border-red-500',
                className
              )}
              {...props}
            />
            <span
              className="pointer-events-none absolute w-2 h-2 rounded-full bg-blue-700 opacity-0 peer-checked:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          </div>

          {(label || helperText) && (
            <div className="text-left leading-snug">
              {label && (
                <span
                  className={cn(
                    'text-sm font-medium text-slate-800',
                    disabled && 'text-slate-400 cursor-not-allowed'
                  )}
                >
                  {label}
                </span>
              )}
              {helperText && <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
            </div>
          )}
        </label>
      </div>
    );
  }
);

Radio.displayName = 'Radio';
