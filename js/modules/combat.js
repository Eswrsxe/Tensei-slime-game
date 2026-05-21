import { db } from '../firebase.js';
import { doc, setDoc, runTransaction, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { RenderUI } from '../ui/render.js';
import { PlayerState, addExperience } from './player.js';
import { GreatSage } from './greatsage.js';
import { SkillTree } from './skills.js';
import { InventorySystem } from './inventory.js';
import { VillageSystem } from './village.js';
import { GAME_CONFIG } from '../data/gameConfig.js';

export class CombatEngine {
    constructor(playerId, enemyConfig, isBoss = false) {
        this.playerId = playerId;
        this.enemy = { ...enemyConfig, hp_current: enemyConfig.hp_max };
        this.isBoss = isBoss;
        this.combatId = `comb_${Date.now()}_${Math.floor(Math.random() * 1000)}`; 
        this.isActive = false;
    }

    async start() {
        this.isActive = true;
        RenderUI.log(`Um ${this.enemy.name} selvagem apareceu!`, "system");
        await setDoc(doc(db, "active_combats", this.combatId), { playerId: this.playerId, enemy: this.enemy.name, isLooted: false, timestamp: Date.now() });
    }

    executePlayerTurn(action) {
        if (!this.isActive) return;
        const partyBonus = VillageSystem.getPartyBonus();

        if (action === 'attack') {
            const damage = SkillTree.calculateDamage() + partyBonus.atk;
            this.enemy.hp_current -= damage;
            RenderUI.log(`Sua Vanguarda atacou! Causou ${damage} de dano.`);
        } else if (action === 'defend') {
            PlayerState.defense_modifier = 0.5;
            RenderUI.log(`Você assumiu uma postura defensiva.`);
        } else if (action === 'magic') {
            const currentForm = PlayerState.current_form || 'slime';
            const skill = GAME_CONFIG.ACTIVE_SKILLS[currentForm];

            if (PlayerState.mp_current < skill.cost) {
                RenderUI.log(`MP Insuficiente! Requer ${skill.cost} MP para conjurar.`, "damage");
                return; // Impede que o turno passe se errar a magia
            }

            PlayerState.mp_current -= skill.cost;
            RenderUI.updateHUD(PlayerState);

            if (skill.type === 'attack') {
                const baseDmg = SkillTree.calculateDamage() + partyBonus.atk;
                const damage = Math.floor(baseDmg * skill.mult);
                this.enemy.hp_current -= damage;
                RenderUI.log(`Você conjurou [${skill.name}]! Causou ${damage} de dano massivo.`, "sage");
            } else if (skill.type === 'buff') {
                PlayerState.active_buff = { effect: skill.effect, turns: skill.duration };
                RenderUI.log(`Você conjurou [${skill.name}]! Proteção mágica ativada por ${skill.duration} turnos.`, "sage");
            } else if (skill.type === 'attack_heal') {
                const baseDmg = SkillTree.calculateDamage() + partyBonus.atk;
                const damage = Math.floor(baseDmg * skill.mult);
                this.enemy.hp_current -= damage;
                const heal = Math.floor(PlayerState.hp_max * skill.heal);
                PlayerState.hp_current = Math.min(PlayerState.hp_max, PlayerState.hp_current + heal);
                RenderUI.log(`Você conjurou [${skill.name}]! Causou ${damage} de dano e absorveu ${heal} HP.`, "heal");
                RenderUI.updateHUD(PlayerState);
            }
        }

        if (this.enemy.hp_current <= 0) {
            this.handleEnemyDeath();
        } else {
            this.executeEnemyTurn(partyBonus);
        }
    }

    executeEnemyTurn(partyBonus) {
        let damage = Math.floor((Math.random() * 4) + this.enemy.base_damage - 2);
        damage = Math.max(1, damage - partyBonus.def); 

        let defMod = PlayerState.defense_modifier || 1;
        
        // Verifica se há Buffs de Defesa ativos (Ex: Escudo de Água do Lizardman)
        if (PlayerState.active_buff && PlayerState.active_buff.turns > 0) {
            defMod *= PlayerState.active_buff.effect;
            PlayerState.active_buff.turns -= 1;
            if (PlayerState.active_buff.turns === 0) {
                RenderUI.log(`《 Grande Sábio 》 O efeito mágico de proteção se dissipou.`, "sage");
            }
        }

        damage = Math.floor(damage * defMod);
        PlayerState.hp_current -= damage;
        PlayerState.defense_modifier = 1; 

        RenderUI.log(`O ${this.enemy.name} atacou, causando ${damage} de dano.`, "damage");
        RenderUI.updateHUD(PlayerState);
        
        if (PlayerState.hp_current <= 0) this.handlePlayerDeath();
        else GreatSage.analyzeSituation(PlayerState);
    }

    handlePlayerDeath() {
        this.isActive = false;
        RenderUI.log(`Corpo físico colapsou...`, "damage");
        document.getElementById('btn-attack').disabled = true;
        document.getElementById('btn-defend').disabled = true;
        document.getElementById('btn-magic').disabled = true;
        
        setTimeout(() => {
            PlayerState.hp_current = PlayerState.hp_max;
            PlayerState.mp_current = PlayerState.mp_max;
            PlayerState.active_buff = { turns: 0, effect: 1 }; // Limpa buffs na morte
            RenderUI.updateHUD(PlayerState);
            document.dispatchEvent(new CustomEvent('spawnNextEnemy'));
        }, 3000);
    }

    handleEnemyDeath() {
        this.isActive = false;
        RenderUI.log(`O ${this.enemy.name} foi subjugado!`, "system");
        
        const regen = Math.floor(PlayerState.hp_max * 0.2);
        PlayerState.hp_current = Math.min(PlayerState.hp_max, PlayerState.hp_current + regen);
        PlayerState.active_buff = { turns: 0, effect: 1 }; // Limpa buffs após a luta
        RenderUI.updateHUD(PlayerState);

        document.getElementById('btn-attack').disabled = true;
        document.getElementById('btn-defend').disabled = true;
        document.getElementById('btn-magic').disabled = true;
        document.getElementById('btn-predator').disabled = false;
        document.getElementById('btn-name-monster').disabled = false;
        
        const baseEnemyKey = this.enemy.id.split('_')[1] === '001' ? 'GOBLIN' : 
                             this.enemy.id.split('_')[1] === '002' ? 'DIREWOLF' : 
                             this.enemy.id.split('_')[1] === '003' ? 'LIZARDMAN' : 'ORC';
        const cost = GAME_CONFIG.ENEMIES[baseEnemyKey].naming_cost;
        document.getElementById('btn-name-monster').innerText = `Nomear (${cost} MP)`;
    }

    async finishEncounter() {
        document.getElementById('btn-predator').disabled = true;
        document.getElementById('btn-name-monster').disabled = true;
        await addExperience(this.playerId, this.enemy.exp_reward);
        
        if (this.isBoss && PlayerState.current_zone < 4) {
            PlayerState.current_zone += 1;
            PlayerState.zone_progress = 0;
            const nextZone = GAME_CONFIG.ZONES[PlayerState.current_zone];
            RenderUI.log(`《 Grande Sábio 》 Área subjugada. Desbravando nova região: [${nextZone.name}].`, "sage");
            RenderUI.updateZoneUI(PlayerState.current_zone);
        } else if (!this.isBoss) {
            PlayerState.zone_progress += 1;
        }

        await updateDoc(doc(db, "player_core", this.playerId), { 
            current_zone: PlayerState.current_zone,
            zone_progress: PlayerState.zone_progress
        });

        RenderUI.log("Procurando nova assinatura mágica (3s)...", "system");
        setTimeout(() => document.dispatchEvent(new CustomEvent('spawnNextEnemy')), 3000);
    }

    async executePredator() {
        RenderUI.log("Ativando [Predador]...", "system");
        try {
            await runTransaction(db, async (t) => {
                const docRef = await t.get(doc(db, "active_combats", this.combatId));
                if (docRef.data().isLooted) throw new Error("ALREADY_LOOTED");
                t.update(doc(db, "active_combats", this.combatId), { isLooted: true });
            });
            RenderUI.log(`[Predador] Concluído.`, "sage");
            
            const formKey = this.enemy.id.split('_')[1] === '001' ? 'goblin' : 
                            this.enemy.id.split('_')[1] === '002' ? 'direwolf' : 
                            this.enemy.id.split('_')[1] === '003' ? 'lizardman' : 'orc';
                            
            SkillTree.unlockForm(this.playerId, formKey);
            
            const baseEnemyKey = formKey.toUpperCase();
            const coinReward = GAME_CONFIG.ENEMIES[baseEnemyKey].drop_coins * (this.isBoss ? 3 : 1);
            PlayerState.wallet += coinReward;
            await updateDoc(doc(db, "player_core", this.playerId), { wallet: PlayerState.wallet });
            
            RenderUI.log(`Obteve recompensa: ${RenderUI.formatCurrency(coinReward)}`);

            if (formKey === 'goblin') await InventorySystem.addItem(this.playerId, 'magicule_potion', 1);
            else if (formKey === 'direwolf') await InventorySystem.addItem(this.playerId, 'magicule_potion', 2);
            else if (formKey === 'lizardman') await InventorySystem.addItem(this.playerId, 'magicule_potion', 3);
            else if (formKey === 'orc') await InventorySystem.addItem(this.playerId, 'magicule_potion', 5);

            await this.finishEncounter();
        } catch (e) { console.error(e); }
    }

    async executeName() {
        const baseEnemyKey = this.enemy.id.split('_')[1] === '001' ? 'GOBLIN' : 
                             this.enemy.id.split('_')[1] === '002' ? 'DIREWOLF' : 
                             this.enemy.id.split('_')[1] === '003' ? 'LIZARDMAN' : 'ORC';
        const cost = GAME_CONFIG.ENEMIES[baseEnemyKey].naming_cost;

        if (PlayerState.mp_current < cost) {
            RenderUI.log("Magicules insuficientes para conceder um nome!", "damage");
            return;
        }

        RenderUI.log("Canalizando Magicules...", "system");
        try {
            await runTransaction(db, async (t) => {
                const docRef = await t.get(doc(db, "active_combats", this.combatId));
                if (docRef.data().isLooted) throw new Error("ALREADY_LOOTED");
                t.update(doc(db, "active_combats", this.combatId), { isLooted: true });
            });
            
            PlayerState.mp_current -= cost;
            await updateDoc(doc(db, "player_core", this.playerId), { mp_current: PlayerState.mp_current });
            RenderUI.updateHUD(PlayerState);

            await VillageSystem.addSubordinate(this.playerId, GAME_CONFIG.ENEMIES[baseEnemyKey]); 
            await this.finishEncounter();
        } catch (e) { console.error(e); }
    }
}