import { db } from '../firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { PlayerState } from './player.js';
import { RenderUI } from '../ui/render.js';
import { GreatSage } from './greatsage.js';

export const SkillTree = {
    FORMS: {
        'slime': { name: 'Slime', bonus_hp: 0, bonus_dmg: 0 },
        'goblin': { name: 'Goblin', bonus_hp: 20, bonus_dmg: 4 },
        'direwolf': { name: 'Direwolf', bonus_hp: 50, bonus_dmg: 15 },
        // HOTFIX: Adicionando as novas formas
        'lizardman': { name: 'Lizardman', bonus_hp: 80, bonus_dmg: 25 },
        'orc': { name: 'Orc', bonus_hp: 120, bonus_dmg: 35 }
    },

    async unlockForm(playerId, formId) {
        if (!PlayerState.unlocked_forms.includes(formId)) {
            PlayerState.unlocked_forms.push(formId);
            const playerRef = doc(db, "player_core", playerId);
            await updateDoc(playerRef, { unlocked_forms: PlayerState.unlocked_forms });
            GreatSage.pushHint(`Análise concluída. Mimetismo destravado: [${this.FORMS[formId].name}].`, 1, `unlock_${formId}`);
        }
    },

    async changeForm(playerId, newFormId) {
        if (PlayerState.current_form === newFormId) return;
        
        PlayerState.current_form = newFormId;
        const playerRef = doc(db, "player_core", playerId);
        await updateDoc(playerRef, { current_form: newFormId });

        RenderUI.log(`Você mimetizou a forma: ${this.FORMS[newFormId].name}.`, "system");
        RenderUI.updateHUD(PlayerState);
        RenderUI.renderFormsModal(playerId);
    },

    calculateDamage() {
        const baseDmg = Math.floor(Math.random() * 5) + 5;
        const formBonus = this.FORMS[PlayerState.current_form]?.bonus_dmg || 0;
        return baseDmg + formBonus;
    }
};