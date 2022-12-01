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

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @param {*} context The context to invoke the listener with.
 * @constructor
 * @private
 */
class Listener<Fn extends ListenerFn = ListenerFn, Context = undefined> {
  constructor(public fn: Fn, public once = false, public context?: Context) {}
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
  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @param {Function} fn The listener function.
   * @param {Boolean} once Specify if the listener is a one-time listener.
   * @returns {EventEmitter<EmitEvents & Record<Ev, Fn>>}
   * @private
   */
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
  /**
   * Return an array listing the events for which the emitter has registered
   * listeners.
   *
   * @returns {Array}
   * @public
   */
  eventNames<Ev extends EventNames<EmitEvents>>(): Ev[] {
    const names: any[] = [];
    for (const name of this._events.keys()) {
      names.push(name);
    }
    return names;
  }
  /**
   * Return the listeners registered for a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @returns {Array} The registered listeners.
   * @public
   */
  listeners<Ev extends EventNames<EmitEvents>>(event: Ev): ListenerFn<any>[] {
    const listeners = this._events.get(event);
    if (!listeners || listeners.size === 0) return [];
    return Array.from(listeners).map((ee) => ee.fn);
  }
  /**
   * Return the number of listeners listening to a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @returns {Number} The number of listeners.
   * @public
   */
  listenerCount<Ev extends EventNames<EmitEvents>>(event: Ev): number {
    return this._events.get(event)?.size ?? 0;
  }
  /**
   * Calls each of the listeners registered for a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @returns {Boolean} `true` if the event had listeners, else `false`.
   * @public
   */
  emit<
    Ev extends EventNames<EmitEvents>,
    Params extends EventParams<EmitEvents, Ev>,
  >(event: Ev, ...args: Params): boolean {
    const listeners = this._events.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }
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
  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @param {Function} fn The listener function.
   * @returns {EventEmitter<EmitEvents & Record<Ev, Fn>>} `this`.
   * @public
   */
  on<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn = ListenerFn<EventParams<EmitEvents, Ev>>,
  >(event: Ev, fn: Fn): EventEmitter<EmitEvents & Record<Ev, Fn>> {
    return this.addListener(event, fn, false);
  }
  /**
   * Add a one-time listener for a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @param {Function} fn The listener function.
   * @returns {EventEmitter<EmitEvents & Record<Ev, Fn>>} `this`.
   * @public
   */
  once<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn = ListenerFn<EventParams<EmitEvents, Ev>>,
  >(event: Ev, fn: Fn): EventEmitter<EmitEvents & Record<Ev, Fn>> {
    return this.addListener(event, fn, true);
  }
  /**
   * Alias methods names because people roll like that.
   */
  off = this.reomveListener;
  /**
   * Alias methods names because people roll like that.
   */
  offAny = this.removeAllListeners;
  /**
   * Remove the listeners of a given event.
   *
   * @param {(String|Symbol|Number)} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {Boolean} once Only remove one-time listeners.
   * @returns {EventEmitter} `this`.
   * @public
   */
  reomveListener<
    Ev extends EventNames<EmitEvents>,
    Fn extends ListenerFn<EventParams<EmitEvents, Ev>>,
  >(event: Ev, fn: Fn, once?: boolean): this {
    const listeners = this._events.get(event);
    if (!listeners) {
      return this;
    }
    for (const ee of listeners.values()) {
      if (ee.fn === fn && (!once || ee.once)) {
        listeners.delete(ee);
      }
    }
    return this;
  }
  /**
   * Remove all listeners, or those of the specified event.
   *
   * @param {(String|Symbol|Number)} [event] The event name.
   * @returns {EventEmitter<EmitEvents & Record<Ev, Fn>>} `this`.
   * @public
   */
  removeAllListeners<Ev extends EventNames<EmitEvents>>(
    event: Ev,
  ): EventEmitter<SetDefault<EmitEvents, Ev>> {
    this._events.delete(event);
    return this as EventEmitter<SetDefault<EmitEvents, Ev>>;
  }
}
