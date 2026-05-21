import { db } from '../firebase.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { RenderUI } from '../ui/render.js';
import { GAME_CONFIG } from '../data/gameConfig.js';
import { GreatSage } from './greatsage.js';

export let PlayerState = null;

export async function initPlayer(uid) {
    const playerRef = doc(db, "player_core", uid);
    const playerSnap = await getDoc(playerRef);

    if (playerSnap.exists()) {
        PlayerState = playerSnap.data();
        let needsUpdate = false;
        if (!PlayerState.inventory) { PlayerState.inventory = { 'magicule_potion': 3 }; needsUpdate = true; }
        if (!PlayerState.subordinates) { PlayerState.subordinates = []; needsUpdate = true; }
        if (PlayerState.current_zone === undefined) { PlayerState.current_zone = 1; PlayerState.zone_progress = 0; needsUpdate = true; }
        if (PlayerState.wallet === undefined) { PlayerState.wallet = 0; needsUpdate = true; }
        if (!PlayerState.upgrades) { PlayerState.upgrades = {}; needsUpdate = true; }
        if (!PlayerState.active_buff) { PlayerState.active_buff = { turns: 0, effect: 1 }; needsUpdate = true; }
        
        // Patch v8: Destino de Expedição
        if (!PlayerState.expedition_zone) { PlayerState.expedition_zone = 1; needsUpdate = true; }
        
        if (needsUpdate) await setDoc(playerRef, PlayerState, { merge: true });
    } else {
        PlayerState = {
            isNamed: false, name: "Slime", level: 1, exp_current: 0,
            hp_current: GAME_CONFIG.STARTING_STATS.HP, hp_max: GAME_CONFIG.STARTING_STATS.HP,
            mp_current: GAME_CONFIG.STARTING_STATS.MP, mp_max: GAME_CONFIG.STARTING_STATS.MP,
            defense_modifier: 1, current_form: 'slime', unlocked_forms: ['slime'],
            inventory: { 'magicule_potion': 3 }, subordinates: [], last_village_update: Date.now(),
            current_zone: 1, zone_progress: 0, wallet: 0, upgrades: {}, active_buff: { turns: 0, effect: 1 },
            expedition_zone: 1
        };
        await setDoc(playerRef, PlayerState);
    }
    
    RenderUI.updateHUD(PlayerState);
    RenderUI.updateZoneUI(PlayerState.current_zone);
}

export async function addExperience(playerId, amount) {
    PlayerState.exp_current += amount;
    let expNeeded = Math.floor(GAME_CONFIG.LEVEL_CURVE.base_exp * Math.pow(GAME_CONFIG.LEVEL_CURVE.multiplier, PlayerState.level - 1));
    let leveledUp = false;

    while (PlayerState.exp_current >= expNeeded) {
        PlayerState.exp_current -= expNeeded;
        PlayerState.level += 1;
        PlayerState.hp_max += 10;
        PlayerState.mp_max += 5;
        PlayerState.hp_current = PlayerState.hp_max;
        PlayerState.mp_current = PlayerState.mp_max;
        leveledUp = true;
        expNeeded = Math.floor(GAME_CONFIG.LEVEL_CURVE.base_exp * Math.pow(GAME_CONFIG.LEVEL_CURVE.multiplier, PlayerState.level - 1));
        GreatSage.pushHint(`Evolução. Nível atual: ${PlayerState.level}.`, 1, `lvlup_${PlayerState.level}`);
    }

    await setDoc(doc(db, "player_core", playerId), { 
        level: PlayerState.level, exp_current: PlayerState.exp_current,
        hp_max: PlayerState.hp_max, mp_max: PlayerState.mp_max,
        hp_current: PlayerState.hp_current, mp_current: PlayerState.mp_current
    }, { merge: true });

    if(leveledUp) RenderUI.log(`LEVEL UP! Energias restauradas.`, "heal");
    RenderUI.updateHUD(PlayerState);
}

export function getExpNeededForNextLevel() {
    return Math.floor(GAME_CONFIG.LEVEL_CURVE.base_exp * Math.pow(GAME_CONFIG.LEVEL_CURVE.multiplier, PlayerState.level - 1));
}