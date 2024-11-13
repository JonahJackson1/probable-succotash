// https://stackoverflow.com/questions/73736370/is-it-better-to-translate-to-whole-canvas-or-to-change-the-position-of-elements
function generateRandomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function updateEntityPosition(entity, dmx, dmy, speed) {
  // normalize movement if diagonal to maintain consistent speed
  const length = Math.sqrt(dmx * dmx + dmy * dmy);
  if (length > 0) {
    dmx = (dmx / length) * speed;
    dmy = (dmy / length) * speed;
  }

  entity.position.x += dmx;
  entity.position.y += dmy;
}

class App {
  createStaticEntity({
    id = generateRandomNumber(1, 99999),
    position = {
      x: generateRandomNumber(-1500, 1500),
      y: generateRandomNumber(-1500, 1500),
    },
    color = "red",
    height = generateRandomNumber(50, 1500),
    width = generateRandomNumber(50, 1500),
  } = {}) {
    return {
      id,
      position,
      color,
      width,
      height,
    };
  }

  createMoveableEntity({
    id = generateRandomNumber(1, 99999),
    position = {
      x: generateRandomNumber(-1000, 1000),
      y: generateRandomNumber(-1000, 1000),
    },
    color = "blue",
    height = generateRandomNumber(1, 100),
    width = generateRandomNumber(1, 3),
    // speed = generateRandomNumber(0.5, 2.4),
    // speed = generateRandomNumber(0.5, 2.8),
    speed = 2.5,
    chase = true,
  } = {}) {
    return {
      id,
      position,
      color,
      height,
      width,
      speed,
      chase,
    };
  }

  createCameraEntity() {
    return {
      id: generateRandomNumber(1, 99999),
      position: { x: 0, y: 0 },
      color: "#00000000",
      width: 0,
      height: 0,
      speed: 2.5,
      health: 100,
    };
  }

  updateCameraPosition() {
    // camera movement
    let dmx = 0;
    let dmy = 0;
    updateEntityPosition(this.camera, dmx, dmy, this.camera.speed);
  }

  updateMoveablesPosition() {
    // moveable movement
    for (const moveable of this.moveables) {
      // moveable speed
      updateEntityPosition(moveable, 0, -1, moveable.speed);
    }
  }

  positionEntities(
    index,
    total = 60,
    {
      shape = "circle", // default shape is circle
      center = { x: 0, y: 0 },
      radius = 500,
      sideLength = 500,
    } = {}
  ) {
    if (shape === "circle") {
      const angleIncrement = (2 * Math.PI) / total;
      const angle = index * angleIncrement;
      return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    } else if (shape === "square") {
      const entitiesPerSide = Math.ceil(Math.sqrt(total));
      const spacing = sideLength / entitiesPerSide;
      const row = Math.floor(index / entitiesPerSide);
      const col = index % entitiesPerSide;
      return {
        x: center.x + col * spacing - sideLength / 2 + spacing / 2,
        y: center.y + row * spacing - sideLength / 2 + spacing / 2,
      };
    }
    // Handle unexpected shape values
    throw new Error(`Unsupported shape type: ${shape}`);
  }

  performLoop() {
    // set default transform to clear the canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.updateCameraPosition();

    this.updateMoveablesPosition();

    // set view
    this.view.translateX = -this.camera.position.x + this.canvas.width * 0.5;
    this.view.translateY = -this.camera.position.y + this.canvas.height * 0.5;

    // apply view
    this.ctx.setTransform(
      this.view.scaleX,
      this.view.skewY,
      this.view.skewX,
      this.view.scaleY,
      this.view.translateX,
      this.view.translateY
    );

    // draw world
    for (const entity of this.entities) {
      this.ctx.fillStyle = entity.color;
      this.ctx.fillRect(
        entity.position.x - entity.width * 0.5,
        entity.position.y - entity.height * 0.5,
        entity.width,
        entity.height
      );
    }

    const fps = 1000 / 30; // 1 second divided by 30 "frames"
    setTimeout(() => requestAnimationFrame(this.performLoop.bind(this)), fps);
  }

  constructor() {
    const MAX_WIDTH_PX = 1920;
    const MAX_HEIGHT_PX = 1080;

    const root = document.getElementById("root");
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    const resize = () => {
      this.canvas.width = Math.min(window.innerWidth, MAX_WIDTH_PX);
      this.canvas.height = Math.min(window.innerHeight, MAX_HEIGHT_PX);
    };

    resize();
    root.appendChild(this.canvas);
    window.addEventListener("resize", resize);

    this.view = {
      scaleX: 1,
      skewX: 0,
      skewY: 0,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
    };

    this.camera = this.createCameraEntity();

    // * these objects can have a speed and so on to be able to move around the screen
    this.moveables = Array.from({ length: 120 }).map((_, i) =>
      this.createMoveableEntity({
        height: generateRandomNumber(1, 100),
        width: generateRandomNumber(1, 3),
        color: "#3b86ccb2",
        position: this.positionEntities(i, 120),
      })
    );

    this.entities = [
      // ...this.moveables,
      ...Array.from({ length: 240 }).map((_, i) =>
        this.createStaticEntity({
          height: generateRandomNumber(1, 100),
          width: generateRandomNumber(1, 3),
          color: "#3b86ccb2",
          position: this.positionEntities(i, -480),
        })
      ),
      ...Array.from({ length: 240 }).map((_, i) =>
        this.createStaticEntity({
          height: generateRandomNumber(1, 100),
          width: generateRandomNumber(1, 3),
          color: "#bf2138b2",
          position: this.positionEntities(i, 480),
        })
      ),
      // * these just hangout
      ...Array.from({ length: 1600 }).map((_, i) =>
        this.createStaticEntity({
          height: generateRandomNumber(1, 18),
          width: generateRandomNumber(1, 3),
          color: "#a3b8c4",
          position: this.positionEntities(i, 1600, { shape: "square" }),
        })
      ),
      // * this is the perspective of the user, can move
      this.camera,
    ];

    requestAnimationFrame(this.performLoop.bind(this));
  }
}

new App();
