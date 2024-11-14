// https://stackoverflow.com/questions/73736370/is-it-better-to-translate-to-whole-canvas-or-to-change-the-position-of-elements
function generateRandomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

class App {
  static createStaticEntity({
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

  static createVariableEntity({
    id = generateRandomNumber(1, 99999),
    position = {
      x: generateRandomNumber(-1000, 1000),
      y: generateRandomNumber(-1000, 1000),
    },
    color = "blue",
    height = generateRandomNumber(1, 100),
    width = generateRandomNumber(1, 3),
    // speed = generateRandomNumber(0.5, 2.8),
    speed = 1,
  } = {}) {
    return {
      id,
      position,
      color,
      height,
      width,
      speed,
    };
  }

  static createCameraEntity({
    id = generateRandomNumber(1, 99999),
    position = { x: 0, y: 0 },
    color = "#00000000",
    width = 0,
    height = 0,
    speed = 1,
  } = {}) {
    return {
      id,
      position,
      color,
      width,
      height,
      speed,
    };
  }

  /**
   * Takes in the entity to adjust, the distance to move x / y, and the speed at which to do it.
   * @param {object} entity
   * @param {number} dmx
   * @param {number} dmy
   * @param {number} speed
   */
  static updateEntityPosition(entity, dmx, dmy, speed) {
    // normalize movement if diagonal to maintain consistent speed
    const length = Math.sqrt(dmx * dmx + dmy * dmy);
    if (length > 0) {
      dmx = (dmx / length) * speed;
      dmy = (dmy / length) * speed;
    }

    entity.position.x += dmx;
    entity.position.y += dmy;
  }

  /**
   * takes in the current index, the total number of index, and the shape in which to arrange them.
   * @param {number} index
   * @param {number} total
   * @param {object} param2
   * @returns
   */
  static getCoordinatesByIndex(
    index,
    total = 60,
    {
      shape = "circle",
      center = { x: 0, y: 0 },
      radius = 500,
      sideLength = 500,
    } = {}
  ) {
    if (index < 0 || total < 0)
      throw new Error(`index or total was less than 0!`);

    switch (shape) {
      case "circle": {
        const maxRadius = radius;
        const scalingFactor = Math.sqrt(total); // Density control based on total

        const a = maxRadius / scalingFactor; // Initial offset from the center
        const b = maxRadius / scalingFactor; // Controls spacing between points

        const angle = index * 0.5; // Multiplier adjusts spiral density
        const distance = a + b * Math.sqrt(index); // Gradual outward spread

        return {
          x: center.x + distance * Math.cos(angle),
          y: center.y + distance * Math.sin(angle),
        };
      }
      case "square": {
        const entitiesPerSide = Math.ceil(Math.sqrt(total));
        const spacing = sideLength / entitiesPerSide;
        const row = Math.floor(index / entitiesPerSide);
        const col = index % entitiesPerSide;
        return {
          x: center.x + col * spacing - sideLength / 2 + spacing / 2,
          y: center.y + row * spacing - sideLength / 2 + spacing / 2,
        };
      }
      default:
        throw new Error(`Unsupported shape type: ${shape}`);
    }
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

    this.camera = App.createCameraEntity();

    this.entities = [
      ...Array.from({ length: 60 }).map((_, i) =>
        App.createVariableEntity({
          height: generateRandomNumber(1, 100),
          width: generateRandomNumber(1, 3),
          color: "#653b6e99",
          position: App.getCoordinatesByIndex(i, 120),
        })
      ),
      ...Array.from({ length: 480 }).map((_, i) =>
        App.createVariableEntity({
          height: generateRandomNumber(1, 100),
          width: generateRandomNumber(1, 3),
          color: "#bf213866",
          position: App.getCoordinatesByIndex(i, 480),
        })
      ),
      ...Array.from({ length: 1600 }).map((_, i) =>
        App.createVariableEntity({
          height: generateRandomNumber(1, 18),
          width: generateRandomNumber(1, 3),
          color: "#a3b8c4cc",
          position: App.getCoordinatesByIndex(i, 1600, {
            shape: "square",
          }),
        })
      ),
      // * this is the perspective of the user, could move
      this.camera,
    ];

    requestAnimationFrame(this.performLoop.bind(this));
  }

  performLoop() {
    // * set default transform to clear the canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // * update camera position
    App.updateEntityPosition(this.camera, 0, 0, this.camera.speed);

    // * set view
    this.view.translateX = -this.camera.position.x + this.canvas.width * 0.5;
    this.view.translateY = -this.camera.position.y + this.canvas.height * 0.5;

    // * apply view
    this.ctx.setTransform(
      this.view.scaleX,
      this.view.skewY,
      this.view.skewX,
      this.view.scaleY,
      this.view.translateX,
      this.view.translateY
    );

    // * draw world / all entities
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
}

new App();
