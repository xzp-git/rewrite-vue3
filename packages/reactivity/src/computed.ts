import { isFunction } from "@vue/shared";
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";

class ComputedRefImpl {
  public effect;
  public _dirty = true; //默认应该取值的时候进行计算
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  public dep = new Set();
  constructor(getter, public setter) {
    //我们将用户的getter放到effect中，这里面firstName和lastName就会被这个effect收集起来
    this.effect = new ReactiveEffect(getter, () => {
      //稍后依赖的属性变化会执行此调度函数
      if (!this._dirty) {
        this._dirty = true;
        //实现触发更新
        triggerEffects(this.dep);
      }
    });
  }

  get value() {
    //做依赖收集
    trackEffects(this.dep);
    if (this._dirty) {
      // 说明这个值是脏的
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);
  let getter, setter;

  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
};
