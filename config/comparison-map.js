/* 同類產品按系列、口味及【同容量】配對，已知重量不同必須獨立分組。
 * 各地產品編號可以不同；sizeVariantOf 是顯示同系列不同規格的關聯，絕不可視作同商品比價。
 * 重量／份量未核實可以標待核對，但不可斷言同容量或相同配方。 */
window.HBL_COMPARISON_GROUPS = [
  {
    "id": "f1-vanilla",
    "label": "F1 營養蛋白飲－香草",
    "HK": "0141",
    "TW": "2770",
    "JP": "085K",
    "CN": "1316",
    "TH": "0118"
  },
  {
    "id": "f1-chocolate",
    "label": "F1 營養蛋白飲－朱古力",
    "HK": "0142",
    "TW": "2771",
    "JP": "088K",
    "CN": "1317",
    "TH": "0119"
  },
  {
    "id": "f1-strawberry",
    "label": "F1 營養蛋白飲－草莓",
    "HK": "0143",
    "TW": "2772",
    "JP": "090K",
    "TH": "0120"
  },
  {
    "id": "f1-cookies",
    "label": "F1 營養蛋白飲－曲奇忌廉",
    "HK": "0146",
    "TW": "0271",
    "JP": "086K",
    "CN": "1407",
    "TH": "1029"
  },
  {
    "id": "f1-mango",
    "label": "F1 營養蛋白飲－芒果",
    "TW": "2335",
    "CN": "1228"
  },
  {
    "id": "f1-red-bean",
    "label": "F1 營養蛋白飲－紅豆薏仁",
    "HK": "1927",
    "CN": "1927"
  },
  {
    "id": "f1-mint-chocolate",
    "label": "F1 營養蛋白飲－薄荷朱古力",
    "HK": "2789",
    "TW": "1207",
    "TH": "1486"
  },
  {
    "id": "f1-cafe-latte",
    "label": "F1 營養蛋白飲－咖啡拿鐵",
    "HK": "2774",
    "TW": "2487",
    "TH": "0278"
  },
  {
    "id": "f1-select",
    "label": "F1 Select 精選植物配方－香草",
    "HK": "072K",
    "TW": "072K",
    "JP": "083K",
    "TH": "072K"
  },
  {
    "id": "protein-powder",
    "label": "優質蛋白粉",
    "HK": "0242",
    "TW": "0242",
    "JP": "171K",
    "TH": "171K",
    "matchNote": "🇹🇼 優質蛋白粉為240g；其他地區規格尚待核對。🇨🇳 400g版本另列，不視作同一包裝。"
  },
  {
    "id": "protein-powder-cn-400g",
    "label": "蛋白粉－中國大陸 400g",
    "CN": "1331",
    "sizeVariantOf": "protein-powder",
    "sizeLabel": "400g",
    "matchNote": "🇨🇳 官方400g，與台灣240g不同包裝，獨立列出，不參與跨地區差價。"
  },
  {
    "id": "multivitamin",
    "label": "多種維他命／草維錠",
    "HK": "3115",
    "TW": "3122",
    "JP": "3114",
    "TH": "3122"
  },
  {
    "id": "herbal-tea-original",
    "label": "草本濃縮速溶茶－原味",
    "HK": "0106",
    "TW": "0106",
    "JP": "0106",
    "TH": "0106"
  },
  {
    "id": "aloe-mango",
    "label": "蘆薈飲－芒果味",
    "TW": "1065",
    "JP": "1065",
    "TH": "1065"
  },
  {
    "id": "aloe-grape",
    "label": "蘆薈飲－葡萄味",
    "HK": "1610",
    "TW": "1610",
    "JP": "1610"
  },
  {
    "id": "aloe-mandarin",
    "label": "蘆薈飲－柑橘／橘子味",
    "HK": "2631",
    "JP": "2631"
  },
  {
    "id": "fiber-apple",
    "label": "營養纖維粉－蘋果味",
    "HK": "2864",
    "TW": "2864",
    "JP": "2864",
    "TH": "2864"
  },
  {
    "id": "probiotic",
    "label": "益生菌",
    "HK": "1829",
    "TW": "1829",
    "JP": "1829",
    "TH": "1829",
    "CN": "1829"
  },
  {
    "id": "niteworks",
    "label": "夜寧新 Niteworks",
    "HK": "0036",
    "TW": "0036",
    "JP": "1158"
  },
  {
    "id": "cell-u-loss",
    "label": "Cell-U-Loss 細喜／消脂片",
    "HK": "0111",
    "TW": "0111",
    "JP": "0111",
    "TH": "0111"
  },
  {
    "id": "tri-shield",
    "label": "南極磷蝦油 Tri-Shield",
    "HK": "0100",
    "TW": "0100",
    "JP": "0100"
  },
  {
    "id": "fish-oil",
    "label": "深海魚油 Herbalifeline",
    "HK": "0065",
    "TW": "0065",
    "JP": "0065",
    "TH": "0065"
  },
  {
    "id": "calcium",
    "label": "複合鈣片 Xtra-Cal",
    "HK": "0565",
    "TW": "0565",
    "JP": "0174",
    "TH": "0020"
  },
  {
    "id": "joint-support",
    "label": "關節營養／Herbaliflex",
    "HK": "1000",
    "TW": "1000",
    "JP": "0555"
  },
  {
    "id": "collagen",
    "label": "膠原蛋白美妍飲",
    "HK": "0056",
    "TW": "0056",
    "JP": "3170"
  },
  {
    "id": "womans-choice",
    "label": "女士之選 Woman's Choice",
    "HK": "1061",
    "TW": "127K",
    "JP": "127K"
  },
  {
    "id": "cr7",
    "label": "CR7 運動補水飲",
    "HK": "1463",
    "TW": "1463",
    "JP": "1463",
    "TH": "1463"
  },
  {
    "id": "h24-f1-sport",
    "label": "H24 Formula 1 Sport",
    "HK": "1457",
    "TW": "1457",
    "JP": "1412",
    "TH": "1457"
  },
  {
    "id": "h24-rebuild",
    "label": "H24 Rebuild Strength",
    "HK": "1417",
    "TW": "1459",
    "JP": "1459",
    "TH": "1459"
  },
  {
    "id": "protein-bar-vanilla",
    "label": "蛋白棒－香草杏仁",
    "HK": "0258",
    "JP": "0258",
    "TH": "0258"
  },
  {
    "id": "protein-bar-citrus",
    "label": "蛋白棒－柑橘檸檬",
    "TW": "0260",
    "JP": "0260"
  },
  {
    "id": "coffee-mocha",
    "label": "蛋白冰咖啡－摩卡",
    "HK": "011K",
    "TW": "011K",
    "JP": "011K",
    "TH": "011K"
  },
  {
    "id": "coffee-latte",
    "label": "蛋白冰咖啡－拿鐵",
    "TW": "012K",
    "JP": "012K",
    "TH": "012K"
  },
  {
    "id": "rose-guard",
    "label": "露思抗氧化 Rose Guard",
    "HK": "0139",
    "TH": "0139"
  },
  {
    "id": "vitamin-mask-moisturizing",
    "label": "維他命面膜－保濕",
    "HK": "111K",
    "TW": "111K",
    "TH": "111K"
  },
  {
    "id": "tang-kuei",
    "label": "當歸錠 Tang Kuei",
    "TW": "0566",
    "TH": "0566"
  },
  {
    "id": "beta-glucan",
    "label": "β-葡聚糖／倍他營養飲",
    "TW": "0267",
    "TH": "0267"
  },
  {
    "id": "herbal-tea-lemon",
    "label": "草本茶－檸檬味（日本／泰國規格待核）",
    "JP": "0188",
    "TH": "0255",
    "comparisonMode": "viewOnly",
    "matchNote": "日本和泰國此產品容量未核實；中國100g獨立列出，不直接作同容量比較。"
  },
  {
    "id": "herbal-tea-lemon-cn-100g",
    "label": "草本茶－檸檬味 100g",
    "CN": "1335",
    "sizeVariantOf": "herbal-tea-lemon",
    "sizeLabel": "100g",
    "matchNote": "🇨🇳 100g；日本及泰國的容量待核實，暫不配對同一規格。"
  },
  {
    "id": "herbal-tea-raspberry-tw-50g",
    "label": "草本茶－覆盆子／木莓 50g",
    "TW": "0256",
    "matchNote": "🇹🇼 50g；中國100g屬不同包裝，不能配成同一產品。",
    "sizeVariantOf": "herbal-tea-raspberry",
    "sizeLabel": "50g"
  },
  {
    "id": "herbal-tea-raspberry-cn-100g",
    "label": "草本茶－覆盆子／木莓 100g",
    "CN": "1336",
    "sizeVariantOf": "herbal-tea-raspberry",
    "sizeLabel": "100g",
    "matchNote": "🇨🇳 100g，台灣50g已另外列出；不視為同一容量產品。"
  },
  {
    "id": "herbal-tea-honey-ginger",
    "label": "草本茶－蜜薑（台灣102g）",
    "TW": "2121",
    "TH": "2121",
    "matchNote": "🇹🇼 台灣102g；🇹🇭 泰國容量尚待確認。中國100g另列，兩種容量不合併。"
  },
  {
    "id": "herbal-tea-honey-ginger-cn-100g",
    "label": "草本茶－蜜薑 100g",
    "CN": "L896",
    "sizeVariantOf": "herbal-tea-honey-ginger",
    "sizeLabel": "100g",
    "matchNote": "🇨🇳 100g，不等於台灣102g，同口味亦不合併。"
  },
  {
    "id": "nrg",
    "label": "NRG 瓜拿那茶",
    "HK": "0102",
    "TW": "0102",
    "JP": "0124"
  },
  {
    "id": "liftoff",
    "label": "Liftoff 活力發泡飲",
    "HK": "2871",
    "TW": "3152",
    "JP": "105K"
  },
  {
    "id": "cleanser",
    "label": "SKIN 潔面乳",
    "HK": "0765",
    "TW": "0765",
    "JP": "0765"
  },
  {
    "id": "toner",
    "label": "SKIN 草本化妝水／爽膚水 150ml",
    "HK": "0891",
    "TW": "0891",
    "JP": "0891"
  },
  {
    "id": "serum",
    "label": "SKIN 精華霜／精華液",
    "HK": "0768",
    "TW": "0768",
    "JP": "0768"
  },
  {
    "id": "day-moisturizer",
    "label": "SKIN 日間保濕乳液",
    "HK": "0769",
    "TW": "0769",
    "JP": "0769"
  },
  {
    "id": "sunscreen",
    "label": "SKIN 防曬乳液 SPF30",
    "HK": "0899",
    "TW": "0899",
    "JP": "0899"
  },
  {
    "id": "night-cream",
    "label": "SKIN 賦活晚霜",
    "HK": "0774",
    "TW": "0774",
    "JP": "0774"
  },
  {
    "id": "eye-gel",
    "label": "SKIN 緊緻眼部啫喱",
    "HK": "0770",
    "TW": "0770",
    "JP": "0770"
  },
  {
    "id": "eye-cream",
    "label": "SKIN 保濕眼霜",
    "HK": "0771",
    "TW": "0771",
    "JP": "0771"
  },
  {
    "id": "body-wash",
    "label": "蘆薈滋潤沐浴露",
    "HK": "2561",
    "TW": "2561",
    "JP": "2561",
    "TH": "2561"
  },
  {
    "id": "aloe-gel",
    "label": "蘆薈護膚凝露",
    "HK": "2562",
    "TW": "2562",
    "JP": "2562",
    "TH": "2562"
  },
  {
    "id": "body-cream",
    "label": "蘆薈滋潤乳霜／身體霜",
    "HK": "2563",
    "TW": "2563",
    "JP": "250K",
    "TH": "2563"
  },
  {
    "id": "citrus-cleanser",
    "label": "柑橘磨砂潔面乳",
    "TW": "0766",
    "TH": "0766"
  },
  {
    "id": "schizandra",
    "label": "五味子 Schizandra Plus",
    "HK": "0022",
    "TW": "0022"
  },
  {
    "id": "relaxation-tea",
    "label": "輕鬆茶 Relaxation Tea",
    "HK": "044K",
    "TW": "044K"
  },
  {
    "id": "garden",
    "label": "蔬果營養／Herbal Garden",
    "TW": "3272",
    "JP": "1394"
  },
  {
    "id": "shaker",
    "label": "奶昔搖搖杯／Shaker 400ml",
    "TW": "8574",
    "JP": "295A",
    "TH": "295A"
  },
  {
    "id": "measuring-spoons",
    "label": "白色量匙 10支",
    "JP": "297A",
    "TH": "297A"
  },
  {
    "id": "tablet-crusher",
    "label": "碎藥器",
    "JP": "314A",
    "TH": "314A"
  },
  {
    "id": "supervisor-fee",
    "label": "督導年費",
    "TW": "0909",
    "JP": "0909",
    "HK": "0909",
    "TH": "0909"
  },
  {
    "id": "distributor-fee",
    "label": "會員／直銷商年費",
    "HK": "9909",
    "TW": "9909",
    "JP": "9909",
    "TH": "9909"
  }
];
