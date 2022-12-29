type EventType = string | symbol | number;

interface EventMap {
  [event: EventType]: any;
}

interface DefaultEventMap {
  [event: EventType]: (...args: any[]) => void;
}

interface Listener {
  fn: (...args: unknown[]) => void;
  count: number;
}

type ListenerFn<
  Maps extends EventMap = DefaultEventMap,
  Ev extends EventType = keyof Maps,
> = Ev extends typeof Emitter.AnyEvent
  ? (data: any) => void
  : Maps[Ev] extends (...args: any[]) => void
  ? Maps[Ev]
  : (data: Maps[Ev]) => void;

type EventNames<Maps extends EventMap = DefaultEventMap> = keyof Maps;

type EventParams<
  Maps extends EventMap = DefaultEventMap,
  Ev extends EventType = keyof Maps,
> = Parameters<ListenerFn<Maps, Ev>>;

/**
 * 一个类型完备的事件派发器
 */
export class Emitter<
  ListenEvents extends EventMap = DefaultEventMap,
  EmitEvents extends EventMap = ListenEvents,
> {
  static readonly AnyEvent = Symbol("any-event");
  private events: Map<EventNames, Listener[]>;
  constructor() {
    this.events = new Map();
  }
  /**
   * 添加一个监听函数
   *
   * @param event 事件名
   * @param fn 监听函数
   * @param count 函数调用次数, 0为没有次数限制
   */
  addListener<
    Ev extends EventNames<ListenEvents>,
    Fn extends ListenerFn = ListenerFn<ListenEvents, Ev>,
  >(event: Ev, fn: Fn, count: number): number;
  /** addListener */
  addListener(event: EventNames, fn: ListenerFn, count: number) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    count = -Math.abs(count);
    const listener: Listener = { fn, count };
    const listeners = this.events.get(event) || [];
    listeners.push(listener);
    this.events.set(event, listeners);
    return listeners.length;
  }
  /**
   * 移除指定的一个监听函数
   *
   * @param event 事件名
   * @param fn 监听函数
   * @return 是否存在该事件
   */
  removeListener<
    Ev extends EventNames<ListenEvents>,
    Fn extends ListenerFn = ListenerFn<ListenEvents, Ev>,
  >(event: Ev, fn: Fn): boolean;
  /** removeListener */
  removeListener(event: EventNames, fn: ListenerFn) {
    let listeners = this.events.get(event);
    if (!listeners) {
      return false;
    }
    listeners = listeners.filter((ee) => {
      return ee.fn !== fn;
    });
    if (listeners.length === 0) {
      this.events.delete(event);
    } else {
      this.events.set(event, listeners);
    }
    return true;
  }
  /**
   * 异步派发事件
   *
   * @param event 事件名
   * @param args 监听函数所需参数
   * @return 已调用的监听函数个数
   */
  async emit<
    Ev extends EventNames = EventNames<EmitEvents>,
    Params extends EventParams<EmitEvents, Ev> = EventParams<EmitEvents, Ev>,
  >(event: Ev, ...args: Params): Promise<number>;
  /** emit */
  async emit(event: EventNames, ...args: EventParams) {
    let listeners = this.events.get(event);
    let count = 0;
    if (!listeners) {
      return count;
    }
    listeners = listeners.filter((ee) => {
      ee.fn(...args);
      ee.count += 1;
      count += 1;
      return ee.count !== 0;
    });
    if (listeners.length === 0) {
      this.events.delete(event);
    } else {
      this.events.set(event, listeners);
    }
    if (event !== Emitter.AnyEvent) {
      await this.emit(Emitter.AnyEvent, args);
    }
    return count;
  }
  /**
   * 为指定事件添加监听函数
   *
   * @param event 事件名
   * @param fn 监听函数
   * @return this
   */
  on<
    Ev extends EventNames = EventNames<ListenEvents>,
    Fn extends ListenerFn = ListenerFn<ListenEvents, Ev>,
  >(event: Ev, fn: Fn): Emitter<ListenEvents, EmitEvents & Record<Ev, Fn>>;
  /** on */
  on(event: EventNames, fn: ListenerFn) {
    this.addListener(event, fn, 0);
    return this;
  }
  /**
   * 为指定事件添加一次性的监听函数
   *
   * @param event 事件名
   * @param fn 监听函数
   * @return this
   */
  once<
    Ev extends EventNames = EventNames<ListenEvents>,
    Fn extends ListenerFn = ListenerFn<ListenEvents, Ev>,
  >(event: Ev, fn: Fn): Emitter<ListenEvents, EmitEvents & Record<Ev, Fn>>;
  /** once */
  once(event: EventNames, fn: ListenerFn) {
    this.addListener(event, fn, 1);
    return this;
  }
  /**
   * 为每次事件添加的监听函数
   *
   * @param fn 监听函数
   * @return this
   */
  any(
    fn: ListenerFn<ListenEvents, typeof Emitter.AnyEvent>,
  ): Emitter<ListenEvents, EmitEvents>;
  any(fn: ListenerFn) {
    this.addListener(Emitter.AnyEvent, fn, 0);
    return this;
  }
  /**
   * 移除所有事件的所有监听函数
   * @return this
   */
  off(): Emitter;
  /**
   * 移除指定事件的所有监听函数
   *
   * @param event 事件名
   * @return this
   */
  off<Ev extends EventNames = EventNames<ListenEvents>>(
    event: Ev,
  ): Emitter<Omit<ListenEvents, Ev>, Omit<EmitEvents, Ev>>;
  /**
   * 移除指定的一个监听函数
   *
   * @param event 事件名
   * @param fn 监听函数
   * @return this
   */
  off<
    Ev extends EventNames<ListenEvents>,
    Fn extends ListenerFn = ListenerFn<ListenEvents, Ev>,
  >(event: Ev, fn: Fn): Emitter<ListenEvents, EmitEvents>;
  /** off */
  off(event?: EventNames, fn?: ListenerFn): Emitter {
    if (typeof event === "undefined") {
      this.events = new Map();
      return this;
    }
    if (typeof fn === "undefined") {
      this.events.delete(event);
      return this;
    }
    if (typeof fn === "function") {
      this.removeListener(event, fn);
      return this;
    }
    return this;
  }
  /**
   * 统计已被订阅的事件数量
   *
   * @return 所有事件个数
   */
  count(): number;
  /**
   * 统计指定事件的订阅者数量
   *
   * @param event 事件名
   * @return 绑定该事件的函数个数
   */
  count<Ev extends EventNames<ListenEvents>>(event: Ev): number;
  /**
   * 统计指定函数的计数器
   *
   * @param event 事件名
   * @param fn 监听函数
   * @return 负数为剩余调用次数,正数为已调用次数
   */
  count<
    Ev extends EventNames<ListenEvents>,
    Fn extends ListenerFn<ListenEvents, Ev>,
  >(event?: Ev, fn?: Fn): number;
  /** count */
  count(event?: EventNames, fn?: ListenerFn) {
    let count = 0;
    if (typeof event === "undefined") {
      count = this.events.size;
      return count;
    }
    const listeners = this.events.get(event);
    if (!listeners) {
      return count;
    }
    if (typeof fn === "undefined") {
      count = listeners.length;
      return count;
    }
    if (typeof fn === "function") {
      for (const ee of listeners) {
        if (ee.fn === fn) {
          count += ee.count;
        }
      }
      return count;
    }
    return NaN;
  }
}
