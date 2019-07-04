// From https://fadden.com/tech/ShadowCast.cs.txt

interface Octant {
	xx: number;
	xy: number;
	yx: number;
	yy: number;
}

const octant: Octant[] = [
	{ xx: +1, xy: +0, yx: +0, yy: +1 }, // 0 E-NE
	{ xx: +0, xy: +1, yx: +1, yy: +0 }, // 1 NE-N
	{ xx: +0, xy: -1, yx: +1, yy: +0 }, // 2 N-NW
	{ xx: -1, xy: +0, yx: +0, yy: +1 }, // 3 NW-W
	{ xx: -1, xy: +0, yx: +0, yy: -1 }, // 4 W-SW
	{ xx: +0, xy: -1, yx: -1, yy: +0 }, // 5 SW-S
	{ xx: +0, xy: +1, yx: -1, yy: +0 }, // 6 S-SE
	{ xx: +1, xy: +0, yx: +0, yy: -1 }, // 7 SE-E
];

interface GridData {
	data: Int8Array;
	width: number;
	height: number;
}

interface GridPosition {
	x: number;
	y: number;
}

export class Grid {
	/**
	 * Lights up cells visible from the source. Clear all lighting before calling.
	 */
	static castPointShadow(
		grid: GridData,
		source: GridPosition,
		radius: number
	): Float32Array {
		const shadowMap = new Float32Array(grid.width * grid.height);

		// Viewer's cell is always visible.
		shadowMap[source.x + grid.width * source.y] = 0 << 0;

		// Cast light into cells for each of 8 octants.
		//
		// The left/right inverse slope values are initially 1 and 0, indicating a diagonal
		// and a horizontal line.  These aren't strictly correct, as the view area is supposed
		// to be based on corners, not center points.  We only really care about one side of the
		// wall at the edges of the octant though.
		//
		// NOTE: depending on the compiler, it's possible that passing the octant transform
		// values as four integers rather than an object reference would speed things up.
		// It's much tidier this way though.
		for (let idx = 0; idx < octant.length; ++idx) {
			castShadow(grid, source, radius, 1, 1.0, 0.0, octant[idx]);
		}

		return shadowMap;

		function castShadow(
			grid: GridData,
			source: GridPosition,
			radius: number,
			startCol: number,
			leftViewSlope: number,
			rightViewSlope: number,
			octant: Octant
		) {
			const radiusSq = radius * radius;
			const viewCeiling = Math.ceil(radius) << 0;

			// Set true if the previous cell we encountered was blocked.
			let prevWasBlocked = false;

			// As an optimization, when scanning past a block we keep track of the
			// rightmost corner (bottom-right) of the last one seen.  If the next cell
			// is empty, we can use this instead of having to compute the top-right corner
			// of the empty cell.
			let savedRightSlope = -1;

			const xDim = grid.width;
			const yDim = grid.height;

			// Outer loop: walk across each column, stopping when we reach the visibility limit.
			for (let currentCol = startCol; currentCol <= viewCeiling; ++currentCol) {
				const xc = currentCol;

				// Inner loop: walk down the current column.  We start at the top, where X==Y.
				//
				// TODO: we waste time walking across the entire column when the view area
				//   is narrow.  Experiment with computing the possible range of cells from
				//   the slopes, and iterate over that instead.
				for (let yc = currentCol; yc >= 0; --yc) {
					// Translate local coordinates to grid coordinates.  For the various octants
					// we need to invert one or both values, or swap X for Y.
					const gridX = source.x + xc * octant.xx + yc * octant.xy;
					const gridY = source.y + xc * octant.yx + yc * octant.yy;

					// Range-check the values.  This lets us avoid the slope division for blocks
					// that are outside the grid.
					//
					// Note that, while we will stop at a solid column of blocks, we do always
					// start at the top of the column, which may be outside the grid if we're (say)
					// checking the first octant while positioned at the north edge of the map.
					if (gridX < 0 || gridX >= xDim || gridY < 0 || gridY >= yDim) {
						continue;
					}

					// Compute slopes to corners of current block.  We use the top-left and
					// bottom-right corners.  If we were iterating through a quadrant, rather than
					// an octant, we'd need to flip the corners we used when we hit the midpoint.
					//
					// Note these values will be outside the view angles for the blocks at the
					// ends -- left value > 1, right value < 0.
					const leftBlockSlope = (yc + 0.5) / (xc - 0.5);
					const rightBlockSlope = (yc - 0.5) / (xc + 0.5);

					// Check to see if the block is outside our view area.  Note that we allow
					// a "corner hit" to make the block visible.  Changing the tests to >= / <=
					// will reduce the number of cells visible through a corner (from a 3-wide
					// swath to a single diagonal line), and affect how far you can see past a block
					// as you approach it.  This is mostly a matter of personal preference.
					if (rightBlockSlope > leftViewSlope) {
						// Block is above the left edge of our view area; skip.
						continue;
					} else if (leftBlockSlope < rightViewSlope) {
						// Block is below the right edge of our view area; we're done.
						break;
					}

					// This cell is visible, given infinite vision range.  If it's also within
					// our finite vision range, light it up.
					//
					// To avoid having a single lit cell poking out N/S/E/W, use a fractional
					// viewRadius, e.g. 8.5.
					//
					// TODO: we're testing the middle of the cell for visibility.  If we tested
					//  the bottom-left corner, we could say definitively that no part of the
					//  cell is visible, and reduce the view area as if it were a wall.  This
					//  could reduce iteration at the corners.
					const distanceSquared = xc * xc + yc * yc;
					if (distanceSquared <= radiusSq) {
						shadowMap[source.x + grid.width * source.y] = distanceSquared;
					}

					const curBlocked = grid.data[source.x + grid.width * source.y] !== 0;

					if (prevWasBlocked) {
						if (curBlocked) {
							// Still traversing a column of walls.
							savedRightSlope = rightBlockSlope;
						} else {
							// Found the end of the column of walls.  Set the left edge of our
							// view area to the right corner of the last wall we saw.
							prevWasBlocked = false;
							leftViewSlope = savedRightSlope;
						}
					} else {
						if (curBlocked) {
							// Found a wall.  Split the view area, recursively pursuing the
							// part to the left.  The leftmost corner of the wall we just found
							// becomes the right boundary of the view area.
							//
							// If this is the first block in the column, the slope of the top-left
							// corner will be greater than the initial view slope (1.0).  Handle
							// that here.
							if (leftBlockSlope <= leftViewSlope) {
								castShadow(
									grid,
									source,
									radius,
									currentCol + 1,
									leftViewSlope,
									leftBlockSlope,
									octant
								);
							}

							// Once that's done, we keep searching to the right (down the column),
							// looking for another opening.
							prevWasBlocked = true;
							savedRightSlope = rightBlockSlope;
						}
					}
				}

				// Open areas are handled recursively, with the function continuing to search to
				// the right (down the column).  If we reach the bottom of the column without
				// finding an open cell, then the area defined by our view area is completely
				// obstructed, and we can stop working.
				if (prevWasBlocked) {
					break;
				}
			}
		}
	}
}
