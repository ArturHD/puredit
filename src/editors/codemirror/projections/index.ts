import { getIndentation, syntaxTree } from "@codemirror/language";
import { ChangeSpec, EditorState, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { zip } from "../../../shared/utils";
import {
  createPatternMap,
  findPatterns,
  Match,
  PatternNode,
  SyntaxNode,
} from "../../../parsers/lezer";
import { flexPlugin } from "./flex";
import type { ProjectionWidgetClass } from "./projection";
import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import * as changeProjection from "./changeProjection";
import * as replaceProjection from "./replaceProjection";
import * as trimProjection from "./trimProjection";

const projectionState = StateField.define<DecorationSet>({
  create(state) {
    let tree = syntaxTree(state);
    let matches = findPatterns(patternMap, tree.cursor(), state.doc);
    let decorations = updateProjections(Decoration.none, false, state, matches);
    return decorations;
  },
  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);
    let state = transaction.state;
    let tree = syntaxTree(state);
    let matches = findPatterns(patternMap, tree.cursor(), state.doc);
    decorations = updateProjections(decorations, true, state, matches);

    // TODO: figure out a way to incrementally match changes, to avoid
    // rematching the whole tree.
    /*transaction.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
      let matches = findPatterns(
        patternMap,
        tree.cursor(fromB),
        state.doc,
        toB
      );
      decorations = updateProjections(decorations, true, state, matches);
    });*/

    let visibleDecorations = decorations;
    if (transaction.selection) {
      let onSelection = false;
      let { head } = transaction.selection.main;
      decorations.between(head, head, (from, to) => {
        if (from < head && to > head) {
          onSelection = true;
        }
      });
      if (onSelection) {
        visibleDecorations = decorations.update({
          filterFrom: head,
          filterTo: head,
          filter: (from, to) => to <= head || from >= head,
        });
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

let patternMap = createPatternMap(
  changeProjection.pattern,
  replaceProjection.pattern,
  trimProjection.pattern
);
let projections = new Map<PatternNode, Array<ProjectionWidgetClass<Match>>>([
  [changeProjection.pattern, [changeProjection.widget, changeProjection.end]],
  [replaceProjection.pattern, [replaceProjection.widget]],
  [trimProjection.pattern, [trimProjection.widget]],
]);

function updateProjections(
  decorations: DecorationSet,
  isUpdate: boolean,
  state: EditorState,
  matches: Match[]
): DecorationSet {
  for (const match of matches) {
    const widgets = projections.get(match.pattern);
    if (!widgets) {
      //console.warn("No projection found for pattern", match.pattern);
      continue;
    }
    const ranges = removeBlocksFromRange(
      match.node.from,
      match.node.to,
      match.blocks
    );
    for (const [{ from, to }, Widget] of zip(ranges, widgets)) {
      let found = false;
      decorations.between(from, to, (a, b, dec) => {
        let widget = dec.spec.widget;
        if ((a === from || b === to) && widget instanceof Widget) {
          widget.set(match, state);
          found = true;
          // Adjust range
          if (a !== from || b !== to) {
            decorations = decorations.update({
              add: [dec.range(from, to)],
              filterFrom: a,
              filterTo: b,
              filter: (innerFrom, innerTo) =>
                match.blocks.some(
                  (block) => block.from <= innerFrom && block.to >= innerTo
                ),
            });
          }
          return false;
        }
      });
      if (!found) {
        decorations = decorations.update({
          add: [
            Decoration.replace({
              widget: new Widget(isUpdate, match, state),
            }).range(from, to),
          ],
          filterFrom: from,
          filterTo: to,
          filter: (innerFrom, innerTo) =>
            match.blocks.some(
              (block) => block.from <= innerFrom && block.to >= innerTo
            ),
        });
      }
    }
  }
  return decorations;
}

interface Range {
  from: number;
  to: number;
}

/**
 * Splits a range into subranges that do not cover a given list of blocks.
 * @param from Start of the original range.
 * @param to End of the original range.
 * @param blocks A sorted list of blocks to exclude from the range.
 */
function removeBlocksFromRange(
  from: number,
  to: number,
  blocks: SyntaxNode[],
  includeBraces: boolean = true
): Range[] {
  const rangeModifier = includeBraces ? 1 : 0;
  let ranges: Range[] = [];
  for (const block of blocks) {
    if (block.from !== from) {
      ranges.push({ from, to: block.from + rangeModifier });
    }
    from = block.to - rangeModifier;
  }
  if (from !== to) {
    ranges.push({ from, to });
  }
  return ranges;
}

const changeFilter = EditorState.transactionFilter.of((tr) => {
  const decorations = tr.startState.field(projectionState);
  const changes: ChangeSpec[] = [];
  tr.changes.iterChanges((from, to, _fromB, _toB, insert) => {
    let inProjectionRange = false;
    decorations.between(from, to, () => {
      inProjectionRange = true;
      return false;
    });
    if (!inProjectionRange) {
      changes.push({ from, to, insert });
    }
  }, true);
  return {
    changes,
    selection: tr.selection,
    effects: tr.effects,
    scrollIntoView: tr.scrollIntoView,
  };
});

function completions(context: CompletionContext): CompletionResult | null {
  let word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }
  const indentation = getIndentation(context.state, word.from) || 0;
  return {
    from: word.from,
    options: [
      {
        label: "change table",
        type: "function",
        apply: changeProjection.draft
          .split("\n")
          .join("\n" + " ".repeat(indentation)),
      },
      {
        label: "replace string in column",
        type: "function",
        apply: replaceProjection.draft
          .split("\n")
          .join("\n" + " ".repeat(indentation)),
      },
      {
        label: "trim column",
        type: "function",
        apply: trimProjection.draft
          .split("\n")
          .join("\n" + " ".repeat(indentation)),
      },
    ],
  };
}

export const projectionPlugin = [
  projectionState.extension,
  //changeFilter,
  flexPlugin,
  //autocompletion({ override: [completions] }),
];
