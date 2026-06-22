import { createDecorator } from 'vscf/platform/instantiation/common';

export type TestInjectionRule =
  | {
      action: 'throw';
      message?: string;
    }
  | {
      action: 'delay';
      delayMs: number;
    }
  | {
      action: 'mock';
      value: unknown;
    };

export interface ITestInjectionService {
  readonly _serviceBrand: undefined;
  get<T = unknown>(point: string): Promise<T | undefined>;
  set(point: string, rule: TestInjectionRule): void;
  unset(point: string): void;
  clear(): void;
  list(): Record<string, TestInjectionRule>;
}

export const ITestInjectionService =
  createDecorator<ITestInjectionService>('ITestInjectionService');

export class TestInjectionService implements ITestInjectionService {
  readonly _serviceBrand: undefined;
  private readonly rules = new Map<string, TestInjectionRule>();

  async get<T = unknown>(point: string): Promise<T | undefined> {
    const rule = this.rules.get(point);
    if (!rule) return undefined;

    if (rule.action === 'delay') {
      await new Promise((resolve) => setTimeout(resolve, rule.delayMs));
      return undefined;
    }

    if (rule.action === 'mock') {
      if (typeof rule.value === 'function') {
        return (await (rule.value as () => T | Promise<T>)()) as T;
      }
      return rule.value as T;
    }

    throw new Error(rule.message ?? `Injected test error: ${point}`);
  }

  set(point: string, rule: TestInjectionRule): void {
    this.rules.set(point, rule);
  }

  unset(point: string): void {
    this.rules.delete(point);
  }

  clear(): void {
    this.rules.clear();
  }

  list(): Record<string, TestInjectionRule> {
    return Object.fromEntries(this.rules.entries());
  }
}
