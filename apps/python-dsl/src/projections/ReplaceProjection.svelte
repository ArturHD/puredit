<script lang="ts">
  import { onMount } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import type { EditorView } from "@codemirror/view";
  import { HighlightStyle, tags } from "@codemirror/highlight";
  import type { Match } from "@puredit/parser";
  import type { FocusGroup } from "@puredit/projections/focus";
  import TextInput from "@puredit/projections/TextInput.svelte";
  import { validateFromList } from "@puredit/projections/shared";
  import type { ContextTable } from "./context";

  export let isNew: boolean;
  export let view: EditorView | null;
  export let match: Match;
  export let context: ContextTable;
  export let state: EditorState;
  export let focusGroup: FocusGroup;

  let textColumns: string[];
  $: textColumns = Object.keys(context.columns).filter(
    (key) => context.columns[key] === "TEXT"
  );

  onMount(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        focusGroup.first();
      });
    }
  });
</script>

<span class="inline-flex">
  <span>replace</span>
  <TextInput
    className={HighlightStyle.get(state, tags.string)}
    node={match.args.target}
    {state}
    {view}
    {focusGroup}
    placeholder="target"
  />
  <span>in column</span>
  <TextInput
    className={HighlightStyle.get(state, tags.atom)}
    node={match.args.column}
    {state}
    {view}
    {focusGroup}
    placeholder="column"
    completions={textColumns}
    validate={validateFromList(textColumns)}
  />
  <span>with</span>
  <TextInput
    className={HighlightStyle.get(state, tags.string)}
    node={match.args.replacement}
    {state}
    {view}
    {focusGroup}
    placeholder="replacement"
  />
</span>
