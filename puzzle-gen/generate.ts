import { readFile, writeFile } from "fs/promises";
import { colClues, rowClues } from "./clues.ts";
import { write } from "fs";

function cell(R: number, C: number, isFilled: boolean): string {
	return `
			<div class="cell c${C} sol-${isFilled ? 'fill' : 'empty'}">
				<input type="radio" name="r${R}c${C}" id="r${R}c${C}-e" class="s s-empty" checked>
				<input type="radio" name="r${R}c${C}" id="r${R}c${C}-f" class="s s-fill">
				<input type="radio" name="r${R}c${C}" id="r${R}c${C}-m" class="s s-mark">
				<label class="to-fill"  for="r${R}c${C}-f"></label>
				<label class="to-mark"  for="r${R}c${C}-m"></label>
				<label class="to-empty" for="r${R}c${C}-e"></label>
			</div>
	`;
}

function colCluesMarkup(grid: boolean[][]): string {
	const columnClues = colClues(grid);
	let clueMarkup: string = '';
	for (let i in columnClues) {
		const clueSpans = columnClues[i].map((c) => `<span>${c}</span>` ).join('');
		clueMarkup += `
			<div class="col-clue cc${Number(i) + 1}">${clueSpans}</div>`;
	}

	return `
		<div class="col-clues">
			<div class="clue-spacer"></div>
			${clueMarkup}
		</div>
	`;
}

function rowsMarkup(grid: boolean[][]): string {
	let result: string = '';
	const rClues = rowClues(grid);

	for (let row in grid) {
		result += `
		<div class="row r${+row+1}">
			${rowMarkup(+row, grid[row], rClues[row])}
		</div>
		`;
	}

	return `
		${result}
	`;
}

function rowMarkup(index: number, row: boolean[], clues: number[]): string {
	let result: string = '';

	// clues first
	const clueSpans = clues.map((c) => `<span>${c}</span>`).join('');
	result += `<div class="row-clue">${clueSpans}</div>\n`;

	// then each cell in the row
	for (let c in row) {
		result += cell(index+1, +c+1, row[c]);
	}

	return result;
}

async function generateBoard(): Promise<boolean[][]> {
	// pull in puzzle from cmdline
	const puzzleFile = process.argv[2];
	if (!puzzleFile)
	{
		throw new Error("No puzzle file.");
	}

	let puzzleData: string = '';
	try {
		puzzleData = await readFile(puzzleFile, 'utf-8');
	} catch (e) {
		console.error('Failed to read puzzle file: ', e);
	}

	// build the grid
	const grid: boolean[][] = [];
	for (const line of puzzleData.split(/\r?\n/)) {
		if (line.length == 0) continue;
		const row: boolean[] = [];
		for (let char of line) {
			row.push(char === '#');
		}
		grid.push(row);
	}

	return grid;
}

async function generateBoardMarkup(board: boolean[][]) {
	const TEMPLATE_FILE_PATH: string = 'puzzle-gen/template.html';
	let templateFile: string = '';
	try {
		templateFile = await readFile(TEMPLATE_FILE_PATH, 'utf-8');
	} catch (e) {
		console.error('Failed to retrieve template file: ', e);
	}
	templateFile = templateFile.replace('{{board}}', `${colCluesMarkup(board)}\n${rowsMarkup(board)}`);

	try {
		await writeFile('index.html', templateFile);
	} catch (e) {
		console.error('Failed to write index file: ', e);
	}
}

async function generateCSS(board: boolean[][]) {
	let result: string = `.puzzle { --cols: ${board[0].length}; }`;

	for (let c in board[0]) {
		result += `
		.puzzle:not(:has(.c${+c+1}.sol-fill .s-fill:not(:checked),
						.c${+c+1}.sol-empty .s-fill:checked)) .cc${+c+1} { color: var(--clue-done); }
		`;
	}

	await writeFile('puzzle.generated.css', result);
}

let board: boolean[][] = [];
try {
	board = await generateBoard();
} catch (e) {
	console.error('Failed to generate the puzzle board: ', e);
}

try {
	await generateBoardMarkup(board);
} catch (e) {
	console.error('Failed to generate the board markup: ', e);
}
try {
	await generateCSS(board);
} catch (e) {
	console.error('Failed to generate the CSS file: ', e);
}
