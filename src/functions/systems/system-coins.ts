import { GuildMember } from 'discord.js';
import { db } from '../..';
import { DocumentPlayer } from '../../structs';

export const systemCoins = {
    async give(member: GuildMember, value: number){
        const memberData = await db.players.get(member.id) as DocumentPlayer | undefined;
        if (!memberData) return false;

        const limit = memberData.config?.limits?.coins || 20000
        const currentCoins = memberData.wallet?.coins || 0;

        if (currentCoins >= limit) return false;

        const newCoins = currentCoins + value;

        if (newCoins >= limit) db.players.update(member.id, "wallet.coins", limit);
        else db.players.update(member.id, "wallet.coins", newCoins);
        
        return true;
    }
}