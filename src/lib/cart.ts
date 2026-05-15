export type CartItem = {
  productId: string;
  productSlug: string;
  name: string;
  pricingOptionId: string;
  periodMonths: 1 | 3 | 6 | 12;
  unitMonthlyCents: number;
  qty: number;
};

export function lineTotalCents(item: CartItem): number {
  return item.unitMonthlyCents * item.periodMonths * item.qty;
}

export function cartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + lineTotalCents(it), 0);
}
