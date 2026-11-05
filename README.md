# ZenFlow v9

室內設計工期排程與代墊款工作台。正式網站：https://stan-yao.github.io/ZenFlow/

## 開發

```sh
npm ci
npm test
npm run build
npm run dev
```

本機預覽 http://127.0.0.1:4173 使用獨立示範資料；開發伺服器以 CSP `connect-src 'none'` 阻擋對外資料連線。只有 `stan-yao.github.io/ZenFlow/` 正式路徑才會初始化 Firebase；正式網址附加 `?demo` 亦只使用本機示範資料。

建置產出 `assets/app.js`、`assets/app.css`，首頁帶內容雜湊版本碼以避免舊快取。發布 GitHub Pages 前須執行建置並提交產物。React 預先打包，不再於使用者瀏覽器即時編譯 JSX。

## 資料保護

- 訂閱 `gantt-projects`；不建立、清空、遷移既有文件，載入與切換本身不寫入。
- 只在使用者主動編輯後啟動各專案獨立儲存佇列。
- Firestore transaction 先比較讀取基準與雲端版本，版本衝突時阻擋覆寫並保留本頁草稿。
- 未知欄位與既有工項、代墊款、分類 ID 保留；SDK 不可變型別亦保留。
- `gantt-settings` 不再寫入。主題、目前專案與欄寬為裝置偏好。
- 工項與代墊款移除保留至 `trash`；專案使用 `archived` 封存，不執行 Firebase delete。
- 草稿在本頁記憶體，儲存失敗時請保留分頁或下載草稿；強制關閉、作業系統終止仍可能遺失未儲存變更。
- 同時開啟舊 v8 分頁會繼續使用舊寫入邏輯，更新後請重新整理其他裝置與分頁。v9 不修改資料庫安全規則。

## 介面與操作

- 甘特圖／工項清單／代墊款；週、月、全案視圖與回到今天。
- 搜尋、多選工種、未完成、未來七天篩選；左欄拖曳調寬，左右共同垂直捲動。
- 工期條支援 Pointer Events 拖曳與端點調整；放開後才排序，可復原／重做。
- 自訂與內建分類皆可改色，支援選色器與十六進位色碼，匯出跟隨設定。
- 工項複製、日曆天／工作天、休工設定、前置工項、選用向後順延及受影響工項確認。
- 設計／施工範本僅追加工項，既有排程不被取代。
- JPG 先預覽後下載；可下載單一／所有專案 JSON 備份。尚無 JSON 自動匯入介面。
- 回收區與專案封存可還原；快捷鍵 Ctrl/⌘ Z、Ctrl/⌘ Shift Z。

## 驗證

Node 測試涵蓋資料不變性、讀取零寫入、儲存佇列、衝突、重試、復原、回收、日期與依賴。正式 adapter 使用模擬 Firestore 交易測試，不對正式專案執行測試寫入。實機 iOS 觸控手勢與真實多人網路併發需另行驗證。

API 依據：[Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)、[realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen)。
