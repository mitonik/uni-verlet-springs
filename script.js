const c = document.getElementById('canvas');
c.width = window.innerWidth;
c.height = window.innerHeight;
const ctx = c.getContext('2d');
const SCALE = 100;
ctx.scale(SCALE, SCALE);

const width = canvas.width / SCALE;
const height = canvas.height / SCALE;

let gravity = Number(document.getElementById('gravity').value);
let wind = Number(document.getElementById('wind').value);

function updateSettings() {
  gravity = Number(document.getElementById('gravity').value);
  wind = Number(document.getElementById('wind').value);
}
updateSettings();

ctx.fillStyle = '#2c1e2e';
ctx.lineWidth = 0.01;
ctx.strokeStyle = '#9f4c9a';

class Point {
  sx = 0.1;
  sy = 0.1;

  ax = 0;
  ay = 0;

  constructor(x, y) {
    this.px = x;
    this.py = y;
    this.pxOld = x;
    this.pyOld = y;
  }

  update(dt) {
    const pxNew = this.px + (this.px - this.pxOld) + this.ax * dt ** 2;
    const pyNew = this.py + (this.py - this.pyOld) + this.ay * dt ** 2;
    this.pxOld = this.px;
    this.pyOld = this.py;
    this.px = pxNew;
    this.py = pyNew;
    this.vx = (this.px - this.pxOld) / dt;
    this.vy = (this.py - this.pyOld) / dt;
    this.ax = wind - 6 * Math.PI * 18e-2 * this.sx * this.vx;
    this.ay = gravity - 6 * Math.PI * 18e-2 * this.sy * this.vy;
  }

  restrain() {
    if (this.px > width - this.sx) {
      this.px = (width - this.sx) - ( this.px - (width - this.sx) ) * 0.6;
      this.pxOld = (width - this.sx) + ( (width - this.sx) - this.pxOld ) * 0.6;
    } else if (this.px < 0) {
      this.px = -this.px * 0.6;
      this.pxOld = -this.pxOld * 0.6;
    }
    if (this.py > height - this.sy) {
      this.py = (height - this.sy) - ( this.py - (height - this.sy) ) * 0.6;
      this.pyOld = (height - this.sy) + ( (height - this.sy) - this.pyOld ) * 0.6;
    } else if (this.py < 0) {
      this.py = -this.py * 0.6;
      this.pyOld = -this.pyOld * 0.6;
    }
  }

  draw() {
    ctx.fillRect(this.px, this.py, this.sx, this.sy);
  }
}

class Constraint {
  constructor(p1, p2, b) {
    this.p1 = p1;
    this.p2 = p2;
    this.baseDistance = b;
    this.stiffness = 1e4;
  }

  update() {
    const dx = this.p2.px - this.p1.px;
    const dy = this.p2.py - this.p1.py;

    const dist = Math.sqrt(dx * dx + dy * dy);

    const diff = (this.baseDistance - dist) / dist;

    const offsetX = this.stiffness * dx * diff;
    const offsetY = this.stiffness * dy * diff;

    this.p1.ax -= offsetX;
    this.p1.ay -= offsetY;
    this.p2.ax += offsetX;
    this.p2.ay += offsetY;
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.p1.px, this.p1.py);
    ctx.lineTo(this.p2.px, this.p2.py);
    ctx.stroke();
  }
}

class Cloth {
  pointsArray = [];
  constraintsArray = [];
  constructor() {
    for (let i = 0; i < 5; i++) {
      for (let j = 5; j < 15; j++) {
        this.pointsArray.push(new Point(j, i));
      }
    }

    for (let i = 0; i < 50; i += 10) {
      for (let j = 0; j < 9; j++) {
        this.constraintsArray.push(new Constraint(this.pointsArray[i + j], this.pointsArray[i + j + 1], 1));
      }
    }
    for (let i = 0; i < 40; i += 10) {
      for (let j = 0; j < 10; j++) {
        this.constraintsArray.push(new Constraint(this.pointsArray[i + j], this.pointsArray[i + j + 1 + 9], 1));
      }
    }
  }
  update(dt) {
    for (let i = 10; i < 50; i++) {
      this.pointsArray[i].update(dt);
      this.pointsArray[i].restrain();
    }
    for (let constraint of this.constraintsArray) {
      constraint.update();
    }
  }
  draw() {
    for (let point of this.pointsArray) {
      point.draw();
    }
    for (let constraint of this.constraintsArray) {
      constraint.draw();
    }
  }
}

class Box {
  pointsArray = [];
  constraintsArray = [];
  constructor(x, y) {
    this.pointsArray.push(new Point(x, y));
    this.pointsArray.push(new Point(x + 1, y));
    this.pointsArray.push(new Point(x + 1, y + 1));
    this.pointsArray.push(new Point(x, y + 1));
    
    this.constraintsArray.push(new Constraint(this.pointsArray[0], this.pointsArray[1], 1));
    this.constraintsArray.push(new Constraint(this.pointsArray[1], this.pointsArray[2], 1));
    this.constraintsArray.push(new Constraint(this.pointsArray[2], this.pointsArray[3], 1));
    this.constraintsArray.push(new Constraint(this.pointsArray[3], this.pointsArray[0], 1));
    this.constraintsArray.push(new Constraint(this.pointsArray[0], this.pointsArray[2], Math.sqrt(2)));
  }
  update(dt) {
    for (let point of this.pointsArray) {
      point.update(dt);
      point.restrain();
    }
    for (let constraint of this.constraintsArray) {
      constraint.update();
    }
  }
  draw() {
    for (let point of this.pointsArray) {
      point.draw();
    }
    for (let constraint of this.constraintsArray) {
      constraint.draw();
    }
  }
}

const cloth = new Cloth();

const boxArray = [];

function update(dt) {
  cloth.update(dt);
  for (let box of boxArray) {
    box.update(dt);
  }
}

function draw() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  cloth.draw();
  for (let box of boxArray) {
    box.draw();
  }
}

let lastTime = 0;
let accumulator = 0;
const dt = 1/60;

function loop(time) {
  let frameTime = time - lastTime;
  if (frameTime > 60) {
    frameTime = 60;
  }
  lastTime = time;
  accumulator += frameTime;
  while (accumulator >= dt) {
    update(dt/1000);
    accumulator -= dt;
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

canvas.addEventListener('click', (e) => {
  boxArray.push(new Box(e.clientX / SCALE, e.clientY / SCALE));
})
