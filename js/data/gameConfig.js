export const GAME_CONFIG = {
    STARTING_STATS: { HP: 50, MP: 20 },
    LEVEL_CURVE: { base_exp: 50, multiplier: 1.5 },
    
    // As imagens ficam armazenadas na propriedade "img"
    RANKS: {
        0: { name: "Slime Base", stat_mult: 1, req_lvl: 0, img: "https://s10.aconvert.com/convert/p3r68-cdx67/apana-80p5f.png" },
        1: { name: "Demon Slime", stat_mult: 2, req_lvl: 50, color: "#d2a8ff", img: "https://s10.aconvert.com/convert/p3r68-cdx67/a7y7u-9zi95.png" },
        2: { name: "Demon Lord", stat_mult: 5, req_lvl: 100, color: "#ffd700", img: "https://s10.aconvert.com/convert/p3r68-cdx67/ajysw-x87td.png" }
    },

    ZONES: {
        1: { name: "Caverna de Veldora", class: "zone-1", enemies: ['GOBLIN'], kills_to_boss: 4, boss: 'GOBLIN' }, 
        2: { name: "Floresta de Jura", class: "zone-2", enemies: ['GOBLIN', 'DIREWOLF'], kills_to_boss: 6, boss: 'DIREWOLF' }, 
        3: { name: "Pântano Negro", class: "zone-3", enemies: ['DIREWOLF', 'LIZARDMAN'], kills_to_boss: 8, boss: 'LIZARDMAN' }, 
        4: { name: "Domínio Orc", class: "zone-4", enemies: ['LIZARDMAN', 'ORC'], kills_to_boss: 10, boss: 'ORC' }, 
        5: { name: "Labirinto de Ramiris", class: "zone-3", enemies: ['GOBLIN', 'DIREWOLF', 'LIZARDMAN', 'ORC'], kills_to_boss: 15, boss: 'ORC', scaling: true }
    },

    EVOLUTIONS: {
        'mob_001': { next_id: 'mob_001_evo', name: 'Hobgoblin', cost: 5000 },
        'mob_002': { next_id: 'mob_002_evo', name: 'Tempest Star Wolf', cost: 15000 },
        'mob_003': { next_id: 'mob_003_evo', name: 'Dragonewt', cost: 30000 },
        'mob_004': { next_id: 'mob_004_evo', name: 'High Orc', cost: 50000 }
    },

    ENEMIES: {
        GOBLIN: { id: 'mob_001', name: 'Goblin', hp_max: 30, base_damage: 3, exp_reward: 15, naming_cost: 5, bonus_atk: 2, bonus_def: 0, drop_coins: 20, img: "https://s10.aconvert.com/convert/p3r68-cdx67/a2juc-sy34b.png" },
        DIREWOLF: { id: 'mob_002', name: 'Direwolf', hp_max: 60, base_damage: 8, exp_reward: 35, naming_cost: 15, bonus_atk: 5, bonus_def: 0, drop_coins: 55, img: "https://s10.aconvert.com/convert/p3r68-cdx67/ac8i2-8thiu.png" },
        LIZARDMAN: { id: 'mob_003', name: 'Lizardman', hp_max: 90, base_damage: 12, exp_reward: 60, naming_cost: 25, bonus_atk: 3, bonus_def: 3, drop_coins: 120, img: "https://s10.aconvert.com/convert/p3r68-cdx67/ajhfv-sxi76.png" },
        ORC: { id: 'mob_004', name: 'Orc', hp_max: 150, base_damage: 18, exp_reward: 100, naming_cost: 40, bonus_atk: 8, bonus_def: 1, drop_coins: 350, img: "https://s10.aconvert.com/convert/p3r68-cdx67/ahgft-nf7rc.png" },
        HOBGOBLIN: { id: 'mob_001_evo', name: 'Hobgoblin', bonus_atk: 8, bonus_def: 2, img: "https://s10.aconvert.com/convert/p3r68-cdx67/am7kk-pr3q7.png" },
        STARWOLF: { id: 'mob_002_evo', name: 'Tempest Star Wolf', bonus_atk: 15, bonus_def: 4, img: "https://s10.aconvert.com/convert/p3r68-cdx67/at50p-5b8es.png" },
        DRAGONEWT: { id: 'mob_003_evo', name: 'Dragonewt', bonus_atk: 12, bonus_def: 10, img: "https://s10.aconvert.com/convert/p3r68-cdx67/aa6kv-k0lji.png" },
        HIGH_ORC: { id: 'mob_004_evo', name: 'High Orc', bonus_atk: 25, bonus_def: 8, img: "https://s10.aconvert.com/convert/p3r68-cdx67/apcsu-dcs64.png" }
    },

    EVENTS: [
        {
            id: 'evt_mercador',
            npc: 'Mercador Errante',
            img: 'https://placehold.co/40x40/e69138/ffffff?text=ME', // Substitua pelo link da imagem do Mercador
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
            img: 'https://placehold.co/40x40/3fb950/ffffff?text=EF', // Substitua pelo link da imagem do Espírito
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

    TUTORIAL_EVENT: {
        id: 'evt_tutorial',
        npc: 'Voz Misteriosa',
        img: 'https://placehold.co/40x40/d2a8ff/ffffff?text=VM', // Substitua pelo link da imagem da Voz/Raphael
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

    MARKET: {
        UPGRADES: {
            'vanguard_limit': { id: 'vanguard_limit', name: '[Dwargon] Alojamentos', desc: '+1 Espaço na Vanguarda', max_level: 1, base_cost: 50000 },
            'military_training': { id: 'military_training', name: '[Dwargon] Treino Militar', desc: '+5 Ataque da Party', max_level: 10, base_cost: 20000 },
            'trade_route': { id: 'trade_route', name: '[Dwargon] Rotas Comerciais', desc: 'Aumenta lucro da Expedição', max_level: 5, base_cost: 80000 }
        },
        SHOP: {
            'buy_potion_1': { id: 'magicule_potion', name: '[Sarion] Poção de Magicule x1', desc: 'Restaura HP/MP', qty: 1, cost: 500 },
            'buy_potion_10': { id: 'magicule_potion', name: '[Sarion] Pacote de Poções x10', desc: 'Restaura HP/MP (Lote)', qty: 10, cost: 4500 }
        }
    }
};