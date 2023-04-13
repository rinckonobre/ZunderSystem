export type ScheduleType = {
    name: string
    enable: boolean
    display: string,
    frequency: string,
    execute: () => any,
}

export class Schedule {
    constructor(options: ScheduleType){
        Object.assign(this, options);
    }
}