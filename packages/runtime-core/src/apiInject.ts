import { curretnInstance } from "./component";


export function provide(key, value) {
    if(!curretnInstance) return //此provide 一定要用到setup语法中
    const parentProvides = curretnInstance.parent && curretnInstance.parent.provides

    let provides = curretnInstance.provides //自己的provides

    //自己的provides不能定义在父亲上，否则会导致儿子提供的属性 父亲也能用
    if (parentProvides === provides) {
        provides = curretnInstance.provides = Object.create(provides)     
    }

    provides[key] = value
}

export function inject(key, defaultValue) {
    if(!curretnInstance) return
    const provides = curretnInstance.parent && curretnInstance.parent.provides
    if (provides && (key in provides)) {
        return provides[key]
    }else if (arguments.length > 1) {
        return defaultValue
    }
}