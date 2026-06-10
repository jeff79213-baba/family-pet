/* ====== 家庭寵物樂園 - 資料管理 ====== */

const STORAGE_KEY = 'familyPetGame_v1';
const GACHA_COST = 30;
const DAILY_CORE_TOTAL = 50;

// ====== 預設任務 ======
const DEFAULT_TASKS = [
  { id: 'wakeup',      label: '⏰ 準時起床（7:30前）',     reward: 10 },
  { id: 'cleanup',     label: '🧹 整理房間',               reward: 15 },
  { id: 'dishes',      label: '🍽️ 洗碗／擦桌子',          reward: 10 },
  { id: 'homework',    label: '📚 寫完功課',               reward: 15 },
  { id: 'extra',       label: '⭐ 額外幫忙',               reward: 5  }
];

// ====== 初始化 ======
function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); }
    catch(e) { console.warn('資料損毀，重新初始化'); }
  }
  return createDefaultData();
}

function createDefaultData() {
  return {
    currentMember: null,
    members: [],
    tasks: [],
    unlockedBosses: [1],
    expeditionSlots: 3
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ====== 動態任務系統 ======
function getTaskDefs() {
  const data = getData();
  return (data.tasks && data.tasks.length > 0) ? data.tasks : DEFAULT_TASKS;
}

function saveTaskDefs(tasks) {
  const data = getData();
  data.tasks = tasks;
  saveData(data);
}

function addTaskDef(label, reward) {
  const tasks = getTaskDefs();
  const id = 'task_' + Date.now();
  tasks.push({ id, label, reward });
  saveTaskDefs(tasks);
  return id;
}

function removeTaskDef(taskId) {
  const data = getData();
  if (data.tasks && data.tasks.length > 0) {
    data.tasks = data.tasks.filter(t => t.id !== taskId);
  }
  data.members.forEach(m => {
    if (m.todayTasks && taskId in m.todayTasks) {
      delete m.todayTasks[taskId];
    }
  });
  saveData(data);
}

function updateTaskDef(taskId, newLabel, newReward) {
  const data = getData();
  const tasks = (data.tasks && data.tasks.length > 0) ? data.tasks : DEFAULT_TASKS;
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return false;
  tasks[idx].label = newLabel;
  tasks[idx].reward = newReward;
  if (data.tasks && data.tasks.length > 0) {
    data.tasks = tasks;
  } else {
    data.tasks = tasks;
  }
  saveData(data);
  return true;
}

// ====== 家庭成員 ======
function addMember(name, avatar) {
  const data = getData();
  const id = 'member_' + Date.now();
  const member = {
    id,
    name,
    avatar: avatar || '👤',
    coins: 30,
    freePulls: 0,
    exams: [],
    todayEarned: 0,
    pets: [],
    todayTasks: {},
    isParent: false,
    password: '',
    lastBossAt: null,
    expedition: null,
    expeditionRewards: 0,
    lowAnimMode: false,
    createdAt: new Date().toISOString()
  };
  data.members.push(member);
  if (!data.currentMember) data.currentMember = id;
  saveData(data);
  return data;
}

function selectMember(id) {
  const data = getData();
  data.currentMember = id;
  saveData(data);
  return data;
}

function getCurrentMember() {
  const data = getData();
  if (!data.currentMember || !data.members.length) return null;
  return data.members.find(m => m.id === data.currentMember) || data.members[0];
}

function removeMember(id) {
  const data = getData();
  data.members = data.members.filter(m => m.id !== id);
  if (data.currentMember === id) {
    data.currentMember = data.members.length ? data.members[0].id : null;
  }
  saveData(data);
  return data;
}

// ====== 成員密碼 ======
function setMemberPassword(memberId, password) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return false;
  member.password = password || '';
  saveData(data);
  return true;
}

function hasMemberPassword(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  return member ? !!(member.password) : false;
}

function verifyMemberPassword(memberId, input) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  return member && member.password === input;
}

// ====== 任務系統 ======
function isTaskDone(memberId, taskId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return false;
  return member.todayTasks[taskId] === 'approved' || member.todayTasks[taskId] === true;
}

function isTaskPending(memberId, taskId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return false;
  return member.todayTasks[taskId] === 'pending';
}

function submitTask(memberId, taskId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  if (member.todayTasks[taskId]) return;
  member.todayTasks[taskId] = 'pending';
  saveData(data);
  return data;
}

function cancelTask(memberId, taskId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  if (member.todayTasks[taskId] !== 'pending') return;
  delete member.todayTasks[taskId];
  saveData(data);
  return data;
}

