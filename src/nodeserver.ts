import { Entity, SimpleGridFOV } from './gamemode/GameModeEntity';

class MyEntity extends Entity {

}


const playerA = new MyEntity();
const playerB = new MyEntity();
const playerC = new MyEntity();

const grid = new SimpleGridFOV(20, 20);

grid.addEntity(playerA, 10, 10, 5);
grid.addEntity(playerB, 14, 10, 2);

console.log(grid.isEntityVisibleTo(playerA, playerB));
console.log(grid.isEntityVisibleTo(playerB, playerA));
console.log(grid.isEntityVisibleTo(playerA, playerC));
console.log(grid.isEntityVisibleTo(playerB, playerC));