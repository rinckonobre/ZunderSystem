export type CooldownTimes = "seconds" | "minutes" | "hours" | "days" | "months"

export class Cooldown extends Date {
    constructor(value: number, cooldownTimes: CooldownTimes){
        super();
        const date = new Date(Date.now());
        switch (cooldownTimes) {
            case "seconds":{
                date.setSeconds(date.getSeconds() + value);
                break;
            }
            case "minutes":{
                date.setMinutes(date.getMinutes() + value);
                break;
            }
            case "hours":{
                date.setHours(date.getHours() + value);
                break;
            }
            case "days":{
                date.setHours(date.getHours() + (value  * 24))
                break;
            }
        }
    }
}