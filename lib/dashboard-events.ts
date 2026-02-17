export type IncomeRow = {
  id: string;
  source: string;
  amount: number;
  date: Date | string;
  status: string;
  type: string;
};

export type ExpenseRow = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  date: Date | string;
};

type EventMap = {
  "income:create:optimistic": { row: IncomeRow };
  "income:create:confirm": { tempId: string; row: IncomeRow };
  "income:create:rollback": { tempId: string };
  "income:update:optimistic": { id: string; row: IncomeRow };
  "income:update:rollback": { id: string; previous: IncomeRow };
  "expense:create:optimistic": { row: ExpenseRow };
  "expense:create:confirm": { tempId: string; row: ExpenseRow };
  "expense:create:rollback": { tempId: string };
  "expense:update:optimistic": { id: string; row: ExpenseRow };
  "expense:update:rollback": { id: string; previous: ExpenseRow };
};

type EventName = keyof EventMap;

function isBrowser() {
  return typeof window !== "undefined";
}

export function emitDashboardEvent<T extends EventName>(name: T, detail: EventMap[T]) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function subscribeDashboardEvent<T extends EventName>(name: T, handler: (detail: EventMap[T]) => void) {
  if (!isBrowser()) return () => {};

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<EventMap[T]>;
    handler(customEvent.detail);
  };
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
