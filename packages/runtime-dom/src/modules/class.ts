export function patchClass(el, nextValue) {
    if (!nextValue) {
        el.removeAttribute('class')
    }else{
        el.className = nextValue
    }
}