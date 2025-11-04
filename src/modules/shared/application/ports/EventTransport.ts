import type { Lifecycle } from './Lifecycle';

export type TransportMessage = {
  topic: string;
  key?: string;
  value: string;
  headers?: Record<string, string>;
};

export type TransportHandler = (message: TransportMessage) => Promise<void>;

export interface EventTransport extends Lifecycle {
  publish(message: TransportMessage): Promise<void>;
  subscribe(topic: string, handler: TransportHandler): void;
}


