module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "indent": "off",
    "@typescript-eslint/indent": "off",

    "max-len": ["error", { 
      "code": 120,
      "ignoreComments": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true
    }],

    "keyword-spacing": "warn",
    "space-before-blocks": "warn",
    "no-trailing-spaces": "warn",

    "new-cap": "off",

    "comma-dangle": ["warn", "always-multiline"],

    "spaced-comment": "off",

    "arrow-parens": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
