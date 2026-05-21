    updateHUD(playerState) {
        const rankData = GAME_CONFIG.RANKS[playerState.rank || 0];
        document.getElementById('player-name').innerText = playerState.isNamed ? playerState.name : rankData.name;
        document.getElementById('player-name').style.color = rankData.color || '#c9d1d9';
        
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

        // Botão Auto muda para Raphael
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

    log(message, type = 'info') {
        // Interceptador Visual de Raphael
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