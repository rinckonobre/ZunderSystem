import { Event } from "../../../app/base";
import { systemRegister } from "../../../app/functions";

export default new Event({
    name: "guildMemberAdd", 
    async run(member){
        if (member.user.bot) return;
        systemRegister.auto(member);
    }
});