import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable } from 'konstellio-disposable';

import { Client } from '../Net/Client/Client';
import { Server } from '../Net/Server/Server';

export abstract class AGameMode extends EventEmitter {

    protected netAdapter: Client | Server;

    constructor (netAdapter: Client | Server) {
        super();

        this.netAdapter = netAdapter;
    }

    get isServer (): boolean {
        return this.netAdapter instanceof Server
    }

    disposeAsync (): Promise<void> {
        (this as any).netAdapter = undefined;
        return super.disposeAsync();
    }

}