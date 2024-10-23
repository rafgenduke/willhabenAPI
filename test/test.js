const assert = require('assert');
const wh = require('../app')

test();

async function test() {
    const res = await wh.new().count(10).periode(1).condition(wh.getConditions.gebraucht).category('2846').search()

    console.log(res);
}