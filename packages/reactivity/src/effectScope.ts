
/**
 * effectScope 可以存储 effectScope
 * effectScope => effect
 * 
 * 父effectScope => 子effectScope => effect
 * 父effectScope.stop() 停止自家的effect 执行子effectScope.stop() 同时停止自己的effect
 *
 */


export let activeEffectScope = null;
class EffectScope{
    active = true;
    parent = null
    effects = [] //此scope记录的effect
    scopes = []//effectScope 还有可能要手机子集的effectScope
    constructor(detached){
        //只有不独立的才要收集
        if (!detached && activeEffectScope) {
            activeEffectScope.scopes.push(this)
        }
    }
    run(fn){
        if (this.active) {
            try {
                this.parent = activeEffectScope
                activeEffectScope = this
                return fn()
            } finally{
                activeEffectScope = this.scopes
            }
        }
    }
    stop(){
        if (this.active) {
            for (let i = 0; i < this.effects.length; i++) {
                this.effects[i].stop()
            }
            for (let i = 0; i < this.scopes.length; i++) {
                this.scopes[i].stop()
            }
            this.active = false
        }
    }
}




export function recordEffectScope(effect) {
    if (activeEffectScope && activeEffectScope.active) {
        activeEffectScope.effects.push(effect)
    }
}


export function effectScope(detached = false) {
    return new EffectScope(detached)
}