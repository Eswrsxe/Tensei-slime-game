    renderVillageModal(playerId, activeTab = 'subs') {
        import('../modules/village.js').then(({ VillageSystem }) => {
            const container = document.getElementById('village-list');
            container.innerHTML = '';
            document.getElementById('tab-subs').classList.toggle('active', activeTab === 'subs');
            document.getElementById('tab-exped').classList.toggle('active', activeTab === 'exped');
            
            // Aqui substituímos a antiga Tab de Infra pelo Mercado
            const tabMarket = document.getElementById('tab-upgrades');
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
                    if (evoData) div.querySelector('.evo-btn').onclick = () => VillageSystem.evolveSubordinate(playerId, sub.id);
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
                    div.innerHTML = `<div class="item-info" style="flex:1;"><span class="item-name" style="color:#d2a8ff;">${item.name}</span><span class="item-desc">${item.desc}</span><span class="item-desc" style="margin-top:5px; color:#e69138;">Custo: ${this.formatCurrency(item.cost)}</span></div><button class="use-btn" ${PlayerState.wallet < item.cost ? 'disabled' : ''}>Comprar</button>`;
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
                    div.innerHTML = `<div class="item-info" style="flex:1;"><span class="item-name" style="color:#58a6ff;">${upg.name} [Nv.${currentLevel}/${upg.max_level}]</span><span class="item-desc">${upg.desc}</span><span class="item-desc" style="margin-top:5px;">Custo: ${isMax ? 'MÁXIMO' : this.formatCurrency(cost)}</span></div><button class="use-btn" ${isMax || PlayerState.wallet < cost ? 'disabled' : ''}>Contratar</button>`;
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