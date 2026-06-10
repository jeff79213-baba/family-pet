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
    tasks: []
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
    lastBossAt: null,
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

  const existing = member.pets.find(p => p.templateId === template.id);
  if (existing) {
  }

  member.pets.push(pet);
  saveData(data);
  return pet;
}

function getMemberPets(memberId) {
  const data = getData();
  const member = data.members.find(m => m.id === memberId);
  return member ? member.pets : [];
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
