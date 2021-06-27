import { DIRS, Path } from 'rot-js';
import { Game } from './game';
import * as util from './util';

class Entity {
    constructor(
        private renderCharacter: string,
        private renderColor: string,
        protected game: Game,
        public x: number,
        public y: number,
    ) {}
    draw() {
        this.game.mapDisplay.draw(
            this.x,
            this.y,
            this.renderCharacter,
            this.renderColor,
            null
        );
    }
    act() {}
}

function passableCallback(x: number, y: number) {
    const cellKey = util.packCell(x, y);
    const passableCharacters = ['.', '+', '*'];
    return (cellKey in this.game.map &&
        passableCharacters.includes(this.game.map[cellKey])
    );
}

export class Player extends Entity {
    private done: boolean;
    level: number = 1;
    xp: number = 0;
    hp: number = 10;
    str: number = 12;
    constructor(
        x: number,
        y: number,
        game: Game,
    ) {
        super("@", "yellow", game, x, y);
    }
    async act() {
        this.done = false;
        this.game.statDisplay.drawText(1, 1, `Level: ${this.level}`);
        this.game.statDisplay.drawText(13, 1, `XP: ${this.xp}`)
        this.game.statDisplay.drawText(25, 1, `HP: ${this.hp}`)
        this.game.statDisplay.drawText(37, 1, `STR: ${this.str}`)
        while (!this.done && this.game.active) {
            await new Promise(
                response => { window.addEventListener('keydown', response, {"once": true}); }
            ).then( (keystroke: KeyboardEvent) => { this.done = this.processKeystroke(keystroke); } );
        }
        if (this.game.active) util.showMessage(" ", this.game.messageDisplay);
    }
    private processKeystroke(e: KeyboardEvent) {
        var keyMap = {
            "ArrowUp": 0,
            "ArrowRight": 2,
            "ArrowDown": 4,
            "ArrowLeft": 6,
            "k": 0,
            "l": 2,
            "j": 4,
            "h": 6,
        };
        var code = e.key;
        if (code == " " || code == "Enter") {
            this.checkBox();
            return false;
        }
        if (!(code in keyMap)) {return false;}
        var diff = DIRS[8][keyMap[code]];
        var newX = this.x + diff[0];
        var newY = this.y + diff[1];
        if (!passableCallback.bind(this)(newX, newY)) {return false;}
    
        this.game.mapDisplay.draw(
            this.x,
            this.y,
            this.game.map[util.packCell(this.x, this.y)],
            null,
            null
        );
        this.x = newX;
        this.y = newY;
        this.draw();
        return true;
    }
    private checkBox() {
        let packedCell = util.packCell(this.x, this.y);
        if (this.game.map[packedCell] != "*") {
            util.showMessage("There is no box here.", this.game.messageDisplay);
        } else if (packedCell == this.game.treasure) {
            util.showMessage("You found the treasure and won this game!", this.game.messageDisplay);
            this.game.active = false;
        } else {
            util.showMessage("This box is empty.", this.game.messageDisplay);
        }
    }
}

export class Enemy extends Entity {
    constructor(
        x: number,
        y: number,
        game: Game,
    ) {
        super("r", "red", game, x, y);
    }
    act() {
        var playerX = this.game.player.x;
        var playerY = this.game.player.y;
        var astar = new Path.AStar(
            playerX,
            playerY,
            passableCallback.bind(this),
            {topology:4}
        );
        var path = [];
        var pathCallback = function(x, y) {
            path.push([x,y]);
        }
        astar.compute(this.x, this.y, pathCallback);
    
        path.shift(); // remove enemy's position
        if (path.length == 1) {
            util.showMessage("The enemy captured you. Game over.", this.game.messageDisplay);
            this.game.active = false;
        } else {
            let newX: number, newY: number;
            newX = path[0][0];
            newY = path[0][1];
            this.game.mapDisplay.draw(
                this.x,
                this.y,
                this.game.map[util.packCell(this.x, this.y)],
                null,
                null
            );
            this.x = newX;
            this.y = newY;
            this.draw();
        }
    }
}
