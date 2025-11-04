import type { Order } from '../../domain/order/Order';

type ShopifyLineItem = {
  id?: number | string;
  sku?: string;
  title?: string;
  quantity?: number;
  price?: number | string;
};

type ShopifyCustomer = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
};

type ShopifyOrder = {
  id: number | string;
  created_at?: string;
  currency?: string;
  total_price?: number | string;
  line_items?: ShopifyLineItem[];
  customer?: ShopifyCustomer;
};

type ShopifyOrdersResponse = { orders: ShopifyOrder[] };

export class ShopifyOrderMapper {
  toDomain(responseData: ShopifyOrdersResponse, ctx: { shopId: string }): Order[] {
    const items = Array.isArray(responseData?.orders) ? responseData.orders : [];
    return items.map((o) => ({
      id: String(o.id),
      shopId: ctx.shopId,
      currency: o.currency ?? '',
      totalPrice: Number(typeof o.total_price === 'string' ? parseFloat(o.total_price) : o.total_price ?? 0),
      customer: {
        id: o.customer?.id != null ? String(o.customer.id) : '',
        firstName: o.customer?.first_name ?? '',
        lastName: o.customer?.last_name ?? ''
      },
      lineItems: (o.line_items ?? []).map((li) => ({
        id: li.id != null ? String(li.id) : '',
        sku: li.sku ?? '',
        title: li.title ?? '',
        quantity: li.quantity ?? 0,
        price: Number(typeof li.price === 'string' ? parseFloat(li.price) : li.price ?? 0)
      })),
      createdAt: o.created_at ? new Date(o.created_at) : new Date()
    }));
  }
}


