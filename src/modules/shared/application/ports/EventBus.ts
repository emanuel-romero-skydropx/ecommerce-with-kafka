export type EventMessage<T = unknown> = {
  topic: string;
  key?: string;
  payload: T;
};

export type EventHandler<T = unknown> = (message: EventMessage<T>) => Promise<void>;

import type { Lifecycle } from './Lifecycle';

export interface EventBus extends Lifecycle {
  publish<T = unknown>(message: EventMessage<T>): Promise<void>;
  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): void;
}


