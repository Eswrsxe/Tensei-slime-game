import { auth, signInAnonymously, GoogleAuthProvider, linkWithPopup, signInWithPopup } from './firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initPlayer, PlayerState, executeRankUp } from './modules/player.js';
import { CombatEngine } from './modules/combat.js';
import { RenderUI } from './ui/render.js';
import { GAME_CONFIG } from './data/gameConfig.js';
import { VillageSystem } from './modules/village.js';

let currentCombat = null;
let isAutoMode = false;
let autoTimer = null;
let activeEvent = null; // Controla se estamos num evento de texto

document.addEventListener('DOMContentLoaded', () => {
    RenderUI.log("Sistema Inicializando...", "system");
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await initPlayer(user.uid);
            
            if (user.providerData.some(p => p.providerId === 'google.com')) {
                const btnGoogle = document.getElementById('btn-google');
                if (btnGoogle) btnGoogle.style.display = 'none';
            }

            const report = await VillageSystem.processExpeditionGains(user.uid, true);
            if (report && (report.exp > 0 || report.coins > 0 || report.potions > 0)) {
                RenderUI.showOfflineReport(report);
                document.getElementById('btn-collect-offline').onclick = () => {
                    import('./modules/player.js').then(m => m.addExperience(user.uid, report.exp));
                    document.getElementById('offline-modal').classList.add('hidden');
                    startNewEncounter();
                };
            } else {
                startNewEncounter();
            }
            setupControls();
            setInterval(() => {
                if (currentCombat && currentCombat.isActive) VillageSystem.processExpeditionGains(user.uid, false);
            }, 60000);
        } else {
            signInAnonymously(auth);
        }
    });
});

document.addEventListener('spawnNextEnemy', () => startNewEncounter());

function startNewEncounter() {
    // NOVO MOTOR RNG (15% de chance de Evento Textual se não for a luta do Chefe)
    const zoneLevel = PlayerState.current_zone > 5 ? 5 : PlayerState.current_zone;
    const currentZone = GAME_CONFIG.ZONES[zoneLevel];
    const isBossFight = PlayerState.zone_progress >= currentZone.kills_to_boss;

    if (!isBossFight && Math.random() <= 0.15 && !isAutoMode) {
        triggerRandomEvent();
        return;
    }

    let enemyKey = '';
    let isBoss = false;

    if (isBossFight) {
        enemyKey = currentZone.boss;
        isBoss = true;
        RenderUI.log(`《 Grande Sábio 》 Alerta: Assinatura mágica massiva detectada. O Chefe da Área se aproxima!`, "sage");
    } else {
        enemyKey = currentZone.enemies[Math.floor(Math.random() * currentZone.enemies.length)];
    }
    
    const baseEnemy = GAME_CONFIG.ENEMIES[enemyKey];
    let enemyData = { ...baseEnemy };
    
    if (currentZone.scaling) {
        const scaleMult = PlayerState.level + 2;
        enemyData.hp_max = Math.floor(enemyData.hp_max * (scaleMult * 0.1));
        enemyData.base_damage = Math.floor(enemyData.base_damage * (scaleMult * 0.1));
        enemyData.exp_reward = Math.floor(enemyData.exp_reward * (scaleMult * 0.2));
    }
    
    if (isBoss) {
        enemyData.name = `[CHEFE] ${baseEnemy.name}`;
        enemyData.hp_max = Math.floor(enemyData.hp_max * 1.5);
        enemyData.base_damage = Math.floor(enemyData.base_damage * 1.3);
        enemyData.exp_reward = enemyData.exp_reward * 3;
    }
    
    currentCombat = new CombatEngine(auth.currentUser.uid, enemyData, isBoss);
    currentCombat.start();
    
    document.getElementById('btn-attack').disabled = false;
    document.getElementById('btn-defend').disabled = false;
    document.getElementById('btn-magic').disabled = false;
    document.getElementById('btn-predator').disabled = true;
    document.getElementById('btn-name-monster').disabled = true;
    document.getElementById('btn-name-monster').innerText = 'Nomear (MP)';
}