function approveTask(memberId, taskId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return false;
  if (member.todayTasks[taskId] !== 'pending') return false;
  const tasks = getTaskDefs();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return false;
  member.todayTasks[taskId] = 'approved';
  member.coins += task.reward;
  member.todayEarned = (member.todayEarned || 0) + task.reward;
  saveData(data);
  return true;
}

function rejectTask(memberId, taskId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return false;
  if (member.todayTasks[taskId] !== 'pending') return false;
  delete member.todayTasks[taskId];
  saveData(data);
  return true;
}

// 保留舊函數別名避免報錯（內部改為新流程）
function completeTask(memberId, taskId) { return submitTask(memberId, taskId); }
function uncompleteTask(memberId, taskId) { return cancelTask(memberId, taskId); }

function resetDailyTasks() {
  const data = getData();
  data.members.forEach(m => {
    m.todayTasks = {};
    m.todayEarned = 0;
  });
  saveData(data);
  return data;
}

// ====== 寵物系統 ======
function addPetToMember(memberId, petTemplateId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || !window.PET_DATABASE) return null;

  const template = window.PET_DATABASE.find(p => p.id === petTemplateId);
  if (!template) return null;

  // 檢查是否已擁有該寵物 → 觸發進化
  const existing = member.pets.find(p => p.templateId === template.id);
  if (existing && template.nextEvoId && !template.isLegendary) {
    const result = performEvolution(member, template);
    if (result) {
      saveData(data);
      return { type: 'evolution', oldTemplate: result.oldTemplate, newTemplate: result.newTemplate, pet: result.pet };
    }
  }

  // 重複寵物無法進化（已是終階或傳說），加戰力
  if (existing) {
    existing.power = (existing.power || 0) + 20;
    saveData(data);
    return { type: 'duplicate', pet: existing, powerUp: 20 };
  }

  const pet = {
    templateId: template.id,
    instanceId: 'pet_' + template.id + '_' + Date.now(),
    name: template.name,
    type: template.type,
    stage: template.stage,
    power: template.power,
    isLegendary: template.isLegendary,
    obtainedAt: new Date().toISOString()
  };

  member.pets.push(pet);
  saveData(data);
  return { type: 'new', pet };
}

// ====== 進化系統 ======
function performEvolution(member, template) {
  const newTemplate = window.PET_DATABASE.find(p => p.id === template.nextEvoId);
  if (!newTemplate) return null;

  const oldPet = member.pets.find(p => p.templateId === template.id);
  if (!oldPet) return null;

  const oldTemplate = { ...template };
  const newPower = newTemplate.stage === 2 ? 100 : (newTemplate.stage === 3 ? 300 : 0);

  oldPet.templateId = newTemplate.id;
  oldPet.name = newTemplate.name;
  oldPet.type = newTemplate.type;
  oldPet.stage = newTemplate.stage;
  oldPet.power = newPower;
  oldPet.isLegendary = newTemplate.isLegendary;

  return { oldTemplate, newTemplate, pet: oldPet };
}

function getEvolutionChain(templateId) {
  if (!window.PET_DATABASE) return null;
  const chain = [];
  let current = window.PET_DATABASE.find(p => p.id === templateId);
  if (!current) return null;
  while (current) {
    chain.push(current);
    if (!current.nextEvoId) break;
    current = window.PET_DATABASE.find(p => p.id === current.nextEvoId);
    if (!current) break;
  }
  return chain;
}

function getMemberPets(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  return member ? member.pets : [];
}

// ====== 獎勵發送 ======
function sendBonus(memberId, amount, reason) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || amount <= 0) return false;
  member.coins += amount;
  if (!member.bonusLog) member.bonusLog = [];
  member.bonusLog.push({
    amount,
    reason: reason || '🎁 獎勵',
    date: new Date().toISOString()
  });
  saveData(data);
  return true;
}

// ====== 金幣 ======
function addCoins(memberId, amount) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;
  member.coins += amount;
  saveData(data);
  return data;
}

function spendCoins(memberId, amount) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || member.coins < amount) return false;
  member.coins -= amount;
  saveData(data);
  return true;
}

// ====== 考試系統 ======
function addExam(memberId, subject, score) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return null;

  const record = {
    subject,
    score,
    coinsEarned: 0,
    freePullEarned: 0,
    date: new Date().toISOString()
  };

  if (score >= 100) {
    record.coinsEarned = 5;
    record.freePullEarned = 1;
    member.coins += 5;
    member.freePulls = (member.freePulls || 0) + 1;
    member.todayEarned = (member.todayEarned || 0) + 5;
  } else if (score >= 98) {
    record.coinsEarned = 5;
    member.coins += 5;
    member.todayEarned = (member.todayEarned || 0) + 5;
  }

  member.exams.push(record);
  saveData(data);
  return record;
}

