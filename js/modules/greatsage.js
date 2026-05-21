import { RenderUI } from '../ui/render.js';

export const GreatSage = {
    cooldowns: new Map(),
    
    pushHint(message, threatLevel, hashKey) {
        const now = Date.now();
        // Cooldown de 15 segundos reais (ajustável para turnos)
        const cooldownTime = 15000; 

        if (this.cooldowns.has(hashKey) && (now - this.cooldowns.get(hashKey)) < cooldownTime) {
            return; // Bloqueia spam (Debounce)
        }

        this.cooldowns.set(hashKey, now);
        RenderUI.log(`《 Grande Sábio 》 ${message}`, "sage");
    },

    analyzeSituation(playerState) {
        const hpPercent = (playerState.hp_current / playerState.hp_max) * 100;
        if (hpPercent <= 30) {
            this.pushHint("Aviso: Vitalidade crítica. Sugere-se uso de itens de cura ou evasão imediata.", 5, "low_hp");
        }
    }
};