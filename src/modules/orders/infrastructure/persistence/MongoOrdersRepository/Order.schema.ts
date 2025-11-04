import { Schema, model } from 'mongoose';
import type { Order } from '../../../domain/order/Order';

const orderSchema = new Schema<Order>(
  {
    id: { type: String, required: true, unique: true },
    shopId: { type: String, required: true, index: true },
    currency: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    customer: {
      id: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true }
    },
    lineItems: [
      {
        id: { type: String, required: true },
        sku: { type: String },
        title: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    createdAt: { type: Date, required: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const OrderModel = model<Order>('Order', orderSchema);
