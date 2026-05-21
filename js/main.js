import { auth, signInAnonymously, GoogleAuthProvider, linkWithPopup, signInWithPopup } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initPlayer, PlayerState } from './modules/player.js';
import { CombatEngine } from './modules/combat.js';
import { RenderUI } from './ui/render.js';
import { GAME_CONFIG } from './data/gameConfig.js';
import { VillageSystem } from './modules/village.js';

let currentCombat = null;
let isAutoMode = false;
let autoTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    RenderUI.log("Sistema Inicializando...", "system");
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await initPlayer(user.uid);
            
            // Oculta botão Google se já estiver vinculado
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
    const zoneLevel = PlayerState.current_zone > 4 ? 4 : PlayerState.current_zone;
    const currentZone = GAME_CONFIG.ZONES[zoneLevel];
    let isBoss = false; let enemyKey = '';

    if (PlayerState.zone_progress >= currentZone.kills_to_boss) {
        enemyKey = currentZone.boss;
        isBoss = true;
        RenderUI.log(`《 Grande Sábio 》 Alerta: Assinatura mágica massiva detectada. O Chefe da Área se aproxima!`, "sage");
    } else {
        enemyKey = currentZone.enemies[Math.floor(Math.random() * currentZone.enemies.length)];
    }
    
    const baseEnemy = GAME_CONFIG.ENEMIES[enemyKey];
    let enemyData = { ...baseEnemy };
    
    if (isBoss) {
        enemyData.name = `[CHEFE] ${baseEnemy.name}`;
        enemyData.hp_max = Math.floor(baseEnemy.hp_max * 1.5);
        enemyData.base_damage = Math.floor(baseEnemy.base_damage * 1.3);
        enemyData.exp_reward = baseEnemy.exp_reward * 3;
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

function closeAllModals() { 
    document.querySelectorAll('.modal').forEach(modal => { modal.classList.add('hidden'); }); 
}

function toggleAuto() {
    isAutoMode = !isAutoMode;
    const btn = document.getElementById('btn-auto');
    btn.innerText = isAutoMode ? 'AUTO: ON' : 'AUTO: OFF';
    btn.style.background = isAutoMode ? 'var(--sage-color)' : 'transparent';
    btn.style.color = isAutoMode ? '#000' : 'var(--sage-color)';
    
    if (isAutoMode) {
        RenderUI.log("《 Grande Sábio 》 Controle autônomo de combate ativado.", "sage");
        autoBattleLoop();
    } else {
        RenderUI.log("《 Grande Sábio 》 Controle retornado ao usuário.", "sage");
        clearTimeout(autoTimer);
    }
}

function autoBattleLoop() {
    if (!isAutoMode) return;
    
    if (currentCombat) {
        if (currentCombat.isActive && !document.getElementById('btn-attack').disabled) {
            const form = PlayerState.current_form || 'slime';
            const skill = GAME_CONFIG.ACTIVE_SKILLS[form];
            
            if (skill && PlayerState.mp_current >= skill.cost) {
                if (skill.type === 'attack_heal' && PlayerState.hp_current === PlayerState.hp_max) {
                    currentCombat.executePlayerTurn('attack');
                } else if (skill.type === 'buff' && PlayerState.active_buff.turns > 0) {
                    currentCombat.executePlayerTurn('attack');
                } else {
                    currentCombat.executePlayerTurn('magic');
                }
            } else {
                currentCombat.executePlayerTurn('attack');
            }
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

    document.querySelectorAll('.btn-close-modal').forEach(btn => { btn.onclick = () => closeAllModals(); });

    document.getElementById('tab-subs').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'subs');
    document.getElementById('tab-exped').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'exped');
    document.getElementById('tab-upgrades').onclick = () => RenderUI.renderVillageModal(auth.currentUser.uid, 'upgrades');
    
    document.getElementById('btn-auto').onclick = () => toggleAuto();

    // Vínculo com Conta Google e Sistema de Carregar Jogo (Load)
    document.getElementById('btn-google').onclick = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // Tenta vincular o jogo atual (Novo Jogador)
            const result = await linkWithPopup(auth.currentUser, provider);
            RenderUI.log(`《 Grande Sábio 》 Vínculo de Alma permanente estabelecido com: ${result.user.email}`, "sage");
            document.getElementById('btn-google').style.display = 'none';
        } catch (error) {
            // Se a conta já existe, o jogador está retornando! Vamos baixar o save dele.
            if (error.code === 'auth/credential-already-in-use') {
                RenderUI.log(`《 Grande Sábio 》 Memórias passadas detectadas. Sincronizando...`, "sage");
                try {
                    await signInWithPopup(auth, provider);
                    // Recarrega a página para o sistema baixar a vida, nível e moedas da nuvem
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