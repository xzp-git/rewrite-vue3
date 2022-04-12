import { isVnode } from "../vnode";
import { getCurrentInstance } from "../component";
import { ShapeFlags } from "@vue/shared";
import { onMounted,onUpdated } from "../apiLifecycle";

function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag

    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
    }
    if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
    }
    vnode.shapeFlag = shapeFlag
}

export const KeepAliveImpl = {
    __isKeepAlive: true,
    props:{
        include:{},
        exculde:{},
        max:{}
    },
    setup(props, {slots}) {
        const keys = new Set() //缓存的key
        const cache = new Map() //哪个key 对应的是哪个虚拟节点

        const instance = getCurrentInstance()
        let {createElement, move} = instance.ctx.renderer
        const storageContainer = createElement('div') //稍后我们要把渲染好的组件移入进去
        instance.ctx.deactivate = function (vnode) {
            move(vnode, storageContainer)
        }
        instance.ctx.activate = function (vnode, container, anchor) {
            move(vnode, container, anchor)
        }

        let pendingCachKey = null

        function cacheSubTree() {
            if (pendingCachKey) {
                cache.set(pendingCachKey, instance.subTree)
            }
        }

        onMounted(cacheSubTree)
        onUpdated(cacheSubTree)
        const {include,exclude,max} = props; // watch include 与exclude的关系

        let current = null
        function pruneCacheEntry(key) {
            resetShapeFlag(current)
            cache.delete(key)
            keys.delete(key)
        }

        //本身keep-alive
        return () => { //keep-alive 本身没有功能，渲染的是插槽
            //keep-alive默认会去取slots的default属性， 返回的虚拟节点的第一个
            let vnode = slots.default()

            //看一下vnode是不是组件，只有组件才能缓存
            //必须是虚拟节点 而且是带状态的组件
            if (!isVnode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
                return vnode
            }
            const comp = vnode.type
            const key = vnode.key == null ? comp : vnode.key
            let name = comp.name //组件的名字可以根据名字来决定是否需要缓存
            if (name && (include && !include.split(',').includes(name))|| (exclude && exclude.split(',').includes(name))) {
                return vnode
            }

            let cacheVnode = cache.get(key) //找有没有缓存过
            if (cacheVnode) {
                vnode.component = cacheVnode.component //告诉复用缓存的component
                vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE//标识初始化的时候 不要走创建了
                keys.delete(key)
                keys.add(key)

            }else{
                keys.add(key) //缓存key
                pendingCachKey = key
                if (max && keys.size > max) {
                    
                    pruneCacheEntry(keys.values().next().value)
                }
            }
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE; // 标识这个组件稍后是假的卸载
            current = vnode;

            return vnode; // 组件 -》 组件渲染的内容

        }
    }
}

export const isKeepAlive = (vnode) => vnode.type.__isKeepAlive