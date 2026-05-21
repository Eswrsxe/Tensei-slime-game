import { getExpNeededForNextLevel, PlayerState } from '../modules/player.js';
import { GAME_CONFIG } from '../data/gameConfig.js';

export const RenderUI = {
    formatCurrency(totalCopper) {
        if (!totalCopper || totalCopper <= 0) return '<span style="color:#e69138; font-weight:bold;">0 Cobre</span>';
        const stellar = Math.floor(totalCopper / 1000000);
        const gold = Math.floor((totalCopper % 1000000) / 10000);
        const silver = Math.floor((totalCopper % 10000) / 100);
        const copper = Math.floor(totalCopper % 100);
        
        let str = [];
        if (stellar > 0) str.push(`<span style="color:#00ffff; text-shadow: 0 0 5px #00ffff; font-weight:bold;">${stellar} Ouro Estelar</span>`);
        if (gold > 0) str.push(`<span style="color:#ffd700; font-weight:bold;">${gold} Ouro</span>`);
        if (silver > 0) str.push(`<span style="color:#c0c0c0; font-weight:bold;">${silver} Prata</span>`);
        if (copper > 0) str.push(`<span style="color:#e69138; font-weight:bold;">${copper} Cobre</span>`);
        return str.join(' | ');
    },

    updateHUD(playerState) {
        document.getElementById('player-name').innerText = playerState.isNamed ? playerState.name : "Slime (Sem Nome)";
        document.getElementById('player-level').innerText = `Lvl: ${playerState.level}`;
        const currentForm = playerState.current_form || 'slime';
        document.getElementById('player-form').innerText = `Forma: ${currentForm.toUpperCase()}`;
        
        const hpPercent = (playerState.hp_current / playerState.hp_max) * 100;
        document.getElementById('hp-bar').style.width = `${Math.max(0, hpPercent)}%`;
        document.getElementById('hp-text').innerText = `HP: ${playerState.hp_current}/${playerState.hp_max}`;
        
        const mpPercent = (playerState.mp_current / playerState.mp_max) * 100;
        document.getElementById('mp-bar').style.width = `${Math.max(0, mpPercent)}%`;
        document.getElementById('mp-text').innerText = `MP: ${playerState.mp_current}/${playerState.mp_max}`;
        
        const expNeeded = getExpNeededForNextLevel();
        const expPercent = (playerState.exp_current / expNeeded) * 100;
        document.getElementById('exp-bar').style.width = `${Math.min(100, Math.max(0, expPercent))}%`;
        document.getElementById('exp-text').innerText = `EXP: ${playerState.exp_current}/${expNeeded}`;
        document.getElementById('wallet-display').innerHTML = this.formatCurrency(playerState.wallet);

        const skill = GAME_CONFIG.ACTIVE_SKILLS[currentForm];
        if (skill) document.getElementById('btn-magic').innerText = `Magia: ${skill.name} (${skill.cost} MP)`;
    },
    
    updateZoneUI(zoneId) {
        const display = document.getElementById('combat-display');
        const zoneData = GAME_CONFIG.ZONES[zoneId] || GAME_CONFIG.ZONES[4];
        display.className = '';
        display.classList.add(zoneData.class);
    },

    log(message, type = 'info') {
        const logArea = document.getElementById('combat-log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString([], { hour12: false });
        entry.innerHTML = `<span class="timestamp">[${time}]</span> ${message}`;
        logArea.appendChild(entry);
        setTimeout(() => { entry.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 15);
    },

    showOfflineReport(report) {
        document.getElementById('offline-modal').classList.remove('hidden');
        const container = document.getElementById('offline-report-content');
        container.innerHTML = `
            <div class="item-slot" style="justify-content: center; flex-direction: column; text-align: center; background: transparent; border: none;">
                <span style="color:#8b949e; font-size:12px;">Tempo de Expedição: ${report.minutes} Minuto(s)</span>
                <span style="color:#58a6ff; font-weight:bold; margin-top:5px;">Destino: ${report.zoneName}</span>
            </div>
            <div class="item-slot"><span>Experiência</span><span style="color:#d2a8ff; font-weight:bold;">+${report.exp} EXP</span></div>
            <div class="item-slot"><span>Moedas</span><span style="color:#e69138; font-weight:bold;">+${report.coins} Cobre(s)</span></div>
            <div class="item-slot"><span>Poções de Magicule</span><span style="color:#3fb950; font-weight:bold;">+${report.potions}</span></div>
        `;
    },

    renderFormsModal(playerId) {
        import('../modules/skills.js').then(({ SkillTree }) => {
            const container = document.getElementById('forms-list');
            container.innerHTML = '';
            PlayerState.unlocked_forms.forEach(formId => {
                const btn = document.createElement('button');
                btn.className = `form-btn ${PlayerState.current_form === formId ? 'active' : ''}`;
                btn.innerText = SkillTree.FORMS[formId].name;
                btn.onclick = () => { SkillTree.changeForm(playerId, formId); document.getElementById('skills-modal').classList.add('hidden'); };
                container.appendChild(btn);
            });
        });
    },

    renderInventoryModal(playerId, combatEngine) {
        import('../modules/inventory.js').then(({ InventorySystem }) => {
            const container = document.getElementById('inventory-list');
            container.innerHTML = '';
            if (!PlayerState.inventory || Object.keys(PlayerState.inventory).length === 0) return container.innerHTML = '<p>Estômago vazio.</p>';
            Object.entries(PlayerState.inventory).forEach(([itemId, qty]) => {
                const item = InventorySystem.ITEMS[itemId];
                if(item.heal > 0) {
                    const div = document.createElement('div');
                    div.className = 'item-slot';
                    div.innerHTML = `<div class="item-info"><span class="item-name">${item.name} (x${qty})</span></div>
                                     <button class="use-btn">Consumir</button>`;
                    div.querySelector('.use-btn').onclick = () => InventorySystem.useItem(playerId, itemId, combatEngine);
                    container.appendChild(div);
                }
            });
        });
    },

    renderVillageModal(playerId, activeTab = 'subs') {
        import('../modules/village.js').then(({ VillageSystem }) => {
            const container = document.getElementById('village-list');
            container.innerHTML = '';
            
            document.getElementById('tab-subs').classList.toggle('active', activeTab === 'subs');
            document.getElementById('tab-exped').classList.toggle('active', activeTab === 'exped');
            document.getElementById('tab-upgrades').classList.toggle('active', activeTab === 'upgrades');

            if (activeTab === 'subs') {
                if (!PlayerState.subordinates || PlayerState.subordinates.length === 0) return container.innerHTML = '<p style="color:#8b949e; font-size:12px;">Sua vila está vazia.</p>';
                PlayerState.subordinates.forEach(sub => {
                    const div = document.createElement('div');
                    div.className = 'item-slot';
                    const isParty = sub.role === 'party';
                    div.innerHTML = `
                        <div class="item-info">
                            <span class="item-name" style="color: ${isParty ? '#ff7b72' : '#58a6ff'};">${sub.name}</span>
                            <span class="item-desc">Status: ${isParty ? 'Lutando' : 'Trabalhando'}</span>
                        </div>
                        <button class="use-btn" style="background: ${isParty ? '#da3633' : '#1f6feb'};">${isParty ? 'Remover' : 'Equipar'}</button>
                    `;
                    div.querySelector('.use-btn').onclick = () => VillageSystem.toggleRole(playerId, sub.id);
                    container.appendChild(div);
                });
            } else if (activeTab === 'exped') {
                const currentExped = PlayerState.expedition_zone || 1;
                Object.keys(GAME_CONFIG.ZONES).forEach(zId => {
                    const zoneId = parseInt(zId);
                    if (zoneId <= PlayerState.current_zone) {
                        const zone = GAME_CONFIG.ZONES[zoneId];
                        const isActive = currentExped === zoneId;
                        const div = document.createElement('div');
                        div.className = 'item-slot';
                        div.innerHTML = `
                            <div class="item-info" style="flex:1;">
                                <span class="item-name" style="color:${isActive ? '#3fb950' : '#c9d1d9'}">${zone.name}</span>
                                <span class="item-desc">${isActive ? 'Expedição em Andamento...' : 'Área Desbravada'}</span>
                            </div>
                            <button class="use-btn" style="background:${isActive ? '#21262d' : '#1f6feb'}; color:${isActive ? '#8b949e' : '#fff'};" ${isActive ? 'disabled' : ''}>
                                ${isActive ? 'Explorando' : 'Despachar'}
                            </button>
                        `;
                        if (!isActive) div.querySelector('.use-btn').onclick = () => VillageSystem.setExpeditionZone(playerId, zoneId);
                        container.appendChild(div);
                    }
                });
            } else if (activeTab === 'upgrades') {
                Object.values(GAME_CONFIG.UPGRADES).forEach(upg => {
                    const currentLevel = PlayerState.upgrades[upg.id] || 0;
                    const isMax = currentLevel >= upg.max_level;
                    const cost = Math.floor(upg.base_cost * Math.pow(1.5, currentLevel));
                    
                    const div = document.createElement('div');
                    div.className = 'item-slot';
                    div.innerHTML = `
                        <div class="item-info" style="flex:1;">
                            <span class="item-name">${upg.name} [Nv.${currentLevel}/${upg.max_level}]</span>
                            <span class="item-desc">${upg.desc}</span>
                            <span class="item-desc" style="margin-top:5px;">Custo: ${isMax ? 'MÁXIMO' : this.formatCurrency(cost)}</span>
                        </div>
                        <button class="use-btn" ${isMax || PlayerState.wallet < cost ? 'disabled' : ''}>Comprar</button>
                    `;
                    if (!isMax) div.querySelector('.use-btn').onclick = () => VillageSystem.buyUpgrade(playerId, upg.id);
                    container.appendChild(div);
                });
            }
        });
    }
};