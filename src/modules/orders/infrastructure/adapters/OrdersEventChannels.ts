export const EventChannels = {
  // Requested naming
  ORDERS_SYNC_REQUEST: 'orders.sync.requested',
  ORDERS_PAGE_REQUEST: 'orders.sync.page.requested',

  // Keep property name but align value to "processed"
  ORDERS_PAGE_FETCHED: 'orders.sync.page.processed',
  ORDERS_SYNC_COMPLETED: 'orders.sync.completed',

  // Retry/DLQ scoped to page processing
  ORDERS_RETRY: 'orders.sync.page.retry',
  ORDERS_DLQ: 'orders.sync.page.dlq'
} as const;


