const assert = require("node:assert/strict");
const {
  MAX_ITEMS,
  SHOP,
  battle,
  createPlayer,
  incomeForLevel,
  itemStats,
  levelUpCost,
  upgradeIfPossible
} = require("../src/index.js");

function testEconomyScaling() {
  assert.equal(incomeForLevel(1), 6);
  assert.equal(incomeForLevel(5), 14);
  assert.equal(levelUpCost(1), 6);
  assert.equal(levelUpCost(5), 14);
}

function testTierStatScaling() {
  const sword = SHOP.find((i) => i.id === "short-sword");
  const t0 = itemStats({ blueprint: sword, tier: 0 });
  const t1 = itemStats({ blueprint: sword, tier: 1 });
  assert.equal(t0.attack, 6);
  assert.equal(t1.attack, 11);
  assert.ok(t1.attack > t0.attack);
}

function testUpgradeRuleThreeCopies() {
  const player = createPlayer("Tester");
  const sword = SHOP.find((i) => i.id === "short-sword");

  player.inventory.push({ blueprint: sword, tier: 0 });
  player.inventory.push({ blueprint: sword, tier: 0 });
  player.inventory.push({ blueprint: sword, tier: 0 });
  player.copies.set(sword.id, [3, 0, 0, 0]);

  upgradeIfPossible(player, sword);

  assert.equal(player.inventory.filter((i) => i.blueprint.id === sword.id && i.tier === 1).length, 1);
  assert.equal(player.inventory.filter((i) => i.blueprint.id === sword.id && i.tier === 0).length, 0);
}

function testBattleReturnsValidWinner() {
  const p1 = createPlayer("A");
  const p2 = createPlayer("B");

  const winner = battle(p1, p2);
  assert.ok(["A", "B", "Draw"].includes(winner));
}

function testInventoryCapConstant() {
  assert.equal(MAX_ITEMS, 6);
}

function run() {
  testEconomyScaling();
  testTierStatScaling();
  testUpgradeRuleThreeCopies();
  testBattleReturnsValidWinner();
  testInventoryCapConstant();
  console.log("All smoke tests passed.");
}

run();
