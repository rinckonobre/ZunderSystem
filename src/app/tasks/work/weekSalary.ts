import { EmbedBuilder, TextChannel } from "discord.js";
import { client, config } from "../..";
import { Firestore, Schedule, ServerManager, DocumentPlayer, DiscordCreate } from "../../structs";

const playersColl = new Firestore("players");

export default new Schedule({
    name: "Salário de trabalho",
    display: "Pagamendo de salário de trabalho todo sábado às 2:30".blue,
    enable: false,
    frequency: "30 2 * * 6",
    async execute() {

        const guild = client.guilds.cache.get(client.mainGuildID);
        if (!guild) return;

        const cAudit = ServerManager.findChannel(guild, config.guild.channels.audit) as TextChannel | undefined;
        if (!cAudit) return;

        const roleWork = ServerManager.findRole(guild, config.guild.roles.functional.work);
        if (!roleWork) return;

        const embeds: Array<EmbedBuilder> = [];

        roleWork.members.forEach(async member => {
            const memberData = await playersColl.getDocData(member.id) as DocumentPlayer | undefined

            const registry = memberData?.registry
            const inventory = memberData?.inventory
            const work = memberData?.work

            if (registry && work && (work.salary || 1) > 80) {

                const currCoins = inventory?.coins || 0
                const salary = work.salary || 0

                const newCoins = (30 / 100) * salary

                if (memberData.inventory) {
                    memberData.inventory.coins = currCoins + newCoins;
                } else {
                    memberData.inventory = {
                        coins: newCoins,
                        amplifier: 0,
                    }
                }

                if (memberData.work) memberData.work.salary = 0;

                playersColl.saveDocData(member.id, memberData)

                embeds.push(DiscordCreate.simpleEmbed(config.colors.systems.work,
                    `💳 O pagamento de ${member} foi depositado!
                    > Recebeu ${ServerManager.findEmoji(guild, "coins")} \` ${newCoins} \` moedas`)
                )
            }
        })

        setTimeout(() => {

            if (embeds.length < 1) return;

            const sendMessages = setInterval(() => {

                const embed = embeds.pop()
                if (embed) cAudit.send({ embeds: [embed] })

                if (embeds.length < 1) clearInterval(sendMessages)

            }, 120 * 1000)
        }, 10 * 1000)


    },
})