export type Order = {
  id: string;
  shopId: string;
  currency: string;
  totalPrice: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lineItems: {
    id: string;
    sku: string;
    title: string;
    quantity: number;
    price: number;
  }[];
  createdAt: Date;
};
