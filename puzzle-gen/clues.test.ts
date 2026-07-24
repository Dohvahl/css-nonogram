import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { lineClues, rowClues, colClues } from "./clues.ts";

// Readable fixtures: '#' = filled, anything else = empty.
const line = (s: string): boolean[] => [...s].map((ch) => ch === "#");
const grid = (rows: string[]): boolean[][] => rows.map(line);

/* lineClues: a line of cells -> its run lengths.
   An all-empty line is [0], not []. */
describe("lineClues", () => {
  const cases: [name: string, input: string, expected: number[]][] = [
    ["empty line", ".....", [0]],
    ["full line", "#####", [5]],
    ["single filled", "#", [1]],
    ["single empty", ".", [0]],
    ["two gaps", ".#.#.", [1, 1]],
    ["run then single", "##..#", [2, 1]],
    ["leading run", "#....", [1]],
    ["trailing run", "....#", [1]],
    ["centered run", ".###.", [3]],
    ["alternating", "#.#.#", [1, 1, 1]],
    ["runs at both ends", "#...#", [1, 1]],
  ];

  for (const [name, input, expected] of cases) {
    test(name, () => {
      assert.deepEqual(lineClues(line(input)), expected);
    });
  }
});

/* rowClues / colClues: a grid -> one clue array per row / column. */
describe("rowClues and colClues", () => {
  const heart = grid([".#.#.", "#####", "#####", ".###.", "..#.."]);

  test("heart rows", () => {
    assert.deepEqual(rowClues(heart), [[1, 1], [5], [5], [3], [1]]);
  });

  test("heart cols", () => {
    assert.deepEqual(colClues(heart), [[2], [4], [4], [4], [2]]);
  });

  // A non-square grid catches rows and columns being confused.
  const asym = grid(["##.", "#.#"]);

  test("non-square rows", () => {
    assert.deepEqual(rowClues(asym), [[2], [1, 1]]);
  });

  test("non-square cols", () => {
    assert.deepEqual(colClues(asym), [[2], [1], [1]]);
  });

  // A column read top-to-bottom can hold multiple runs.
  const multi = grid(["#.", ".#", "#."]);

  test("multi-run rows", () => {
    assert.deepEqual(rowClues(multi), [[1], [1], [1]]);
  });

  test("multi-run cols", () => {
    assert.deepEqual(colClues(multi), [[1, 1], [1]]);
  });
});
