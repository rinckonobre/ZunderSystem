import { InviteGuild } from "discord.js";
import { Event } from "../../../app/base";

export default new Event({
    name: "inviteCreate",
    run(invite) {
        const { code, guild } = invite;

        
    }
});