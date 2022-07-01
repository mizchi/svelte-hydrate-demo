import { compile } from "svelte/compiler";
import { expose } from "comlink";
const api = {
  compile(code: string) {
    const out = compile(code, {
      format: "esm",
      css: false,
      hydratable: true,
      dev: true
    });
    return {
      js: out.js.code
    };
  }
}
export type Api = typeof api;

expose(api);

