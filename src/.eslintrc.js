module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "extends": [
    "airbnb-base",
    "plugin:flowtype/recommended"
  ],
  "plugins": [
    "import",
    "flowtype"
  ],
  "rules": {
    "no-else-return": 0,
    "complexity": ["warn", 7],
    "max-len": [2, {"code": 150, "tabWidth": 4, "ignoreUrls": true}],
    "no-unused-expressions": [2, { allowTernary: true }]
  }
};