import type { PlayerState, ArenaState, InputState, Anchor } from '@gamevault/rift-shared';
import { isInRange, distance } from '@gamevault/rift-shared';
import { ANCHOR_CAPTURE_RANGE } from '@gamevault/rift-shared';

interface BotBrain {
  targetAnchorId: number | null;
  phaseTimer: number;
  attackTimer: number;
  wanderAngle: number;
  decisionTimer: number;
}

const brains = new Map<string, BotBrain>();

export function getBotInput(bot: PlayerState, state: ArenaState, dt: number): InputState {
  let brain = brains.get(bot.id);
  if (!brain) {
    brain = {
      targetAnchorId: null,
      phaseTimer: 5 + Math.random() * 10,
      attackTimer: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      decisionTimer: 0,
    };
    brains.set(bot.id, brain);
  }

  brain.decisionTimer -= dt;
  brain.phaseTimer -= dt;
  brain.attackTimer -= dt;

  // Make decisions every 1-2 seconds
  if (brain.decisionTimer <= 0) {
    brain.decisionTimer = 1 + Math.random();
    brain.targetAnchorId = pickTargetAnchor(bot, state);
    brain.wanderAngle += (Math.random() - 0.5) * Math.PI;
  }

  let moveX = 0;
  let moveY = 0;
  let aimAngle = bot.aimAngle;
  let phaseShift = false;
  let attack = false;

  // Move toward target anchor
  const targetAnchor = brain.targetAnchorId !== null
    ? state.anchors.find(a => a.id === brain!.targetAnchorId)
    : null;

  if (targetAnchor) {
    const dx = targetAnchor.position.x - bot.position.x;
    const dy = targetAnchor.position.y - bot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > ANCHOR_CAPTURE_RANGE * 0.5) {
      moveX = dx / dist;
      moveY = dy / dist;
    }

    // Phase shift if anchor is in other dimension
    if (targetAnchor.dimension !== bot.dimension && brain.phaseTimer <= 0 && bot.phaseCooldown <= 0) {
      phaseShift = true;
      brain.phaseTimer = 8 + Math.random() * 8;
    }
  } else {
    // Wander
    moveX = Math.cos(brain.wanderAngle);
    moveY = Math.sin(brain.wanderAngle);
  }

  // Look for nearby enemies to attack
  let nearestEnemy: PlayerState | null = null;
  let nearestDist = 300;
  for (const [, p] of state.players) {
    if (p.id === bot.id || !p.alive || p.dimension !== bot.dimension) continue;
    const d = distance(bot.position, p.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestEnemy = p;
    }
  }

  if (nearestEnemy) {
    aimAngle = Math.atan2(
      nearestEnemy.position.y - bot.position.y,
      nearestEnemy.position.x - bot.position.x,
    );
    if (brain.attackTimer <= 0) {
      attack = true;
      brain.attackTimer = 0.4 + Math.random() * 0.3;
    }
  } else {
    aimAngle = Math.atan2(moveY, moveX);
  }

  // Phase shift back to light if debt is high
  if (bot.dimension === 'shadow' && bot.phaseDebt > 10 && bot.phaseCooldown <= 0) {
    phaseShift = true;
    brain.phaseTimer = 5;
  }

  return { moveX, moveY, aimAngle, phaseShift, attack };
}

function pickTargetAnchor(bot: PlayerState, state: ArenaState): number {
  // Prefer unowned anchors in our dimension, then enemy-owned
  let best: Anchor | null = null;
  let bestScore = -Infinity;

  for (const anchor of state.anchors) {
    if (anchor.owner === bot.id) continue;

    let score = 0;
    // Prefer same dimension
    if (anchor.dimension === bot.dimension) score += 50;
    // Prefer unowned
    if (!anchor.owner) score += 30;
    // Closer is better
    const dist = distance(bot.position, anchor.position);
    score -= dist * 0.05;
    // Add randomness
    score += Math.random() * 20;

    if (score > bestScore) {
      bestScore = score;
      best = anchor;
    }
  }

  return best?.id ?? 0;
}

export function clearBotBrains(): void {
  brains.clear();
}
