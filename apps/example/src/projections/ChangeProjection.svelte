<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import { HighlightStyle, tags } from "@codemirror/highlight";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import TextInput from "@puredit/projections/TextInput.svelte";
  import { validateFromList } from "@puredit/projections/shared";
  import type { ContextGlobal } from "./context";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  export let context: ContextGlobal;
  export let state: EditorState;
  export let focusGroup: FocusGroup;

  let tables: string[];
  $: tables = Object.keys(context.tables);

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>change table</span>
  <TextInput
    className={HighlightStyle.get(state, tags.atom)}
    node={match.args.table}
    {state}
    {view}
    {focusGroup}
    placeholder="table"
    completions={tables}
    validate={validateFromList(tables)}
  />
</span>
