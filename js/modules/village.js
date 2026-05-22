import { db } from '../firebase.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { PlayerState } from './player.js';
import { GAME_CONFIG } from '../data/gameConfig.js';
import { RenderUI } from '../ui/render.js';
import { InventorySystem } from './inventory.js';

export const VillageSystem = {
    async addSubordinate(playerId, enemyConfig) {
        if (!PlayerState.subordinates) PlayerState.subordinates = [];
        PlayerState.subordinates.push({ id: `sub_${Date.now()}`, typeId: enemyConfig.id, name: enemyConfig.name, role: 'village' });
        await setDoc(doc(db, "player_core", playerId), { subordinates: PlayerState.subordinates }, { merge: true });
        RenderUI.log(`Você nomeou um ${enemyConfig.name}. Ele agora serve à Nação Tempest!`, "sage");
    },

    async toggleRole(playerId, subId) {
        const sub = PlayerState.subordinates.find(s => s.id === subId);
        if (!sub) return;
        const maxVanguard = 2 + (PlayerState.upgrades['vanguard_limit'] || 0);
        const activePartyCount = PlayerState.subordinates.filter(s => s.role === 'party').length;
        if (sub.role === 'village') {
            if (activePartyCount >= maxVanguard) return RenderUI.log(`A Vanguarda está cheia (Máx: ${maxVanguard}).`, "damage");
            sub.role = 'party';
        } else {
            sub.role = 'village';
        }
        await setDoc(doc(db, "player_core", playerId), { subordinates: PlayerState.subordinates }, { merge: true });
        RenderUI.renderVillageModal(playerId, 'subs');
    },

    async evolveSubordinate(playerId, subId) {
        const sub = PlayerState.subordinates.find(s => s.id === subId);
        if (!sub) return;
        
        const evoData = GAME_CONFIG.EVOLUTIONS[sub.typeId];
        if (!evoData) return;

        if (PlayerState.wallet < evoData.cost) {
            return RenderUI.log("《 Grande Sábio 》 Fundos insuficientes para instigar a evolução.", "damage");
        }

        PlayerState.wallet -= evoData.cost;
        const oldName = sub.name;
        sub.typeId = evoData.next_id;
        sub.name = evoData.name; 

        await setDoc(doc(db, "player_core", playerId), { 
            subordinates: PlayerState.subordinates, 
            wallet: PlayerState.wallet 
        }, { merge: true });

        RenderUI.log(`《 Grande Sábio 》 Evolução concluída! ${oldName} transcendeu para a raça [${evoData.name}]. O bônus da vanguarda aumentou.`, "sage");
        RenderUI.updateHUD(PlayerState);
        RenderUI.renderVillageModal(playerId, 'subs');
    },

    getPartyBonus() {
        let bonusAtk = 0; let bonusDef = 0;
        if (!PlayerState.subordinates) return { atk: 0, def: 0 };
        const militaryBonus = (PlayerState.upgrades['military_training'] || 0) * 5;
        PlayerState.subordinates.filter(s => s.role === 'party').forEach(sub => {
            const enemyData = Object.values(GAME_CONFIG.ENEMIES).find(e => e.id === sub.typeId);
            if (enemyData) { bonusAtk += enemyData.bonus_atk + militaryBonus; bonusDef += enemyData.bonus_def; }
        });
        return { atk: bonusAtk, def: bonusDef };
    },

    // NOVO: Lógica de Compra no Mercado
    async buyMarketItem(playerId, itemKey, isUpgrade = false) {
        const marketData = isUpgrade ? GAME_CONFIG.MARKET.UPGRADES[itemKey] : GAME_CONFIG.MARKET.SHOP[itemKey];
        
        if (isUpgrade) {
            const currentLevel = PlayerState.upgrades[itemKey] || 0;
            if (currentLevel >= marketData.max_level) return;
            const cost = Math.floor(marketData.base_cost * Math.pow(1.5, currentLevel));
            
            if (PlayerState.wallet < cost) return RenderUI.log("Fundos insuficientes para transação com Dwargon.", "damage");
            PlayerState.wallet -= cost;
            PlayerState.upgrades[itemKey] = currentLevel + 1;
            
            await setDoc(doc(db, "player_core", playerId), { wallet: PlayerState.wallet, upgrades: PlayerState.upgrades }, { merge: true });
            RenderUI.log(`Contrato com Dwargon fechado: [${marketData.name}] Nível ${currentLevel + 1}.`, "sage");
        
        } else {
            if (PlayerState.wallet < marketData.cost) return RenderUI.log("Fundos insuficientes para transação com Sarion.", "damage");
            PlayerState.wallet -= marketData.cost;
            
            await InventorySystem.addItem(playerId, marketData.id, marketData.qty);
            await setDoc(doc(db, "player_core", playerId), { wallet: PlayerState.wallet }, { merge: true });
            RenderUI.log(`Importação de Sarion recebida: +${marketData.qty}x ${marketData.name.replace('[Sarion] ', '')}.`, "sage");
        }

        RenderUI.updateHUD(PlayerState);
        RenderUI.renderVillageModal(playerId, 'market');
    },

    async setExpeditionZone(playerId, zoneId) {
        PlayerState.expedition_zone = zoneId;
        await setDoc(doc(db, "player_core", playerId), { expedition_zone: zoneId }, { merge: true });
        RenderUI.log(`Expedição redirecionada para: ${GAME_CONFIG.ZONES[zoneId].name}.`, "sage");
        RenderUI.renderVillageModal(playerId, 'exped');
    },

    async travelToZone(playerId, zoneId) {
        PlayerState.current_zone = zoneId;
        PlayerState.zone_progress = 0;
        await setDoc(doc(db, "player_core", playerId), { current_zone: zoneId, zone_progress: 0 }, { merge: true });
        RenderUI.log(`《 Grande Sábio 》 Viagem Rápida concluída: ${GAME_CONFIG.ZONES[zoneId].name}`, "sage");
        RenderUI.updateZoneUI(zoneId);
        RenderUI.renderVillageModal(playerId, 'map');
    },

    async toggleAutoAdvance(playerId) {
        PlayerState.auto_advance = !PlayerState.auto_advance;
        await setDoc(doc(db, "player_core", playerId), { auto_advance: PlayerState.auto_advance }, { merge: true });
        RenderUI.renderVillageModal(playerId, 'map');
    },

    async processExpeditionGains(playerId, isOfflineLogin = false) {
        if (!PlayerState.subordinates || !PlayerState.last_village_update) return null;
        const now = Date.now();
        const minutesPassed = Math.floor((now - PlayerState.last_village_update) / 60000);
        if (minutesPassed < 1) return null;

        const villageWorkers = PlayerState.subordinates.filter(s => s.role === 'village').length;
        if (villageWorkers === 0) {
            await setDoc(doc(db, "player_core", playerId), { last_village_update: now }, { merge: true });
            PlayerState.last_village_update = now;
            return null;
        }

        const tradeBonus = (PlayerState.upgrades['trade_route'] || 0) * 0.05;
        const multiplier = 1 + tradeBonus;
        const zone = PlayerState.expedition_zone || 1;

        let exp = 0, coins = 0, potions = 0;
        if (zone === 1) { potions = Math.floor(minutesPassed * villageWorkers * 0.2 * multiplier); exp = Math.floor(minutesPassed * villageWorkers * 2 * multiplier); coins = Math.floor(minutesPassed * villageWorkers * 5 * multiplier); }
        else if (zone === 2) { potions = Math.floor(minutesPassed * villageWorkers * 0.1 * multiplier); exp = Math.floor(minutesPassed * villageWorkers * 5 * multiplier); coins = Math.floor(minutesPassed * villageWorkers * 10 * multiplier); }
        else if (zone === 3) { potions = Math.floor(minutesPassed * villageWorkers * 0.05 * multiplier); exp = Math.floor(minutesPassed * villageWorkers * 12 * multiplier); coins = Math.floor(minutesPassed * villageWorkers * 8 * multiplier); }
        else if (zone >= 4) { potions = Math.floor(minutesPassed * villageWorkers * 0.02 * multiplier); exp = Math.floor(minutesPassed * villageWorkers * 8 * multiplier); coins = Math.floor(minutesPassed * villageWorkers * 25 * multiplier); }

        PlayerState.wallet += coins;
        if (potions > 0) await InventorySystem.addItem(playerId, 'magicule_potion', potions);

        PlayerState.last_village_update = now;
        await setDoc(doc(db, "player_core", playerId), { last_village_update: now, wallet: PlayerState.wallet }, { merge: true });

        const report = { minutes: minutesPassed, exp, coins, potions, zoneName: GAME_CONFIG.ZONES[zone].name };
        if (isOfflineLogin) return report;
        else {
            import('./player.js').then(m => { if(exp > 0) m.addExperience(playerId, exp); });
            RenderUI.log(`[Expedição: ${GAME_CONFIG.ZONES[zone].name}] Equipe retornou com +${coins} Cobres e recursos!`, "system");
            RenderUI.updateHUD(PlayerState);
            return null;
        }
    }
};