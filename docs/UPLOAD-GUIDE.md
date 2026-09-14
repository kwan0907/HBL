# GitHub 上載及日後修改指南

## 上載整個新版

1. 在 GitHub 回到 HBL repository 最外層；這一層要看見 `index.html`、`app.js`、`config` 和 `data`。
2. 選 **Add file → Upload files**。
3. 解壓下載檔後，把解壓資料夾「裡面的全部內容」拖入上載區；不要把外層資料夾拖進 `data`。
4. Commit 後檢查香港資料的路徑必須是 `HBL / data / hong-kong.js`。

如果看到 `HBL / data / data / hong-kong.js`，路徑就是錯的，App 不會讀到修改。

## 日後只更新一個地區價格

| 修改地區 | 只需交給新 Chat／上載的檔案 |
|---|---|
| 香港 | `data/hong-kong.js` |
| 台灣 | `data/taiwan.js` |
| 日本 | `data/japan.js` |
| 泰國 | `data/thailand.js` |

在 GitHub 更新單一價目時，先進入 repository 的 `data` 資料夾，再上載那一個 `.js` 檔並取代同名檔案。

可在新 Chat 使用這段指示：

> 這是 HBL 多區格價 App。請只修改我提供的 `data/地區名稱.js` 價格資料，不要刪減功能，也不要改產品編號或欄位名稱。完成後把同名檔案給我，我會放回 repository 的 `data` 資料夾。

## 日後新增產品

提供該地區的 `data/*.js`，並說明產品編號、中文短名、原文名、VP、各價格等級及分類。若產品要和其他地區同類產品比較，也一併提供 `config/comparison-map.js`。

## 日後新增地區

需提供以下檔案：

- `config/countries.js`
- `config/comparison-map.js`
- 新地區的價目／產品資料
- 現有 `data/*.js`（方便核對同類產品）

新增地區後，必須一併更新 `config`、新 `data` 檔、`app.js`、`index.html`、`styles.css`、`manifest.json` 和 `service-worker.js`，再整包上載到 repository 最外層。
