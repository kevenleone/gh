module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
    "prettier",
    "simple-import-sort",
    "sort-destructure-keys",
    "sort-keys-fix",
  ],
  rules: {
    "@typescript-eslint/no-use-before-define": ["error"],
    camelcase: "off",
    "no-explicit-any": "off",
    "no-use-before-define": "off",
    semi: ["error", "always"],
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": "error",
    "sort-destructure-keys/sort-destructure-keys": [
      2,
      { caseSensitive: false },
    ],
    "sort-keys": [
      "error",
      "asc",
      { caseSensitive: true, minKeys: 2, natural: false },
    ],
    "sort-keys-fix/sort-keys-fix": "warn",
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
};
