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
    /** Current player level */
    level?: number;
    /** Current player exp */
    xp: number;
}
interface DocumentPlayerInventory {
    /**
     * Player's total coins
     */
    coins: number;
    /** Player's amplifier level */
    amplifier: number;
}

interface DocumentPlayerWallet {
    /** Player's total coins */
    coins: number;
}

export interface DocumentPlayerRegistry {
    /** Player's registry level */
    level: 1 | 2 | 3 | 4 | 5;
    /** Player's nick */
    nick: string;
    /** Player's registry type */
    type: "zunder" | "discord";
    /** Player's registry decive */
    device: string;
}
interface DocumentPlayerRequests {
    zunder?: {
        /**
         * Nick utilizado para se registrar como membro Zunder
         */
        nick: string,
        /**
         * Dispositivos habilitados para registro Zunder
         * - minecraft
         * - steam
         * - epicgames
         */
        device: string
    }
}
interface DocumentPlayerStaff {
    daily: {
        check: boolean;
        messages: number;
        call: number;
    }
    decrease: number;
    manages: number;
    score: number;
}
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
    /** Limits configuration */
    limits?: {
        coins?: number
    }
    /** Profile configuration */
    profile?: {
        about?: string
    }
}

export interface DocumentPlayer {
    /** Informações de registro */
    registry: DocumentPlayerRegistry;
    /** Cooldowns para utilizar comandos e funções */
    cooldowns?: DocumentPlayerCooldowns;
    /** Interação */
    interaction?: DocumentPlayerInteraction;
    /** Inventário de itens*/
    inventory?: DocumentPlayerInventory;
    /** Carteira do membro */
    wallet?: DocumentPlayerWallet;
    /** Pedidos */
    requests?: DocumentPlayerRequests;
    /** Lista de ids de recursos enviados */
    resources?: Array<{id: string}>;
    staff?: DocumentPlayerStaff;
    /** Estatisticas do membro */
    stats?: DocumentPlayerStats;
    work?: DocumentPlayerWork;
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