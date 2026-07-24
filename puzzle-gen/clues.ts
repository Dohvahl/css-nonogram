export function lineClues(line: boolean[]): number[] {
	// return clues indicating filled cells in the line
	const clues: number[] = [];
	let current = 0;
	for (const cell of line) {
		if (cell) {
			current += 1;
		} else if (current > 0) {
			clues.push(current);
			current = 0;
		}
	}

	if (current > 0) clues.push(current);
	return clues.length > 0 ? clues : [0];
}

export function rowClues(grid: boolean[][]): number[][] {
	const clues: number[][] = [];
	for (const row of grid) {
		clues.push(lineClues(row))
	}
	return clues;
}

export function colClues(grid: boolean[][]): number[][] {
	const clues: number[][] = [];
	const transpose = (g: boolean[][]): boolean[][] =>
		g[0].map((_, c) => g.map(row => row[c]));

	return rowClues(transpose(grid));
}
