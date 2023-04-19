import { client } from "../..";
import { Event } from "../../structs";

export default new Event({
    name: "ready", once: true, async run() {

        const [commands, buttons, selects, modals] = [
            client.commands.size,
            client.buttons.size,
            client.selects.size,
            client.modals.size
        ]

        function formatNumber(number: number) {
            return number < 10 ? `0${number}` : `${number}`
        }

        const display = (client.enviroment == "development") ?
        " in development mode ".bgCyan.black :
        " in production mode ".bgGreen.white 

        console.log(" ✓ Bot online".green, display)
        console.log("⤷ ⌨️  Commands (/) loaded:".cyan, `${formatNumber(commands) || "nenhum"}`);
        console.log("⤷ ⏺️  Buttons loaded:".cyan, `${formatNumber(buttons) || "nenhum"}`);
        console.log("⤷ 🗃️  Select Menus loaded:".cyan, `${formatNumber(selects) || "nenhum"}`);
        console.log("⤷ 📑 Modals loaded:".cyan, `${formatNumber(modals) || "nenhum"}`);
    }
})