<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import { HighlightStyle, tags } from "@codemirror/highlight";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import TextInput from "@puredit/projections/TextInput.svelte";
  import type { ContextTable } from "./context";
  import { arrayCodeToValue, arrayValueToCode } from "./helpers";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  // svelte-ignore unused-export-let
  export let context: ContextTable;
  export let state: EditorState;
  export let focusGroup: FocusGroup;

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>display</span>
  <TextInput
    className={HighlightStyle.get(state, tags.atom)}
    node={match.args.columns}
    {state}
    {view}
    {focusGroup}
    placeholder="columns"
    codeToValue={arrayCodeToValue}
    valueToCode={arrayValueToCode}
  />
</span>
