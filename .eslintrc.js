module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    // 允许使用单引号
    quotes: ['error', 'single'],
    // 关闭函数名和括号之间的空格检查
    'space-before-function-paren': 'off',
    'no-multiple-empty-lines': 2,
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    indent: 'off', // 缩进
    'new-cap': 'off', // 允许使用小写开头的类名
    'no-prototype-builtins': 'off', // 允许直接调用对象的原型方法
    'prefer-rest-params': 'off', // 允许使用 arguments 对象
    camelcase: 'off', // 允许小写开头的变量
    '@typescript-eslint/no-var-requires': 'off', // 允许使用 require 导入的规则
    '@typescript-eslint/no-explicit-any': 'off' // 允许使用 any 类型的规则
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
