# HBL 多區產品格價計算器

HBL 是一個 buildless 的多地區產品價格比較／計算 Web App。目前支援香港、台灣、日本、泰國、中國大陸五個地區，保留單區計算、雙價格等級、購物車、複製、VP、香港運費、套裝、多區格價、匯率、分類、排序及字體大小等功能。

## 最重要：平日應該改哪裡？

| 你要做的事 | 正確檔案 |
|---|---|
| 改香港價格 | `data/hong-kong.js` |
| 改台灣價格 | `data/taiwan.js` |
| 改日本價格 | `data/japan.js` |
| 改泰國價格 | `data/thailand.js` |
| 改中國大陸官方原價 | `data/china.js`（不計算任何折扣與 VP） |
| 新增／修改地區、貨幣、等級 | `config/countries.js` |
| 修改跨區同類產品配對 | `config/comparison-map.js` |
| 修改 App 功能 | `src/app.js` |
| 修改 App 外觀 | `src/styles/app.css` |
| 修改頁面 DOM | `index.html` |

正常改價時，不需要碰其他檔案。

## 最終 Repository 結構

```text
HBL/
├── index.html
├── app.js                     # 兼容入口，只載入 src/app.js
├── styles.css                 # 兼容入口，只載入 src/styles/app.css
├── manifest.json
├── service-worker.js
├── logo.svg
├── package.json
│
├── src/
│   ├── app.js                 # 真正主程式
│   └── styles/
│       └── app.css            # 真正主樣式
│
├── config/
│   ├── countries.js
│   └── comparison-map.js
│
├── data/
│   ├── hong-kong.js
│   ├── taiwan.js
│   ├── japan.js
│   ├── thailand.js
│   └── china.js
│
├── icons/
├── assets/branding/
├── scripts/
├── docs/
└── .github/workflows/
```

詳細架構見 `docs/ARCHITECTURE.md`。

## 不要再出現的結構

以下都屬於錯誤／重複檔案：

```text
hong-kong.js              # 放在 root
countries.js              # 放在 root
comparison-map.js         # 放在 root
data/data/...
data/app.js
data/index.html
data/styles.css
```

Repository 已加入自動檢查，這類結構如果再次出現，GitHub Actions 會報錯。

## 改價流程

例如香港產品 `1154` 的銀級價格要改為 `305.75`：

1. 開 `data/hong-kong.js`
2. 找 `"stock_no": "1154"`
3. 修改 `"銀級": 305.75`
4. 不要只改 `retail_price`
5. 提交後等待網站重新部署

香港畫面真正使用 `標準價／銅級／銀級／金級／58%／50%` 等欄位；`retail_price` 只作參考時，不會自動覆蓋其他等級。

## 多區格價

- 即使只有一區有售，產品仍可顯示並標示獨有。
- 統一顯示貨幣可切換 HKD／TWD／JPY／THB／CNY。
- 基準地區按所選貨幣自動決定。
- 可按地區價格或基準差價排序。
- 內用／外用／工具可獨立篩選。
- 各區 VP 有差異時會標示。

跨區同類產品配對只在 `config/comparison-map.js` 維護。

## 中國大陸原價（2026-10-09 新增）

- 只收錄中國康寶萊官網公開的人民幣零售原價；不推算會員折扣、訂貨成本或 VP。
- 目前收錄 56 項公開產品：`data/china.js`；價格來源存於各品項 `source_url`，`source_checked` 記錄核對日期。
- 已核實 19 款產品的官方編號，並記錄 `product_detail_url` 和部分淨含量；尚有 37 項以 `CNxxx` 作工具內部識別碼（並非官方編號）。
- 五地格價中，選其他折扣級別仍顯示中國零售原價，但會標示「僅供參考・非相同折扣基準」，而且不計入該折扣級別的「最平」及省錢排名。
- 尚未確認與其他地區相同容量／配方的產品，暫時以「待核對同款」獨立條目展示，不表示真的是中國獨有，避免錯誤配對；日後核實後可於 `config/comparison-map.js` 配對。

## 五地跨編號／跨語言同口味比對（2026-10-09）

- `config/comparison-map.js` 使用人工核對的產品分類、口味及對應編號，不依賴各區 `stock_no` 相同或中文名稱完全一致。
- 已有 **10 組中國大陸與其他區域的對照**，包括 F1 香草／朱古力／曲奇／芒果／紅豆薏仁、益生菌、蛋白粉及部分草本茶。
- 其中 F1 香草／朱古力／曲奇及益生菌可顯示五個地區的對照貨號與價格。其他地區的草莓、薄荷朱古力、咖啡拿鐵亦補齊泰國／港／台對照。
- 格價區新增「全部產品」「已配對」「中國對照」三個篩選。選「中國對照」時排成香港、中國、台灣、日本、泰國，手機可優先見到中國欄位。
- **不同規格不能當同一件比較**：中國蛋白粉400克與台灣常見240克屬同類產品，CN 被排除「最平」及省錢評估；蜜薑茶、檸檬茶、木莓茶等規格不同則該組停止最低價比較，只列同口味及警告。
- 中國大陸價格仍為官方人民幣**零售原價**，不計任何會員折扣和 VP。其他地區相同配方不能一概保證，請檢查成分與規格。
- 不能核實同一用途、同一份量的品項，仍保留「待核對同款」，不會強行比價。

## 泰國價格

泰國折扣價沿用：

```text
折扣價 = 建議零售價 −（Earn Base × 折扣率）
```

目前支援 15%、25%、35%、42%、50%。Earn Base 為 0 的項目維持原價。

## 日本／泰國產品名稱

日本與泰國產品可保留中文短名加當地語原名：

```text
中文短名｜當地語原名
```

一般只改名稱時，不需要更動主程式。

## 新增第 5／6 個地區

1. 在 `data/` 新增該區資料檔。
2. 在 `config/countries.js` 登記地區、貨幣、價格等級、功能旗標及 `dataFile`。
3. 如需跨區格價，再到 `config/comparison-map.js` 加對應產品編號。
4. 執行完整檢查。

地區按鈕、貨幣按鈕、排序按鈕與格價欄位會按 config 自動產生。

## 自動匯率

系統以 HKD 為基礎取得參考匯率，並在本機保存最近一次匯率。外部匯率服務無法連線時會保留現有設定，使用者亦可手動修改。

## Repository 自動檢查

本專案不需要 build，但有維護檢查：

```bash
npm run check
```

會檢查：

- 必要 runtime 檔案是否存在
- `index.html` 是否仍指向正確入口
- Root `app.js`／`styles.css` 是否仍指向 `src/` canonical source
- 是否重新出現舊 duplicate／nested 路徑
- 五區 data 是否可正常註冊
- `stock_no` 是否重複／缺失
- config 的 `dataFile` 是否真的存在
- comparison map 的產品編號是否仍能對應到現行 data

同一套檢查會在 Pull Request 及 `main` push 自動執行。

## PWA / Vercel

目前仍維持純靜態部署，不需要 npm build。Root runtime URL 刻意保持穩定，避免既有 Vercel／PWA／舊主畫面安裝路徑因整理 Repository 而失效。

若只是改價格，最安全做法是只修改對應 `data/*.js`。
