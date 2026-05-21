export const GAME_CONFIG = {
    STARTING_STATS: { HP: 50, MP: 20 },
    LEVEL_CURVE: { base_exp: 50, multiplier: 1.5 },
    
    RANKS: {
        0: { name: "Slime Base", stat_mult: 1, req_lvl: 0 },
        1: { name: "Demon Slime", stat_mult: 2, req_lvl: 50, color: "#d2a8ff" },
        2: { name: "True Demon Lord", stat_mult: 5, req_lvl: 100, color: "#ffd700" }
    },

    ZONES: {
        1: { name: "Caverna de Veldora", class: "zone-1", enemies: ['GOBLIN'], kills_to_boss: 4, boss: 'GOBLIN' }, 
        2: { name: "Floresta de Jura", class: "zone-2", enemies: ['GOBLIN', 'DIREWOLF'], kills_to_boss: 6, boss: 'DIREWOLF' }, 
        3: { name: "Pântano Negro", class: "zone-3", enemies: ['DIREWOLF', 'LIZARDMAN'], kills_to_boss: 8, boss: 'LIZARDMAN' }, 
        4: { name: "Domínio Orc", class: "zone-4", enemies: ['LIZARDMAN', 'ORC'], kills_to_boss: 10, boss: 'ORC' }, 
        5: { name: "Labirinto de Ramiris", class: "zone-3", enemies: ['GOBLIN', 'DIREWOLF', 'LIZARDMAN', 'ORC'], kills_to_boss: 15, boss: 'ORC', scaling: true }
    },

    ENEMIES: {
        GOBLIN: { id: 'mob_001', name: 'Goblin', hp_max: 30, base_damage: 3, exp_reward: 15, naming_cost: 5, bonus_atk: 2, bonus_def: 0, drop_coins: 20 },
        DIREWOLF: { id: 'mob_002', name: 'Direwolf', hp_max: 60, base_damage: 8, exp_reward: 35, naming_cost: 15, bonus_atk: 5, bonus_def: 0, drop_coins: 55 },
        LIZARDMAN: { id: 'mob_003', name: 'Lizardman', hp_max: 90, base_damage: 12, exp_reward: 60, naming_cost: 25, bonus_atk: 3, bonus_def: 3, drop_coins: 120 },
        ORC: { id: 'mob_004', name: 'Orc', hp_max: 150, base_damage: 18, exp_reward: 100, naming_cost: 40, bonus_atk: 8, bonus_def: 1, drop_coins: 350 }
    },

    EVENTS: [
        {
            id: 'evt_mercador',
            npc: 'Mercador Errante',
            text: '"Saudações, ser poderoso! Os Goblins estão roubando minha carga na Caverna. Pode me ajudar a derrotar 10 deles?"',
            options: {
                'A': { text: '"Sim, eu resolvo isso."', response: '"Maravilhoso! Lhe pagarei bem."', quest: 'q_goblins' },
                'B': { text: '"Qual a recompensa?"', response: '"Te dou 2.000 Cobres e 5 Poções. Fechado?"', quest: 'q_goblins' },
                'C': { text: '"Tenho mais o que fazer. Adeus."', response: '"Que pena... terei que contratar outro."', quest: null }
            }
        },
        {
            id: 'evt_espirito',
            npc: 'Espírito da Floresta',
            text: '"A Floresta de Jura chora... Os Direwolves estão fora de controle. Purifique 5 deles para mim?"',
            options: {
                'A': { text: '"Deixe comigo."', response: '"A floresta agradece."', quest: 'q_lobos' },
                'B': { text: '"Isso é problema seu."', response: '"Como é cruel..."', quest: null },
                'C': { text: '"Eu cuido deles, mas quero EXP."', response: '"Lhe concederei as bênçãos da floresta."', quest: 'q_lobos' }
            }
        }
    ],

    QUESTS: {
        'q_goblins': { id: 'q_goblins', name: 'Ajudar o Mercador', desc: 'Derrote 10 Goblins.', target: 'mob_001', required: 10, reward_coins: 2000, reward_pots: 5, reward_exp: 500 },
        'q_lobos': { id: 'q_lobos', name: 'Fúria da Floresta', desc: 'Derrote 5 Direwolves.', target: 'mob_002', required: 5, reward_coins: 0, reward_pots: 2, reward_exp: 1500 }
    },

    // NOVO: Evento Fixo de Tutorial
    TUTORIAL_EVENT: {
        id: 'evt_tutorial',
        npc: 'Voz Misteriosa',
        text: '"Você reencarnou neste mundo. Sua jornada para construir uma nação de monstros começa agora. Deseja ouvir as instruções básicas?"',
        options: {
            'A': { text: '"Sim, como eu sobrevivo?"', response: '"Derrote monstros. Use o [Estômago] para equipar armas e [Tempest] para gerenciar sua vila. Pegue este presente."', reward_coins: 1000, reward_pots: 10 },
            'B': { text: '"Já conheço as regras, pule isso."', response: '"Muito bem, anomalia. Aqui está seu suprimento inicial. Boa sorte."', reward_coins: 1000, reward_pots: 10 },
            'C': { text: '"Não quero esmolas. Eu me viro."', response: '"Uma escolha ousada e orgulhosa. Que o mundo tenha piedade de você."' }
        }
    },

    ACTIVE_SKILLS: {
        'slime': { name: 'Lâmina de Água', cost: 5, type: 'attack', mult: 1.5 },
        'goblin': { name: 'Golpe Brutal', cost: 8, type: 'attack', mult: 2.0 },
        'direwolf': { name: 'Relâmpago Negro', cost: 15, type: 'attack', mult: 3.0 },
        'lizardman': { name: 'Escudo de Água', cost: 10, type: 'buff', effect: 0.2, duration: 3 },
        'orc': { name: 'Esmagar', cost: 12, type: 'attack_heal', mult: 2.5, heal: 0.1 }
    },

    UPGRADES: {
        'vanguard_limit': { id: 'vanguard_limit', name: 'Alojamentos', desc: '+1 Espaço na Vanguarda', max_level: 1, base_cost: 500 },
        'military_training': { id: 'military_training', name: 'Treino Militar', desc: '+5 Ataque da Party', max_level: 10, base_cost: 200 },
        'trade_route': { id: 'trade_route', name: 'Rotas Comerciais', desc: 'Vila produz recursos mais rápido', max_level: 5, base_cost: 800 }
    }
};