export let activeEffect = undefined;

export class ReactiveEffect {
  public parent;
  public deps = [];
  public active = true; //这个effect默认是激活状态

  constructor(public fn, public scheduler) {}

  run() {
    // run 就是执行effect中传入的fn
    if (!this.active) {
      //这里表示如果是非激活的情况, 只需要执行函数，不需要进行依赖收集
      return this.fn();
    }

    //这里就需要依赖收集了 核心就是将当前的effect 和 稍后渲染的属性关联在一起

    try {
      //记录父级的effect // 多层effect嵌套 防止effecct丢失
      this.parent = activeEffect;
      activeEffect = this;

      //当稍后调用取值操作的时候，就可以获取到这个全局的activeEffect了
      return this.fn();
    } finally {
      activeEffect = this.parent;
    }
  }
}

export const effect = (fn, options: any = {}) => {
  //这里fn可以根据状态 重新执行， effect可以嵌套着写

  //创建响应式的effect
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run(); //默认先执行一次 fn
  const runner = _effect.run.bind(_effect); //绑定 this
  runner.effect = _effect; // 将effect实例挂载到runner函数上
  return runner;
};

//一个effect 对应多个属性，一个属性对应多个effect
//结论 多对多
// 对象 某个属性 -》 多个effect
// WeakMap = {对象:Map{name:Set-》effect}}
// {对象:{name:[]}}
const targetMap = new WeakMap();

export function track(target, type, key) {
  //如果此时不存在全局的effect 则不需要进行依赖收集
  if (!activeEffect) return;

  let depsMap = targetMap.get(target); //该对象对应的Map
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);

  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  //收集依赖
  /**
   * 单向指的是 属性记录了effect， 反向记录，应该让effect也记录他被哪些属性收集过，这样做的好处是为了可以清理依赖
   */
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep); //让effect记住对应的dep，稍后清理的时候会用到
    }
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return; //触发的值不在模板中使用

  let effects = depsMap.get(key); //找到了属性对应的effect

  if (effects) {
    triggerEffects(effects);
  }
}

export function triggerEffects(effects) {
  effects = new Set(effects);
  effects.forEach((effect) => {
    //我们在执行effect的时候 又要执行自己，那我们需要屏蔽掉自己，不要造成死循环
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler(); //如果用户传入了调度函数，则调用调度函数
      } else {
        effect.run(); //否则默认刷新视图
      }
    }
  });
}

/**
 * 1) 我们先搞了一个响应式对象
 * 2) effect 默认数据变化要能更新 我么你先将正在执行的effect作为全局的变量，渲染（取值），我们在get方法中进行依赖收集
 * 3) weakMap ( 对象：map(属性：set（effect）) )
 * 4) 稍后用户发生数据变化，会通过对象属性来查找对应的effect集合，找到effect全部执行
 */
