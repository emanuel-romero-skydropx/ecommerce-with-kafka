import type { Order } from '../../domain/order/Order';

type ShopifyOrdersResponse = { orders: Array<{ id: number | string; created_at?: string }> };

export class ShopifyOrderMapper {
  toDomain(responseData: ShopifyOrdersResponse): Order[] {
    const items = Array.isArray(responseData?.orders) ? responseData.orders : [];
    return items.map((o) => ({
      id: String(o.id),
      externalId: String(o.id),
      createdAt: o.created_at ? new Date(o.created_at) : new Date()
    }));
  }
}


