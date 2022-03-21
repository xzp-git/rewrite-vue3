const args = require("minimist")(process.argv.slice(2)); //解析命令行参数的
const { resolve } = require("path");

const { build } = require("esbuild");

// args { _: [ 'reactivity' ], f: 'global' }
const target = args._[0];
