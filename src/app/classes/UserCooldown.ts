import { User } from "discord.js";

interface UserCooldownTime {
    duration: number,
    unit?: "seconds" | "minutes" | "hours" | "days"
}

export class UserCooldown {
    constructor(
        private guild: string,
        private user: User,
        private time: UserCooldownTime
    ){
        
    }
}