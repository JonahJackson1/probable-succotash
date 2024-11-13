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

(function initialize() {
  const MAX_WIDTH_PX = 1920;
  const MAX_HEIGHT_PX = 1080;

  const root = document.getElementById("root");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = Math.min(window.innerWidth, MAX_WIDTH_PX);
    canvas.height = Math.min(window.innerHeight, MAX_HEIGHT_PX);
  };

  // Initial setup and resize event listener
  resize();
  root.appendChild(canvas);
  window.addEventListener("resize", resize);

  function createStaticEntity({
    id = generateRandomNumber(1, 99999),
    position = {
      x: generateRandomNumber(-1500, 1500),
      y: generateRandomNumber(-1500, 1500),
    },
    color = "#2b2b2b2b",
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

  function createMoveableEntity({
    id = generateRandomNumber(1, 99999),
    position = {
      x: generateRandomNumber(-1000, 1000),
      y: generateRandomNumber(-1000, 1000),
    },
    color = "#bebcbc",
    height = generateRandomNumber(1, 100),
    width = generateRandomNumber(1, 3),
    // speed = generateRandomNumber(0.5, 2.4),
    speed = generateRandomNumber(0.5, 2.8),
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

  function createCameraEntity() {
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

  function updateCameraPosition() {
    // camera movement
    let dmx = 0;
    let dmy = -1;
    updateEntityPosition(camera, dmx, dmy, camera.speed);
  }

  function updateMoveablesPosition() {
    // moveable movement
    for (const moveable of moveables) {
      // moveable speed
      const pace = moveable.chase ? moveable.speed : -moveable.speed;
      updateEntityPosition(moveable, 0, -10, pace);
    }
  }

  function performLoop() {
    // set default transform to clear the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateCameraPosition();

    updateMoveablesPosition();

    // set view
    view.translateX = -camera.position.x + canvas.width * 0.5;
    view.translateY = -camera.position.y + canvas.height * 0.5;

    // apply view
    ctx.setTransform(
      view.scaleX,
      view.skewY,
      view.skewX,
      view.scaleY,
      view.translateX,
      view.translateY
    );

    // draw world
    for (const entity of entities) {
      ctx.fillStyle = entity.color;
      ctx.fillRect(
        entity.position.x - entity.width * 0.5,
        entity.position.y - entity.height * 0.5,
        entity.width,
        entity.height
      );
    }

    const fps = 1000 / 30; // 1 second divided by 30 "frames"
    setTimeout(() => requestAnimationFrame(performLoop), fps);
  }

  const view = {
    scaleX: 1,
    skewX: 0,
    skewY: 0,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
  };

  const camera = createCameraEntity();
  const moveables = [
    ...Array.from({ length: 60 }).map(() => createMoveableEntity()),
    ...Array.from({ length: 60 }).map(() =>
      createMoveableEntity(createStaticEntity())
    ),
  ];
  const entities = [...moveables, camera];

  requestAnimationFrame(performLoop);
})();
