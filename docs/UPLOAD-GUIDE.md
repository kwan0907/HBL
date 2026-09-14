# GitHub 更新指南

目前 HBL Repository 已整理成固定結構，日後**不要再整包拖入 GitHub 覆蓋**，除非明確需要完整重建。

## 最安全的更新方式

### 只改一個地區價格

直接修改該區 canonical file：

| 地區 | 檔案 |
|---|---|
| 香港 | `data/hong-kong.js` |
| 台灣 | `data/taiwan.js` |
| 日本 | `data/japan.js` |
| 泰國 | `data/thailand.js` |

如果 ChatGPT／Codex 已連接 GitHub，可以直接建立 branch／PR 修改，不需要先下載再重新上載。

### 改跨區配對

只修改：

```text
config/comparison-map.js
```

### 改地區／貨幣／價格等級

只修改：

```text
config/countries.js
```

### 改功能／UI

```text
src/app.js
src/styles/app.css
index.html
```

Root `app.js` 與 `styles.css` 是 compatibility entry，不應放 feature logic。

## GitHub Web 手動修改（如果沒有 connector）

1. 進入正確 canonical file。
2. 按 Edit。
3. 修改後 commit 到新 branch。
4. 開 Pull Request。
5. 等 GitHub Actions 的 `HBL repository checks` 通過。
6. 再 merge 到 `main`。

## 不要再做

以下操作容易令 App 修改無效或 Repository 再次變亂：

- 把整個專案拖進 `data/`
- 建立 `data/data/`
- 把 `hong-kong.js`、`countries.js` 等複製到 root
- 同時保留多份 `app.js`／`index.html`／`styles.css`
- 為了解決快取問題而再上載一份同名資料到其他資料夾

## 修改後檢查

完整檢查：

```bash
npm run check
```

GitHub Pull Request 及 `main` push 亦會自動執行同一套檢查。

如果網站仍顯示舊價，應檢查部署 branch、實際修改的價格 tier、`config/countries.js` 的 dataFile，以及 App 的「更新價目」；不要建立 duplicate file。
