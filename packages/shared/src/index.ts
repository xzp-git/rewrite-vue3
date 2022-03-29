export const isObject = (value) => {
  return typeof value === "object" && value !== null;
};
export const isString = (value) => {
  return typeof value === "string";
};
export const isNumber = (value) => {
  return typeof value === "number";
};
export const isFunction = (value) => {
  return typeof value === "function";
};

export const isArray = Array.isArray;
export const assign = Object.assign;

export const enum ShapeFlags { // vue3提供的形状标识
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}

// 位运算 & | 适合权限的组合  let user = 增加 | 删除   user&增加 > 0
