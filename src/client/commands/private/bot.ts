import { ApplicationCommandType, ColorResolvable, EmbedBuilder } from "discord.js";
import { client, config } from "../../..";
import { Command } from "../../../app/base";
import { convertHex } from "../../../app/functions";

export default new Command({
    name: "bot",
    description: "Mostra informações sobre o bot",
    type: ApplicationCommandType.ChatInput,
    visibility: "private",
    dmPermission: false,
    async run(interaction) {
        const { heapTotal, heapUsed } = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        function formatUptime(uptime: number) {
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            return `${days} dias, ${hours} horas, ${minutes} minutos e ${seconds} segundos`;
        }

        interaction.reply({ephemeral: true, embeds: [
            new EmbedBuilder({
                title: "Informações sobre o bot",
                thumbnail: { url: client.user!.displayAvatarURL() },
                color: convertHex(config.colors.theme.zunder),
                description: `> ${client.user}`,
                fields: [
                    { name: "Memória", value: `${Math.round(heapUsed / 1024 / 1024 * 100) / 100} MB usados de ${Math.round(heapTotal / 1024 / 1024 * 100) / 100} MB` },
                    { name: "CPU", value: `${(cpuUsage.user / 1000 / 1000).toFixed(2)}ms de uso da CPU do usuário` },
                    { name: "Tempo ativo", value: `${formatUptime(process.uptime())}` }
                ]
            })
        ]});
    },
});