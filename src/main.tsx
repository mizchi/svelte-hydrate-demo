import type {Api} from "./worker";
import {wrap} from "comlink";

const worker = new Worker(new URL('./worker', import.meta.url), {
  type: 'module'
});

import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { useRef } from "react";
const root = createRoot(document.getElementById("app"));

const initialCode = `
<script>
  export let x;
  export let onChange;

  function onClick() {
    x++;
  }

  $: {
    onChange({ x })
  }
</script>

<div style="color: red">Hello, {x}</div>
<button on:click={onClick}>++</button>
`;

type ContinuousState = {x: number};
let _cachedState: ContinuousState = {x: 1};

function App() {
  const ref = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingCode, setEditingCode] = useState(initialCode);

  useEffect(() => {
    if (!ref.current) return;
    (async () =>{
      // worker(eable)
      const api = wrap<Api>(worker);
      const out = await api.compile(editingCode);
      const replaced = out.js
        // from "svelte/internal" => from "https://cdn.skypack.dev/svelte/internal"
        .replace('svelte/internal', 'https://cdn.skypack.dev/svelte/internal')
        .replace('"svelte"', 'https://cdn.skypack.dev/svelte');

      // Evaluate code in runtime context(like iframe)
      const {default: App} = await import(/* @vite-ignore */ 'data:text/javascript,' + replaced);
      let onChangeState = (s: ContinuousState) => _cachedState = s;
      // console.log("new render with", _cachedState);
      const _app = new App({
        props: {
          dev: true,
          ..._cachedState,
          onChange: onChangeState
        },
        target: ref.current,
        hydrate: true,
      });
      // Do not destroy app. Rerender it.
    })();
  }, [ref, editingCode]);
  return <div>
    <h1>
      Svelte hydrate Playground
    </h1>
    <hr />
    <textarea style={{width: '50vw', height: '30vh'}} ref={textareaRef} value={editingCode} onChange={(ev) => {
      setEditingCode(ev.target.value);
    }}></textarea>
    <hr />
    <div ref={ref}></div>
  </div>
}
root.render(<App />);