'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {ChevronDown} from './Icons';

export function Accordion({items}: {items: {q: string; a: string}[]}) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="space-y-2">
      {items.map((it, idx) => (
        <AccordionPrimitive.Item key={idx} value={String(idx)} className="rounded-2xl border border-white/10 bg-white/5">
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
              <span>{it.q}</span>
              <ChevronDown className="h-4 w-4 opacity-70 transition-transform data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="px-4 pb-4 text-sm text-white/70">
            {it.a}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
