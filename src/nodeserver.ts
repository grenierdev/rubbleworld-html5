import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

class GameState extends EventEmitter {
    title: string;
    players: Immutable.Map<string, PlayerState>;
    tiles: Immutable.List<TileState>;
}

class PlayerState extends EventEmitter {
    name: string;
}

class TileState extends EventEmitter {

}

const game = new GameState();

// Game Client
{
    
}

// Client
{
    const client = new CompositeDisposable();
    
    client.add(game.on('playerChangedName', (player: PlayerState) => {
        // signal client
    }));
    client.add(game.on('playerJoined', (player: PlayerState) => {
        // signal client
    }))
}