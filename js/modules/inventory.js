import { db } from '../firebase.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { PlayerState } from './player.js';
import { RenderUI } from '../ui/render.js';

export const InventorySystem = {
    ITEMS: {
        'magicule_potion': { id: 'magicule_potion', name: 'Poção de Magicule Menor', heal: 15, mp_heal: 10, desc: 'Restaura 15 HP e 10 MP.' },
        'goblin_fang': { id: 'goblin_fang', name: 'Presa de Goblin', heal: 0, mp_heal: 0, desc: 'Material.' }
    },

    async addItem(playerId, itemId, quantity = 1) {
        if (!PlayerState.inventory) PlayerState.inventory = {};
        PlayerState.inventory[itemId] = (PlayerState.inventory[itemId] || 0) + quantity;
        await setDoc(doc(db, "player_core", playerId), { inventory: PlayerState.inventory }, { merge: true });
    },

    async useItem(playerId, itemId, combatEngineInstance) {
        if (!PlayerState.inventory || !PlayerState.inventory[itemId] || PlayerState.inventory[itemId] <= 0) return;
        
        const item = this.ITEMS[itemId];
        
        if (item.heal > 0) {
            PlayerState.hp_current = Math.min(PlayerState.hp_current + item.heal, PlayerState.hp_max);
            PlayerState.mp_current = Math.min(PlayerState.mp_current + (item.mp_heal || 0), PlayerState.mp_max);
            RenderUI.log(`Você consumiu [${item.name}]. Recuperou Vida e Magia.`, "heal");
        }

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