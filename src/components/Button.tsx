import clsx from 'clsx';
import * as React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({className, variant='primary', ...props}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-green-400/40',
        variant === 'primary' && 'bg-green-500/90 hover:bg-green-500 text-black',
        variant === 'ghost' && 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
        className
      )}
      {...props}
    />
  );
}
