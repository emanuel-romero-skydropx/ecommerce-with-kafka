export interface OrdersExternalServiceEventPort {
  getOrders(payload: { shop: string }): Promise<void>;
}
