import enUS from '../en-US.json';
import zhCN from '../zh-CN.json';
import { getValidLocaleKey } from './locale';

export function configMessages(localeInput: string) {
  const locale = getValidLocaleKey(localeInput);
  globalThis.language = locale;
  globalThis.i18nMessages = locale === 'zh-CN' ? zhCN : enUS;

  Object.keys(globalThis.i18nMessages).forEach((key) => {
    if (typeof globalThis.i18nMessages[key] !== 'string') {
      globalThis.i18nMessages[key] = globalThis.i18nMessages[key].content;
    }
  });
}
