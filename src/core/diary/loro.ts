import { LoroDoc } from 'loro-crdt/web';
import initLoroWasm from 'loro-crdt/web/loro_wasm.js';
import loroWasmUrl from 'loro-crdt/web/loro_wasm_bg.wasm?url';

export type { LoroDoc, LoroMap, LoroMovableList, PeerID } from 'loro-crdt/web';

let loroReady: Promise<void> | undefined;

async function getLoroWasmModule() {
  if (typeof window === 'undefined') {
    const [{ readFile }, { fileURLToPath }] = await Promise.all([
      //@ts-ignore
      import('node:fs/promises'),
      //@ts-ignore
      import('node:url'),
    ]);
    const resolve = (import.meta as ImportMeta & { resolve?: (specifier: string) => string })
      .resolve;
    if (resolve) {
      return readFile(fileURLToPath(resolve('loro-crdt/web/loro_wasm_bg.wasm')));
    }
    if (!loroWasmUrl.startsWith('/node_modules/')) {
      return loroWasmUrl;
    }
    const wasmFileUrl = new URL(`../../..${loroWasmUrl}`, import.meta.url);
    return readFile(fileURLToPath(wasmFileUrl));
  }
  return loroWasmUrl;
}

export async function loadLoro() {
  loroReady ??= getLoroWasmModule()
    .then((module_or_path) => initLoroWasm({ module_or_path }))
    .then(() => undefined);
  await loroReady;
  return { LoroDoc };
}
