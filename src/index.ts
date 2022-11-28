import { KeyboardState } from "./utils/keyboardState";

const keyboard = new KeyboardState().connect();

const handleKeypress = () => {
  if (keyboard.pressed("W") || keyboard.pressed("ArrowUp")) {
    console.log("move forward");
  }
  if (keyboard.pressed("S") || keyboard.pressed("ArrowDown")) {
    console.log("go back");
  }
  if (keyboard.pressed("A") || keyboard.pressed("ArrowLeft")) {
    console.log("turn left");
  }
  if (keyboard.pressed("D") || keyboard.pressed("ArrowRight")) {
    console.log("turn right");
  }
  if (keyboard.pressed("Space")) {
    console.log("jump");
  }
  if (keyboard.pressed("Shift", "W")) {
    console.log("run");
  }
};

const animate = () => {
  requestAnimationFrame(animate);
  handleKeypress();
};

animate();

setTimeout(() => {
  keyboard.destory();
}, 30e3);
