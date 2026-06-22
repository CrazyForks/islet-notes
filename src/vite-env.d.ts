/// <reference types="vite/client" />

declare module '*?url' {
  const url: string;
  export default url;
}

declare module 'loro-crdt/web/loro_wasm_bg.wasm?url' {
  const url: string;
  export default url;
}
