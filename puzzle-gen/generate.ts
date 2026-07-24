import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { colClues, rowClues } from "./clues.ts";

const PUZZLE_DIR = "puzzle-gen/puzzles";
const TEMPLATE_PATH = "puzzle-gen/template.html";
const OUTPUT_PATH = "index.html";
const GENERATED_CSS_PATH = "puzzles.generated.css";

type Puzzle = { name: string; title: string; grid: boolean[][] };

function parseGrid(data: string): boolean[][] {
  const grid: boolean[][] = [];
  for (const line of data.split(/\r?\n/)) {
    if (line.length === 0) continue;
    grid.push([...line].map((ch) => ch === "#"));
  }
  return grid;
}

// Ids and radio names are prefixed with the puzzle name so multiple boards
// can share one page without their radio groups or labels colliding.
function cell(name: string, r: number, c: number, isFilled: boolean): string {
  const id = `${name}-r${r}c${c}`;
  return `
          <div class="cell c${c} sol-${isFilled ? "fill" : "empty"}">
            <input type="radio" name="${id}" id="${id}-e" class="s s-empty" checked>
            <input type="radio" name="${id}" id="${id}-f" class="s s-fill">
            <input type="radio" name="${id}" id="${id}-m" class="s s-mark">
            <label class="to-fill"  for="${id}-f"></label>
            <label class="to-mark"  for="${id}-m"></label>
            <label class="to-empty" for="${id}-e"></label>
          </div>`;
}

function rowMarkup(
  name: string,
  index: number,
  row: boolean[],
  clues: number[],
): string {
  const clueSpans = clues.map((c) => `<span>${c}</span>`).join("");
  const cells = row
    .map((filled, c) => cell(name, index + 1, c + 1, filled))
    .join("");
  return `<div class="row-clue">${clueSpans}</div>${cells}`;
}

function rowsMarkup(name: string, grid: boolean[][]): string {
  const clues = rowClues(grid);
  return grid
    .map(
      (row, i) =>
        `<div class="row r${i + 1}">${rowMarkup(name, i, row, clues[i])}</div>`,
    )
    .join("\n");
}

function colCluesMarkup(grid: boolean[][]): string {
  const cells = colClues(grid)
    .map((clue, i) => {
      const spans = clue.map((c) => `<span>${c}</span>`).join("");
      return `<div class="col-clue cc${i + 1}">${spans}</div>`;
    })
    .join("\n");
  return `<div class="col-clues"><div class="clue-spacer"></div>${cells}</div>`;
}

function puzzleSection(p: Puzzle): string {
  return `
    <section id="${p.name}" class="puzzle-page">
      <form class="puzzle">
        <h2 class="puzzle-title">${p.title}</h2>
        <input type="checkbox" id="${p.name}-mode" class="mode" />
        <label class="mode-switch" for="${p.name}-mode">
          <span class="mode-fill">Fill</span>
          <span class="mode-mark">Mark</span>
        </label>
        <div class="board">
          ${colCluesMarkup(p.grid)}
          ${rowsMarkup(p.name, p.grid)}
        </div>
        <button type="reset" class="reset">Reset</button>
        <div class="win">Solved!</div>
      </form>
    </section>`;
}

function navMarkup(puzzles: Puzzle[]): string {
  return puzzles.map((p) => `<a href="#${p.name}">${p.title}</a>`).join("\n");
}

// Everything size- or puzzle-specific lives here, scoped to the puzzle's #id
// so one puzzle's rules never touch another's.
function puzzleCSS(p: Puzzle): string {
  const cols = p.grid[0].length;
  // Size the row-clue gutter to the widest row clue so long clues (e.g.
  // "1 2 2 1") don't crowd the left edge. Assumes single-digit clues.
  const maxRowClue = Math.max(...rowClues(p.grid).map((clue) => clue.length));
  const clueW = (maxRowClue * 1.1 + 0.9).toFixed(2);
  const lines = [`#${p.name} { --cols: ${cols}; --clue-w: ${clueW}rem; }`];
  for (let c = 1; c <= cols; c++) {
    lines.push(
      `#${p.name}:not(:has(.c${c}.sol-fill .s-fill:not(:checked), .c${c}.sol-empty .s-fill:checked)) .cc${c} { color: var(--clue-done); }`,
    );
  }
  lines.push(
    `body:has(#${p.name}:target) .puzzle-nav a[href="#${p.name}"] { background: var(--accent); color: var(--cell-bg); }`,
  );
  return lines.join("\n");
}

async function loadPuzzles(): Promise<Puzzle[]> {
  const files = (await readdir(PUZZLE_DIR))
    .filter((f) => f.endsWith(".txt"))
    .sort();
  const puzzles: Puzzle[] = [];
  for (const file of files) {
    const name = file.replace(/\.txt$/, "");
    const title = name.charAt(0).toUpperCase() + name.slice(1);
    const grid = parseGrid(await readFile(join(PUZZLE_DIR, file), "utf-8"));
    puzzles.push({ name, title, grid });
  }
  return puzzles;
}

const puzzles = await loadPuzzles();
if (puzzles.length === 0) {
  throw new Error(`No .txt puzzles found in ${PUZZLE_DIR}`);
}

const template = await readFile(TEMPLATE_PATH, "utf-8");
const page = template
  .replace("{{nav}}", () => navMarkup(puzzles))
  .replace("{{puzzles}}", () => puzzles.map(puzzleSection).join("\n"));

await writeFile(OUTPUT_PATH, page);
await writeFile(GENERATED_CSS_PATH, puzzles.map(puzzleCSS).join("\n\n") + "\n");
console.log(
  `Generated ${OUTPUT_PATH} + ${GENERATED_CSS_PATH} with ${puzzles.length} puzzle(s): ${puzzles.map((p) => p.name).join(", ")}`,
);
