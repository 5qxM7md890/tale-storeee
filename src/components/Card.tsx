import clsx from 'clsx';
import * as React from 'react';

export function Card({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur',
        className
      )}
      {...props}
    />
  );
}
