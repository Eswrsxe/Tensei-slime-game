import { db } from '../firebase.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { PlayerState } from './player.js';
import { RenderUI } from '../ui/render.js';

export const InventorySystem = {
    ITEMS: {
        'magicule_potion': { id: 'magicule_potion', name: 'Poção de Magicule', type: 'consumable', heal: 15, mp_heal: 10, desc: 'Restaura 15 HP/10 MP.' },
        'lamina_desespero': { id: 'lamina_desespero', name: 'Lâmina do Desespero', type: 'weapon', atk_bonus: 50, lifesteal: 0.05, desc: '+50 ATK. Absorve 5% do dano.' },
        'escama_dragao': { id: 'escama_dragao', name: 'Escama Soberana', type: 'armor', def_mult: 0.8, desc: 'Reduz dano recebido em 20%.' },
        'anel_sabio': { id: 'anel_sabio', name: 'Anel do Sábio', type: 'accessory', mp_regen: 5, desc: 'Regenera 5 MP por turno.' },
        'colar_conquistador': { id: 'colar_conquistador', name: 'Colar do Conquistador', type: 'accessory', exp_mult: 1.5, desc: 'Aumenta EXP em batalha em +50%.' }
    },

    async addItem(playerId, itemId, quantity = 1) {
        if (!PlayerState.inventory) PlayerState.inventory = {};
        PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + quantity;
        await setDoc(doc(db, "player_core", playerId), { inventory: PlayerState.inventory }, { merge: true });
    },

    async toggleEquip(playerId, itemId) {
        const item = this.ITEMS[itemId];
        if (!item || item.type === 'consumable') return;

        if (PlayerState.equipment[item.type] === itemId) {
            PlayerState.equipment[item.type] = null; 
            RenderUI.log(`Você desequipou [${item.name}].`, "system");
        } else {
            PlayerState.equipment[item.type] = itemId; 
            RenderUI.log(`Você equipou [${item.name}].`, "sage");
        }

        await setDoc(doc(db, "player_core", playerId), { equipment: PlayerState.equipment }, { merge: true });
        
        // Dispara uma atualização total do modal para refletir os 3 slots
        RenderUI.renderInventoryModal(playerId);
        
        // Atualiza a tela de combate para caso existam alterações visuais
        import('../ui/render.js').then(r => r.RenderUI.updateHUD(PlayerState));
    },

    async useItem(playerId, itemId, combatEngineInstance) {
        const item = this.ITEMS[itemId];
        if (!item || item.type !== 'consumable') return;
        if (!PlayerState.inventory[itemId] || PlayerState.inventory[itemId] <= 0) return;

        PlayerState.hp_current = Math.min(PlayerState.hp_current + item.heal, PlayerState.hp_max);
        PlayerState.mp_current = Math.min(PlayerState.mp_current + (item.mp_heal || 0), PlayerState.mp_max);
        RenderUI.log(`Você consumiu [${item.name}]. Recuperou Vida e Magia.`, "heal");

        PlayerState.inventory[itemId] -= 1;
        if (PlayerState.inventory[itemId] === 0) delete PlayerState.inventory[itemId];

        await setDoc(doc(db, "player_core", playerId), { inventory: PlayerState.inventory }, { merge: true });
        RenderUI.updateHUD(PlayerState);
        RenderUI.renderInventoryModal(playerId, combatEngineInstance);
        
        if (combatEngineInstance && combatEngineInstance.isActive) {
            document.getElementById('inventory-modal').classList.add('hidden');
            combatEngineInstance.executeEnemyTurn(await import('./village.js').then(m => m.VillageSystem.getPartyBonus()));
        }
    }
};