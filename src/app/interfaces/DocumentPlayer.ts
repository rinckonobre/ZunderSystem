interface DocumentPlayerCooldowns {
    commands?: {
        resources?: {
            upload?: number,
            edit?: number,
            delete?: number,
            list?: number,
        }
        work?: {
            profession?: number
        }
    }
}

interface DocumentPlayerInteraction {
    /** Player's current interaction level */
    level?: number;
    /** Player's current interaction exp */
    xp: number;
}
interface DocumentPlayerInventory {
    /**
     * @deprecated
     * Total player coins
     */
    coins: number;
    /** Player amp level */
    amplifier: number;
}

interface DocumentPlayerWallet {
    /** Total player coins */
    coins: number;
}

export interface DocumentPlayerRegistry {
    /** 
     * Player registration level 
     * - [1] Member
     * - [2] Helper
     * - [3] Mod
     * - [4] Admin
     * - [5] Leader 
    */
    level: 1 | 2 | 3 | 4 | 5;
    /** Player's nickname */
    nick: string;
    /** Player registration type */
    type: "zunder" | "discord";
    /** Player registration device */
    device: string;
}
interface DocumentPlayerRequests {
    zunder?: {
        /**
         * Nickname used to register as a Zunder member
         */
        nick: string,
        /**
         * Device used to perform the Zunder registration request
         * - minecraft
         * - steam
         * - epicgames
         */
        device: string
    }
}
// interface DocumentPlayerStaff {
//     daily: {
//         check: boolean;
//         messages: number;
//         call: number;
//     }
//     decrease: number;
//     manages: number;
//     score: number;
// }
interface DocumentPlayerStats {
    /** Total de eventos participados */
    events?: number;
    /** Total de mensagens enviadas */
    msg?: number;
    /** Total de compartilhamentos postados */
    shares?: number;
    /** Total de dinheiro doado para o grupo */
    donated?: number;
}
interface DocumentPlayerWorkDone {
    xpEarned: number;
    amount: number;
    gameID: string;
    professionID: string;
}
export interface DocumentPlayerWork {
    level: number;
    xp: number;
    dones?: Array<DocumentPlayerWorkDone>
    gameID: string;
    profession: string;
    salary: number
}

interface DocumentPlayerConfig {
    /** limit settings */
    limits?: {
        /** Player coin limit */
        coins?: number
    }
    /** Profile settings */
    profile?: {
        /** Profile "About" field text */
        about?: string
    }
}

export interface DocumentPlayer {
    /** Registration information */
    registry: DocumentPlayerRegistry;
    /** Cooldowns for using commands and functions */
    cooldowns?: DocumentPlayerCooldowns;
    /** Interaction */
    interaction?: DocumentPlayerInteraction;
    /** Player inventory */
    inventory?: DocumentPlayerInventory;
    /** Player wallet */
    wallet?: DocumentPlayerWallet;
    /** Requests */
    requests?: DocumentPlayerRequests;
    /** List of resource ids posted by the player */
    resources?: Array<{id: string}>;
    //staff?: DocumentPlayerStaff;
    /** Player stats */
    stats?: DocumentPlayerStats;
    /** Player job information */
    work?: DocumentPlayerWork;
    /** Player settings */
    config?: DocumentPlayerConfig;
}

export type DocumentPlayerPaths = 
"registry" | "registry.type" | "registry.level" | "registry.nick" | "registry.device" |
"interaction" | "interaction.level" | "interaction.xp" |
"wallet" | "wallet.coins" | 
"requests" | "requests.zunder" | 
"stats" | "stats.events" | "stats.msg" | "stats.shares" | "stats.donated" | 
"work" | "work.level" | "work.xp" | "work.dones" | "work.gameID" | "work.profession" | "work.salary" |
"config" | "config.limits" | "config.limits.coins" | "config.profile" | "config.profile.about"