import rss from "@astrojs/rss";
import { sdk, agentId } from "../contentagen";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

//@ts-expect-error
export const GET = async (context) => {
   const response = await sdk.listContentByAgent({
      agentId: agentId,
      status: ["approved"],
      limit: 100,
      page: 1,
   });
   const posts = response.posts ?? [];

   return rss({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      site: context.site,
      items: posts.map((post) => ({
         title: post.meta?.title ?? "",
         description: post.meta?.description ?? "",
         link: new URL(post.meta?.slug ?? "", context.site).toString(),
         pubDate: post.createdAt,
         categories: post.meta.keywords ?? [],
      })),
   });
};
