module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  rules: {
    "import/order": ["warn", { "newlines-between": "always" }],
    "@typescript-eslint/no-explicit-any": "off"
  },
  ignorePatterns: ["dist", "playwright-report", "test-results"]
};

