const { defineConfig } = require('@vue/cli-service')

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const glob = require('glob')
const path = require('path')
const workerEntries = {}
glob.sync('./src/main/worker/*.ts')
  .forEach(e => {
    const name = path.parse(e).name
    workerEntries[`worker/${name}`] = `./src/main/worker/${name}.ts`
  })

module.exports = defineConfig({
  transpileDependencies: true,
  pages: {
    nextStudio: 'src/renderer/pages/nextStudio/main.js',
    symbolMaker: 'src/renderer/pages/symbolMaker/main.js'
  },
  configureWebpack: {
    plugins: [
      new NodePolyfillPlugin()
    ],
    resolve: {
      fallback: {
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        console: require.resolve('console-browserify'),
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        domain: require.resolve('domain-browser'),
        events: require.resolve('events/'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        punycode: require.resolve('punycode/'),
        process: require.resolve('process/browser'),
        querystring: require.resolve('querystring-es3'),
        stream: require.resolve('stream-browserify'),
        string_decoder: require.resolve('string_decoder/'),
        sys: require.resolve('util/'),
        timers: require.resolve('timers-browserify'),
        tty: require.resolve('tty-browserify'),
        url: require.resolve('url/'),
        vm: require.resolve('vm-browserify'),
        zlib: require.resolve('browserify-zlib')
      }
    }
  },
  pluginOptions: {
    electronBuilder: {
      /**
       * Node Integration
       *
       * As of v2.0 of VCPEB, Electron nodeIntegration is disabled by default.
       * This blocks all node APIs such as require. This reduces security risks (opens new window),
       * and is a recommended best practice by the Electron team.
       * If you need to use native modules such as fs or sqlite in the renderer process,
       * you can enable nodeIntegration in vue.config.js:
       */
      nodeIntegration: true,
      /**
       * Native modules are supported and should work without any configuration, assuming nodeIntegration is enabled.
       * If you get errors, you may need to set the native dependency as a webpack external (opens new window).
       * It should get found automatically, but it might not. To do this, use the externals option:
       *
       * You can prefix an item in the externals array with ! to prevent it being automatically marked as an external. (!not-external)
       *
       * If you do not use native dependencies in your code, you can remove the postinstall and postuninstall scripts from your package.json.
       * Native modules may not work, but dependency install times will be faster.
       *
       * Using a database such as MySQL or MongoDB requires extra configuration. See Issue #76 (comment)
       *
       * List native deps here if they don't work
       */
      externals: ['typeorm'],
      /**
       * Preload files allow you to execute JS with Node integration in the context of your Vue App (shared window variable).
       * Create a preload file and update your vue.config.js as so:
       *   preload: 'src/preload.js',
       * Or, for multiple preload files:
       */
      // preload: { preload: 'src/preload.js', otherPreload: 'src/preload2.js' },
      /**
       * If you are using Yarn Workspaces, you may have multiple node_modules folders
       * List them all here so that VCP Electron Builder can find them
       */
      // nodeModulesPath: ['../../node_modules', './node_modules'],
      /**
       * Configuring Electron Builder
       * To see available options, check out Electron Builder Configuration Options.
       *
       * options placed here will be merged with default configuration and passed to electron-builder
       */
      builderOptions: {
        electronDownload: {
          mirror: 'https://npmmirror.com/mirrors/electron/'
        },
        extraFiles: [
          { from: '版本说明.txt', to: './' }
        ],
        asarUnpack: [
          'node_modules/file-uri-to-path/**',
          'node_modules/bindings/**',
          'node_modules/better-sqlite3-multiple-ciphers/**',
          'worker/*.js'
        ],
        asar: true
      },
      /**
       * Webpack Configuration
       *
       * Your regular config is extended and used for bundling the renderer process (your app).
       * To modify your webpack config for Electron builds only, use the chainWebpackRendererProcess function.
       * To modify the webpack config for the Electron main process (opens new window)only,
       * use the chainWebpackMainProcess function under VCP Electron Builder's plugin options in vue.config.js.
       * To learn more about webpack chaining, see webpack-chain .
       * These functions work similarly to the chainWebpack option provided by Vue CLI.
       */
      // Chain webpack config for electron main process only
      chainWebpackMainProcess: (config) => {
        // 增加thread的webpack配置
        Object.keys(workerEntries).forEach(key => {
          config.entry(key).add(workerEntries[key])
        })
      },
      // Chain webpack config for electron renderer process only (won't be applied to web builds)
      // chainWebpackRendererProcess: (config) => {
      // },
      /**
       * Use this to change the entrypoint of your app's main process
       */
      // mainProcessFile: 'src/myBackgroundFile.js',
      /**
       * Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
       */
      // rendererProcessFile: 'src/myMainRenderFile.js',
      /**
       * Provide an array of files that, when changed, will recompile the main process and restart Electron
       * Your main process file will be added by default
       */
      mainProcessWatch: [
        'src/main/util.ts',
        'src/main/windowsManager.ts',
        'src/main/ipcMainHandler.ts',
        'src/main/NextStudioWindow.ts',
        'src/main/SymbolMakerWindow.ts',
        ...Object.values(workerEntries)
      ],
      /**
       * Provide a list of arguments that Electron will be launched with during "electron:serve",
       * which can be accessed from the main process (src/background.js).
       * Note that it is ignored when --debug flag is used with "electron:serve", as you must launch Electron yourself
       * Command line args (excluding --debug, --dashboard, and --headless) are passed to Electron as well
       */
      // mainProcessArgs: ['--arg-name', 'arg-value'],
      /**
       * Changing the Output Directory
       *
       * If you don't want your files outputted into dist_electron, you can choose a custom folder in VCPEB's plugin options.
       * You can use the --dest argument to change the output dir as well.
       * Note: It is recommended to add the new directory to your .gitignore file.
       */
      // outputDir: 'electron-builder-output-dir',
      /**
       * TypeScript Options
       *
       * Typescript support is automatic and requires no configuration, just add the @vue/typescript cli plugin.
       * There are a few options for configuring typescript if necessary:
       *
       * If you decide to add the @vue/typescript plugin to your app later on, make sure to re-invoke
       * the generator of VCP-Electron-Builder with vue invoke electron-builder.
       * This will automatically insert missing type definitions to your background.ts file.
       *
       * Manually disable typescript plugin for main process.
       * Enable if you want to use regular js for the main process (src/background.js by default).
       */
      disableMainProcessTypescript: false,
      /**
       * Manually enable type checking during webpack bundling for background file.
       */
      mainProcessTypeChecking: false,
      /**
       * Changing the File Loading Protocol
       *
       * By default, the app protocol is used to load files.
       * This allows you to use ES6 type="module" scripts, created by Vue CLI's modern mode (opens new window).
       * If, for some reason, you would like to use a different protocol, set it with the customFileProtocol option,
       * and change it in your background.js file.
       *
       * If you want to use the file:// protocol, add win.loadURL(`file://${__dirname}/index.html`) to your main process file
       * In place of win.loadURL('app://./index.html'), and set customFileProtocol to './'
       * 修复打包后图标字体不显示的问题
       * */
      customFileProtocol: './' // Make sure to add "./" to the end of the protocol
      /**
       * Electron's Junk Terminal Output
       *
       * Electron will sometimes produce a bunch of junk output like so:
       * 2018-08-10 22:52:14.068 Electron[90710:4891777] *** WARNING: Textured window <AtomNSWindow: 0x7fd508e75020> is getting an implicitly transparent titlebar. This will break when linking against newer SDKs. Use NSWindow's -titlebarAppearsTransparent=YES instead.
       * 2018-08-10 22:52:37.919 Electron Helper[90714:4892173] Couldn't set selectedTextBackgroundColor from default ()
       * [90789:0810/225757.360355:ERROR:CONSOLE(0)] "Failed to load https://chrome-devtools-frontend.appspot.com/serve_file/@7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33/product_registry_impl/product_registry_impl_module.js: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'chrome-devtools://devtools' is therefore not allowed access. The response had HTTP status code 404.", source: chrome-devtools://devtools/bundled/inspector.html?remoteBase=https://chrome-devtools-frontend.appspot.com/serve_file/@7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33/&can_dock=true&toolbarColor=rgba(223,223,223,1)&textColor=rgba(0,0,0,1)&experiments=true (0)
       * [90789:0810/225757.360445:ERROR:CONSOLE(22)] "Empty response arrived for script 'https://chrome-devtools-frontend.appspot.com/serve_file/@7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33/product_registry_impl/product_registry_impl_module.js'", source: chrome-devtools://devtools/bundled/inspector.js (22)
       * [90789:0810/225757.361236:ERROR:CONSOLE(105)] "Uncaught (in promise) Error: Could not instantiate: ProductRegistryImpl.Registry", source: chrome-devtools://devtools/bundled/inspector.js (105)
       * [90789:0810/225757.361293:ERROR:CONSOLE(105)] "Uncaught (in promise) Error: Could not instantiate: ProductRegistryImpl.Registry", source: chrome-devtools://devtools/bundled/inspector.js (105)
       * ...
       *
       * VCP Electron Builder will automatically remove this for you (powered by run-electron (opens new window)).
       * If you don't want this removed, set removeElectronJunk to false in plugin options:
       */
      // removeElectronJunk: false,
    }
  },
  /**
   * 如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建。
   * Default: true
   */
  productionSourceMap: false
})
