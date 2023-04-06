export interface DocPlayerCooldowns {
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

export interface DocPlayerInteraction {
    /** Nível atual do jogador */
    level?: number;
    /** Experiência atual do jogador */
    xp?: number;
}
export interface DocPlayerInventory {
    /**
     * Total de moedas do jogador
     */
    coins: number;
    /** Nível do amplificador de moedas do jogador*/
    amplifier: number;
}

export interface DocPlayerWallet {
    /** Total de moedas do jogador*/
    coins: number;
}

export interface DocPlayerRegistry {
    level: number;
    nick: string;
    type: "zunder" | "discord";
    device: string;
}
export interface DocPlayerRequests {
    zunder?: {
        /**
         * Nick utilizado para se registrar como membro Zunder
         */
        nick: string,
        //auto: boolean, // Depreciar
        /**
         * Dispositivos habilitados para registro Zunder
         * - minecraft
         * - steam
         * - epicgames
         */
        device: string
    }
}
export interface DocPlayerStaff {
    daily: {
        check: boolean;
        messages: number;
        call: number;
    }
    decrease: number;
    manages: number;
    score: number;
}
export interface DocPlayerStats {
    /** Total de eventos participados */
    events?: number;
    /** Total de mensagens enviadas */
    msg?: number;
    /** Total de compartilhamentos postados */
    shares?: number;
    /** Total de dinheiro doado para o grupo */
    donated?: number;
}
export interface DocPlayerWorkDone {
    xpEarned: number;
    amount: number;
    gameID: string;
    professionID: string;
}
export interface DocPlayerWork {
    level: number;
    xp: number;
    dones?: Array<DocPlayerWorkDone>
    gameID: string;
    profession: string;
    salary: number
}

export interface DocPlayerConfig {
    limits?: {
        coins?: number
    }
}

export interface DocPlayer {
    /** Cooldowns para utilizar comandos e funções */
    cooldowns?: DocPlayerCooldowns;
    /** Interação */
    interaction?: DocPlayerInteraction;
    /** Inventário de itens*/
    inventory?: DocPlayerInventory;
    /** Carteira do membro */
    wallet?: DocPlayerWallet;
    /** Informações de registro */
    registry?: DocPlayerRegistry;
    /** Pedidos */
    requests?: DocPlayerRequests;
    /** Lista de ids de recursos enviados */
    resources?: Array<{id: string}>;
    staff?: DocPlayerStaff;
    /** Estatisticas do membro */
    stats?: DocPlayerStats;
    work?: DocPlayerWork;
    config?: DocPlayerConfig;
}

export interface DocGuild {
    bank: {
        total: number;
    }
    systems: {
        interaction: boolean;
        economy: boolean;
        stats: boolean;
        work: boolean
    }
}
export interface DocResource {
    title: string;
    description: string;
    acessURL: string;
    thumbURL?: string;
    bannerURL?: string;
    messageURL: string;
    guildID: string;
    reports: Array<{
        id: string,
        reason: string;
    }>;
    category: {
        name: string;
        subCategory: string; 
    };
    messageID: string;
    authorID: string;
}