function getFreePullCount(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  return member ? (member.freePulls || 0) : 0;
}

function useFreePull(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || !member.freePulls) return false;
  member.freePulls--;
  saveData(data);
  return true;
}

function getTodayEarned(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  return member ? (member.todayEarned || 0) : 0;
}

// ====== 工具 ======
function getImageUrl(petId) {
  return `assets/pets/pet_${petId}.png`;
}

function getTypeColor(type) {
  const colors = {
    '草': '#78c850', '火': '#f08030', '水': '#6890f0',
    '電': '#f8d030', '毒': '#a040a0', '地面': '#e0c068',
    '幽靈': '#705898', '超能力': '#f85888', '岩石': '#b8a038',
    '冰': '#98d8d8', '龍': '#7038f8', '惡': '#705848',
    '格鬥': '#c03028', '妖精': '#ee99ac', '鋼鐵': '#b8b8d0',
    '飛行': '#a890f0', '一般': '#a8a878', '蟲': '#a8b820'
  };
  return colors[type] || '#a8a878';
}

// ====== Boss 戰系統 ======
const BOSSES = [
  { id: 1, name: '暗影巨龍', type: '龍', hp: 500, reward: 50, emoji: '🐉', color: '#7038f8' },
  { id: 2, name: '熔岩獸王', type: '火', hp: 400, reward: 40, emoji: '🔥', color: '#f08030' },
  { id: 3, name: '深海巨妖', type: '水', hp: 450, reward: 45, emoji: '🐙', color: '#6890f0' },
  { id: 4, name: '鋼鐵魔神', type: '鋼鐵', hp: 600, reward: 60, emoji: '🤖', color: '#b8b8d0' }
];

const BOSS_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

function getBosses() {
  return BOSSES;
}

function getUnlockedBosses() {
  const data = getData();
  return (data.unlockedBosses || [1]).map(id => BOSSES.find(b => b.id === id)).filter(Boolean);
}

function canFightBoss(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return false;
  if (!member.lastBossAt) return true;
  return Date.now() - new Date(member.lastBossAt).getTime() >= BOSS_COOLDOWN_MS;
}

function getBossCooldownRemaining(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || !member.lastBossAt) return 0;
  const elapsed = Date.now() - new Date(member.lastBossAt).getTime();
  return Math.max(0, BOSS_COOLDOWN_MS - elapsed);
}

const TYPE_ADVANTAGE = {
  '火': ['草', '冰', '蟲', '鋼鐵'],
  '水': ['火', '地面', '岩石'],
  '草': ['水', '地面', '岩石'],
  '電': ['水', '飛行'],
  '毒': ['草', '妖精'],
  '幽靈': ['幽靈', '超能力'],
  '超能力': ['格鬥', '毒'],
  '格鬥': ['一般', '冰', '岩石', '鋼鐵', '惡'],
  '惡': ['幽靈', '超能力'],
  '冰': ['草', '地面', '龍', '飛行'],
  '龍': ['龍'],
  '妖精': ['格鬥', '龍', '惡'],
  '岩石': ['火', '冰', '飛行', '蟲'],
  '地面': ['火', '電', '毒', '岩石', '鋼鐵'],
  '鋼鐵': ['冰', '岩石', '妖精'],
  '飛行': ['草', '格鬥', '蟲'],
  '一般': []
};

function calcBattleDamage(attackerPower, attackerType, bossType) {
  const isAdvantage = TYPE_ADVANTAGE[attackerType] && TYPE_ADVANTAGE[attackerType].includes(bossType);
  const multiplier = isAdvantage ? 1.5 : 1.0;
  const base = Math.max(10, (attackerPower || 0) + 50);
  return { damage: Math.floor(base * multiplier), isAdvantage };
}

function fightBoss(memberId, bossId, petInstanceId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return null;
  if (!canFightBoss(memberId)) return { error: '冷卻中' };

  const boss = BOSSES.find(b => b.id === bossId);
  if (!boss) return null;

  const pet = member.pets.find(p => p.instanceId === petInstanceId);
  if (!pet) return null;

  const { damage, isAdvantage } = calcBattleDamage(pet.power || 0, pet.type, boss.type);
  const win = damage >= boss.hp;

  if (win) {
    member.coins += boss.reward;
    member.lastBossAt = new Date().toISOString();
    member.expeditionRewards = (member.expeditionRewards || 0) + 1;
    // Unlock next boss
    const nextBossId = bossId + 1;
    if (nextBossId <= BOSSES.length && !data.unlockedBosses.includes(nextBossId)) {
      data.unlockedBosses.push(nextBossId);
    }
  }

  saveData(data);
  return { win, damage, boss, pet, isAdvantage, reward: win ? boss.reward : 0 };
}

