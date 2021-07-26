import * as React from 'react';

export interface ILandmark {
  host: HTMLElement | null;
  focus(options?: FocusOptions): void;
}

export type LandmarkRegistry = Record<string, ILandmark | null>;

export type LandmarkRegisterFn<T extends LandmarkRegistry> =
  (key: keyof T, value: ILandmark) => void;

export const LandmarkContext = React.createContext<LandmarkRegisterFn<LandmarkRegistry>>(() => undefined);
