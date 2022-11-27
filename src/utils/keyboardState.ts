import { KeyCode } from "./keyCode";

export class KeyboardState {
  readonly keyCodes = new Set<string>();
  private shiftKey = false;
  private ctrlKey = false;
  private altKey = false;

  /** @param domElement GlobalEventHandlers */
  constructor(private domElement: GlobalEventHandlers = window) {
    this.domElement.addEventListener("keydown", this._onKeydown.bind(this));
    this.domElement.addEventListener("keyup", this._onKeyup.bind(this));
  }

  /** @param keys [KeyCode] */
  pressed(...keys: (keyof typeof KeyCode)[]) {
    return keys.map((code) => this.hasCode(code)).every((e) => !!e);
  }

  get Ctrl() {
    return this.ctrlKey;
  }
  get Shift() {
    return this.shiftKey;
  }
  get Alt() {
    return this.altKey;
  }

  hasCode(code: keyof typeof KeyCode) {
    const trueCode = KeyCode[code];
    if (trueCode === KeyCode.Shift) {
      return this.shiftKey;
    }
    if (trueCode === KeyCode.Control) {
      return this.ctrlKey;
    }
    if (trueCode === KeyCode.Alt) {
      return this.altKey;
    }
    return this.keyCodes.has(trueCode);
  }

  private _onKeydown(ev: KeyboardEvent) {
    this.keyCodes.add(ev.code);
    this.shiftKey = ev.shiftKey;
    this.ctrlKey = ev.ctrlKey;
    this.altKey = ev.altKey;
  }

  private _onKeyup(ev: KeyboardEvent) {
    this.keyCodes.delete(ev.code);
    this.shiftKey = ev.shiftKey;
    this.ctrlKey = ev.ctrlKey;
    this.altKey = ev.altKey;
  }

  destory() {
    this.domElement.removeEventListener("keydown", this._onKeydown.bind(this));
    this.domElement.removeEventListener("keyup", this._onKeyup.bind(this));
  }
}
