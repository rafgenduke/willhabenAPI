const assert = require("assert");
const wh = require("../app");

test();

async function test() {
  const res = await wh
    .new()
    .count(3)
    .periode(1)
    .sortBy(wh.getSortOrders.preisAbsteigend)
    .condition(wh.getConditions.gebraucht)
    .category("2846")
    //.areaIds([wh.getAreadId.niederoesterreich.melk, wh.getAreadId.niederoesterreich.amstetten])
    .search();
  console.log(res);
}
