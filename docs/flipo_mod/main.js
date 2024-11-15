// main.js
title = "FLIP O Mod";
description = `
Red: +1 ball\n
Yellow: stop +3s\n
Green: boom\n
[Tap] Flip
`;
characters = [];
options = {
  theme: "shapeDark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  isDrawingScoreFront: true,
  seed: 2,
};
/** @type {{pos: Vector, pp: Vector, vel: Vector, angle: number, multiplier: 1}[]} */
let balls;
let flipCount;
/** @type {{pos: Vector, hasBall: boolean, isYellow: boolean, isGreen: boolean}[]} */
let blocks;
let nextBlockDist;
const ballRadius = 2;
const flipperLength = 12;
const blockSize = vec(9, 5);
const blockCount = 8;
let freezeTime = 0; // timer to stop block falling
const yellowBlockProbability = 0.05;
const greenBlockProbability = 0.05;

function update() {
  if (!ticks) {
    balls = [
      {
        pos: vec(80, 10),
        pp: vec(80, 10),
        vel: vec(1, 0),
        angle: rnd(PI * 2),
        multiplier: 1,
      },
    ];
    flipCount = 0;
    blocks = [];
    nextBlockDist = 0;
  }
  let maxBlockY = 0;
  blocks.forEach((b) => {
    if (b.isGreen) {  
      color("green");
    } else if (b.isYellow) {
      color("yellow");
    } else if (b.hasBall) {
      color("red");
    } else {
      color("cyan");
    }
    box(b.pos, blockSize);
    if (b.pos.y > maxBlockY) {
      maxBlockY = b.pos.y;
    }
  });

  // calculate scroll speed based on freezeTime
  let scr = 0;
  if (freezeTime <= 0) {
    scr = maxBlockY < 29 ? (30 - maxBlockY) * 0.1 : sqrt(difficulty) * 0.02;
  } else {
    freezeTime -= 1; // decrement freezeTime if blocks are frozen
  }

  if (input.isJustPressed) {
    play("laser");
    if (freezeTime <= 0) { // ensure input does not move blocks during freeze
      scr += sqrt(difficulty) * 0.3 * balls.length;
    }
    flipCount = (flipCount + 1) % 2;
  }

  color("light_cyan");
  rect(5, 0, 90, 5);
  color("light_blue");
  rect(0, 0, 5, 99);
  rect(95, 0, 5, 99);

  color("blue");
  let c = bar(7, 75, 25, 3, 0.5, 0).isColliding.rect;
  c = { ...c, ...bar(101 - 7, 75, 25, 3, PI - 0.5, 0).isColliding.rect };

  color("purple");
  const f1a = flipCount === 0 ? 0.5 : -0.5;
  c = { ...c, ...bar(50 - 17, 88, flipperLength, 3, f1a, 0).isColliding.rect };
  const f2a = flipCount === 0 ? PI + 0.5 : PI - 0.5;
  c = { ...c, ...bar(51 + 17, 88, flipperLength, 3, f2a, 0).isColliding.rect };
  if (c.cyan || c.red) {
    color("red");
    bar(7, 75, 25, 3, 0.5, 0);
    bar(101 - 7, 75, 25, 3, PI - 0.5, 0);
    play("explosion");
    end();
  }
  if (input.isJustPressed) {
    if (flipCount === 0) {
      bar(51 + 17, 88, flipperLength, 3, PI, 0);
    } else {
      bar(50 - 17, 88, flipperLength, 3, 0, 0);
    }
  }

  remove(balls, (b) => {
    b.pp.set(b.pos);
    b.pp.y += scr;
    b.vel.y += 0.1;
    b.vel.mul(0.99);
    b.pos.add(vec(b.vel).mul(sqrt(difficulty) * 0.5));
    b.pos.y += scr;
    b.angle += b.vel.x * 0.03 + b.vel.y * 0.02;
    color("black");
    const c = arc(b.pos, ballRadius, 3, b.angle, b.angle + PI * 2).isColliding
      .rect;
    if (c.red || c.cyan || c.yellow || c.green) { 
      if (c.yellow) {
        freezeTime = 3 * 60; 
      }
      if (c.green) {
        explodeBlock(b.pos); // destroy adjacent blocks
      }
      addScore(b.multiplier * balls.length, b.pos);
      b.multiplier++;
      color("transparent");
      const cx = arc(b.pp.x, b.pos.y, ballRadius).isColliding.rect;
      const cy = arc(b.pos.x, b.pp.y, ballRadius).isColliding.rect;
      if (!(cx.red || cx.cyan || cx.yellow || cx.green)) {
        reflect(b, b.vel.x > 0 ? -PI : 0);
      }
      if (!(cy.red || cy.cyan || cy.yellow || cy.green)) {
        reflect(b, b.vel.y > 0 ? -PI / 2 : PI / 2);
      }
    }
    if (c.light_cyan) {
      play("hit");
      reflect(b, PI / 2, "light_cyan");
    }
    if (c.light_blue) {
      play("hit");
      reflect(b, b.pos.x < 50 ? 0 : PI, "light_blue");
    }
    if (c.blue) {
      reflect(b, b.pos.x < 50 ? 0.5 - PI / 2 : PI - 0.5 + PI / 2, "blue");
    }
    if (c.purple) {
      if (input.isJustPressed) {
        play("jump");
        const pp = vec(b.pos);
        const pf1a = flipCount === 1 ? 0.5 : -0.5;
        const pf2a = flipCount === 1 ? PI + 0.5 : PI - 0.5;
        reflect(b, b.pos.x < 50 ? pf1a - PI / 2 : pf2a + PI / 2, "purple");
        reflect(b, -PI / 2, "purple");
        reflect(b, b.pos.x < 50 ? f1a - PI / 2 : f2a + PI / 2, "purple");
        b.vel.add(vec(b.pos).sub(pp));
        b.multiplier = 1;
      } else {
        reflect(b, b.pos.x < 50 ? f1a - PI / 2 : f2a + PI / 2, "purple");
      }
    }
    if (b.pos.y > 99 + ballRadius) {
      play("select");
      return true;
    }
  });
  if (balls.length === 0) {
    play("explosion");
    end();
  }
  balls.forEach((b) => {
    balls.forEach((ab) => {
      if (ab === b || ab.pos.distanceTo(b.pos) > ballRadius * 2) {
        return;
      }
      reflect(b, ab.pos.angleTo(b.pos));
    });
  });

  color("transparent");
  remove(blocks, (b) => {
    b.pos.y += scr;
    const blockCollision = box(b.pos, blockSize).isColliding.rect;
    if (blockCollision.black) {
      if (b.hasBall) {
        play("powerUp");
        balls.push({
          pos: vec(b.pos),
          pp: vec(b.pos),
          vel: vec(1, 0).rotate(rnd(PI * 2)),
          angle: rnd(PI * 2),
          multiplier: 1,
        });
      } else if (blockCollision.yellow) {
        play("hit");
        freezeTime = 5 * 60;
      } else {
        play("coin");
      }
      return true;
    }
  });
  nextBlockDist -= scr;
  while (nextBlockDist < 0) {
    let x = (blockSize.x + 1) / 2;
    const y = -nextBlockDist;
    const br = 0.1 / balls.length;
    for (let i = 0; i < blockCount / 2; i++) {
      const isGreenBlock = rnd() < greenBlockProbability;
      blocks.push({ pos: vec(50 - x, y), hasBall: rnd() < br, isYellow: rnd() < yellowBlockProbability, isGreen: isGreenBlock });
      blocks.push({ pos: vec(50 + x, y), hasBall: rnd() < br, isYellow: rnd() < yellowBlockProbability, isGreen: isGreenBlock });
      x += (blockSize.x + 1);
    }
    nextBlockDist += blockSize.y + 1;
  }

  function reflect(b, a, c) {
    const oa = wrap(b.vel.angle - a - PI, -PI, PI);
    if (abs(oa) < PI / 2) {
      b.vel.addWithAngle(a, b.vel.length * cos(oa) * 1.7);
    }
    if (c != null) {
      color("transparent");
      for (let i = 0; i < 9; i++) {
        b.pos.addWithAngle(a, 1);
        if (!arc(b.pos, ballRadius).isColliding.rect[c]) {
          break;
        }
      }
    }
  }

  function explodeBlock(pos) { // green blocks exploding
    const toRemove = [];
    blocks.forEach((b) => {
      if (b.pos.distanceTo(pos) <= blockSize.x + 7.5) { // range adjusted
        play("explosion");
        toRemove.push(b);
        // award score and apply power-ups if necessary
        addScore(1, b.pos); // Score from each block
        if (b.hasBall) {
          // duplication effect from red blocks
          balls.push({
            pos: vec(b.pos),
            pp: vec(b.pos),
            vel: vec(1, 0).rotate(rnd(PI * 2)),
            angle: rnd(PI * 2),
            multiplier: 1,
          });
          play("powerUp");
        } else if (b.isYellow) {
          // time freeze effect from yellow blocks
          freezeTime = 5 * 60;
          play("hit");
        }
      }
    });
    blocks = blocks.filter((b) => !toRemove.includes(b));
  }
}