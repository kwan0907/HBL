# HBL 計算器：AI／ChatGPT 修改規則

這份文件是給任何新 ChatGPT／Codex 對話看的固定維護規格。目標是避免再次出現 duplicate 檔、錯誤路徑、改錯檔案或整包覆蓋。

## Canonical source（只認這些位置）

| 用途 | 唯一正確檔案 |
|---|---|
| 香港價格 | `data/hong-kong.js` |
| 台灣價格 | `data/taiwan.js` |
| 日本價格 | `data/japan.js` |
| 泰國價格 | `data/thailand.js` |
| 地區／貨幣／價格等級設定 | `config/countries.js` |
| 跨區同類產品配對 | `config/comparison-map.js` |
| App 功能 | `src/app.js` |
| App 樣式 | `src/styles/app.css` |
| DOM／頁面結構 | `index.html` |
| PWA | `manifest.json`、`service-worker.js`、`icons/` |

Root 的 `app.js` 與 `styles.css` 只係 compatibility entry；不要將新功能寫入 root 版本。

## 永久規則

- 不可建立 root `hong-kong.js`、`countries.js`、`comparison-map.js` 等 duplicate。
- 不可建立 `data/data/`、`data/config/`、`data/app.js` 等 nested copy。
- 改價只改指定地區的 `data/*.js`。
- 不可因為某次修改而刪減其他地區、產品、價格欄位或現有功能。
- 保留 iPhone 版固定 viewport、四級字體 `11 / 13 / 16 / 20`。
- 日本／泰國產品如有當地語，保持「中文短名｜當地語原名」。
- 日本及泰國預設不開 VP 推薦，除非明確要求。
- 所有修改完成後必須執行 `npm run check`。
- 如果 GitHub 已連接，直接在 repository branch／PR 修改，不要要求重新下載 ZIP 再手動覆蓋。

## 情況 1：修改現有價格

只修改該區 `data/*.js`。

例如：

```text
國家：香港
SKU：1154
銀級：305.75
```

正確做法：在 `data/hong-kong.js` 找 `"stock_no": "1154"`，修改 `"銀級"`。不要只改 `retail_price`，亦不要複製整個 data 檔去 root。

完成後：

```bash
npm run check:data
```

## 情況 2：加入產品

1. 修改該地區 `data/*.js`。
2. `stock_no` 不可與該區現有 SKU 重複。
3. 補齊該區必要價格欄位、分類、名稱、VP 等資料。
4. 如要跨區比較，再改 `config/comparison-map.js`。
5. 執行 `npm run check`。

## 情況 3：新增地區

1. 新增 `data/<region>.js`。
2. 在 `config/countries.js` 登記地區、貨幣、tiers、default tier、功能旗標、dataFile。
3. 如新貨幣不存在，再新增 currency metadata。
4. 如要跨區比較，再改 `config/comparison-map.js`。
5. 一般不需要改 `index.html`，地區／貨幣／排序按鈕由 config 自動產生。
6. 執行 `npm run check`。

## 情況 4：改 App 功能／UI

- 功能：`src/app.js`
- CSS：`src/styles/app.css`
- DOM：`index.html`

Root compatibility entry URL 要保留，除非一次過同步更新所有 runtime reference、PWA、驗證規則並完成測試。

## 驗證

完整檢查：

```bash
npm run check
```

會驗證 repository 結構、duplicate path、四區資料格式、SKU 重複、config dataFile、comparison map 對應產品等。

如果檢查失敗，不要用複製第二份檔案的方法繞過；應修正 canonical source。