// ====== 遠征探險系統 ======
const EXPEDITION_DURATION_MS = 30 * 1000; // 30 seconds for now
const EXPEDITION_REQUIRED_TASKS = 4;

function getCompletedTaskCount(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return 0;
  const tasks = getTaskDefs();
  return tasks.filter(t => member.todayTasks[t.id] === 'approved' || member.todayTasks[t.id] === true).length;
}

function canStartExpedition(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return { ok: false, reason: '找不到成員' };
  if (member.expedition) return { ok: false, reason: '已有進行中的遠征' };
  const today = new Date().toDateString();
  if (member.lastExpeditionDate === today) return { ok: false, reason: '今天已經遠征過了，明天再來！' };
  const done = getCompletedTaskCount(memberId);
  if (done < EXPEDITION_REQUIRED_TASKS) return { ok: false, reason: `今日須完成 ${EXPEDITION_REQUIRED_TASKS} 項任務才能遠征（目前 ${done} 項）` };
  return { ok: true };
}

function getExpeditionRewardInfo() {
  return {
    basePerPet: 5,
    baseFixed: 15,
    bonusChance: 0.3,
    bonusMin: 10,
    bonusMax: 29,
    examples: [
      { pets: 1, total: 20 },
      { pets: 2, total: 25 },
      { pets: 3, total: 30 }
    ]
  };
}

function startExpedition(memberId, petInstanceIds) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return null;
  const check = canStartExpedition(memberId);
  if (!check.ok) return { error: check.reason };

  const pets = petInstanceIds.map(id => member.pets.find(p => p.instanceId === id)).filter(Boolean);
  if (pets.length === 0) return { error: '請選擇至少一隻寵物' };

  member.expedition = {
    petIds: petInstanceIds,
    startedAt: new Date().toISOString(),
    duration: EXPEDITION_DURATION_MS
  };
  member.lastExpeditionDate = new Date().toDateString();

  saveData(data);
  return { ok: true, pets };
}

function getExpeditionStatus(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || !member.expedition) return null;

  const elapsed = Date.now() - new Date(member.expedition.startedAt).getTime();
  const progress = Math.min(100, (elapsed / member.expedition.duration) * 100);

  if (progress >= 100) {
    return { status: 'completed', progress: 100 };
  }
  return { status: 'ongoing', progress, remaining: member.expedition.duration - elapsed };
}

function claimExpeditionRewards(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  if (!member || !member.expedition) return null;

  const elapsed = Date.now() - new Date(member.expedition.startedAt).getTime();
  if (elapsed < member.expedition.duration) return { error: '遠征尚未完成' };

  const petCount = member.expedition.petIds.length;
  const baseReward = 15 + petCount * 5;
  const hasBonus = Math.random() < 0.3;
  const bonusReward = hasBonus ? 10 + Math.floor(Math.random() * 20) : 0;

  member.coins += baseReward + bonusReward;
  member.expedition = null;

  saveData(data);
  return { coins: baseReward + bonusReward, baseReward, bonusReward, hasBonus };
}

// ====== 設定系統 ======
function getLowAnimMode() {
  const member = getCurrentMember();
  return member ? (member.lowAnimMode || false) : false;
}

function setLowAnimMode(val) {
  const data = getData();
  const member = data.members.find(m => m.id === getCurrentMember()?.id);
  if (member) {
    member.lowAnimMode = !!val;
    saveData(data);
  }
}

function getDefaultMembers() {
  return [
    { name: '哥哥', avatar: '👦' },
    { name: '弟弟', avatar: '👧' }
  ];
}

// ====== 主題設定 ======
function getSavedTheme() {
  return localStorage.getItem('familyPet_theme') || '';
}

function saveTheme(theme) {
  localStorage.setItem('familyPet_theme', theme);
}

// ====== 匯出/匯入備份 ======
function exportSaveData() {
  const data = getData();
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    gameData: data,
    theme: getSavedTheme()
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-pet-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importSaveData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.gameData) throw new Error('無效的備份檔案');
      saveData(backup.gameData);
      saveTheme(backup.theme || '');
      location.reload();
    } catch (err) {
      alert('❌ 備份檔案格式錯誤，無法匯入');
    }
  };
  reader.readAsText(file);
}
