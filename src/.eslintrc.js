module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "airbnb-base",
  "installedESLint": true,
  "plugins": [
    "import"
  ],
  "rules": {
    "no-else-return": 0,
    "complexity": ["warn", 9],
    "max-len": [2, {"code": 150, "tabWidth": 4, "ignoreUrls": true}]
  }
};