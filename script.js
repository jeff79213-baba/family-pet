/* ====== 家庭寵物樂園 - UI 腳本 ====== */

let isAdminMode = false;
let selectedAdminAvatar = '👤';

// ====== 頁面導航 ======
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const page = link.dataset.page;
    if (page === 'admin' && !isAdminMode) return;
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    const pageId = 'page-' + page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    refreshUI();
  });
});

// ====== 刷新所有 UI ======
function refreshUI() {
  renderMemberSelector();
  updateNavCoins();
  if (isAdminMode) {
    renderAdminTaskList();
    renderAdminMemberList();
    renderAdminAvatarSelector();
    renderAdminPendingTasks();
    renderThemeSelector();
    renderSettingsUI();
    renderAdminBonusSection();
    document.getElementById('adminNavLink').style.display = 'inline-block';
  } else {
    document.getElementById('adminNavLink').style.display = 'none';
  }
  updateHomeStats();
  renderTasks();
  renderPetList();
  renderAlbum();
  renderExamHistory();
  updateGachaUI();
  renderBossPage();
  renderExpedition();
}

function updateNavCoins() {
  const member = getCurrentMember();
  const coinsEl = document.getElementById('navCoins');
  const userEl = document.getElementById('navCurrentUser');
  if (member) {
    coinsEl.textContent = '💰 ' + member.coins;
    coinsEl.style.display = 'inline';
    userEl.textContent = (member.avatar || '👤') + ' ' + member.name;
    userEl.style.display = 'inline';
  } else {
    coinsEl.style.display = 'none';
    userEl.style.display = 'none';
  }
}

// ====== 成員選擇器（首頁）=====
function renderMemberSelector() {
  const container = document.getElementById('memberSelector');
  const data = getData();
  const current = getCurrentMember();

  let html = '';

  data.members.forEach(m => {
    const active = current && m.id === current.id ? 'active' : '';
    const hasPwd = hasMemberPassword(m.id);
    html += `
      <div class="member-btn ${active}" onclick="switchMember('${m.id}')">
        <span class="member-avatar">${m.avatar || '👤'}</span>
        <span class="member-name">${m.name}</span>
        ${hasPwd ? '<span class="lock-icon">🔒</span>' : ''}
        <span class="member-pwd-btn" onclick="event.stopPropagation();showMemberPwdSetting('${m.id}')" title="設定密碼">🔑</span>
      </div>
    `;
  });

  html += `
    <div class="member-btn parent-btn" onclick="showParentLogin()">
      <span class="member-avatar">🔐</span>
      <span class="member-name">家長</span>
    </div>
  `;

  container.innerHTML = html;
}

function switchMember(id) {
  if (hasMemberPassword(id)) {
    showMemberPasswordModal(id);
    return;
  }
  selectMember(id);
  refreshUI();
}