// MOTOR DE EVENTOS DE TEXTO
function triggerRandomEvent() {
    activeEvent = GAME_CONFIG.EVENTS[Math.floor(Math.random() * GAME_CONFIG.EVENTS.length)];
    
    // Esconde os botões de luta, mostra o painel de chat
    document.getElementById('btn-attack').disabled = true;
    document.getElementById('btn-defend').disabled = true;
    document.getElementById('btn-magic').disabled = true;
    document.getElementById('chat-panel').classList.remove('hidden');

    RenderUI.log(`《 Grande Sábio 》 Uma presença se aproxima pacificamente...`, "sage");
    RenderUI.log(`[NPC] ${activeEvent.npc}: ${activeEvent.text}`, "info");
    RenderUI.log(`[A] ${activeEvent.options['A'].text}`, "system");
    RenderUI.log(`[B] ${activeEvent.options['B'].text}`, "system");
    RenderUI.log(`[C] ${activeEvent.options['C'].text}`, "system");
}

function processChatInput() {
    if (!activeEvent) return;
    const inputField = document.getElementById('chat-input');
    const answer = inputField.value.trim().toUpperCase();
    inputField.value = '';

    if (!['A', 'B', 'C'].includes(answer)) {
        return RenderUI.log(`《 Grande Sábio 》 Comando inválido. Use A, B ou C.`, "damage");
    }

    const choice = activeEvent.options[answer];
    RenderUI.log(`[Você]: ${choice.text}`, "heal");
    
    setTimeout(async () => {
        RenderUI.log(`[NPC] ${activeEvent.npc}: ${choice.response}`, "info");
        
        if (choice.quest) {
            // Verifica se já não tem a quest
            if (!PlayerState.quests.find(q => q.id === choice.quest)) {
                PlayerState.quests.push({ id: choice.quest, progress: 0 });
                await updateDoc(doc(db, "player_core", auth.currentUser.uid), { quests: PlayerState.quests });
                RenderUI.log(`《 Grande Sábio 》 Missão Aceita: [${GAME_CONFIG.QUESTS[choice.quest].name}]. Verifique a Guilda.`, "sage");
            } else {
                RenderUI.log(`《 Grande Sábio 》 Você já está executando esta missão.`, "sage");
            }
        }
        
        activeEvent = null;
        document.getElementById('chat-panel').classList.add('hidden');
        RenderUI.log("Procurando nova assinatura mágica (3s)...", "system");
        setTimeout(() => startNewEncounter(), 3000);

    }, 1500);
}


function closeAllModals() { document.querySelectorAll('.modal').forEach(modal => { modal.classList.add('hidden'); }); }

function toggleAuto() {
    isAutoMode = !isAutoMode;
    const btn = document.getElementById('btn-auto');
    const isRaphael = PlayerState.rank >= 2;
    const aiName = isRaphael ? 'RAPHAEL' : 'AUTO';
    
    btn.innerText = isAutoMode ? `${aiName}: ON` : `${aiName}: OFF`;
    btn.style.background = isAutoMode ? (isRaphael ? '#ffd700' : 'var(--sage-color)') : 'transparent';
    btn.style.color = isAutoMode ? '#000' : (isRaphael ? '#ffd700' : 'var(--sage-color)');
    
    if (isAutoMode) {
        RenderUI.log("《 Grande Sábio 》 Controle autônomo de combate ativado.", "sage");
        autoBattleLoop();
    } else {
        RenderUI.log("《 Grande Sábio 》 Controle retornado ao usuário.", "sage");
        clearTimeout(autoTimer);
    }
}

