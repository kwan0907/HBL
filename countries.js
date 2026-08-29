/* 地區與貨幣總設定。新增地區時只需在此加一項設定，再建立對應 data 檔。 */
window.HBL_COUNTRY_CONFIGS = {
  "HK": {
    "code": "HK",
    "name": "香港",
    "flag": "🇭🇰",
    "dataFile": "./data/hong-kong.js",
    "currency": "HK$",
    "currencyCode": "HKD",
    "locale": "zh-HK",
    "decimals": 2,
    "defaultTier": "標準價",
    "supportsVP": true,
    "hasVPData": true,
    "supportsFreight": true,
    "showSpecialShortcuts": true,
    "tiers": [
      [
        "標準價",
        "標準價"
      ],
      [
        "銅級",
        "銅級"
      ],
      [
        "銀級",
        "銀級"
      ],
      [
        "金級",
        "金級"
      ],
      [
        "58%",
        "58%"
      ],
      [
        "50%",
        "50%"
      ],
      [
        "cost",
        "成本價"
      ]
    ],
    "compareTiers": {
      "retail": "標準價",
      "15%": "銅級",
      "25%": "銀級",
      "35%": "金級",
      "42%": "58%",
      "50%": "50%"
    }
  },
  "TW": {
    "code": "TW",
    "name": "台灣",
    "flag": "🇹🇼",
    "dataFile": "./data/taiwan.js",
    "currency": "NT$",
    "currencyCode": "TWD",
    "locale": "zh-TW",
    "decimals": 0,
    "defaultTier": "建議零售價",
    "supportsVP": true,
    "hasVPData": true,
    "supportsFreight": false,
    "showSpecialShortcuts": false,
    "tiers": [
      [
        "建議零售價",
        "建議零售價（含稅）"
      ],
      [
        "未稅價格",
        "未稅價格"
      ],
      [
        "15%",
        "15%"
      ],
      [
        "25%",
        "25%"
      ],
      [
        "35%",
        "35%"
      ],
      [
        "42%",
        "42%"
      ],
      [
        "50%",
        "50%"
      ],
      [
        "cost",
        "成本價（50%）"
      ]
    ],
    "compareTiers": {
      "retail": "建議零售價",
      "15%": "15%",
      "25%": "25%",
      "35%": "35%",
      "42%": "42%",
      "50%": "50%"
    }
  },
  "JP": {
    "code": "JP",
    "name": "日本",
    "flag": "🇯🇵",
    "dataFile": "./data/japan.js",
    "currency": "¥",
    "currencyCode": "JPY",
    "locale": "ja-JP",
    "decimals": 0,
    "defaultTier": "標準小売価格",
    "supportsVP": false,
    "hasVPData": true,
    "supportsFreight": false,
    "showSpecialShortcuts": false,
    "tiers": [
      [
        "標準小売価格",
        "標準小売価格"
      ],
      [
        "15%",
        "15%"
      ],
      [
        "25%",
        "25%"
      ],
      [
        "35%",
        "35%"
      ],
      [
        "42%",
        "42%"
      ],
      [
        "50%",
        "50%"
      ],
      [
        "cost",
        "成本價（50%）"
      ]
    ],
    "compareTiers": {
      "retail": "標準小売価格",
      "15%": "15%",
      "25%": "25%",
      "35%": "35%",
      "42%": "42%",
      "50%": "50%"
    }
  },
  "TH": {
    "code": "TH",
    "name": "泰國",
    "flag": "🇹🇭",
    "dataFile": "./data/thailand.js",
    "currency": "฿",
    "currencyCode": "THB",
    "locale": "th-TH",
    "decimals": 2,
    "defaultTier": "建議零售價",
    "supportsVP": false,
    "hasVPData": true,
    "supportsFreight": false,
    "showSpecialShortcuts": false,
    "tiers": [
      ["建議零售價", "建議零售價"],
      ["15%", "15%"],
      ["25%", "25%"],
      ["35%", "35%"],
      ["42%", "42%"],
      ["50%", "50%"],
      ["cost", "成本價（50%）"]
    ],
    "compareTiers": {
      "retail": "建議零售價",
      "15%": "15%",
      "25%": "25%",
      "35%": "35%",
      "42%": "42%",
      "50%": "50%"
    }
  }
};

window.HBL_CURRENCY_META = {
  "HKD": {
    "symbol": "HK$",
    "label": "港幣 HKD",
    "locale": "zh-HK",
    "decimals": 2,
    "ratePerHKD": 1
  },
  "TWD": {
    "symbol": "NT$",
    "label": "台幣 TWD",
    "locale": "zh-TW",
    "decimals": 0,
    "ratePerHKD": 4.060717
  },
  "JPY": {
    "symbol": "¥",
    "label": "日圓 JPY",
    "locale": "ja-JP",
    "decimals": 0,
    "ratePerHKD": 20.312473
  },
  "THB": {
    "symbol": "฿",
    "label": "泰銖 THB",
    "locale": "th-TH",
    "decimals": 2,
    "ratePerHKD": 4.184015
  }
};