// ====== 家長驗證 ======
function showParentLogin() {
  document.getElementById('passwordInput').value = '';
  document.getElementById('modalError').style.display = 'none';
  document.getElementById('passwordModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('passwordInput').focus(), 100);
}

function closePasswordModal() {
  document.getElementById('passwordModal').classList.add('hidden');
}

function verifyParentPassword() {
  const input = document.getElementById('passwordInput').value;
  if (input === getParentPassword()) {
    closePasswordModal();
    enterAdminMode();
  } else {
    document.getElementById('modalError').style.display = 'block';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
}

// ====== 成員密碼彈窗（切換成員時驗證）=====
let pendingMemberId = null;

function showMemberPasswordModal(memberId) {
  pendingMemberId = memberId;
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  document.getElementById('memberPwdTitle').textContent = `🔒 ${member?.name || ''} 的密碼`;
  document.getElementById('memberPwdInput').value = '';
  document.getElementById('memberPwdError').style.display = 'none';
  document.getElementById('memberPasswordModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('memberPwdInput').focus(), 100);
}

function closeMemberPasswordModal() {
  document.getElementById('memberPasswordModal').classList.add('hidden');
  pendingMemberId = null;
}

function verifyMemberPasswordModal() {
  const input = document.getElementById('memberPwdInput').value;
  if (pendingMemberId && verifyMemberPassword(pendingMemberId, input)) {
    closeMemberPasswordModal();
    selectMember(pendingMemberId);
    pendingMemberId = null;
    refreshUI();
  } else {
    document.getElementById('memberPwdError').style.display = 'block';
    document.getElementById('memberPwdInput').value = '';
    document.getElementById('memberPwdInput').focus();
  }
}

// ====== 小孩自行設定密碼彈窗 ======
function showMemberPwdSetting(memberId) {
  pendingMemberId = memberId;
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  const hasPwd = hasMemberPassword(memberId);
  document.getElementById('memberSetPwdTitle').textContent = hasPwd ? `🔑 修改 ${member?.name || ''} 的密碼` : `🔑 為 ${member?.name || ''} 設定密碼`;
  document.getElementById('memberSetPwdHint').textContent = hasPwd ? '請先輸入舊密碼，再設定新密碼' : '設定密碼後，點選此成員需要輸入密碼';
  document.getElementById('memberSetOldPwd').value = '';
  document.getElementById('memberSetNewPwd').value = '';
  document.getElementById('memberSetPwdError').style.display = 'none';
  document.getElementById('memberSetOldPwdWrap').style.display = hasPwd ? 'block' : 'none';
  document.getElementById('memberSetPwdModal').classList.remove('hidden');
}

function closeMemberSetPwdModal() {
  document.getElementById('memberSetPwdModal').classList.add('hidden');
  pendingMemberId = null;
}

function confirmMemberSetPwd() {
  const oldPwd = document.getElementById('memberSetOldPwd').value;
  const newPwd = document.getElementById('memberSetNewPwd').value;
  const errEl = document.getElementById('memberSetPwdError');

  if (!newPwd || newPwd.length < 4) {
    errEl.textContent = '❌ 密碼至少 4 位';
    errEl.style.display = 'block';
    return;
  }

  if (hasMemberPassword(pendingMemberId) && !verifyMemberPassword(pendingMemberId, oldPwd)) {
    errEl.textContent = '❌ 舊密碼錯誤';
    errEl.style.display = 'block';
    return;
  }

  setMemberPassword(pendingMemberId, newPwd);
  closeMemberSetPwdModal();
  refreshUI();
  showToast('🔑 密碼已設定');
}

function clearMemberPassword(memberId) {
  if (!confirm('確定清除此成員的密碼？')) return;
  setMemberPassword(memberId, '');
  if (isAdminMode) renderAdminMemberList();
  else refreshUI();
  showToast('🔓 密碼已清除');
}

function adminChangePassword() {
  const newPwd = document.getElementById('adminNewPwd').value;
  const confirmPwd = document.getElementById('adminConfirmPwd').value;
  const msgEl = document.getElementById('adminPwdMsg');
  if (!newPwd || newPwd.length < 4) { msgEl.textContent = '❌ 密碼至少 4 位'; return; }
  if (newPwd !== confirmPwd) { msgEl.textContent = '❌ 兩次密碼不一致'; return; }
  setParentPassword(newPwd);
  document.getElementById('adminNewPwd').value = '';
  document.getElementById('adminConfirmPwd').value = '';
  msgEl.textContent = '';
  showToast('🔒 家長密碼已更新');
}

function enterAdminMode() {
  isAdminMode = true;
  document.getElementById('adminNavLink').style.display = 'inline-block';
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.querySelector('[data-page="admin"]').classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-admin').classList.add('active');
  refreshUI();
  showToast('🔐 已進入管理員模式');
}

// ====== 備份功能 ======
function handleImportBackup(input) {
  if (!input.files || input.files.length === 0) return;
  if (!confirm('⚠️ 匯入備份將會覆蓋目前所有資料，確定要繼續嗎？')) {
    input.value = '';
    return;
  }
  importSaveData(input.files[0]);
}

// ====== 離開管理員模式 ======
function exitAdminMode() {
  isAdminMode = false;
  document.getElementById('adminNavLink').style.display = 'none';
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.querySelector('[data-page="home"]').classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-home').classList.add('active');
  refreshUI();
  showToast('👋 已返回兒童模式');
}

// ====== 管理後台 - 任務列表 ======
function renderAdminTaskList() {
  const container = document.getElementById('adminTaskList');
  const tasks = getTaskDefs();

  if (tasks.length === 0) {
    container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">目前沒有任務，請新增任務</p>';
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="admin-task-item" id="adminTask_${task.id}">
      <span class="admin-task-label">${task.label}</span>
      <span class="admin-task-reward">💰 ${task.reward}</span>
      <button onclick="adminEditTask('${task.id}')" class="admin-btn edit">✏️ 編輯</button>
      <button onclick="adminDeleteTask('${task.id}')" class="admin-btn delete">🗑️ 刪除</button>
    </div>
  `).join('');
}

function adminEditTask(taskId) {
  const tasks = getTaskDefs();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const div = document.getElementById('adminTask_' + taskId);
  div.innerHTML = `
    <input type="text" class="admin-task-input" id="editLabel_${taskId}" value="${task.label.replace(/"/g, '&quot;')}" placeholder="任務名稱">
    <input type="number" class="admin-task-input" id="editReward_${taskId}" value="${task.reward}" min="1" max="100" style="max-width:80px;">
    <button onclick="adminSaveTask('${taskId}')" class="admin-btn save">💾 儲存</button>
    <button onclick="renderAdminTaskList()" class="admin-btn delete">取消</button>
  `;
}

function adminSaveTask(taskId) {
  const newLabel = document.getElementById('editLabel_' + taskId).value.trim();
  const newReward = parseInt(document.getElementById('editReward_' + taskId).value);
  if (!newLabel) { showToast('❌ 請輸入任務名稱'); return; }
  if (isNaN(newReward) || newReward < 1) { showToast('❌ 請輸入有效的金幣數'); return; }
  updateTaskDef(taskId, newLabel, newReward);
  renderAdminTaskList();
  showToast('✅ 任務已更新');
}

function adminDeleteTask(taskId) {
  if (!confirm('確定要刪除這個任務嗎？\n（成員的任務狀態也會一併清除）')) return;
  removeTaskDef(taskId);
  renderAdminTaskList();
  showToast('🗑️ 任務已刪除');
}

function adminAddTask() {
  const nameInput = document.getElementById('adminTaskName');
  const rewardInput = document.getElementById('adminTaskReward');
  const label = nameInput.value.trim();
  const reward = parseInt(rewardInput.value);

  if (!label) { showToast('❌ 請輸入任務名稱'); return; }
  if (isNaN(reward) || reward < 1) { showToast('❌ 請輸入有效的金幣數'); return; }

  addTaskDef(label, reward);
  nameInput.value = '';
  rewardInput.value = '';
  renderAdminTaskList();
  showToast(`✅ 已新增任務：${label}（+${reward}💰）`);
}

// ====== 管理後台 - 成員管理 ======
function renderAdminMemberList() {
  const container = document.getElementById('adminMemberList');
  const data = getData();

  if (data.members.length === 0) {
    container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">目前沒有成員</p>';
    return;
  }

  container.innerHTML = data.members.map(m => {
    const hasPwd = hasMemberPassword(m.id);
    return `
    <div class="admin-member-item">
      <span class="admin-member-avatar">${m.avatar || '👤'}</span>
      <span class="admin-member-name">
        ${m.name}
        <span class="admin-pwd-status ${hasPwd ? 'locked' : 'unlocked'}">${hasPwd ? '🔒 已設定' : '🔓 無密碼'}</span>
      </span>
      <button onclick="adminSetMemberPwd('${m.id}')" class="admin-btn edit">${hasPwd ? '🔑 修改' : '🔑 設定密碼'}</button>
      ${hasPwd ? `<button onclick="clearMemberPassword('${m.id}')" class="admin-btn delete">🔓 清除</button>` : ''}
      <button onclick="adminDeleteMember('${m.id}')" class="admin-btn delete">🗑️ 刪除</button>
    </div>`;
  }).join('');
}

function adminSetMemberPwd(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  const newPwd = prompt(`為「${member.name}」設定新密碼（至少 4 位，留空 = 取消）`);
  if (!newPwd) return;
  if (newPwd.length < 4) { showToast('❌ 密碼至少 4 位'); return; }
  setMemberPassword(memberId, newPwd);
  renderAdminMemberList();
  showToast(`🔑 ${member.name} 的密碼已設定`);
}

// ====== 管理後台 - 發送獎勵 ======
function renderAdminBonusSection() {
  const container = document.getElementById('bonusMemberSelect');
  if (!container) return;
  const data = getData();
  container.innerHTML = `
    <div style="width:100%;margin-bottom:6px;">
      <label style="font-size:0.8rem;cursor:pointer;color:var(--text-muted);" onclick="toggleAllBonusMembers()">
        ☑️ 全選 / 取消
      </label>
    </div>
  ` + data.members.map(m => `
    <label class="bonus-member-item">
      <input type="checkbox" class="bonus-check" value="${m.id}">
      <span>${m.avatar || '👤'} ${m.name}</span>
    </label>
  `).join('');
}

function toggleAllBonusMembers() {
  const checks = document.querySelectorAll('.bonus-check');
  const someUnchecked = Array.from(checks).some(c => !c.checked);
  checks.forEach(c => c.checked = someUnchecked);
}

function sendBonusFromAdmin() {
  const checked = document.querySelectorAll('.bonus-check:checked');
  if (checked.length === 0) { showToast('❌ 請選擇至少一位成員'); return; }

  const amount = parseInt(document.getElementById('bonusAmount').value);
  const reason = document.getElementById('bonusReason').value.trim();

  if (!amount || amount < 1) { showToast('❌ 請輸入有效的金幣數量'); return; }

  const data = getData();
  let sentCount = 0;
  let names = [];

  checked.forEach(cb => {
    const ok = sendBonus(cb.value, amount, reason);
    if (ok) {
      sentCount++;
      const member = data.members.find(m => m.id === cb.value);
      if (member) names.push(member.name);
    }
  });

  document.getElementById('bonusAmount').value = '';
  document.getElementById('bonusReason').value = '';

  showToast(`🧧 已發送 +${amount}💰 給 ${names.join('、')}${reason ? '（' + reason + '）' : ''}`);
  refreshUI();
}

function adminDeleteMember(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  if (!confirm(`確定要刪除「${member.name}」嗎？\n（金幣、寵物等資料都會清除）`)) return;
  removeMember(memberId);
  renderAdminMemberList();
  showToast(`🗑️ 已刪除 ${member.name}`);
}

function renderAdminAvatarSelector() {
  const container = document.getElementById('adminAvatarSelector');
  if (!container) return;
  const emojis = ['👦', '👧', '🧒', '👶', '🌟', '🦸', '🧑‍🦰', '👱', '🐱', '🐶', '🐰', '🦊', '🐼', '🐨'];
  container.innerHTML = emojis.map(e => `
    <span class="avatar-option ${selectedAdminAvatar === e ? 'active' : ''}"
          onclick="selectedAdminAvatar='${e}';renderAdminAvatarSelector();">${e}</span>
  `).join('');
}

function adminAddMember() {
  const input = document.getElementById('adminMemberName');
  const name = input.value.trim();
  if (!name) { showToast('❌ 請輸入成員名稱'); return; }
  addMember(name, selectedAdminAvatar);
  input.value = '';
  selectedAdminAvatar = '👤';
  renderAdminMemberList();
  renderAdminAvatarSelector();
  showToast(`🎉 已新增成員：${name}`);
}

// ====== 管理後台 - 待審核任務 ======
function renderAdminPendingTasks() {
  const container = document.getElementById('adminPendingTasks');
  const data = getData();
  const tasks = getTaskDefs();
  let hasPending = false;
  let html = '';

  data.members.forEach(m => {
    const pendings = tasks.filter(t => m.todayTasks[t.id] === 'pending');
    if (pendings.length === 0) return;
    hasPending = true;
    html += `<div class="admin-pending-member">
      <strong>${m.avatar || '👤'} ${m.name}</strong>
      <div class="admin-pending-batch">
        <button onclick="adminApproveAllMemberTasks('${m.id}')" class="admin-btn save" style="font-size:0.75rem;">✅ 全部確認</button>
        <button onclick="adminRejectAllMemberTasks('${m.id}')" class="admin-btn delete" style="font-size:0.75rem;">❌ 全部退回</button>
      </div>
    </div>`;
    pendings.forEach(t => {
      html += `
        <div class="admin-pending-item">
          <span class="admin-pending-label">${t.label}</span>
          <span class="admin-pending-reward">💰 +${t.reward}</span>
          <button onclick="adminApproveTask('${m.id}','${t.id}')" class="admin-btn save">✅ 確認</button>
          <button onclick="adminRejectTask('${m.id}','${t.id}')" class="admin-btn delete">❌ 退回</button>
        </div>
      `;
    });
  });

  if (!hasPending) {
    html = '<p style="color:#999;text-align:center;padding:16px;">目前沒有待審核的任務 🎉</p>';
  }
  container.innerHTML = html;
}

function adminApproveAllMemberTasks(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  const tasks = getTaskDefs();
  const pendings = tasks.filter(t => member.todayTasks[t.id] === 'pending');
  if (pendings.length === 0) return;
  let count = 0;
  pendings.forEach(t => { if (approveTask(memberId, t.id)) count++; });
  renderAdminPendingTasks();
  renderAdminMemberList();
  showToast(`✅ 已確認 ${member.name} 的 ${count} 項任務`);
}

function adminRejectAllMemberTasks(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  const tasks = getTaskDefs();
  const pendings = tasks.filter(t => member.todayTasks[t.id] === 'pending');
  if (pendings.length === 0) return;
  let count = 0;
  pendings.forEach(t => { if (rejectTask(memberId, t.id)) count++; });
  renderAdminPendingTasks();
  showToast(`↩️ 已退回 ${member.name} 的 ${count} 項任務`);
}

function adminApproveTask(memberId, taskId) {
  const ok = approveTask(memberId, taskId);
  if (!ok) { showToast('❌ 審核失敗'); return; }
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  const tasks = getTaskDefs();
  const task = tasks.find(t => t.id === taskId);
  renderAdminPendingTasks();
  renderAdminMemberList();
  showToast(`✅ 已確認 ${member ? member.name : ''} 的「${task ? task.label : ''}」+${task ? task.reward : 0}💰`);
}

function adminRejectTask(memberId, taskId) {
  const ok = rejectTask(memberId, taskId);
  if (!ok) { showToast('❌ 退回失敗'); return; }
  renderAdminPendingTasks();
  showToast('↩️ 已退回，任務待重新提交');
}

// ====== 管理後台 - 主題選擇 ======
function renderThemeSelector() {
  const container = document.getElementById('themeSelector');
  const current = getSavedTheme();
  const themes = [
    { id: '', label: '💖 粉萌樂園', cls: 'pink' },
    { id: 'game', label: '🎮 電玩冒險', cls: 'game' },
    { id: 'rainbow', label: '🌈 彩虹派對', cls: 'rainbow' },
    { id: 'neutral', label: '🐚 中性簡約', cls: 'neutral' },
    { id: 'macaron', label: '🍬 馬卡龍派對', cls: 'macaron' }
  ];

  container.innerHTML = themes.map(t => `
    <button class="theme-btn theme-${t.cls} ${current === t.id ? 'active' : ''}"
            onclick="switchTheme('${t.id}')">${t.label}</button>
  `).join('');
}

function switchTheme(theme) {
  saveTheme(theme);
  document.body.className = theme ? 'theme-' + theme : '';
  renderThemeSelector();
  const msgs = { '': '💖 已切換為粉萌樂園', game: '🎮 已切換為電玩冒險', rainbow: '🌈 已切換為彩虹派對', neutral: '🐚 已切換為中性簡約', macaron: '🍬 已切換為馬卡龍派對' };
  showToast(msgs[theme] || '已切換主題');
}

// ====== 初始化 / 成員選擇 ======
function initGame() {
  let data = getData();

  if (data.members.length === 0) {
    const defaults = getDefaultMembers();
    defaults.forEach(d => {
      const id = 'member_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      data.members.push({
        id,
        name: d.name,
        avatar: d.avatar,
        coins: 30,
        freePulls: 0,
        exams: [],
        todayEarned: 0,
        pets: [],
        todayTasks: {},
        lastBossAt: null,
        password: '',
        expedition: null,
        expeditionRewards: 0,
        lastExpeditionDate: null,
        lowAnimMode: false,
        createdAt: new Date().toISOString()
      });
    });
    data.currentMember = data.members[0].id;
    saveData(data);
  }

  const today = new Date().toDateString();
  const lastReset = localStorage.getItem('familyPet_lastReset');
  if (lastReset !== today) {
    resetDailyTasks();
    localStorage.setItem('familyPet_lastReset', today);
  }

  const savedTheme = getSavedTheme();
  document.body.className = savedTheme ? 'theme-' + savedTheme : '';
  if (getLowAnimMode()) document.body.classList.add('low-anim');

  refreshUI();
}

// ====== 首頁統計 ======
function getTotalDailyPossible() {
  const tasks = getTaskDefs();
  let total = 0;
  tasks.forEach(t => total += t.reward);
  return total || 50;
}

function updateHomeStats() {
  const member = getCurrentMember();
  if (!member) return;
  document.getElementById('statCoins').textContent = member.coins;
  document.getElementById('statPets').textContent = member.pets.length;
  const collected = new Set(member.pets.map(p => p.templateId)).size;
  document.getElementById('statAlbum').textContent = collected + ' / 126';

  const todayEarned = getTodayEarned(member.id);
  const totalPossible = getTotalDailyPossible();
  const progressBar = document.getElementById('todayProgress');
  const progressLabel = document.getElementById('progressLabel');
  if (progressBar) {
    const pct = Math.min(100, (todayEarned / totalPossible) * 100);
    progressBar.style.width = pct + '%';
  }
  if (progressLabel) {
    progressLabel.textContent = `${todayEarned} / ${totalPossible} 💰`;
  }

  const pullsEl = document.getElementById('statPulls');
  if (pullsEl) {
    const coinPulls = Math.floor(member.coins / GACHA_COST);
    const freePulls = member.freePulls || 0;
    pullsEl.textContent = coinPulls + freePulls;
  }

  const badge = document.getElementById('freePullBadge');
  if (badge) {
    const count = member.freePulls || 0;
    badge.textContent = `🎫 免費抽 x ${count}`;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// ====== 任務清單（可切換）=====
function renderTasks() {
  const container = document.getElementById('taskList');
  const member = getCurrentMember();
  if (!member) { container.innerHTML = '<p>請先選擇家庭成員</p>'; return; }

  const todayEarned = getTodayEarned(member.id);
  const tasks = getTaskDefs();
  let totalPossible = 0;
  tasks.forEach(t => totalPossible += t.reward);

  const progressPct = totalPossible > 0 ? Math.min(100, (todayEarned / totalPossible) * 100) : 0;

  let pendingTotal = 0;
  let availableTotal = 0;
  tasks.forEach(task => {
    const state = member.todayTasks[task.id];
    if (state === 'approved' || state === true) return;
    if (state === 'pending') pendingTotal += task.reward;
    else availableTotal += task.reward;
  });

  let html = `
    <div class="task-progress">
      <div class="task-progress-label">📅 今日已賺：<strong>${todayEarned}</strong> 💰</div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="task-summary">
        <div class="task-summary-item pending">⏳ 待審核：<strong>+${pendingTotal}</strong>💰</div>
        <div class="task-summary-item available">📋 可完成：<strong>+${availableTotal}</strong>💰</div>
      </div>
    </div>
  `;

  html += tasks.map(task => {
    const state = member.todayTasks[task.id];
    let btnClass, btnText, disabled;
    if (state === 'approved' || state === true) {
      btnClass = 'done';
      btnText = '✅ 已完成';
      disabled = true;
    } else if (state === 'pending') {
      btnClass = 'pending-review';
      btnText = '⏳ 待審核';
      disabled = false;
    } else {
      btnClass = 'pending';
      btnText = '⏳ 未完成';
      disabled = false;
    }
    return `
      <div class="task-item">
        <div class="task-info">
          <h4>${task.label}</h4>
          <span class="task-reward">💰 +${task.reward}</span>
        </div>
        <button class="task-btn ${btnClass}" onclick="handleTask('${task.id}')" ${disabled ? 'disabled' : ''}>
          ${btnText}
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function handleTask(taskId) {
  const member = getCurrentMember();
  if (!member) return;
  const tasks = getTaskDefs();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const state = member.todayTasks[taskId];
  if (state === 'approved' || state === true) return;
  if (state === 'pending') {
    cancelTask(member.id, taskId);
    showToast(`↩️ ${task.label} 已取消提交`);
  } else {
    submitTask(member.id, taskId);
    showToast(`📨 ${task.label} 已送出，等待家長確認`);
  }
  refreshUI();
}

// ====== 扭蛋系統 ======
function pullGacha() {
  const member = getCurrentMember();
  if (!member || !window.PET_DATABASE) return;

  let usedFreePull = false;
  if (member.freePulls > 0) {
    useFreePull(member.id);
    usedFreePull = true;
  } else if (member.coins < GACHA_COST) {
    alert('💰 金幣不夠！趕快去完成任務賺金幣吧！');
    return;
  } else {
    spendCoins(member.id, GACHA_COST);
  }

  const allPets = window.PET_DATABASE;
  const roll = Math.random();
  let pool;
  if (roll < 0.9) {
    pool = allPets.filter(p => !p.isLegendary && p.stage === 1);
  } else if (roll < 0.98) {
    pool = allPets.filter(p => p.isLegendary === false && p.stage === 1);
  } else {
    pool = allPets.filter(p => p.isLegendary === true);
  }

  if (!pool.length) pool = allPets.filter(p => !p.isLegendary && p.stage === 1);
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  const result = addPetToMember(member.id, chosen.id);

  const resultDiv = document.getElementById('gachaResult');
  resultDiv.classList.remove('hidden');
  resultDiv.className = 'gacha-result';
  resultDiv.innerHTML = `
    <div class="gacha-capsule-phase">
      <div class="gacha-capsule ${chosen.isLegendary ? 'legendary' : ''}">🎁</div>
      <div class="gacha-capsule-label">🎰 扭蛋轉動中...</div>
    </div>
  `;

  setTimeout(() => {
    const capsule = resultDiv.querySelector('.gacha-capsule');
    if (capsule) capsule.classList.add('open');

    setTimeout(() => {
      if (result.type === 'evolution') {
        resultDiv.className = 'gacha-result';
        resultDiv.innerHTML = `
          <div class="gacha-card-reveal">
            <h3>🎉 重複寵物！觸發進化！</h3>
            <p style="color:var(--success);font-weight:bold;margin:12px 0;">
              ${result.oldTemplate.name} → ${result.newTemplate.name}
            </p>
            <p>${usedFreePull ? '🎫 使用免費抽獎券' : '💰 花費 30 金幣'}</p>
          </div>
        `;
        refreshUI();
        setTimeout(() => showEvoModal(result.oldTemplate, result.newTemplate), 600);
      } else if (result.type === 'duplicate') {
        resultDiv.className = 'gacha-result';
        resultDiv.innerHTML = `
          <div class="gacha-card-reveal">
            <h3>🔄 重複寵物！戰力提升！</h3>
            <p>${chosen.name} 戰力 +20（當前 ${result.pet.power}）</p>
            <p>${usedFreePull ? '🎫 使用免費抽獎券' : '💰 花費 30 金幣'}</p>
          </div>
        `;
        refreshUI();
      } else {
        resultDiv.className = 'gacha-result ' + (chosen.isLegendary ? 'legendary-reveal' : '');
        resultDiv.innerHTML = `
          ${chosen.isLegendary ? '<div class="gacha-sparkle-burst"></div>' : ''}
          <div class="gacha-card-reveal">
            <h3>🎉 獲得 ${chosen.name}！</h3>
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${getTypeColor(chosen.type)};color:white;font-size:0.8rem;margin:8px 0;">
              ${chosen.type}
            </span>
            <p>${chosen.isLegendary ? '🌟 傳說寵物！' : '階段 ' + chosen.stage}</p>
            ${usedFreePull ? '<p style="color:#f59e0b;font-weight:bold;">🎫 使用免費抽獎券</p>' : ''}
            <img src="${getImageUrl(chosen.id)}" alt="${chosen.name}"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${chosen.emoji||'🐾'}</text></svg>'">
          </div>
        `;
        refreshUI();
      }
    }, 700);
  }, 1200);
}

// ====== 寵物列表 ======
function renderPetList() {
  const container = document.getElementById('petList');
  const member = getCurrentMember();
  if (!member) { container.innerHTML = '<p>還沒有寵物，去抽扭蛋吧！</p>'; return; }

  if (member.pets.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">還沒有寵物 🥺<br>去扭蛋頁面抽一隻吧！</p>';
    return;
  }

  container.innerHTML = member.pets.map(pet => `
    <div class="pet-card ${pet.isLegendary ? 'legendary' : ''}" onclick="showPetCard('${pet.instanceId}')">
      <img src="${getImageUrl(pet.templateId)}"
           alt="${pet.name}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🐾</text></svg>'">
      <div class="pet-name">${pet.name}</div>
      <span style="display:inline-block;padding:2px 8px;border-radius:8px;background:${getTypeColor(pet.type)};color:white;font-size:0.7rem;">
        ${pet.type}
      </span>
      <div class="pet-stage">${pet.isLegendary ? '🌟 傳說' : '階段 ' + pet.stage}</div>
      <div class="pet-power-badge">⚔️ ${pet.power || 0}</div>
    </div>
  `).join('');
}

// ====== 圖鑑 ======
function renderAlbum() {
  const container = document.getElementById('albumGrid');
  const member = getCurrentMember();
  if (!member || !window.PET_DATABASE) return;

  const collectedIds = new Set(member.pets.map(p => p.templateId));

  container.innerHTML = window.PET_DATABASE.map(pet => {
    const has = collectedIds.has(pet.id);
    const member = getCurrentMember();
    const ownedPet = has ? member.pets.find(p => p.templateId === pet.id) : null;
    return `
      <div class="pet-card ${has ? '' : 'unknown'}" ${ownedPet ? `onclick="showPetCard('${ownedPet.instanceId}')"` : ''}>
        <img src="${has ? getImageUrl(pet.id) : ''}"
             alt="${pet.name}"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${has ? (pet.emoji||'🐾') : '❓'}</text></svg>'">
        <div class="pet-name">${has ? pet.name : '???'}</div>
        ${has ? `<span style="display:inline-block;padding:2px 8px;border-radius:8px;background:${getTypeColor(pet.type)};color:white;font-size:0.7rem;">${pet.type}</span>` : ''}
        <div class="pet-stage">${pet.isLegendary ? '🌟 傳說' : '階 ' + pet.stage}</div>
      </div>
    `;
  }).join('');

  document.getElementById('albumProgress').textContent = collectedIds.size;
}

// ====== 考試系統 ======
function handleExamSubmit() {
  const member = getCurrentMember();
  if (!member) return;

  const subject = document.getElementById('examSubject').value.trim();
  const score = parseInt(document.getElementById('examScore').value);

  if (!subject) { alert('請輸入科目名稱'); return; }
  if (isNaN(score) || score < 0 || score > 100) { alert('請輸入 0~100 的分數'); return; }

  const result = addExam(member.id, subject, score);
  if (!result || (result.coinsEarned === 0 && result.freePullEarned === 0)) {
    alert('❌ 考 98 分以上才有獎勵喔，繼續加油！');
  } else {
    let msg = `🎉 ${subject} ${score} 分！`;
    if (result.coinsEarned > 0) msg += ` +${result.coinsEarned}💰`;
    if (result.freePullEarned > 0) msg += ` 🎫 免費一抽！`;
    showToast(msg);

    const resultDiv = document.getElementById('examResult');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `<div class="exam-reward">${msg}</div>`;
  }

  document.getElementById('examSubject').value = '';
  document.getElementById('examScore').value = '';
  refreshUI();
}

function renderExamHistory() {
  const member = getCurrentMember();
  const container = document.getElementById('examHistory');
  if (!member || !container) return;

  if (!member.exams || member.exams.length === 0) {
    container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">還沒有考試紀錄</p>';
    return;
  }

  container.innerHTML = [...member.exams].reverse().slice(0, 30).map(record => {
    const date = new Date(record.date).toLocaleDateString('zh-TW');
    let reward = '';
    if (record.coinsEarned > 0) reward += `+${record.coinsEarned}💰`;
    if (record.freePullEarned > 0) reward += ` 🎫`;
    return `<div class="exam-record">
      <span class="exam-date">${date}</span>
      <strong class="exam-subject">${record.subject}</strong>
      <span class="exam-score ${record.score >= 100 ? 'perfect' : record.score >= 98 ? 'great' : ''}">${record.score} 分</span>
      ${reward ? `<span class="exam-reward-badge">${reward}</span>` : '<span class="exam-no-reward">-</span>'}
    </div>`;
  }).join('');
}

// ====== 扭蛋 UI 更新 ======
function updateGachaUI() {
  const member = getCurrentMember();
  const btn = document.getElementById('gachaBtn');
  const freeInfo = document.getElementById('freePullInfo');
  if (!btn || !member) return;

  const freePulls = member.freePulls || 0;
  if (freePulls > 0) {
    btn.innerHTML = `<span>🎁</span><span>🎫 免費抽一次</span>`;
    if (freeInfo) {
      freeInfo.style.display = 'inline-block';
      freeInfo.textContent = `🎫 還有 ${freePulls} 張免費抽獎券 🎉`;
    }
  } else {
    btn.innerHTML = `<span>🎁</span><span>抽一次（30💰）</span>`;
    if (freeInfo) freeInfo.style.display = 'none';
  }
}

// ====== Toast 通知 ======
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ====== 寵物卡片彈窗 ======
function showPetCard(instanceId) {
  const member = getCurrentMember();
  if (!member) return;
  const pet = member.pets.find(p => p.instanceId === instanceId);
  if (!pet || !window.PET_DATABASE) return;

  const template = window.PET_DATABASE.find(p => p.id === pet.templateId);
  const modal = document.getElementById('petCardModal');
  const content = document.getElementById('petCardContent');

  document.getElementById('petCardName').textContent = pet.name;
  const badge = document.getElementById('petCardTypeBadge');
  badge.textContent = pet.type;
  badge.style.background = getTypeColor(pet.type);

  document.getElementById('petCardStage').textContent = pet.isLegendary ? '🌟 傳說寵物' : `第 ${pet.stage} 階段`;
  document.getElementById('petCardImage').src = getImageUrl(pet.templateId);
  document.getElementById('petCardType').textContent = pet.type;
  document.getElementById('petCardPower').textContent = pet.power || 0;
  document.getElementById('petCardStageInfo').textContent = pet.isLegendary ? '傳說' : `階段 ${pet.stage}`;
  document.getElementById('petCardDate').textContent = new Date(pet.obtainedAt).toLocaleDateString('zh-TW');

  // Evolution chain
  const evoContainer = document.getElementById('petCardEvolution');
  const chain = getEvolutionChain(pet.templateId);
  if (chain && chain.length > 1) {
    evoContainer.innerHTML = '<div class="evo-chain-label">進化階段</div><div class="evo-chain">' +
      chain.map((c, i) => {
        const isCurrent = c.id === pet.templateId;
        const isOwned = member.pets.some(p => p.templateId === c.id);
        return `<div class="evo-chain-step ${isCurrent ? 'current' : ''} ${isOwned ? 'owned' : ''}">
          <img src="${getImageUrl(c.id)}" alt="${c.name}" onerror="this.style.display='none'">
          <span>${c.name}</span>
          ${isCurrent ? '<span class="evo-current-badge">✓</span>' : ''}
        </div>${i < chain.length - 1 ? '<span class="evo-chain-arrow">→</span>' : ''}`;
      }).join('') + '</div>';
  } else {
    evoContainer.innerHTML = '';
  }

  // Legendary effects
  const sparkle = document.getElementById('petCardSparkle');
  if (pet.isLegendary) {
    content.classList.add('legendary-card');
    sparkle.style.display = 'block';
  } else {
    content.classList.remove('legendary-card');
    sparkle.style.display = 'none';
  }

  modal.classList.remove('hidden');
}

function closePetCard(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('petCardModal').classList.add('hidden');
}

// ====== 進化動畫 ======
function showEvoModal(oldTemplate, newTemplate) {
  const modal = document.getElementById('evoModal');
  document.getElementById('evoSubtitle').textContent =
    `${getCurrentMember()?.name || ''} 的 ${oldTemplate.name} 累積能量，進化成新姿態！`;
  document.getElementById('evoBeforeImg').src = getImageUrl(oldTemplate.id);
  document.getElementById('evoBeforeName').textContent = oldTemplate.name;
  document.getElementById('evoAfterImg').src = getImageUrl(newTemplate.id);
  document.getElementById('evoAfterName').textContent = newTemplate.name;
  modal.classList.remove('hidden');
}

function closeEvoModal() {
  document.getElementById('evoModal').classList.add('hidden');
}

// ====== Boss 戰 ======
function renderBossPage() {
  const member = getCurrentMember();
  const container = document.getElementById('bossList');
  const cooldownEl = document.getElementById('bossCooldown');
  const resultEl = document.getElementById('bossBattleResult');
  if (!member || !container) return;

  if (!member.pets || member.pets.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">還沒有寵物，先去抽扭蛋吧！</p>';
    return;
  }

  const canFight = canFightBoss(member.id);
  if (!canFight) {
    const remaining = getBossCooldownRemaining(member.id);
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    cooldownEl.style.display = 'block';
    cooldownEl.innerHTML = `⏳ 冷卻中，還剩 ${hours} 小時 ${mins} 分鐘`;
  } else {
    cooldownEl.style.display = 'none';
  }

  const unlocked = getUnlockedBosses();
  const strongest = [...member.pets].sort((a, b) => (b.power || 0) - (a.power || 0))[0];

  container.innerHTML = unlocked.map(boss => `
    <div class="boss-card ${!canFight ? 'disabled' : ''}">
      <div class="boss-emoji">${boss.emoji}</div>
      <div class="boss-info">
        <div class="boss-name">${boss.name}</div>
        <span class="boss-type" style="background:${boss.color}">${boss.type}</span>
        <div class="boss-stats">
          <span>❤️ ${boss.hp} HP</span>
          <span>💰 ${boss.reward}</span>
        </div>
      </div>
      <div class="boss-pet-select">
        <div class="boss-strongest">
          最強：${strongest ? `${strongest.name} (⚔️${strongest.power || 0})` : '無寵物'}
          <span class="boss-type-tag" style="background:${getTypeColor(strongest?.type || '一般')}">${strongest?.type || '-'}</span>
        </div>
        <button class="boss-fight-btn" onclick="startBossFight(${boss.id}, '${strongest?.instanceId || ''}')"
                ${!canFight || !strongest ? 'disabled' : ''}>
          ⚔️ 挑戰
        </button>
      </div>
      ${canFight && strongest ? `<div class="boss-advantage-hint">${TYPE_ADVANTAGE[strongest.type]?.includes(boss.type) ? '✨ 屬性相剋！' : '一般攻擊'}</div>` : ''}
    </div>
  `).join('');
}

function startBossFight(bossId, petInstanceId) {
  const member = getCurrentMember();
  if (!member) return;

  const pet = member.pets.find(p => p.instanceId === petInstanceId);
  const boss = BOSSES.find(b => b.id === bossId);
  if (!pet || !boss) return;

  // 計算寵物攻擊
  const petAttack = calcBattleDamage(pet.power || 0, pet.type, boss.type);
  // 計算 Boss 反擊（以血量/8 作為 Boss 的攻擊力）
  const bossPower = Math.max(10, Math.floor(boss.hp / 8));
  const bossAttack = calcBattleDamage(bossPower, boss.type, pet.type);

  const resultEl = document.getElementById('bossBattleResult');
  resultEl.classList.remove('hidden');
  resultEl.className = 'boss-result';

  resultEl.innerHTML = `
    <div class="battle-scene">
      <div class="battle-arena">
        <div class="battle-combatant battle-pet-side">
          <img src="${getImageUrl(pet.templateId)}" alt="${pet.name}" class="battle-pet-img"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🐾</text></svg>'">
          <div class="battle-combatant-name">${pet.name}</div>
        </div>
        <div class="battle-vs-area">⚔️</div>
        <div class="battle-combatant battle-boss-side">
          <div class="boss-emoji-large">${boss.emoji}</div>
          <div class="battle-combatant-name">${boss.name}</div>
        </div>
      </div>
      <div class="battle-projectiles" id="battleProjectiles"></div>
      <div class="battle-damage-overlay" id="battleDamageDisplay"></div>
      <p class="battle-fight-label" id="battleFightLabel">⚔️ ${pet.name} 發動攻擊！</p>
    </div>
  `;

  // === Phase 1：寵物攻擊 Boss ===
  setTimeout(() => {
    const el = document.getElementById('battleProjectiles');
    if (!el) return;
    for (let i = 0; i < 3; i++) {
      const p = document.createElement('div');
      p.className = 'battle-projectile pet-attack';
      p.style.setProperty('--i', i);
      p.style.background = getTypeColor(pet.type);
      el.appendChild(p);
    }
  }, 200);

  // 顯示寵物傷害 + Boss 命中特效
  setTimeout(() => {
    const dmgEl = document.getElementById('battleDamageDisplay');
    if (dmgEl) dmgEl.innerHTML = `
      <div class="battle-hit-flash pet-hit"></div>
      <div class="battle-damage-pop pet-damage">-${petAttack.damage}</div>
    `;
    const label = document.getElementById('battleFightLabel');
    if (label) label.innerHTML = `${petAttack.isAdvantage ? '✨ 屬性相剋！' : '一般攻擊'} ${pet.name} 造成 <strong>${petAttack.damage}</strong> 傷害！`;
  }, 1200);

  // === Phase 2：Boss 反擊 ===
  setTimeout(() => {
    const el = document.getElementById('battleProjectiles');
    if (el) {
      el.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const p = document.createElement('div');
        p.className = 'battle-projectile boss-attack';
        p.style.setProperty('--i', i);
        p.style.background = boss.color;
        el.appendChild(p);
      }
    }
    const label = document.getElementById('battleFightLabel');
    if (label) label.textContent = `⚔️ ${boss.name} 反擊！`;
  }, 1700);

  // 顯示 Boss 傷害 + 寵物命中特效
  setTimeout(() => {
    const dmgEl = document.getElementById('battleDamageDisplay');
    if (dmgEl) dmgEl.innerHTML += `
      <div class="battle-hit-flash boss-hit"></div>
      <div class="battle-damage-pop boss-damage">-${bossAttack.damage}</div>
    `;
    const label = document.getElementById('battleFightLabel');
    if (label) label.innerHTML = `${bossAttack.isAdvantage ? '✨ 屬性相剋！' : ''} ${boss.name} 造成 <strong>${bossAttack.damage}</strong> 傷害！`;
  }, 2700);

  // === Phase 3：結算 ===
  setTimeout(() => {
    const result = fightBoss(member.id, bossId, petInstanceId);
    if (!result || result.error) {
      resultEl.innerHTML = `<p style="color:var(--accent-red);padding:30px;text-align:center;">❌ ${result?.error || '戰鬥失敗'}</p>`;
      return;
    }

    // 二連擊總傷害顯示
    const totalPetDmg = petAttack.damage;
    const totalBossDmg = bossAttack.damage;
    const resultHtml = result.win ? `
      <div class="battle-result-box battle-win-box">
        <div class="battle-hit-burst"></div>
        <h3>🎉 勝利！</h3>
        <div class="battle-exchange">
          <span>⚔️ ${totalPetDmg} 👉</span>
          <span>👈 ${totalBossDmg} ⚔️</span>
        </div>
        <div class="battle-tag">${petAttack.isAdvantage ? '✨ 屬性相剋' : '一般攻擊'}</div>
        <div class="battle-reward">💰 +${result.reward} 金幣</div>
      </div>
    ` : `
      <div class="battle-result-box battle-lose-box">
        <h3>💪 還差一點！</h3>
        <div class="battle-exchange">
          <span>⚔️ ${totalPetDmg} 👉</span>
          <span>👈 ${totalBossDmg} ⚔️</span>
        </div>
        <div class="battle-tag">${petAttack.isAdvantage ? '✨ 屬性相剋' : '一般攻擊'}</div>
        <p style="color:var(--text-muted);margin:8px 0;">繼續培養寵物再來挑戰！</p>
      </div>
    `;
    resultEl.innerHTML = resultHtml + `
      <button class="boss-fight-btn" style="display:block;margin:14px auto;" onclick="document.getElementById('bossBattleResult').classList.add('hidden');renderBossPage();">確認</button>
    `;
    renderBossPage();
    updateNavCoins();
    refreshUI();
  }, 3500);
}

// ====== 遠征探險 ======
function renderExpedition() {
  const member = getCurrentMember();
  const statusEl = document.getElementById('expeditionStatus');
  const teamEl = document.getElementById('expeditionTeam');
  const resultEl = document.getElementById('expeditionResult');
  if (!member || !statusEl) return;

  const expStatus = getExpeditionStatus(member.id);

  if (expStatus && expStatus.status === 'completed') {
    statusEl.innerHTML = `
      <div class="expedition-complete">
        <p>🎊 遠征完成！</p>
        <button class="expedition-claim-btn" onclick="claimExpedition()">🎁 領取獎勵</button>
      </div>
    `;
    teamEl.innerHTML = '';
    return;
  }

  if (expStatus && expStatus.status === 'ongoing') {
    const pct = Math.floor(expStatus.progress);
    const remainingSec = Math.ceil((expStatus.remaining || 0) / 1000);
    const expPets = (member.expedition?.petIds || []).map(id => member.pets.find(p => p.instanceId === id)).filter(Boolean);
    const petImages = expPets.map(p => `
      <img src="${getImageUrl(p.templateId)}" alt="${p.name}" class="expedition-travel-pet"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🐾</text></svg>'">
    `).join('');
    statusEl.innerHTML = `
      <div class="expedition-travel">
        <div class="expedition-sky"></div>
        <div class="expedition-mountains"></div>
        <div class="expedition-ground"></div>
        <div class="expedition-pets-row">${petImages}</div>
        <div class="expedition-chest">🗺️</div>
        <div class="expedition-travel-progress">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="expedition-pct">${pct}%</span>
        </div>
        <div class="expedition-time">⏱️ 約 ${remainingSec} 秒</div>
      </div>
    `;
    teamEl.innerHTML = '';
    return;
  }

  // Not started - show requirement + reward info
  const check = canStartExpedition(member.id);
  const done = getCompletedTaskCount(member.id);
  const rewardInfo = getExpeditionRewardInfo();
  const today = new Date().toDateString();
  const alreadyDone = member.lastExpeditionDate === today;

  statusEl.innerHTML = `
    <div class="expedition-info">
      <div class="expedition-req ${check.ok ? 'req-met' : 'req-locked'}">
        <strong>🔒 遠征條件</strong>
        <p>📋 今日完成任務：${done} / ${EXPEDITION_REQUIRED_TASKS} ${done >= EXPEDITION_REQUIRED_TASKS ? '✅' : '❌'}</p>
        <p>📅 每日限制：${alreadyDone ? '❌ 已用過' : '✅ 還可遠征'}</p>
        ${!check.ok ? `<p class="expedition-reason">${check.reason}</p>` : '<p class="expedition-reason" style="color:var(--success);">✅ 條件滿足，可以出發！</p>'}
      </div>
      <div class="expedition-rewards-info">
        <strong>🎁 遠征獎勵</strong>
        <table class="expedition-reward-table">
          <tr><th>派出寵物</th><th>基礎獎勵</th></tr>
          ${rewardInfo.examples.map(ex => `<tr><td>${ex.pets} 隻</td><td>💰 +${ex.total}</td></tr>`).join('')}
        </table>
        <p class="expedition-bonus-info">🌟 額外驚喜（${Math.round(rewardInfo.bonusChance * 100)}% 機率）：+${rewardInfo.bonusMin}~${rewardInfo.bonusMax}💰</p>
      </div>
    </div>
  `;

  if (!check.ok || !member.pets || member.pets.length === 0) {
    teamEl.innerHTML = '';
    return;
  }

  selectedExpeditionPets = [];
  teamEl.innerHTML = `
    <div class="expedition-pick">
      <p style="margin-bottom:10px;">點選寵物加入遠征隊伍（最多 3 隻）</p>
      <div class="expedition-pets">${member.pets.map(p => `
        <div class="expedition-pet-option" data-id="${p.instanceId}" onclick="toggleExpeditionPet(this)">
          <img src="${getImageUrl(p.templateId)}" alt="${p.name}"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🐾</text></svg>'">
          <div class="expedition-pet-name">${p.name}</div>
          <div class="expedition-pet-power">⚔️${p.power || 0}</div>
        </div>
      `).join('')}</div>
      <button class="expedition-start-btn" onclick="startExpeditionUI()" disabled id="expeditionStartBtn">
        🌍 出發！
      </button>
    </div>
  `;
}

let selectedExpeditionPets = [];

function toggleExpeditionPet(el) {
  const id = el.dataset.id;
  const idx = selectedExpeditionPets.indexOf(id);
  if (idx >= 0) {
    selectedExpeditionPets.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    if (selectedExpeditionPets.length >= 3) {
      showToast('⚠️ 最多選擇 3 隻寵物');
      return;
    }
    selectedExpeditionPets.push(id);
    el.classList.add('selected');
  }
  const btn = document.getElementById('expeditionStartBtn');
  if (btn) btn.disabled = selectedExpeditionPets.length === 0;
}

function startExpeditionUI() {
  const member = getCurrentMember();
  if (!member || selectedExpeditionPets.length === 0) return;

  const result = startExpedition(member.id, selectedExpeditionPets);
  if (result && result.error) {
    showToast('❌ ' + result.error);
    return;
  }

  selectedExpeditionPets = [];
  showToast('🌍 寵物出發探險了！');
  renderExpedition();
}

function claimExpedition() {
  const member = getCurrentMember();
  if (!member) return;

  const result = claimExpeditionRewards(member.id);
  if (result && result.error) {
    showToast('❌ ' + result.error);
    return;
  }

  const resultEl = document.getElementById('expeditionResult');
  resultEl.classList.remove('hidden');
  let bonusHtml = '';
  if (result.hasBonus) {
    bonusHtml = `<div class="expedition-bonus">🌟 稀有發現！額外 +${result.bonusReward}💰</div>`;
  }
  resultEl.innerHTML = `
    <div class="expedition-reward-box">
      <div class="expedition-chest-open">🎁</div>
      <h3>🎊 探索完成！</h3>
      <div class="expedition-coins">💰 +${result.coins} 金幣</div>
      ${bonusHtml}
      <button class="expedition-claim-btn" onclick="document.getElementById('expeditionResult').classList.add('hidden');renderExpedition();refreshUI();">
        太好了！
      </button>
    </div>
  `;
  renderExpedition();
  updateNavCoins();
}

// ====== 設定 ======
function renderSettingsUI() {
  const lowAnimEl = document.getElementById('settingLowAnim');
  if (lowAnimEl) {
    lowAnimEl.checked = getLowAnimMode();
  }
}

function toggleLowAnim(value) {
  setLowAnimMode(value);
  document.body.classList.toggle('low-anim', value);
  showToast(value ? '🐢 低動畫模式已開啟' : '🐢 低動畫模式已關閉');
}

// ====== 自動每日重置（頁面載入時檢查）=====
document.addEventListener('DOMContentLoaded', initGame);
