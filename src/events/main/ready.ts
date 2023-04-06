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

        console.log("✅ Bot online".green)
        console.log("⤷ ⌨️  Comandos (/) carregados:".cyan, `${formatNumber(commands) || "nenhum"}`);
        console.log("⤷ ⏺️  Botões carregados:".cyan, `${formatNumber(buttons) || "nenhum"}`);
        console.log("⤷ 🗃️  Menus de seleção carregados:".cyan, `${formatNumber(selects) || "nenhum"}`);
        console.log("⤷ 📑 Modais carregados:".cyan, `${formatNumber(modals) || "nenhum"}`);
    }
})