async function autoBattleLoop() {
    if (!isAutoMode) return;
    
    if (currentCombat) {
        const isRaphael = PlayerState.rank >= 2;

        if (currentCombat.isActive && !document.getElementById('btn-attack').disabled) {
            
            if (isRaphael && PlayerState.hp_current <= (PlayerState.hp_max * 0.3)) {
                if (PlayerState.inventory && PlayerState.inventory['magicule_potion'] > 0) {
                    const { InventorySystem } = await import('./modules/inventory.js');
                    RenderUI.log("《 Grande Sábio 》 Alerta de Vitalidade. Iniciando consumo automático de Poção.", "sage");
                    await InventorySystem.useItem(auth.currentUser.uid, 'magicule_potion', currentCombat);
                    autoTimer = setTimeout(autoBattleLoop, 1500); 
                    return; 
                }
            }

            const form = PlayerState.current_form || 'slime';
            const skill = GAME_CONFIG.ACTIVE_SKILLS[form];
            let useMagic = false;

            if (skill && PlayerState.mp_current >= skill.cost) {
                useMagic = true;
                
                if (isRaphael) {
                    const { SkillTree } = await import('./modules/skills.js');
                    const partyBonus = VillageSystem.getPartyBonus();
                    let weaponAtk = 0;
                    if (PlayerState.equipment && PlayerState.equipment.weapon) {
                        const { InventorySystem } = await import('./modules/inventory.js');
                        weaponAtk = InventorySystem.ITEMS[PlayerState.equipment.weapon].atk_bonus || 0;
                    }
                    const rankMult = GAME_CONFIG.RANKS[PlayerState.rank].stat_mult;
                    const baseDmg = Math.floor((SkillTree.calculateDamage() + partyBonus.atk + weaponAtk) * rankMult);
                    
                    if (currentCombat.enemy.hp_current <= baseDmg) {
                        useMagic = false;
                    } else if (skill.type === 'buff' && PlayerState.active_buff.turns > 0) {
                        useMagic = false;
                    } else if (skill.type === 'attack_heal' && PlayerState.hp_current === PlayerState.hp_max) {
                        useMagic = false;
                    }
                } else {
                    if (skill.type === 'attack_heal' && PlayerState.hp_current === PlayerState.hp_max) useMagic = false;
                    if (skill.type === 'buff' && PlayerState.active_buff.turns > 0) useMagic = false;
                }
            }

            if (useMagic) currentCombat.executePlayerTurn('magic');
            else currentCombat.executePlayerTurn('attack');

        } else if (!currentCombat.isActive && !document.getElementById('btn-predator').disabled) {
            currentCombat.executePredator();
        }
    }
    autoTimer = setTimeout(autoBattleLoop, 1500); 
}

function setupControls() {
    document.getElementById('btn-attack').onclick = () => { if(currentCombat) currentCombat.executePlayerTurn('attack'); };
    document.getElementById('btn-defend').onclick = () => { if(currentCombat) currentCombat.executePlayerTurn('defend'); };
    document.getElementById('btn-magic').onclick = () => { if(currentCombat) currentCombat.executePlayerTurn('magic'); };
    document.getElementById('btn-predator').onclick = () => { if(currentCombat) currentCombat.executePredator(); };
    document.getElementById('btn-name-monster').onclick = () => { if(currentCombat) currentCombat.executeName(); };

    document.getElementById('btn-skills').onclick = () => { document.getElementById('skills-modal').classList.remove('hidden'); RenderUI.renderFormsModal(auth.currentUser.uid); };
    document.getElementById('btn-inventory').onclick = () => { document.getElementById('inventory-modal').classList.remove('hidden'); RenderUI.renderInventoryModal(auth.currentUser.uid, currentCombat); };
    document.getElementById('btn-village').onclick = () => { document.getElementById('village-modal').classList.remove('hidden'); RenderUI.renderVillageModal(auth.currentUser.uid); };
    
    // NOVO: Botão da Guilda
    document.getElementById('btn-guild').onclick = () => { document.getElementById('guild-modal').classList.remove('hidden'); RenderUI.renderGuildModal(); };

    document.querySelectorAll('.btn-close-modal').forEach(btn => { btn.onclick = () => closeAllModals(); });

    document.getElementById('tab-subs').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'subs');
    document.getElementById('tab-exped').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'exped');
    document.getElementById('tab-upgrades').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'upgrades');
    document.getElementById('tab-map').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'map');
    
    // EVENTOS DE CHAT
    document.getElementById('btn-send-chat').onclick = () => processChatInput();
    document.getElementById('chat-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') processChatInput(); });

    document.getElementById('btn-auto').onclick = () => toggleAuto();
    document.getElementById('btn-rankup').onclick = () => { executeRankUp(auth.currentUser.uid); };

    document.getElementById('btn-google').onclick = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await linkWithPopup(auth.currentUser, provider);
            RenderUI.log(`《 Grande Sábio 》 Vínculo de Alma permanente estabelecido com: ${result.user.email}`, "sage");
            document.getElementById('btn-google').style.display = 'none';
        } catch (error) {
            if (error.code === 'auth/credential-already-in-use') {
                RenderUI.log(`《 Grande Sábio 》 Memórias passadas detectadas. Sincronizando...`, "sage");
                try {
                    await signInWithPopup(auth, provider);
                    window.location.reload(); 
                } catch (loginError) {
                    RenderUI.log(`Erro ao sincronizar memórias: ${loginError.message}`, "damage");
                }
            } else {
                RenderUI.log(`Erro no vínculo: ${error.message}`, "damage");
            }
        }
    };
}