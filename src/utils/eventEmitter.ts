interface DefaultEventMap {
  [event: string | symbol | number]: (...args: any[]) => void;
}

type SetDefault<Map extends DefaultEventMap, Ev extends keyof Map> = {
  [K in keyof Map]: K extends Ev ? DefaultEventMap[K] : Map[K];
};

type EventNames<
  Map extends DefaultEventMap,
  Kv = string | symbol | number,
> = keyof Map & Kv;

type EventParams<
  Map extends DefaultEventMap,
  Ev extends EventNames<Map>,
> = Parameters<Map[Ev]>;

type ListenerFn<Params extends any[] = any> = (...args: Params) => void;

class Listener<Fn extends ListenerFn = ListenerFn> {
  constructor(public fn: Fn, public once = false, public context = undefined) {}
}

export type DefineEvents<Map extends DefaultEventMap> = {
  [Ev in keyof Map]: Map[Ev];
} & DefaultEventMap;

export class EventEmitter<
  EmitEvents extends DefaultEventMap = DefaultEventMap,
> {
  private _events: Map<EventNames<EmitEvents>, Set<Listener>>;

  constructor() {
    this._events = new Map();
  }

  addListener<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn = ListenerFn<EventParams<EmitEvents, Ev>>,
  >(
    event: Ev,
    fn: Fn,
    once = false,
  ): EventEmitter<EmitEvents & Record<Ev, Fn>> {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    const listener = new Listener(fn, once);
    const listeners = this._events.get(event) ?? new Set();
    listeners.add(listener);
    this._events.set(event, listeners);
    return this;
  }

  clearEvent<Ev extends EventNames<EmitEvents>>(event: Ev): boolean {
    return this._events.delete(event);
  }

  eventNames<Ev extends EventNames<EmitEvents>>(): Ev[] {
    const names: any[] = [];
    for (const name of this._events.keys()) {
      names.push(name);
    }
    return names;
  }

  listeners<Ev extends EventNames<EmitEvents>>(event: Ev): ListenerFn<any>[] {
    const listeners = this._events.get(event);
    if (!listeners || listeners.size === 0) return [];
    return Array.from(listeners).map((ee) => ee.fn);
  }

  listenerCount<Ev extends EventNames<EmitEvents>>(event: Ev): number {
    return this._events.get(event)?.size ?? 0;
  }

  emit<
    Ev extends EventNames<EmitEvents>,
    Params extends EventParams<EmitEvents, Ev>,
  >(event: Ev, ...args: Params): boolean {
    const listeners = this._events.get(event);
    if (!listeners || listeners.size === 0) return false;
    for (const ee of Array.from(listeners)) {
      ee.fn(...args);
      if (ee.once) {
        listeners.delete(ee);
      }
    }
    if (listeners.size === 0) {
      this._events.delete(event);
    } else {
      this._events.set(event, listeners);
    }
    return true;
  }

  on<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn = ListenerFn<EventParams<EmitEvents, Ev>>,
  >(event: Ev, fn: Fn): EventEmitter<EmitEvents & Record<Ev, Fn>> {
    return this.addListener(event, fn, false);
  }

  once<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn = ListenerFn<EventParams<EmitEvents, Ev>>,
  >(event: Ev, fn: Fn): EventEmitter<EmitEvents & Record<Ev, Fn>> {
    return this.addListener(event, fn, true);
  }

  off<Ev extends keyof EmitEvents = EventNames<EmitEvents>>(
    event: Ev,
  ): EventEmitter<SetDefault<EmitEvents, Ev>> {
    this.clearEvent(event);
    return this as EventEmitter<SetDefault<EmitEvents, Ev>>;
  }

  reomveListener<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn<EventParams<EmitEvents, Ev>>,
  >(event: Ev, fn: Fn): this {
    const listeners = this._events.get(event);
    if (!listeners) {
      return this;
    }
    for (const ee of listeners.values()) {
      if (ee.fn === fn) {
        listeners.delete(ee);
      }
    }
    return this;
  }

  removeAllListeners(): boolean {
    this._events = new Map();
    return true;
  }
}
