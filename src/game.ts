import { Display, Map, Scheduler } from 'rot-js';
import { Room } from 'rot-js/lib/map/features';
import simple from 'rot-js/lib/scheduler/simple';
import { Player, Enemy } from './entity';
import * as util from './util';

async function mainLoop(scheduler: simple<any>, game: Game) {
    while (game.active) {
        let actor = scheduler.next();
        if (!actor) { break; }
        await actor.act();
    }
}

export class Game {
    display: Display;
    map: Record<string, string> = {};
    treasure: string;
    player: Player;
    enemy: Enemy;
    active: boolean = true;
    init() {
        this.display = new Display({
            width: 50,
            height: 26,
            fontSize: 18,
            forceSquareRatio: true
        });
        document.body.appendChild(this.display.getContainer());
        this.generateMap();
        let scheduler = new Scheduler.Simple();
        scheduler.add(this.player, true);
        scheduler.add(this.enemy, true);
        mainLoop(scheduler, this);
    }
    private generateMap() {
        const roomSize: [number, number] = [3, 8];
        const corridorLength: [number, number] = [3, 10];
        const diggerOptions = {
            "roomWidth": roomSize,
            "roomHeight": roomSize,
            // "corridorLength": corridorLength,
            "dugPercentage": 0.3,
        }
        const digger = new Map.Digger(50, 25, diggerOptions);
        const freeCells: string[] = [];
        const digCallback = (x: number, y: number, value: number) => {
            if (value) { return; } // do not store walls
            let key = util.packCell(x, y);
            freeCells.push(key);
            this.map[key] = '.';
        }
        digger.create(digCallback.bind(this));
        let room: Room;
        for (room of digger.getRooms()) {
            // Draw walls on room boundaries
            const wall = "#";
            let width: number = room.getRight() - room.getLeft();
            let height: number = room.getBottom() - room.getTop();
            for (let i = -1; i < width+2; i++) {
                this.map[util.packCell(room.getLeft() + i, room.getTop()-1)] = wall;
                this.map[util.packCell(room.getLeft() + i, room.getBottom()+1)] = wall;
            }
            for (let i = -1; i < height+2; i++) {
                this.map[util.packCell(room.getLeft()-1, room.getTop() + i)] = wall;
                this.map[util.packCell(room.getRight()+1, room.getTop() + i)] = wall;
            }
            // Draw doors
            const door = "+";
            room.getDoors((x, y) => {
                this.map[util.packCell(x,y)] = door;
            });
        }
        this.generateBoxes(freeCells);
        this.drawWholeMap();
        this.createEntities(freeCells);
    }
    private createEntities(freeCells: string[]) {
        let [ x, y ] = util.unpackCell(util.pickFreeCell(freeCells));
        this.player = new Player(x, y, this);
        this.player.draw();
        [ x, y ] = util.unpackCell(util.pickFreeCell(freeCells));
        this.enemy = new Enemy(x, y, this);
        this.enemy.draw();
    }
    private generateBoxes(freeCells: string[]) {
        for (var i = 0; i < 10; i++) {
            let packedCell = util.pickFreeCell(freeCells);
            this.map[packedCell] = '*';
            if (!i) this.treasure = packedCell;
        }
    }
    private drawWholeMap() {
        for (var key in this.map) {
            let [ x, y ] = util.unpackCell(key);
            this.display.draw(x, y, this.map[key], null, null);
        }
    }
}
