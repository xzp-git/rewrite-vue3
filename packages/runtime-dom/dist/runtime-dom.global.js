var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    KeepAlive: () => KeepAliveImpl,
    LifecycleHooks: () => LifecycleHooks,
    ReactiveEffect: () => ReactiveEffect,
    Teleport: () => TeleportImpl,
    Text: () => Text,
    activeEffect: () => activeEffect,
    computed: () => computed,
    createComponentInstance: () => createComponentInstance,
    createElementBlock: () => createElementBlock,
    createElementVNode: () => createVnode,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    curretnInstance: () => curretnInstance,
    defineAsyncComponent: () => defineAsyncComponent,
    effect: () => effect,
    effectScope: () => effectScope,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    inject: () => inject,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    onBeforeMount: () => onBeforeMount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    openBlock: () => openBlock,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    render: () => render,
    renderComponent: () => renderComponent,
    setCurrentInstance: () => setCurrentInstance,
    setupComponent: () => setupComponent,
    toRef: () => toRef,
    toRefs: () => toRefs,
    track: () => track,
    trackEffects: () => trackEffects,
    trigger: () => trigger,
    triggerEffects: () => triggerEffects,
    watch: () => watch
  });

  // packages/reactivity/src/effectScope.ts
  var activeEffectScope = null;
  var EffectScope = class {
    constructor(detached) {
      this.active = true;
      this.parent = null;
      this.effects = [];
      this.scopes = [];
      if (!detached && activeEffectScope) {
        activeEffectScope.scopes.push(this);
      }
    }
    run(fn) {
      if (this.active) {
        try {
          this.parent = activeEffectScope;
          activeEffectScope = this;
          return fn();
        } finally {
          activeEffectScope = this.scopes;
        }
      }
    }
    stop() {
      if (this.active) {
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].stop();
        }
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop();
        }
        this.active = false;
      }
    }
  };
  function recordEffectScope(effect2) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(effect2);
    }
  }
  function effectScope(detached = false) {
    return new EffectScope(detached);
  }

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.deps = [];
      this.active = true;
      recordEffectScope(this);
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  var effect = (fn, options = {}) => {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  };
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trackEffects(dep) {
    if (activeEffect) {
      let shouldTrack = !dep.has(activeEffect);
      if (shouldTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
      }
    }
  }
  function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isString = (value) => {
    return typeof value === "string";
  };
  var isNumber = (value) => {
    return typeof value === "number";
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isArray = Array.isArray;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (value, key) => hasOwnProperty.call(value, key);
  var invokeArrayFns = (fns) => {
    for (let i = 0; i < fns.length; i++) {
      fns[i]();
    }
  };

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, "get", key);
      let res = Reflect.get(target, key, receiver);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, "set", key, value, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactivity.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  var reactive = (target) => {
    if (!isObject(target)) {
      return;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    let exisitingProxy = reactiveMap.get(target);
    if (exisitingProxy) {
      return exisitingProxy;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  };

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newValue) {
      this.setter(newValue);
    }
  };
  var computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter, setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value))
      return value;
    if (set.has(value)) {
      return value;
    }
    set.add(value);
    for (let key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return;
    }
    let cleanup;
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    let oldValue;
    const job = () => {
      if (cleanup)
        cleanup();
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.dep = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = toReactive(rawValue);
    }
    get value() {
      trackEffects(this.dep);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this.rawValue) {
        this._value = toReactive(newValue);
        this.rawValue = newValue;
        triggerEffects(this.dep);
      }
    }
  };
  function ref(value) {
    return new RefImpl(value);
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  function toRefs(object) {
    const result = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, receiver) {
        let r = Reflect.get(target, key, receiver);
        return r.__v_isRef ? r.value : r;
      },
      set(target, key, value, receiver) {
        let oldValue = target[key];
        if (oldValue.__v_isRef) {
          oldValue.value = value;
          return true;
        } else {
          return Reflect.set(target, key, value, receiver);
        }
      }
    });
  }

  // packages/runtime-core/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (let key in rawProps) {
        const value = rawProps[key];
        if (hasOwn(options, key)) {
          props[key] = value;
        } else {
          attrs[key] = value;
        }
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
    if (instance.vnode.shapeFlag & 2 /* FUNCTIONAL_COMPONENT */) {
      instance.props = instance.attrs;
    }
  }
  var hasPropsChanged = (prevProps = {}, nextProps = {}) => {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };
  function updateProps(prevProps = {}, nextVnode) {
    const props = {};
    const options = nextVnode.type.props || {};
    if (nextVnode.props) {
      for (let key in nextVnode.props) {
        const value = nextVnode.props[key];
        if (hasOwn(options, key)) {
          props[key] = value;
        }
      }
    }
    for (const key in props) {
      prevProps[key] = props[key];
    }
    for (const key in prevProps) {
      if (!hasOwn(props, key)) {
        delete prevProps[key];
      }
    }
  }

  // packages/runtime-core/src/component.ts
  var curretnInstance = null;
  var setCurrentInstance = (instance) => curretnInstance = instance;
  var getCurrentInstance = () => curretnInstance;
  var createComponentInstance = (vnode, parent) => {
    const instance = {
      ctx: {},
      parent,
      provides: parent ? parent.provides : /* @__PURE__ */ Object.create(null),
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      update: null,
      propsOptions: vnode.type.props,
      props: {},
      attrs: {},
      proxy: null,
      render: null,
      setupState: {},
      slots: {}
    };
    return instance;
  };
  function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }
  var publicPropertyMap = {
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots
  };
  var publicInstanceProxy = {
    get(target, key) {
      const { data, props, setupState = {} } = target;
      if (data && hasOwn(data, key)) {
        return data[key];
      } else if (hasOwn(setupState, key)) {
        return setupState[key];
      } else if (props && hasOwn(props, key)) {
        return props[key];
      }
      let getter = publicPropertyMap[key];
      if (getter) {
        return getter(target);
      }
    },
    set(target, key, value) {
      const { data, props, setupState = {} } = target;
      if (data && hasOwn(data, key)) {
        data[key] = value;
      } else if (hasOwn(setupState, key)) {
        setupState[key] = value;
      } else if (props && hasOwn(props, key)) {
        console.warn(`attempting to mutate prop ${key}`);
        return false;
      }
      return true;
    }
  };
  var setupComponent = (instance) => {
    let { props, type, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, publicInstanceProxy);
    let data = type.data;
    if (data) {
      if (!isFunction(data))
        return console.warn("data options must be a function");
      instance.data = reactive(data.call(instance.proxy));
    }
    let setup = type.setup;
    if (setup) {
      const setupContext = {
        emit: (event, ...args) => {
          const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
          const handler = instance.vnode.props[eventName];
          handler && handler(...args);
        },
        attrs: instance.attrs,
        slots: instance.slots
      };
      setCurrentInstance(instance);
      const setupResult = setup(instance.props, setupContext);
      setCurrentInstance(null);
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      }
    }
    if (!instance.render) {
      instance.render = type.render;
    }
  };
  function renderComponent(instance) {
    let { vnode, render: render2, props } = instance;
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
      return render2.call(instance.proxy, instance.proxy);
    } else {
      return vnode.type(props);
    }
  }

  // packages/runtime-core/src/getSequence.ts
  function getSequence(arr) {
    const len = arr.length;
    const result = [0];
    const p = new Array(len).fill(0);
    let start;
    let end;
    let middle;
    let resultLastIndex;
    for (let i2 = 0; i2 < len; i2++) {
      let arrI = arr[i2];
      if (arrI !== 0) {
        if (arrI !== 0) {
          resultLastIndex = result[result.length - 1];
          if (arr[resultLastIndex] < arrI) {
            result.push(i2);
            p[i2] = resultLastIndex;
            continue;
          }
          start = 0;
          end = result.length - 1;
          while (start < end) {
            middle = start + (end - start >> 1);
            if (arr[result[middle]] < arrI) {
              start = middle + 1;
            } else {
              end = middle;
            }
          }
        }
        if (arr[result[end]] > arrI) {
          result[end] = i2;
          p[i2] = result[end - 1];
        }
      }
    }
    let i = result.length;
    let last = result[i - 1];
    while (i-- > 0) {
      result[i] = last;
      last = p[last];
    }
    return result;
  }

  // packages/runtime-core/src/scheduler.ts
  var queue = [];
  var isFlushing = false;
  var resolvePromise = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isFlushing) {
      isFlushing = true;
      resolvePromise.then(() => {
        isFlushing = false;
        let copy = queue.slice(0);
        queue.length = 0;
        for (let i = 0; i < copy.length; i++) {
          let job2 = copy[i];
          job2();
        }
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/components/Teleport.ts
  var TeleportImpl = {
    __isTeleport: true,
    process(n1, n2, container, anchor, internals) {
      let { mountChildren, patchChildren, move } = internals;
      if (!n1) {
        const target = document.querySelector(n2.props.to);
        if (target) {
          mountChildren(n2.children, target);
        }
      } else {
        patchChildren(n1, n2, container);
        if (n2.props.to !== n1.props.to) {
          const nextTarget = document.querySelector(n2.props.to);
          n2.children.forEach((child) => {
            move(child, nextTarget);
          });
        }
      }
    }
  };
  var isTeleport = (type) => type.__isTeleport;

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function isVnode(value) {
    return !!(value && value.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null, patchFlag = 0) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isTeleport(type) ? 64 /* TELEPORT */ : isFunction(type) ? 2 /* FUNCTIONAL_COMPONENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props.key,
      __v_isVnode: true,
      shapeFlag,
      patchFlag
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag |= type2;
    }
    if (currentBlock && vnode.patchFlag > 0) {
      currentBlock.push(vnode);
    }
    return vnode;
  }
  var currentBlock = null;
  function openBlock() {
    currentBlock = [];
  }
  function createElementBlock(type, props, children, patchFlag) {
    return setupBlock(createVnode(type, props, children, patchFlag));
  }
  function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock;
    currentBlock = null;
    return vnode;
  }

  // packages/runtime-core/src/apiLifecycle.ts
  var LifecycleHooks = /* @__PURE__ */ ((LifecycleHooks2) => {
    LifecycleHooks2["BEFORE_MOUNT"] = "bm";
    LifecycleHooks2["MOUNTED"] = "m";
    LifecycleHooks2["BEFORE_UPDATE"] = "bu";
    LifecycleHooks2["UPDATED"] = "u";
    return LifecycleHooks2;
  })(LifecycleHooks || {});
  function createHook(type) {
    return (hook, target = curretnInstance) => {
      if (target) {
        const hooks = target[type] || (target[type] = []);
        const wrappedHook = () => {
          setCurrentInstance(target);
          hook();
          setCurrentInstance(null);
        };
        hooks.push(wrappedHook);
      }
    };
  }
  var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
  var onMounted = createHook("m" /* MOUNTED */);
  var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
  var onUpdated = createHook("u" /* UPDATED */);

  // packages/runtime-core/src/components/KeepAlive.ts
  function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
      shapeFlag -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
    }
    if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
      shapeFlag -= 512 /* COMPONENT_KEPT_ALIVE */;
    }
    vnode.shapeFlag = shapeFlag;
  }
  var KeepAliveImpl = {
    __isKeepAlive: true,
    props: {
      include: {},
      exculde: {},
      max: {}
    },
    setup(props, { slots }) {
      const keys = /* @__PURE__ */ new Set();
      const cache = /* @__PURE__ */ new Map();
      const instance = getCurrentInstance();
      let { createElement, move } = instance.ctx.renderer;
      const storageContainer = createElement("div");
      instance.ctx.deactivate = function(vnode) {
        move(vnode, storageContainer);
      };
      instance.ctx.activate = function(vnode, container, anchor) {
        move(vnode, container, anchor);
      };
      let pendingCachKey = null;
      function cacheSubTree() {
        if (pendingCachKey) {
          cache.set(pendingCachKey, instance.subTree);
        }
      }
      onMounted(cacheSubTree);
      onUpdated(cacheSubTree);
      const { include, exclude, max } = props;
      let current = null;
      function pruneCacheEntry(key) {
        resetShapeFlag(current);
        cache.delete(key);
        keys.delete(key);
      }
      return () => {
        let vnode = slots.default();
        if (!isVnode(vnode) || !(vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */)) {
          return vnode;
        }
        const comp = vnode.type;
        const key = vnode.key == null ? comp : vnode.key;
        let name = comp.name;
        if (name && (include && !include.split(",").includes(name)) || exclude && exclude.split(",").includes(name)) {
          return vnode;
        }
        let cacheVnode = cache.get(key);
        if (cacheVnode) {
          vnode.component = cacheVnode.component;
          vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
          keys.delete(key);
          keys.add(key);
        } else {
          keys.add(key);
          pendingCachKey = key;
          if (max && keys.size > max) {
            pruneCacheEntry(keys.values().next().value);
          }
        }
        vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        current = vnode;
        return vnode;
      };
    }
  };
  var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    let {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostSetText,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp
    } = renderOptions2;
    const processText = (n1, n2, container) => {
      if (n1 === null) {
        hostInsert(n2.el = hostCreateText(n2.children), container);
      } else {
        const el = n2.el = n1.el;
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const normalize = (children, i) => {
      let child = children[i];
      if (isString(child) || isNumber(child)) {
        let vnode = createVnode(Text, null, child);
        children[i] = vnode;
      }
      return children[i];
    };
    const mountChildren = (children, container, parentComponent) => {
      for (let i = 0; i < children.length; i++) {
        let child = normalize(children, i);
        patch(null, child, container, parentComponent);
      }
    };
    const mountElement = (vnode, container, anchor, parentComponent) => {
      let { type, props, children, shapeFlag } = vnode;
      let el = vnode.el = hostCreateElement(type);
      if (props) {
        for (let key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
      }
      hostInsert(el, container, anchor);
    };
    const patchProps = (oldProps, newProps, el) => {
      for (let key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (!newProps[key]) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const unmountChildren = (children, parentComponent) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i], parentComponent);
      }
    };
    const patchKeyChildren = (c1, c2, el, parentComponent) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i], parentComponent);
            i++;
          }
        }
      }
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (let i2 = s2; i2 < e2; i2++) {
        keyToNewIndexMap.set(c2[i2].key, i2);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldChild = c1[i2];
        let newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex === void 0) {
          unmount(oldChild, parentComponent);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      let increment = getSequence(newIndexToOldIndexMap);
      let j = increment.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        let index = i2 + s2;
        let current = c2[index];
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexMap[i2] === 0) {
          patch(null, current, el, anchor);
        } else {
          if (increment[j] != i2) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    };
    const patchChildren = (n1, n2, el, parentComponent) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1, parentComponent);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyChildren(c1, c2, el, parentComponent);
          } else {
            unmountChildren(c1, parentComponent);
          }
        } else {
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el, parentComponent);
          }
        }
      }
    };
    const patchBlockChildren = (n1, n2, parentComponent) => {
      for (let i = 0; i < n2.dynamicChildren.length; i++) {
        patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i], parentComponent);
      }
    };
    const patchElement = (n1, n2, parentComponent) => {
      let el = n2.el = n1.el;
      let oldProps = n1.props || {};
      let newProps = n2.props || {};
      let { patchFlag } = n2;
      if (patchFlag & 2 /* CLASS */) {
        if (oldProps.class !== newProps.class) {
          hostPatchProp(el, "class", null, newProps.class);
        }
      } else {
        patchProps(oldProps, newProps, el);
      }
      if (n2.dynamicChildren) {
        patchBlockChildren(n1, n2, parentComponent);
      } else {
        patchChildren(n1, n2, el, parentComponent);
      }
    };
    const processElement = (n1, n2, container, anchor, parentComponent) => {
      if (!n1) {
        mountElement(n2, container, anchor, parentComponent);
      } else {
        patchElement(n1, n2, parentComponent);
      }
    };
    const processFragment = (n1, n2, container, parentComponent) => {
      if (n1 == null) {
        mountChildren(n2.children, container, parentComponent);
      } else {
        patchChildren(n1, n2, container, parentComponent);
      }
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance.props, next);
      Object.assign(instance.slots, next.children);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const { render: render3, vnode } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          let { bm, m } = instance;
          if (bm) {
            invokeArrayFns(bm);
          }
          const subTree = renderComponent(instance);
          patch(null, subTree, container, anchor, instance);
          instance.subTree = subTree;
          instance.isMounted = true;
          if (m) {
            invokeArrayFns(m);
          }
        } else {
          let { next, bu, u } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          if (bu) {
            invokeArrayFns(bu);
          }
          const subTree = renderComponent(instance);
          patch(instance.subTree, subTree, container, anchor, instance);
          instance.subTree = subTree;
          if (u) {
            invokeArrayFns(u);
          }
        }
      };
      const effect2 = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
      let update = instance.update = effect2.run.bind(effect2);
      update();
    };
    const mountComponent = (vnode, container, anchor, parentComponent) => {
      let instance = vnode.component = createComponentInstance(vnode, parentComponent);
      if (isKeepAlive(vnode)) {
        instance.ctx.renderer = {
          createElement: hostCreateElement,
          move(vnode2, container2) {
            hostInsert(vnode2.component.subTree.el, container2);
          }
        };
      }
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const shouldUpdateComponent = (n1, n2) => {
      const { props: prevProps, children: prevChildren } = n1;
      const { props: nextProps, children: nextChildren } = n2;
      if (prevProps === nextProps)
        return false;
      if (prevChildren || nextChildren) {
        return true;
      }
      return hasPropsChanged(prevProps, nextProps);
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const processComponent = (n1, n2, container, anchor, parentComponent) => {
      if (n1 == null) {
        if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
          parentComponent.ctx.activate(n2, container, anchor);
        } else {
          mountComponent(n2, container, anchor, parentComponent);
        }
      } else {
        updateComponent(n1, n2);
      }
    };
    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
      if (n1 === n2)
        return;
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1, parentComponent);
        n1 = null;
      }
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, parentComponent);
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 6 /* COMPONENT */) {
            processComponent(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 64 /* TELEPORT */) {
            type.process(n1, n2, container, anchor, {
              mountChildren,
              patchChildren,
              move(vnode, container2) {
                hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container2);
              }
            });
          }
      }
    };
    const unmount = (vnode, parentComponent) => {
      if (vnode.type == Fragment) {
        return unmountChildren(vnode, parentComponent);
      } else if (vnode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
        return parentComponent.ctx.deactivate(vnode);
      } else if (vnode.shapeFlag & 6 /* COMPONENT */) {
        return unmount(vnode.component.subTree, null);
      }
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode == null) {
        if (container._vnode) {
          unmount(container._vnode, null);
        }
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsChildren, children) {
    const l = arguments.length;
    if (l === 2) {
      if (isObject(propsChildren) && !isArray(propsChildren)) {
        if (isVnode(propsChildren)) {
          return createVnode(type, null, [propsChildren]);
        }
        return createVnode(type, propsChildren);
      } else {
        return createVnode(type, null, propsChildren);
      }
    } else {
      if (l > 3) {
        children = Array.from(arguments).slice(2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsChildren, children);
    }
  }

  // packages/runtime-core/src/apiInject.ts
  function provide(key, value) {
    if (!curretnInstance)
      return;
    const parentProvides = curretnInstance.parent && curretnInstance.parent.provides;
    let provides = curretnInstance.provides;
    if (parentProvides === provides) {
      provides = curretnInstance.provides = Object.create(provides);
    }
    provides[key] = value;
  }
  function inject(key, defaultValue) {
    if (!curretnInstance)
      return;
    const provides = curretnInstance.parent && curretnInstance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return defaultValue;
    }
  }

  // packages/runtime-core/src/defineAsyncComponent.ts
  function defineAsyncComponent(options) {
    if (typeof options === "function") {
      options = { loader: options };
    }
    return {
      setup() {
        const loaded = ref(false);
        const error = ref(false);
        const loading = ref(false);
        const { loader, timeout, errorComponent, delay, loadingComponent, onError } = options;
        if (delay) {
          setTimeout(() => {
            loading.value = true;
          }, delay);
        }
        let Comp = null;
        function load() {
          return loader().catch((err) => {
            if (onError) {
              return new Promise((resolve, reject) => {
                const retry = () => resolve(load());
                const fail = () => reject(err);
                onError(err, retry, fail);
              });
            }
          });
        }
        load().then((c) => {
          Comp = c;
          loaded.value = true;
        }).catch((err) => error.value = err).finally(() => {
          loading.value = false;
        });
        setTimeout(() => {
          error.value = true;
        }, timeout);
        return () => {
          if (loaded.value) {
            return h(Comp);
          } else if (error.value && errorComponent) {
            return h(errorComponent);
          } else if (loading.value && loadingComponent) {
            return h(loadingComponent);
          }
          return h(Fragment, {}, []);
        };
      }
    };
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/modules/attrs.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (!nextValue) {
      el.removeAttribute("class");
    } else {
      el.className = nextValue;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        el.addEventListener(event, invoker);
      } else if (exits) {
        el.removeEventListener(event, exits);
        invokers[eventName] = void 0;
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue = {}, nextValue = {}) {
    if (nextValue) {
      for (let key in nextValue) {
        el.style[key] = nextValue[key];
      }
    }
    if (prevValue) {
      for (let key in prevValue) {
        if (!nextValue[key]) {
          el.style[key] = "";
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProps.ts
  function patchProp(el, key, preValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, preValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
