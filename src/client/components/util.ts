export type CallbackWithId<T extends (...args: any[]) => any> = {
  id: string;
  callback: T;
};

export interface IHasLifecycle {
  mount?(...args: any[]): void;
  unmount?(...args: any[]): void;
}
