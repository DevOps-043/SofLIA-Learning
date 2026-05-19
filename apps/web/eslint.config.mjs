import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const strictTechDebtRules = process.env.CI_STRICT_TECH_DEBT === "true";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
      "public/**",
      // Archivos con errores de parsing pre-existentes.
      "**/study-planner/components/StudyPlannerLIA.tsx",
      "**/study-planner/dashboard/page.tsx",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": strictTechDebtRules ? "error" : "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "error",

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",

      "no-console": strictTechDebtRules ? "error" : "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='select'][arguments.0.value='*']",
          message: "No uses select('*'). Selecciona campos explicitos.",
        },
        {
          selector: "Literal[value=/#[0-9A-Fa-f]{3,8}/]",
          message: "No uses hex colors hardcoded en TS/TSX. Usa Tailwind, CSS variables o tokens de tema.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}/]",
          message: "No uses hex colors hardcoded en template strings TS/TSX. Usa Tailwind, CSS variables o tokens de tema.",
        },
      ],
      "no-unused-vars": "off",
      "no-useless-catch": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
      "prefer-const": "off",
      "no-constant-binary-expression": "off",
      "no-unexpected-multiline": "off",
      "no-case-declarations": "off",
      "no-prototype-builtins": "off",
      "no-empty-pattern": "off",
    },
  },
];
