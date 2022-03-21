const args = require("minimist")(process.argv.slice(2)); //解析命令行参数的
const { resolve } = require("path");

const { build } = require("esbuild");

// args { _: [ 'reactivity' ], f: 'global' }
const target = args._[0] || 'reactivity';
const format = args.f || 'global';

//开发环境只打包某一个
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

const outputFormat = format.startsWith('global')? 'iife' : format === 'cjs' ? 'cjs' : 'esm'

const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

// 天生就支持ts
build({
    entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile,
    bundle: true, // 把所有的包全部打包到一起
    sourcemap: true,
    format: outputFormat,// 输出的格式
    globalName: pkg.buildOptions?.name, // 打包的全局的名字
    platform: format === 'cjs' ? 'node' : 'browser', // 平台
    watch: { // 监控文件变化
        onRebuild(error) {
            if (!error) console.log(`rebuilt~~~~`)
        }
    }
}).then(() => {
    console.log('watching~~~')
})