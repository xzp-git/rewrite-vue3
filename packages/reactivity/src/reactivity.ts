import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from "./baseHandler";

//1) 将数据转化成响应式的数据，只能做对象的代理
const reactiveMap = new WeakMap(); //key只能是对象

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 1） 实现同一个对象 代理多次 返回同一个代理
 * 2）代理对象被再次代理 可以直接返回
 * @param target 要代理的目标对象
 */
export const reactive = (target) => {
  if (!isObject(target)) {
    return;
  }
  //如果目标时一个代理对象，那么一定被代理过了，会走get
  //get 中会判断 如果被代理过返回true 进入if 返回已经代理过的对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  //这里的目的是 为了防止用户用同一个对象，进行多次代理
  let exisitingProxy = reactiveMap.get(target);

  if (exisitingProxy) {
    return exisitingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);

  //代理完成后将代理对象缓存
  reactiveMap.set(target, proxy);
  return proxy;
};
