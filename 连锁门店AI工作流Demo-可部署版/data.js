window.DEMO_DATA = {
  rules: {
    forecastDays: 3,
    safetyDays: 1.5,
    maxStockDays: 7,
    orderPack: 5,
    anomalyRatio: 0.35,
    expiryWarningDays: 3,
    maxOrderUnits: 180,
    manualApprovalUnits: 100
  },
  products: [
    { id: "P01", name: "杨枝甘露", category: "鲜果", unit: "杯", stock: 68, inbound: 20, shelfLifeDays: 2, expiryDays: 3, sales: [42,45,41,48,50,54,58,47,44,51,55,60,63,52,49,57,61,66,59,55,62,68,72,64,60,71,75,79,73,82] },
    { id: "P02", name: "茉莉奶绿", category: "奶茶", unit: "杯", stock: 175, inbound: 0, shelfLifeDays: 5, expiryDays: 5, sales: [60,58,64,62,67,71,75,66,63,69,72,78,81,70,68,74,79,83,77,73,80,85,89,82,78,86,92,95,90,98] },
    { id: "P03", name: "青提冰茶", category: "鲜果", unit: "杯", stock: 32, inbound: 15, shelfLifeDays: 2, expiryDays: 2, sales: [28,30,27,31,34,38,42,33,29,36,40,45,48,39,35,43,47,52,46,41,49,55,58,50,45,57,61,65,59,70] },
    { id: "P04", name: "桂花酒酿奶茶", category: "奶茶", unit: "杯", stock: 120, inbound: 30, shelfLifeDays: 4, expiryDays: 4, sales: [35,37,34,40,42,45,47,39,36,43,46,50,53,44,41,48,52,56,51,46,54,59,62,55,50,61,65,69,63,67] },
    { id: "P05", name: "生椰拿铁", category: "咖啡", unit: "杯", stock: 44, inbound: 0, shelfLifeDays: 3, expiryDays: 2, sales: [24,23,26,28,30,32,35,29,27,31,34,37,39,33,30,36,38,41,37,34,40,43,46,42,38,45,48,52,47,54] },
    { id: "P06", name: "轻乳乌龙", category: "奶茶", unit: "杯", stock: 260, inbound: 0, shelfLifeDays: 6, expiryDays: 6, sales: [31,33,30,35,36,39,41,34,32,37,40,43,45,38,35,42,44,47,43,39,46,49,52,47,43,51,54,57,52,55] },
    { id: "P07", name: "西瓜啵啵", category: "鲜果", unit: "杯", stock: 18, inbound: 20, shelfLifeDays: 1, expiryDays: 1, sales: [18,20,19,22,25,28,31,24,21,27,30,34,38,29,26,33,37,42,35,31,40,45,50,43,39,52,58,64,56,76] },
    { id: "P08", name: "红豆双皮奶", category: "甜品", unit: "份", stock: 95, inbound: 0, shelfLifeDays: 3, expiryDays: 2, sales: [16,18,15,19,20,22,24,18,17,21,23,25,27,22,19,24,26,28,25,23,27,30,32,29,26,31,34,36,33,35] }
  ]
};
