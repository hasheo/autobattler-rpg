(function () {
  const MAX_ITEMS = 6;
  const DAYS = 10;
  const BATTLE_TIME_LIMIT = 180;

  const SHOP = [
    { id: "short-sword", name: "Short Sword", baseCost: 3, baseAttack: 6, baseDefense: 0, effectsByTier: { 0: [], 1: [{ apply: (_, owner) => { owner.critChance += 0.1; } }], 2: [{ apply: (_, owner) => { owner.lifesteal += 0.15; } }], 3: [{ apply: (_, owner) => { owner.critChance += 0.35; } }] } },
    { id: "guardian-shield", name: "Guardian Shield", baseCost: 4, baseAttack: 1, baseDefense: 8, effectsByTier: { 0: [], 1: [{ apply: (_, owner) => { owner.shield += 18; } }], 2: [{ apply: (_, owner) => { owner.defense += 20; } }], 3: [{ apply: (_, owner, enemy) => { enemy.stunTimer = Math.max(enemy.stunTimer, 2); } }] } },
    { id: "ember-staff", name: "Ember Staff", baseCost: 5, baseAttack: 4, baseDefense: 1, effectsByTier: { 0: [{ apply: (_, owner) => { owner.burnPerSecond += 1; } }], 1: [{ apply: (_, owner) => { owner.burnPerSecond += 2; } }], 2: [{ apply: (_, owner) => { owner.burnPerSecond += 4; } }], 3: [{ apply: (_, owner) => { owner.burnPerSecond += 8; } }] } },
    { id: "vampire-dagger", name: "Vampire Dagger", baseCost: 6, baseAttack: 5, baseDefense: 0, effectsByTier: { 0: [{ apply: (_, owner) => { owner.lifesteal += 0.08; } }], 1: [{ apply: (_, owner) => { owner.lifesteal += 0.16; } }], 2: [{ apply: (_, owner) => { owner.lifesteal += 0.24; } }], 3: [{ apply: (_, owner) => { owner.lifesteal += 0.4; } }] } }
  ];

  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const incomeForLevel = (level) => 4 + level * 2;
  const levelUpCost = (level) => 4 + level * 2;

  function createPlayer(name) {
    return { name, level: 1, gold: 5, inventory: [], copies: new Map() };
  }

  function itemStats(item) {
    const scalar = 1 + item.tier * 0.75;
    return {
      attack: Math.round(item.blueprint.baseAttack * scalar),
      defense: Math.round(item.blueprint.baseDefense * scalar)
    };
  }

  function upgradeIfPossible(player, blueprint, log) {
    const tiers = player.copies.get(blueprint.id) ?? [0, 0, 0, 0];
    for (let tier = 0; tier < 3; tier += 1) {
      while (tiers[tier] >= 3) {
        tiers[tier] -= 3;
        tiers[tier + 1] += 1;

        let removed = 0;
        player.inventory = player.inventory.filter((item) => {
          if (removed < 3 && item.blueprint.id === blueprint.id && item.tier === tier) {
            removed += 1;
            return false;
          }
          return true;
        });

        player.inventory.push({ blueprint, tier: tier + 1 });
        log(`  ↳ ${player.name} upgraded ${blueprint.name} to tier ${tier + 1}!`);
      }
    }

    player.copies.set(blueprint.id, tiers);
  }

  function buyItem(player, log) {
    if (player.inventory.length >= MAX_ITEMS) return;
    const options = SHOP.filter((item) => item.baseCost <= player.gold);
    if (options.length === 0) return;

    const item = randomPick(options);
    player.gold -= item.baseCost;
    player.inventory.push({ blueprint: item, tier: 0 });

    const tiers = player.copies.get(item.id) ?? [0, 0, 0, 0];
    tiers[0] += 1;
    player.copies.set(item.id, tiers);

    log(`  ${player.name} bought ${item.name} (tier 0) for ${item.baseCost}g.`);
    upgradeIfPossible(player, item, log);
  }

  function preparationPhase(player, day, log) {
    const income = incomeForLevel(player.level);
    player.gold += income;
    log(`${player.name} preparation (Day ${day}): +${income}g income (gold=${player.gold}).`);

    while (player.gold >= levelUpCost(player.level) && player.level < 10 && Math.random() < 0.6) {
      const cost = levelUpCost(player.level);
      player.gold -= cost;
      player.level += 1;
      log(`  ${player.name} leveled up to ${player.level} (cost ${cost}g).`);
    }

    while (player.gold >= 3 && player.inventory.length < MAX_ITEMS) {
      const before = player.gold;
      buyItem(player, log);
      if (player.gold === before) break;
    }
  }

  function createFighter(player) {
    const baseHp = 100 + player.level * 22;
    const fighter = { name: player.name, maxHp: baseHp, hp: baseHp, attack: 8 + player.level * 2, defense: 3 + player.level, shield: 0, lifesteal: 0, critChance: 0.05, critMultiplier: 1.75, burnPerSecond: 0, stunTimer: 0, items: player.inventory };
    for (const item of fighter.items) {
      const stats = itemStats(item);
      fighter.attack += stats.attack;
      fighter.defense += stats.defense;
      const tierEffects = item.blueprint.effectsByTier[item.tier] ?? [];
      for (const effect of tierEffects) effect.apply({ timeSec: 0, random: Math.random }, fighter, fighter);
    }
    return fighter;
  }

  function dealDamage(source, target, rawDamage) {
    let damage = Math.max(1, rawDamage - target.defense * 0.35);
    if (Math.random() < source.critChance) damage *= source.critMultiplier;

    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, damage);
      target.shield -= absorbed;
      damage -= absorbed;
    }

    if (damage > 0) {
      target.hp -= damage;
      const heal = damage * source.lifesteal;
      source.hp = Math.min(source.maxHp, source.hp + heal);
    }
  }

  function battle(playerA, playerB) {
    const a = createFighter(playerA);
    const b = createFighter(playerB);
    let timeSec = 0;

    while (timeSec < BATTLE_TIME_LIMIT && a.hp > 0 && b.hp > 0) {
      if (a.stunTimer <= 0) { dealDamage(a, b, a.attack); if (a.burnPerSecond > 0) b.hp -= a.burnPerSecond; } else a.stunTimer -= 1;
      if (b.hp <= 0) break;
      if (b.stunTimer <= 0) { dealDamage(b, a, b.attack); if (b.burnPerSecond > 0) a.hp -= b.burnPerSecond; } else b.stunTimer -= 1;
      timeSec += 1;
    }

    if (a.hp > 0 && b.hp <= 0) return playerA.name;
    if (b.hp > 0 && a.hp <= 0) return playerB.name;

    let fatigue = 2;
    while (a.hp > 0 && b.hp > 0) {
      a.hp -= fatigue;
      b.hp -= fatigue;
      fatigue *= 2;
    }

    if (a.hp === b.hp) return "Draw";
    return a.hp > b.hp ? playerA.name : playerB.name;
  }

  function printInventory(player, log) {
    const summary = player.inventory.map((item) => `${item.blueprint.name} (T${item.tier})`).join(", ");
    log(`${player.name} loadout: ${summary || "No items"}`);
  }

  function runGame(log) {
    const p1 = createPlayer("Player 1");
    const p2 = createPlayer("Player 2");
    let p1Wins = 0;
    let p2Wins = 0;

    for (let day = 1; day <= DAYS; day += 1) {
      log(`\n=== Day ${day} ===`);
      preparationPhase(p1, day, log);
      preparationPhase(p2, day, log);
      printInventory(p1, log);
      printInventory(p2, log);

      const winner = battle(p1, p2);
      if (winner === p1.name) p1Wins += 1;
      else if (winner === p2.name) p2Wins += 1;

      log(`Battle winner: ${winner}`);
      log(`Score => ${p1.name}: ${p1Wins} | ${p2.name}: ${p2Wins}`);
    }

    log("\n=== Final Result ===");
    if (p1Wins === p2Wins) log(`It's a draw after ${DAYS} days (${p1Wins}-${p2Wins}).`);
    else {
      const champion = p1Wins > p2Wins ? p1.name : p2.name;
      log(`${champion} wins the campaign ${Math.max(p1Wins, p2Wins)}-${Math.min(p1Wins, p2Wins)}.`);
    }
  }

  window.Autobattler = { runGame };
})();
