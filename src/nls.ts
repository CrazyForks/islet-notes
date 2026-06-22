const isPseudo =
  typeof document !== 'undefined' &&
  document.location &&
  document.location.hash.includes('pseudo=true');

export function localize(
  key: string,
  message: string,
  ...args: (string | number | boolean | undefined | null)[]
): string;
export function localize(
  data: string,
  message: string,
  ...args: (string | number | boolean | undefined | null)[]
): string {
  const messages = globalThis.i18nMessages || {};
  const candidate = messages[data];
  const raw = typeof candidate === 'string' ? candidate : candidate?.content;
  return format(raw || message, args);
}

function format(message: string, args: (string | number | boolean | undefined | null)[]): string {
  let result =
    args.length === 0
      ? message
      : message.replace(/\{(\d+)\}/g, (match, index) => {
          const arg = args[Number(index)];
          if (typeof arg === 'string') return arg;
          if (
            typeof arg === 'number' ||
            typeof arg === 'boolean' ||
            arg === undefined ||
            arg === null
          ) {
            return String(arg);
          }
          return match;
        });

  if (isPseudo) {
    result = '\uFF3B' + result.replace(/[aouei]/g, '$&$&') + '\uFF3D';
  }

  return result;
}
