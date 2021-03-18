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
        this.game.display.draw(
            this.x,
            this.y,
            this.renderCharacter,
            this.renderColor,
            null
        );
    }
    act() {}
}

export class Player extends Entity {
    private done: boolean;
    constructor(
        x: number,
        y: number,
        game: Game,
    ) {
        super("@", "yellow", game, x, y);
    }
    async act() {
        this.done = false;
        while (!this.done && this.game.active) {
            await new Promise(
                response => { window.addEventListener('keydown', response, {"once": true}); }
            ).then( (keystroke: KeyboardEvent) => { this.done = this.processKeystroke(keystroke); } );
        }
        if (this.game.active) util.showMessage(" ", this.game.display);
    }
    private processKeystroke(e: KeyboardEvent) {
        var keyMap = {
            "ArrowUp": 0,
            "ArrowRight": 2,
            "ArrowDown": 4,
            "ArrowLeft": 6,
        };
        var code = e.key;
        if (code == " ") {
            this.checkBox();
            return false;
        }
        if (!(code in keyMap)) {return false;}
        var diff = DIRS[8][keyMap[code]];
        var newX = this.x + diff[0];
        var newY = this.y + diff[1];
        var newKey = newX + "," + newY;
        if (!(newKey in this.game.map)) {return false;}
    
        this.game.display.draw(
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
            util.showMessage("There is no box here.", this.game.display);
        } else if (packedCell == this.game.treasure) {
            util.showMessage("You found the treasure and won this game!", this.game.display);
            this.game.active = false;
        } else {
            util.showMessage("This box is empty.", this.game.display);
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
        var passableCallback = function(x: number, y: number) {
            return (util.packCell(x, y) in this.game.map);
        };
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
            util.showMessage("The enemy captured you. Game over.", this.game.display);
            this.game.active = false;
        } else {
            let newX: number, newY: number;
            newX = path[0][0];
            newY = path[0][1];
            this.game.display.draw(
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
