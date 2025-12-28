export default {
   extends: ["@commitlint/config-conventional"],
   prompt: {
      questions: {
         scope: {
            description: "What packages/apps are affected by this change?",
            enum: [
               "blog",
               "dashboard",
               "docs",
               "landing-page",
               "server",
               "agents",
               "api",
               "authentication",
               "brand",
               "database",
               "environment",
               "files",
               "localization",
               "payment",
               "posthog",
               "rag",
               "server-events",
               "transactional",
               "ui",
               "utils",
               "workers",
               "typescript",
               "deps",
               "build",
               "ci",
               "release",
               "chore",
            ],
         },
      },
   },
   rules: {
      "scope-empty": [2, "never"],
      "scope-enum": [
         2,
         "always",
         [
            // Apps
            "blog",
            "dashboard",
            "docs",
            "landing-page",
            "server",

            // Packages
            "agents",
            "api",
            "authentication",
            "brand",
            "database",
            "environment",
            "files",
            "localization",
            "payment",
            "posthog",
            "rag",
            "server-events",
            "transactional",
            "ui",
            "utils",
            "contenta-sdk",
            "workers",

            // Tooling
            "typescript",

            // Global scopes
            "deps",
            "build",
            "ci",
            "release",
            "chore",
         ],
      ],
   },
};
