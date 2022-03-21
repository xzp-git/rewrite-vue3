import { isObject } from "@vue/shared"
import { reactive } from "./reactivity"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
}


export const mutableHandlers = {

    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }

        //在这里进行依赖的收集
        console.log("收集依赖");


        let res = Reflect.get(target, key, receiver)
        //取值的时候 发现是对象，再进行代理，不用一上来就进行代理 
        if (isObject(res)) {
            return reactive(res)
        }
        return res
    },
    set(target, key, value, receiver) {
        //去代理上设置值 执行set

        //拿到老值与新值作比较
        let oldValue = target[key]

        //Reflect.set 设置成功会返回 true
        let result = Reflect.set(target, key, value, receiver)


        if (oldValue !== value) { //值变化了 触发更新
            console.log("触发更新");

        }

        //Proxy的返回值 必须为一个布尔值 来代表是否设置成功
        return result
    }

}