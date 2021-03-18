import { RNG, Display } from 'rot-js';

export function pickFreeCell(freeCells: string[]) {
    let index = Math.floor(RNG.getUniform() * freeCells.length);
    return freeCells.splice(index, 1)[0]; // remove cell from list
}

export function packCell(x: number, y: number) {
    return `${x},${y}`;
}

export function unpackCell(packedCell: string) {
    let parts = packedCell.split(',');
    return [parseInt(parts[0]), parseInt(parts[1])];
}

export function showMessage(message: string, display: Display) {
    for (let i = 0; i < 50; i++) display.draw(i, 25, " ", null, null);
    display.drawText(0, 25, message, 50);
}
