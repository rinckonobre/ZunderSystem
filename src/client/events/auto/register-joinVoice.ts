import { client } from "../../..";
import { Event } from "../../../app/base";
import { systemRegister } from "../../../app/functions";

export default new Event({
    name: "voiceStateUpdate", 
    async run(oldState, newState){
        if (newState?.guild?.id != client.mainGuildID || oldState.channel === newState.channel) return;
        const { member } = newState;
        if (!member || member.user.bot) return;

        systemRegister.auto(member);
    }
});