import clsx from 'clsx';
import * as React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({className, variant='primary', ...props}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet-400/40',
        variant === 'primary' &&
          'bg-gradient-to-b from-fuchsia-500 via-violet-500 to-violet-600 text-white shadow-[0_14px_34px_rgba(139,92,246,0.34)] hover:brightness-105',
        variant === 'ghost' &&
          'border border-violet-300/14 bg-violet-500/[0.08] text-white hover:bg-violet-500/[0.14]',
        className
      )}
      {...props}
    />
  );
}
