import { Elysia, t } from "elysia";
import {
  getAllBlockMetadata,
  getBlockDependencies,
  getBlockMetadata,
} from "../integrations/registry-utils";

export const registryRoutes = new Elysia({
  prefix: "/api/registry",
})
  .get(
    "/blocks",
    async () => {
      const blocks = getAllBlockMetadata();
      return blocks;
    },
    {
      response: t.Array(
        t.Object({
          category: t.String(),
          dependencies: t.Object({
            npm: t.Record(t.String(), t.String()),
            shadcn: t.Array(t.String()),
          }),
          files: t.Object({
            component: t.String(),
          }),
          id: t.String(),
          name: t.String(),
        })
      ),
    }
  )
  .get(
    "/blocks/:blockId",
    async ({ params, set }) => {
      const metadata = getBlockMetadata(params.blockId);

      if (!metadata) {
        set.status = 404;
        return { message: "Block not found" };
      }

      return metadata;
    },
    {
      params: t.Object({
        blockId: t.String(),
      }),
      response: {
        200: t.Object({
          category: t.String(),
          dependencies: t.Object({
            npm: t.Record(t.String(), t.String()),
            shadcn: t.Array(t.String()),
          }),
          files: t.Object({
            component: t.String(),
          }),
          id: t.String(),
          name: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .get(
    "/blocks/:blockId/dependencies",
    async ({ params, set }) => {
      const dependencies = getBlockDependencies(params.blockId);

      if (!dependencies) {
        set.status = 404;
        return { message: "Block not found" };
      }

      return dependencies;
    },
    {
      params: t.Object({
        blockId: t.String(),
      }),
      response: {
        200: t.Object({
          npm: t.Record(t.String(), t.String()),
          shadcn: t.Array(t.String()),
        }),
        404: t.Object({
          message: t.String(),
        }),
      },
    }
  );
