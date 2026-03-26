import {NextResponse} from 'next/server';
import {getProductsForPricing} from '@/lib/store';

export async function GET() {
  const {products} = await getProductsForPricing();
  return NextResponse.json({products});
}
