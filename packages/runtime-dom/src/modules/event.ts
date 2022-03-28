






function createInvoker(callback) {
    const invoker = (e) => invoker.value(e)
    invoker.value = callback
    return invoker
}





export function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {})
    let exits = invokers[eventName]

    if (exits && nextValue) {
        exits.value = nextValue
    }else{
        let event = eventName.slice(2).toLowerCase()
        if (nextValue) {
            const invoker = invokers[eventName] = createInvoker(nextValue)
            el.addEventListener(event, invoker)
        }else if(exits){
            el.removeEventListener(event, exits)
            invokers[eventName] = undefined
        }
    }
}