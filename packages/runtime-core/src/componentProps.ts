import { reactive } from "@vue/reactivity";
import { ShapeFlags } from "@vue/shared";
import { hasOwn } from "@vue/shared";


export function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};

    const options = instance.propsOptions || {}

    if (rawProps) {
        for(let key in rawProps){
            const value = rawProps[key];
            if (hasOwn(options, key)) {
                props[key] = value
            }else{
                attrs[key] = value
            }
        }
    }

    //这里props不希望在组件内部被更改，但是props得是响应式的，因为后续属性变化了要更新视图，
    //用的应该是shallowReactive
    instance.props = reactive(props)
    instance.attrs = attrs
    if(instance.vnode.shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT){
        instance.props = instance.attrs;
    }
}


/**
 * 
 * @param prevProps 旧虚拟节点的 props
 * @param nextProps 新虚拟节点的 props
 * @returns 
 */
export const hasPropsChanged = (prevProps = {}, nextProps = {}) => {
    const nextKeys = Object.keys(nextProps);
    //对比属性前后的个数是否一致
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true
    } 
    //个数一致的话比对 属性的值一样吗
    for(let i = 0; i<nextKeys.length; i++){
        const key = nextKeys[i]
        if (nextProps[key] !== prevProps[key]) {
            return true
        }
    }

    return false
}


export function updateProps(prevProps = {}, nextVnode){

    const props = {};

    const options = nextVnode.type.props || {}

    if (nextVnode.props) {
        for(let key in nextVnode.props){
            const value = nextVnode.props[key];
            if (hasOwn(options, key)) {
                props[key] = value
            }
        }
    }

    //看一下属性有没有变化
    //值得变化
    for(const key in props){
        prevProps[key] = props[key];
    }

    for(const key in prevProps){
        if (!hasOwn(props, key)) {
            delete prevProps[key]
        }
    }
}