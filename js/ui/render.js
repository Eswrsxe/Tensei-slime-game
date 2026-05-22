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
        const rankData = GAME_CONFIG.RANKS[playerState.rank || 0];
        document.getElementById('player-name').innerText = playerState.isNamed ? playerState.name : rankData.name;
        document.getElementById('player-name').style.color = rankData.color || '#c9d1d9';
        
        // NOVO: Atualiza a Imagem (Avatar) do HUD com base no Rank
        const avatarEl = document.getElementById('player-avatar');
        if (avatarEl) avatarEl.src = rankData.img;

        const tagElement = document.getElementById('player-tag');
        if (tagElement) tagElement.innerText = playerState.player_tag || '#----';

        document.getElementById('player-level').innerText = `Lvl: ${playerState.level}`;
        const currentForm = playerState.current_form || 'slime';
        document.getElementById('player-form').innerText = `Forma: ${currentForm.toUpperCase()}`;

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

        const btnAuto = document.getElementById('btn-auto');
        if (!btnAuto.innerText.includes('ON')) {
            btnAuto.innerText = (playerState.rank >= 2) ? 'RAPHAEL: OFF' : 'AUTO: OFF';
            btnAuto.style.color = (playerState.rank >= 2) ? '#ffd700' : 'var(--sage-color)';
            btnAuto.style.borderColor = (playerState.rank >= 2) ? '#ffd700' : 'var(--sage-color)';
        }

        const btnRankup = document.getElementById('btn-rankup');
        const nextRankData = GAME_CONFIG.RANKS[(playerState.rank || 0) + 1];
        if (nextRankData && playerState.level >= nextRankData.req_lvl) {
            btnRankup.classList.remove('hidden');
        } else {
            btnRankup.classList.add('hidden');
        }
    },
    
    updateZoneUI(zoneId) {
        const display = document.getElementById('combat-display');
        const zoneData = GAME_CONFIG.ZONES[zoneId] || GAME_CONFIG.ZONES[5];
        display.className = '';
        display.classList.add(zoneData.class);
    },

    log(message, type = 'info') {
        // Interceptador de Raphael (Nível 100+)
        if (PlayerState && PlayerState.rank >= 2) {
            message = message.replace('《 Grande Sábio 》', '<span style="color:#ffd700; font-style:italic; text-shadow: 0 0 5px #ffd700;">《 Raphael, Rei da Sabedoria 》</span>');
        }

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

    renderGuildModal() {
        const container = document.getElementById('quest-list');
        container.innerHTML = '';
        if (!PlayerState.quests || PlayerState.quests.length === 0) {
            return container.innerHTML = '<p style="color:#8b949e; font-size:12px;">Nenhuma missão ativa no momento.</p>';
        }

        PlayerState.quests.forEach(quest => {
            const qData = GAME_CONFIG.QUESTS[quest.id];
            if (!qData) return;
            const pct = Math.floor((quest.progress / qData.required) * 100);
            
            const div = document.createElement('div');
            div.className = 'item-slot';
            div.innerHTML = `
                <div class="item-info" style="flex:1;">
                    <span class="item-name" style="color:#f778ba;">${qData.name}</span>
                    <span class="item-desc">${qData.desc}</span>
                    <div style="width: 100%; background: #21262d; border-radius: 3px; margin-top: 5px; height: 5px;">
                        <div style="width: ${pct}%; background: #f778ba; height: 100%; border-radius: 3px;"></div>
                    </div>
                    <span style="font-size: 10px; color: #8b949e;">Progresso: ${quest.progress}/${qData.required}</span>
                </div>
            `;
            container.appendChild(div);
        });
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
            const wpnId = PlayerState.equipment?.weapon; 
            const armId = PlayerState.equipment?.armor; 
            const accId = PlayerState.equipment?.accessory;
            
            document.getElementById('eqp-weapon').innerText = wpnId ? InventorySystem.ITEMS[wpnId].name : 'Vazio';
            document.getElementById('eqp-armor').innerText = armId ? InventorySystem.ITEMS[armId].name : 'Vazio';
            document.getElementById('eqp-accessory').innerText = accId ? InventorySystem.ITEMS[accId].name : 'Vazio';

            const container = document.getElementById('inventory-list');
            container.innerHTML = '';
            if (!PlayerState.inventory || Object.keys(PlayerState.inventory).length === 0) return container.innerHTML = '<p>Estômago vazio.</p>';
            
            Object.entries(PlayerState.inventory).forEach(([itemId, qty]) => {
                const item = InventorySystem.ITEMS[itemId];
                if (!item) return;
                const isEquipped = (wpnId === itemId || armId === itemId || accId === itemId);
                const btnColor = isEquipped ? '#da3633' : '#1f6feb';
                const btnText = item.type === 'consumable' ? 'Consumir' : (isEquipped ? 'Retirar' : 'Equipar');

                const div = document.createElement('div');
                div.className = 'item-slot';
                div.innerHTML = `<div class="item-info" style="flex:1;"><span class="item-name" style="color: ${item.type === 'consumable' ? '#c9d1d9' : '#d2a8ff'};">${item.name} (x${qty})</span><span class="item-desc">${item.desc}</span></div><button class="use-btn" style="background: ${item.type === 'consumable' ? '#238636' : btnColor};">${btnText}</button>`;
                div.querySelector('.use-btn').onclick = () => { if (item.type === 'consumable') InventorySystem.useItem(playerId, itemId, combatEngine); else InventorySystem.toggleEquip(playerId, itemId); };
                container.appendChild(div);
            });
        });
    },

    renderVillageModal(playerId, activeTab = 'subs') {
        import('../modules/village.js').then(({ VillageSystem }) => {
            const container = document.getElementById('village-list');
            container.innerHTML = '';
            
            document.getElementById('tab-subs').classList.toggle('active', activeTab === 'subs');
            document.getElementById('tab-exped').classList.toggle('active', activeTab === 'exped');
            
            // Renomeia dinamicamente e gerencia a tab do Mercado
            const tabMarket = document.getElementById('tab-upgrades') || document.getElementById('tab-market');
            if (tabMarket) {
                tabMarket.innerText = 'Mercado';
                tabMarket.id = 'tab-market';
            }
            const currentTabMarket = document.getElementById('tab-market');
            if (currentTabMarket) currentTabMarket.classList.toggle('active', activeTab === 'market');
            
            document.getElementById('tab-map').classList.toggle('active', activeTab === 'map');

            if (activeTab === 'subs') {
                if (!PlayerState.subordinates || PlayerState.subordinates.length === 0) return container.innerHTML = '<p style="color:#8b949e; font-size:12px;">Sua vila está vazia.</p>';
                PlayerState.subordinates.forEach(sub => {
                    const div = document.createElement('div');
                    div.className = 'item-slot';
                    const isParty = sub.role === 'party';
                    
                    const evoData = GAME_CONFIG.EVOLUTIONS[sub.typeId];
                    let evoHtml = '';
                    let btnHtml = `<button class="use-btn" style="background: ${isParty ? '#da3633' : '#1f6feb'};">${isParty ? 'Remover' : 'Equipar'}</button>`;

                    if (evoData) {
                        btnHtml += `<button class="evo-btn use-btn" style="background: #e3b341; color: #0d1117; margin-left: 5px; font-weight: bold;">Evoluir</button>`;
                        evoHtml = `<span class="item-desc" style="color: #e3b341; margin-top: 5px; display: block;">Evolução disponível: ${this.formatCurrency(evoData.cost)}</span>`;
                    }

                    div.innerHTML = `
                        <div class="item-info" style="flex:1;">
                            <span class="item-name" style="color: ${isParty ? '#ff7b72' : '#58a6ff'};">${sub.name}</span>
                            <span class="item-desc">Status: ${isParty ? 'Lutando' : 'Trabalhando'}</span>
                            ${evoHtml}
                        </div>
                        <div style="display:flex; align-items:center;">${btnHtml}</div>
                    `;
                    
                    div.querySelector('.use-btn').onclick = () => VillageSystem.toggleRole(playerId, sub.id);
                    if (evoData) {
                        div.querySelector('.evo-btn').onclick = () => VillageSystem.evolveSubordinate(playerId, sub.id);
                    }
                    container.appendChild(div);
                });
            } else if (activeTab === 'exped') {
                const currentExped = PlayerState.expedition_zone || 1;
                Object.keys(GAME_CONFIG.ZONES).forEach(zId => {
                    const zoneId = parseInt(zId);
                    if (zoneId <= PlayerState.highest_zone) {
                        const zone = GAME_CONFIG.ZONES[zoneId];
                        const isActive = currentExped === zoneId;
                        const div = document.createElement('div');
                        div.className = 'item-slot';
                        div.innerHTML = `<div class="item-info" style="flex:1;"><span class="item-name" style="color:${isActive ? '#3fb950' : '#c9d1d9'}">${zone.name}</span><span class="item-desc">${isActive ? 'Expedição em Andamento...' : 'Área Desbravada'}</span></div><button class="use-btn" style="background:${isActive ? '#21262d' : '#1f6feb'}; color:${isActive ? '#8b949e' : '#fff'};" ${isActive ? 'disabled' : ''}>${isActive ? 'Explorando' : 'Despachar'}</button>`;
                        if (!isActive) div.querySelector('.use-btn').onclick = () => VillageSystem.setExpeditionZone(playerId, zoneId);
                        container.appendChild(div);
                    }
                });
            } else if (activeTab === 'market') {
                // Renderiza Compras do Mercado de Sarion e Dwargon
                Object.keys(GAME_CONFIG.MARKET.SHOP).forEach(shopKey => {
                    const item = GAME_CONFIG.MARKET.SHOP[shopKey];
                    const div = document.createElement('div');
                    div.className = 'item-slot';
                    div.innerHTML = `
                        <div class="item-info" style="flex:1;">
                            <span class="item-name" style="color:#d2a8ff;">${item.name}</span>
                            <span class="item-desc">${item.desc}</span>
                            <span class="item-desc" style="margin-top:5px; color:#e69138;">Custo: ${this.formatCurrency(item.cost)}</span>
                        </div>
                        <button class="use-btn" ${PlayerState.wallet < item.cost ? 'disabled' : ''}>Comprar</button>
                    `;
                    div.querySelector('.use-btn').onclick = () => VillageSystem.buyMarketItem(playerId, shopKey, false);
                    container.appendChild(div);
                });

                Object.keys(GAME_CONFIG.MARKET.UPGRADES).forEach(upgId => {
                    const upg = GAME_CONFIG.MARKET.UPGRADES[upgId];
                    const currentLevel = PlayerState.upgrades[upg.id] || 0;
                    const isMax = currentLevel >= upg.max_level;
                    const cost = Math.floor(upg.base_cost * Math.pow(1.5, currentLevel));
                    const div = document.createElement('div');
                    div.className = 'item-slot';
                    div.innerHTML = `
                        <div class="item-info" style="flex:1;">
                            <span class="item-name" style="color:#58a6ff;">${upg.name} [Nv.${currentLevel}/${upg.max_level}]</span>
                            <span class="item-desc">${upg.desc}</span>
                            <span class="item-desc" style="margin-top:5px;">Custo: ${isMax ? 'MÁXIMO' : this.formatCurrency(cost)}</span>
                        </div>
                        <button class="use-btn" ${isMax || PlayerState.wallet < cost ? 'disabled' : ''}>Contratar</button>
                    `;
                    if (!isMax) div.querySelector('.use-btn').onclick = () => VillageSystem.buyMarketItem(playerId, upg.id, true);
                    container.appendChild(div);
                });
            } else if (activeTab === 'map') {
                const toggleDiv = document.createElement('div');
                toggleDiv.className = 'item-slot';
                toggleDiv.innerHTML = `<div class="item-info"><span class="item-name">Avanço Automático de Zona</span><span class="item-desc">Avança ao derrotar o Chefe. Desligue para Farmar.</span></div><button class="use-btn" style="background: ${PlayerState.auto_advance ? '#3fb950' : '#da3633'};">${PlayerState.auto_advance ? 'LIGADO' : 'DESLIGADO'}</button>`;
                toggleDiv.querySelector('.use-btn').onclick = () => VillageSystem.toggleAutoAdvance(playerId);
                container.appendChild(toggleDiv);

                Object.keys(GAME_CONFIG.ZONES).forEach(zId => {
                    const zoneId = parseInt(zId);
                    if (zoneId <= PlayerState.highest_zone) {
                        const zone = GAME_CONFIG.ZONES[zoneId];
                        const isActive = PlayerState.current_zone === zoneId;
                        const div = document.createElement('div');
                        div.className = 'item-slot';
                        div.innerHTML = `<div class="item-info" style="flex:1;"><span class="item-name" style="color:${isActive ? '#58a6ff' : '#c9d1d9'}">${zone.name}</span><span class="item-desc">Área Desbloqueada</span></div><button class="use-btn" style="background:${isActive ? '#21262d' : '#1f6feb'}; color:${isActive ? '#8b949e' : '#fff'};" ${isActive ? 'disabled' : ''}>${isActive ? 'Atual' : 'Viajar'}</button>`;
                        if (!isActive) div.querySelector('.use-btn').onclick = () => VillageSystem.travelToZone(playerId, zoneId);
                        container.appendChild(div);
                    }
                });
            }
        });
    }
};