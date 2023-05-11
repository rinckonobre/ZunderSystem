import { Event } from "../../../app/base";
import { systemRegister } from "../../../app/functions";


export default new Event({
    name: "messageCreate",
    async run(message) {
        const { member } = message;
        if (!member || member.user.bot) return;
        systemRegister.auto(member);
    },
});