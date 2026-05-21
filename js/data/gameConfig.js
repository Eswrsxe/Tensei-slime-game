export const GAME_CONFIG = {
    STARTING_STATS: { HP: 50, MP: 20 },
    LEVEL_CURVE: { base_exp: 50, multiplier: 1.5 },
    
    ZONES: {
        1: { name: "Caverna de Veldora", class: "zone-1", enemies: ['GOBLIN'], kills_to_boss: 4, boss: 'DIREWOLF' },
        2: { name: "Floresta de Jura", class: "zone-2", enemies: ['GOBLIN', 'DIREWOLF'], kills_to_boss: 6, boss: 'LIZARDMAN' },
        3: { name: "Pântano Negro", class: "zone-3", enemies: ['DIREWOLF', 'LIZARDMAN'], kills_to_boss: 8, boss: 'ORC' },
        4: { name: "Domínio Orc", class: "zone-4", enemies: ['LIZARDMAN', 'ORC'], kills_to_boss: 10, boss: 'ORC' }
    },

    ENEMIES: {
        GOBLIN: { id: 'mob_001', name: 'Goblin', hp_max: 30, base_damage: 3, exp_reward: 15, naming_cost: 5, bonus_atk: 2, bonus_def: 0, drop_coins: 20 },
        DIREWOLF: { id: 'mob_002', name: 'Direwolf', hp_max: 60, base_damage: 8, exp_reward: 35, naming_cost: 15, bonus_atk: 5, bonus_def: 0, drop_coins: 55 },
        LIZARDMAN: { id: 'mob_003', name: 'Lizardman', hp_max: 90, base_damage: 12, exp_reward: 60, naming_cost: 25, bonus_atk: 3, bonus_def: 3, drop_coins: 120 },
        ORC: { id: 'mob_004', name: 'Orc', hp_max: 150, base_damage: 18, exp_reward: 100, naming_cost: 40, bonus_atk: 8, bonus_def: 1, drop_coins: 350 }
    },

    // NOVO: Habilidades Ativas
    ACTIVE_SKILLS: {
        'slime': { name: 'Lâmina de Água', cost: 5, type: 'attack', mult: 1.5 },
        'goblin': { name: 'Golpe Brutal', cost: 8, type: 'attack', mult: 2.0 },
        'direwolf': { name: 'Relâmpago Negro', cost: 15, type: 'attack', mult: 3.0 },
        'lizardman': { name: 'Escudo de Água', cost: 10, type: 'buff', effect: 0.2, duration: 3 }, // Reduz dano para 20%
        'orc': { name: 'Esmagar', cost: 12, type: 'attack_heal', mult: 2.5, heal: 0.1 } // Dano + Cura 10%
    },

    UPGRADES: {
        'vanguard_limit': { id: 'vanguard_limit', name: 'Alojamentos Expansivos', desc: '+1 Espaço na Vanguarda (Max: 3)', max_level: 1, base_cost: 500 },
        'military_training': { id: 'military_training', name: 'Treino Militar', desc: '+5 Ataque Base da Party', max_level: 10, base_cost: 200 },
        'trade_route': { id: 'trade_route', name: 'Rotas Comerciais', desc: 'Vila produz recursos 20% mais rápido', max_level: 5, base_cost: 800 }
    }
};