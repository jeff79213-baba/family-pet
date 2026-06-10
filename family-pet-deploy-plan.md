# 家庭寵物樂園 — 部署與功能強化計畫

## 目標

讓親朋好友可透過網址存取這個遊戲，支援電腦和手機，資料存本地，關閉重開不遺失。

---

## Step 1：部署到 GitHub Pages（取得公開網址）

1. 在 GitHub 建立公開 repo（如 `family-pet-game`）
2. 將 `家庭版寵物系統/` 整個資料夾內容推上去
3. 到 repo Settings → Pages → 選 `main` 分支 → 根目錄
4. 獲得網址：`https://你的帳號.github.io/family-pet-game/`

## Step 2：加入「匯出/匯入備份」功能

### 匯出備份（game-data.js）
```js
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
```

### 匯入備份（game-data.js）
```js
function importSaveData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const backup = JSON.parse(e.target.result);
    saveData(backup.gameData);
    saveTheme(backup.theme || '');
    location.reload();
  };
  reader.readAsText(file);
}
```

### UI 位置
在管理後台（家長控制台）新增「資料備份」區塊：
- 💾 **匯出備份** → 下載 JSON 到裝置
- 📂 **匯入備份** → 選擇 JSON 還原資料

## Step 3：調整手機適配

- 檢查所有按鈕觸控區域（至少 44px）
- 檢查寵物圖片路徑 `assets/pets/pet_{id}.png`
- 強化石 media query 手機版 spacing

## Step 4：修改的檔案

| 檔案 | 修改內容 |
|---|---|
| `index.html` | 管理後台新增「資料備份」區塊 + 隱藏 file input |
| `game-data.js` | 新增 `exportSaveData()` / `importSaveData()` 函式 |
| `style.css` | 加強手機適配 |
| `script.js` | 新增備份區塊的 render 與事件綁定 |

## 不更動的部份

- LocalStorage 存取邏輯 (`getData()` / `saveData()`)
- 遊戲機制（金幣、扭蛋、寵物、考試）
- 家長密碼 (`parent-config.js`)

## 使用者流程

```
1. 朋友收到網址 → 用手機或電腦打開
2. 開始玩 → 資料自動存 LocalStorage
3. 關掉再開 → 資料還在
4. 怕不見 → 家長後台 → 匯出備份 → 存 JSON 檔案
5. 換裝置或重灌 → 匯入備份 → 資料回復
```
