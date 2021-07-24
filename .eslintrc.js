module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb'],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  env: {
    jest: true,
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/jsx-filename-extension': 0,
    'jsx-a11y/label-has-for': 0,
    'jsx-a11y/label-has-associated-control': 0,
    'react/destructuring-assignment': 1,
    'no-nested-ternary': 1,
    'react/no-access-state-in-setstate': 1,
    'react/no-this-in-sfc': 1,
    'react/jsx-no-comment-textnodes': 1,
    'react/jsx-curly-newline': 0,
    'react/jsx-fragments': 0,
    'jsx-a11y/anchor-is-valid': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'no-useless-escape': 1,
    'arrow-parens': 0,
  },
};