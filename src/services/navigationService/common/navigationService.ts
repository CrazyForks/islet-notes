import { IHostService } from '@/services/native/common/hostService';
import { Emitter, Event } from 'vscf/base/common/event';
import { IDisposable } from 'vscf/base/common/lifecycle';
import { createDecorator } from 'vscf/platform/instantiation/common';

export interface NavigateOptions {
  path: string;
  replace?: boolean;
  state?: unknown;
}

export interface GoBackOptions {
  fallbackPath?: string;
  replaceFallback?: boolean;
}

export interface INavigationService {
  readonly _serviceBrand: undefined;
  readonly onNavigate: Event<NavigateOptions>;
  navigate(options: NavigateOptions): void;
  listenBackButton(callback: () => void): IDisposable;
  goBack(options?: GoBackOptions): void;
  readonly onGoBack: Event<GoBackOptions | undefined>;
}

export class NavigationService implements INavigationService {
  public readonly _serviceBrand: undefined;
  private readonly _onNavigate = new Emitter<NavigateOptions>();
  private readonly _onGoBack = new Emitter<GoBackOptions | undefined>();
  public readonly onNavigate = this._onNavigate.event;
  public readonly onGoBack = this._onGoBack.event;
  private backButtonListeners: Array<() => void> = [];

  constructor(@IHostService hostService: IHostService) {
    hostService.onBackButton(() => {
      const lastListener = this.backButtonListeners[this.backButtonListeners.length - 1];
      if (lastListener) lastListener();
    });
  }

  navigate(options: NavigateOptions): void {
    this._onNavigate.fire(options);
  }

  goBack(options?: GoBackOptions): void {
    this._onGoBack.fire(options);
  }

  listenBackButton(callback: () => void): IDisposable {
    this.backButtonListeners.push(callback);
    return {
      dispose: () => {
        this.backButtonListeners = this.backButtonListeners.filter((item) => item !== callback);
      },
    };
  }
}

export const INavigationService = createDecorator<INavigationService>('INavigationService');
