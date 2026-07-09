import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // Type-aware linting on top of the @typescript-eslint parser/plugin that
    // eslint-config-next already registers for TS files. `projectService`
    // builds the TypeScript program so type-checked rules can run.
    //
    // typescript-eslint is a direct devDependency (not just transitive via
    // eslint-config-next) to pin >=8.63.0: earlier versions cap their
    // supported TypeScript peer range below the TS 6 this repo uses.
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      // Async functions passed to JSX event attributes (onClick/onSubmit) are
      // idiomatic React; React ignores their return value. Only flag genuine
      // misuse elsewhere.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
