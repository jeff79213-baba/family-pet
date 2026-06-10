// ===== 家庭寵物樂園 - 家長密碼設定 =====
// 預設密碼 1234，可在家長後台自行更改（儲存在瀏覽器）
const DEFAULT_PASSWORD = '1234';

function getParentPassword() {
  return localStorage.getItem('familyPet_parentPassword') || DEFAULT_PASSWORD;
}

function setParentPassword(newPwd) {
  localStorage.setItem('familyPet_parentPassword', newPwd);
}
