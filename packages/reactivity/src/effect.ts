
export let activeEffect = undefined

export class ReactiveEffect{

    public parent
    public deps = []
    public active = true //这个effect默认是激活状态

    constructor(public fn, public scheduler){
    }

    run(){ // run 就是执行effect中传入的fn
        if (!this.active) {
            //这里表示如果是非激活的情况, 只需要执行函数，不需要进行依赖收集
            return this.fn()
        }

        //这里就需要依赖收集了 核心就是将当前的effect 和 稍后渲染的属性关联在一起

        try{
            //记录父级的effect // 多层effect嵌套 防止effecct丢失
            this.parent = activeEffect
            activeEffect = this


            //当稍后调用取值操作的时候，就可以获取到这个全局的activeEffect了
            return this.fn()
        }finally{
            activeEffect = this.parent
        }
    }
}


export const effect = (fn, options:any = {}) => {
    
    //这里fn可以根据状态 重新执行， effect可以嵌套着写

    //创建响应式的effect
    const _effect = new ReactiveEffect(fn, options.scheduler)

    _effect.run() //默认先执行一次 fn
    const runner = _effect.run.bind(_effect) //绑定 this
    runner.effect = _effect // 将effect实例挂载到runner函数上
    return runner
}


//一个effect 对应多个属性，一个属性对应多个effect
//结论 多对多
// 对象 某个属性 -》 多个effect
// WeakMap = {对象:Map{name:Set-》effect}}
// {对象:{name:[]}}
const targetMap = new WeakMap()

export function track(target, type, key) {
    //如果此时不存在全局的effect 则不需要进行依赖收集
    if (!activeEffect) return  

    let depsMap = targetMap.get(target) //该对象对应的Map
    if (!depsMap) {
        targetMap.set(target,(depsMap = new Map))
    }
    
}