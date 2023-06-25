import { ClientEvents } from "discord.js";

type EventData<Key extends keyof ClientEvents> = {
    name: Key,
    once?: boolean,
    run(...args: ClientEvents[Key]): any,
}

export class Event<Key extends keyof ClientEvents> {
    public readonly name: Key;
    public readonly once?: boolean;
    public run: (...args: ClientEvents[Key]) => any;
    constructor({name, once, run }: EventData<Key>){
        this.name = name;
        this.once = once;
        this.run = run;
    }
}