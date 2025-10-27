import { Buffer } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { DatabaseInstance } from "@packages/database/client";
import type { PgVectorDatabaseInstance } from "@packages/rag/client";
import type { MinioClient } from "@packages/files/client";
import type { CustomRuntimeContext } from "@packages/agents";

const mockDb = {} as DatabaseInstance;
const mockRagClient = {} as PgVectorDatabaseInstance;
const mockMinioClient = {} as MinioClient;

vi.mock("@packages/agents", () => ({
   mastra: {
      getAgent: vi.fn(),
   },
   setRuntimeContext: vi.fn(),
}));

vi.mock("@packages/database/repositories/agent-repository", () => ({
   getAgentById: vi.fn(),
}));

vi.mock("@packages/database/repositories/auth-repository", () => ({
   findMemberByUserId: vi.fn(),
}));

vi.mock("@packages/database/repositories/content-repository", () => ({
   getContentById: vi.fn(),
   getContentBySlug: vi.fn(),
   listContents: vi.fn(),
}));

vi.mock("@packages/database/repositories/brand-repository", () => ({
   getBrandByOrgId: vi.fn(),
}));

vi.mock("@packages/files/client", () => ({
   streamFileForProxy: vi.fn(),
}));

vi.mock("@packages/rag/repositories/related-slugs-repository", () => ({
   searchRelatedSlugsByText: vi.fn(),
}));

vi.mock("@api/integrations/auth", () => ({
   auth: {
      api: {
         verifyApiKey: vi.fn(),
         getSession: vi.fn(),
      },
   },
}));

vi.mock("@api/integrations/database", () => ({
   db: mockDb,
   ragClient: mockRagClient,
}));

vi.mock("@api/integrations/minio", () => ({
   minioClient: mockMinioClient,
}));

import { sdkRoutes } from "../src/routes/sdk";
import { mastra, setRuntimeContext } from "@packages/agents";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { findMemberByUserId } from "@packages/database/repositories/auth-repository";
import {
   getContentById,
   getContentBySlug,
   listContents,
} from "@packages/database/repositories/content-repository";
import { getBrandByOrgId } from "@packages/database/repositories/brand-repository";
import { streamFileForProxy } from "@packages/files/client";
import { searchRelatedSlugsByText } from "@packages/rag/repositories/related-slugs-repository";
import { auth } from "@api/integrations/auth";

type AgentRecord = Awaited<ReturnType<typeof getAgentById>>;
type ContentRecord = Awaited<ReturnType<typeof getContentById>>;
type ContentDetailRecord = Awaited<ReturnType<typeof getContentBySlug>>;
type ContentListRecord = Awaited<ReturnType<typeof listContents>>;
type ContentListItem = ContentListRecord[number];
type BrandRecord = Awaited<ReturnType<typeof getBrandByOrgId>>;
type RelatedSlugsRecords = Awaited<ReturnType<typeof searchRelatedSlugsByText>>;
type MemberRecord = Awaited<ReturnType<typeof findMemberByUserId>>;

type AgentMessage = { role: "user" | "assistant" | "system"; content: string };
type StreamOptions = { runtimeContext: unknown; format: string };
type StreamResponse = { toTextStreamResponse: () => Response };

type AgentStreamMock = ReturnType<
   typeof vi.fn<
      (
         messages: AgentMessage[],
         options: StreamOptions,
      ) => Promise<StreamResponse>
   >
>;
type TextResponseMock = ReturnType<typeof vi.fn<() => Response>>;

interface MockMastraAgent {
   stream: AgentStreamMock;
}

const createAgentInstance = (
   text: string = "Assistant response",
): MockMastraAgent => {
   const toTextStreamResponse: TextResponseMock = vi.fn<() => Response>(
      () =>
         new Response(text, {
            headers: { "Content-Type": "text/plain" },
         }),
   );
   const stream: AgentStreamMock = vi.fn<
      (
         messages: AgentMessage[],
         options: StreamOptions,
      ) => Promise<StreamResponse>
   >(async () => ({
      toTextStreamResponse,
   }));
   return { stream };
};

const buildAgent = (overrides: Partial<AgentRecord> = {}): AgentRecord => {
   const { personaConfig: personaOverride, ...rest } = overrides;
   const base: AgentRecord = {
      id: "agent-id",
      userId: "user-id",
      organizationId: null,
      personaConfig: {
         metadata: {
            name: "Default Name",
            description: "Default Description",
         },
      },
      profilePhotoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastGeneratedAt: null,
   };
   return {
      ...base,
      ...rest,
      personaConfig: {
         ...base.personaConfig,
         ...personaOverride,
         metadata: {
            ...base.personaConfig.metadata,
            ...personaOverride?.metadata,
         },
      },
   };
};

const buildContent = (
   overrides: Partial<ContentRecord> = {},
): ContentRecord => {
   const {
      meta: metaOverride,
      request: requestOverride,
      stats: statsOverride,
      ...rest
   } = overrides;
   const base = {
      id: "content-id",
      agentId: "agent-id",
      imageUrl: null,
      body: "",
      status: "draft",
      shareStatus: "private",
      meta: {},
      request: { description: "", layout: "article" },
      stats: {},
      currentVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
   } satisfies ContentRecord;
   const resolvedMeta =
      metaOverride === undefined
         ? base.meta
         : metaOverride === null
           ? null
           : { ...(base.meta ?? {}), ...metaOverride };
   const resolvedStats =
      statsOverride === undefined
         ? base.stats
         : statsOverride === null
           ? null
           : { ...(base.stats ?? {}), ...statsOverride };
   return {
      ...base,
      ...rest,
      meta: resolvedMeta,
      request: {
         ...base.request,
         ...requestOverride,
      },
      stats: resolvedStats,
   };
};

const buildContentListItem = (
   overrides: Partial<ContentListItem> = {},
): ContentListItem => {
   const {
      meta: metaOverride,
      stats: statsOverride,
      agent: agentOverride,
      ...rest
   } = overrides;
   const base = {
      id: "content-id",
      meta: {},
      imageUrl: null,
      status: "draft",
      createdAt: new Date(),
      stats: {},
      shareStatus: "private",
      agent: buildAgent(),
   } satisfies ContentListItem;
   const resolvedMeta =
      metaOverride === undefined
         ? base.meta
         : metaOverride === null
           ? null
           : { ...(base.meta ?? {}), ...metaOverride };
   const resolvedStats =
      statsOverride === undefined
         ? base.stats
         : statsOverride === null
           ? null
           : { ...(base.stats ?? {}), ...statsOverride };
   return {
      ...base,
      ...rest,
      meta: resolvedMeta,
      stats: resolvedStats,
      agent: agentOverride ?? base.agent,
   };
};

const buildBrand = (overrides: Partial<BrandRecord> = {}): BrandRecord => {
   const base = {
      id: "brand-id",
      name: "Brand",
      websiteUrl: "https://example.com",
      summary: "",
      logoUrl: "",
      status: "analyzing",
      organizationId: "org-id",
      uploadedFiles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      features: [],
   } satisfies BrandRecord;
   return {
      ...base,
      ...overrides,
      features: overrides.features ?? base.features,
   };
};

const buildMember = (overrides: Partial<MemberRecord> = {}): MemberRecord => {
   const base = {
      id: "member-id",
      userId: "test-user-id",
      organizationId: "test-org-id",
      role: "member" as const,
      createdAt: new Date(),
   } satisfies MemberRecord;
   return {
      ...base,
      ...overrides,
   };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
   typeof value === "object" && value !== null;

type ImagePayload = { data: string; contentType: string };

const isImagePayload = (value: unknown): value is ImagePayload => {
   if (!isRecord(value)) {
      return false;
   }
   const { data, contentType } = value;
   return typeof data === "string" && typeof contentType === "string";
};

interface AuthorResponse {
   name: string;
   profilePhoto: ImagePayload | null;
}

const assertAuthorResponse = (
   value: unknown,
): asserts value is AuthorResponse => {
   if (!isRecord(value) || typeof value.name !== "string") {
      throw new Error("Invalid author response payload");
   }
   const { profilePhoto } = value;
   if (profilePhoto !== null && !isImagePayload(profilePhoto)) {
      throw new Error("Invalid author profile photo payload");
   }
};

interface ContentListPost extends ContentListItem {
   image: ImagePayload | null;
}

interface ContentListResponse {
   posts: ContentListPost[];
   total: number;
}

const assertContentListPost = (
   value: unknown,
): asserts value is ContentListPost => {
   if (!isRecord(value)) {
      throw new Error("Invalid content list post payload");
   }
   if (typeof value.id !== "string") {
      throw new Error("Invalid content list post id");
   }
   if (
      !("imageUrl" in value) ||
      (value.imageUrl !== null && typeof value.imageUrl !== "string")
   ) {
      throw new Error("Invalid content list post imageUrl");
   }
   if (!("meta" in value) || !isRecord(value.meta)) {
      throw new Error("Invalid content list post meta");
   }
   if (!("agent" in value) || !isRecord(value.agent)) {
      throw new Error("Invalid content list post agent");
   }
   if (!("image" in value)) {
      throw new Error("Missing image field in content list post");
   }
   const image = value.image;
   if (image !== null && !isImagePayload(image)) {
      throw new Error("Invalid content list image payload");
   }
};

const assertContentListResponse = (
   value: unknown,
): asserts value is ContentListResponse => {
   if (
      !isRecord(value) ||
      !Array.isArray(value.posts) ||
      typeof value.total !== "number"
   ) {
      throw new Error("Invalid content list response payload");
   }
   value.posts.forEach(assertContentListPost);
};

type ContentDetailResponse = ContentDetailRecord & {
   image: ImagePayload | null;
};

const assertContentDetailResponse = (
   value: unknown,
): asserts value is ContentDetailResponse => {
   if (!isRecord(value)) {
      throw new Error("Invalid content detail response payload");
   }
   if (!("image" in value)) {
      throw new Error("Missing image field in content detail response");
   }
   const image = value.image;
   if (image !== null && !isImagePayload(image)) {
      throw new Error("Invalid content detail image payload");
   }
};

const assertImageResponse = (
   value: unknown,
): asserts value is ImagePayload | null => {
   if (value !== null && !isImagePayload(value)) {
      throw new Error("Invalid image payload");
   }
};

const assertStringArray = (value: unknown): asserts value is string[] => {
   if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string")
   ) {
      throw new Error("Invalid string array payload");
   }
};

const parseJson = async <T>(
   response: Response,
   validator: (value: unknown) => asserts value is T,
): Promise<T> => {
   const payload = await response.json();
   validator(payload);
   return payload;
};

const createRequest = (
   url: string,
   headers?: Record<string, string>,
): Request =>
   new Request(url, {
      headers: headers ? new Headers(headers) : undefined,
   });

const mastraGetAgentMock = mastra.getAgent as unknown as Mock<
   (agentName: string) => MockMastraAgent
>;
const setRuntimeContextMock = setRuntimeContext as unknown as Mock<
   (context: CustomRuntimeContext) => unknown
>;
const getAgentByIdMock = getAgentById as unknown as Mock<
   (
      dbInstance: DatabaseInstance,
      agentId: string,
   ) => Promise<AgentRecord | null>
>;
const getContentByIdMock = getContentById as unknown as Mock<
   (
      dbInstance: DatabaseInstance,
      contentId: string,
   ) => Promise<ContentRecord | null>
>;
const getContentBySlugMock = getContentBySlug as unknown as Mock<
   (
      dbInstance: DatabaseInstance,
      slug: string,
      agentId: string,
   ) => Promise<ContentDetailRecord | null>
>;
const listContentsMock = listContents as unknown as Mock<
   (
      dbInstance: DatabaseInstance,
      agentIds: string[],
      status: Array<Exclude<ContentRecord["status"], null>>,
   ) => Promise<ContentListRecord>
>;
const getBrandByOrgIdMock = getBrandByOrgId as unknown as Mock<
   (
      dbInstance: DatabaseInstance,
      organizationId: string,
   ) => Promise<BrandRecord | null>
>;
const findMemberByUserIdMock = findMemberByUserId as unknown as Mock<
   (
      dbInstance: DatabaseInstance,
      userId: string,
   ) => Promise<MemberRecord | null>
>;
const streamFileForProxyMock = streamFileForProxy as unknown as Mock<
   (
      fileName: string,
      bucketName: string,
      minioClient: MinioClient,
   ) => Promise<{ buffer: Buffer; contentType: string }>
>;
const searchRelatedSlugsByTextMock =
   searchRelatedSlugsByText as unknown as Mock<
      (
         ragDatabase: PgVectorDatabaseInstance,
         query: string,
         agentId: string,
         options: { limit?: number } | undefined,
      ) => Promise<RelatedSlugsRecords>
   >;
const authVerifyApiKeyMock = auth.api.verifyApiKey as unknown as Mock<
   (input: {
      headers: Headers;
      body: { key: string };
   }) => Promise<{ valid: boolean }>
>;
const authGetSessionMock = auth.api.getSession as unknown as Mock<
   (input: { headers: Headers }) => Promise<{ user: { id: string } }>
>;

const defaultImageBuffer = Buffer.from("test-image-data");
const defaultImageBase64 = defaultImageBuffer.toString("base64");

let agentInstance: MockMastraAgent;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
describe("sdkRoutes", () => {
   beforeEach(() => {
      vi.clearAllMocks();
      consoleErrorSpy = vi
         .spyOn(console, "error")
         .mockImplementation(() => undefined);
      authVerifyApiKeyMock.mockResolvedValue({ valid: true });
      authGetSessionMock.mockResolvedValue({
         user: { id: "test-user-id" },
      });
      findMemberByUserIdMock.mockResolvedValue(buildMember());
      agentInstance = createAgentInstance();
      mastraGetAgentMock.mockReturnValue(agentInstance);
      setRuntimeContextMock.mockReturnValue("runtime-context");
      streamFileForProxyMock.mockResolvedValue({
         buffer: defaultImageBuffer,
         contentType: "image/jpeg",
      });
   });

   afterEach(() => {
      consoleErrorSpy.mockRestore();
   });

   describe("GET /sdk/author/:agentId", () => {
      it("returns author information with profile photo", async () => {
         const agent = buildAgent({
            id: "test-agent-id",
            userId: "test-user-id",
            personaConfig: {
               metadata: {
                  name: "Test Author",
                  description: "Default Description",
               },
            },
            profilePhotoUrl: "test-photo-url",
         });
         getAgentByIdMock.mockResolvedValue(agent);

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/test-agent-id", {
               "sdk-api-key": "test-api-key",
            }),
         );
         const body = await parseJson(response, assertAuthorResponse);

         expect(response.status).toBe(200);
         expect(body).toEqual({
            name: "Test Author",
            profilePhoto: {
               data: defaultImageBase64,
               contentType: "image/jpeg",
            },
         });
         expect(getAgentByIdMock).toHaveBeenCalledWith(mockDb, "test-agent-id");
         expect(streamFileForProxyMock).toHaveBeenCalledWith(
            "test-photo-url",
            "content-writer",
            mockMinioClient,
         );
         expect(authVerifyApiKeyMock).toHaveBeenCalled();
         expect(authGetSessionMock).toHaveBeenCalled();
      });

      it("returns author information without profile photo", async () => {
         const agent = buildAgent({
            id: "test-agent-id",
            userId: "test-user-id",
            personaConfig: {
               metadata: {
                  name: "Test Author",
                  description: "Default Description",
               },
            },
            profilePhotoUrl: null,
         });
         getAgentByIdMock.mockResolvedValue(agent);

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/test-agent-id", {
               "sdk-api-key": "test-api-key",
            }),
         );
         const body = await parseJson(response, assertAuthorResponse);

         expect(response.status).toBe(200);
         expect(body).toEqual({
            name: "Test Author",
            profilePhoto: null,
         });
         expect(streamFileForProxyMock).not.toHaveBeenCalled();
      });

      it("returns 500 when agent lookup fails", async () => {
         getAgentByIdMock.mockRejectedValue(new Error("Agent not found"));

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/unknown", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Agent not found");
      });

      it("returns profile photo as null when file retrieval fails", async () => {
         const agent = buildAgent({
            id: "test-agent-id",
            userId: "test-user-id",
            personaConfig: {
               metadata: {
                  name: "Test Author",
                  description: "Default Description",
               },
            },
            profilePhotoUrl: "test-photo-url",
         });
         getAgentByIdMock.mockResolvedValue(agent);
         streamFileForProxyMock.mockRejectedValue(
            new Error("Photo fetch error"),
         );

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/test-agent-id", {
               "sdk-api-key": "test-api-key",
            }),
         );
         const body = await parseJson(response, assertAuthorResponse);

         expect(response.status).toBe(200);
         expect(body.profilePhoto).toBeNull();
      });

      it("returns 500 when API key is missing", async () => {
         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/test-agent-id"),
         );

         expect(response.status).toBe(500);
         expect(getAgentByIdMock).not.toHaveBeenCalled();
      });

      it("returns 500 when API key is invalid", async () => {
         authVerifyApiKeyMock.mockResolvedValue({ valid: false });

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/test-agent-id", {
               "sdk-api-key": "invalid",
            }),
         );

         expect(response.status).toBe(500);
      });

      it("returns 500 when user is not authorized to access agent", async () => {
         const agent = buildAgent({
            id: "test-agent-id",
            userId: "different-user-id", // Different from session user ID
         });
         getAgentByIdMock.mockResolvedValue(agent);

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/author/test-agent-id", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Unauthorized access to agent information");
      });
   });

   describe("GET /sdk/related-slugs", () => {
      it("returns related slugs", async () => {
         const related: RelatedSlugsRecords = [
            { slug: "related-slug-1" },
            { slug: "related-slug-2" },
            { slug: "original-slug" },
         ];
         searchRelatedSlugsByTextMock.mockResolvedValue(related);

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/related-slugs?slug=original-slug&agentId=test-agent-id",
               {
                  "sdk-api-key": "test-api-key",
               },
            ),
         );
         const body = await parseJson(response, assertStringArray);

         expect(response.status).toBe(200);
         expect(body).toEqual(["related-slug-1", "related-slug-2"]);
         expect(searchRelatedSlugsByTextMock).toHaveBeenCalledWith(
            mockRagClient,
            "original-slug",
            "test-agent-id",
            { limit: 3 },
         );
      });

      it("returns 422 when slug query parameter is missing", async () => {
         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/related-slugs?agentId=test", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(422);
      });

      it("returns 422 when agentId query parameter is missing", async () => {
         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/related-slugs?slug=test", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(422);
      });
   });

   describe("GET /sdk/assistant", () => {
      it("streams assistant response", async () => {
         const member = buildMember({
            userId: "test-user-id",
            organizationId: "test-org-id",
         });
         const brand = buildBrand({
            id: "test-brand-id",
            organizationId: "test-org-id",
         });
         findMemberByUserIdMock.mockResolvedValue(member);
         getBrandByOrgIdMock.mockResolvedValue(brand);
         setRuntimeContextMock.mockReturnValue("assistant-context");

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/assistant?message=Hello", {
               "sdk-api-key": "test-api-key",
               "x-locale": "en",
            }),
         );
         const text = await response.text();

         expect(response.status).toBe(200);
         expect(text).toBe("Assistant response");
         expect(findMemberByUserIdMock).toHaveBeenCalledWith(
            mockDb,
            "test-user-id",
         );
         expect(getBrandByOrgIdMock).toHaveBeenCalledWith(
            mockDb,
            "test-org-id",
         );
         expect(setRuntimeContextMock).toHaveBeenCalledWith({
            userId: "test-user-id",
            language: "en",
            brandId: "test-brand-id",
         });
         expect(mastraGetAgentMock).toHaveBeenCalledWith("appAssistantAgent");
         expect(agentInstance.stream).toHaveBeenCalledWith(
            [{ role: "user", content: "Hello" }],
            { runtimeContext: "assistant-context", format: "aisdk" },
         );
      });

      it("returns 500 when language header is missing", async () => {
         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/assistant?message=Hello", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Language header is required");
      });

      it("returns 500 when member fetch fails", async () => {
         findMemberByUserIdMock.mockRejectedValue(
            new Error("Member not found"),
         );

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/assistant?message=Hello", {
               "sdk-api-key": "test-api-key",
               "x-locale": "en",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Member not found");
      });

      it("returns 500 when member has no organization", async () => {
         const member = buildMember({
            userId: "test-user-id",
            organizationId: undefined,
         });
         findMemberByUserIdMock.mockResolvedValue(member);

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/assistant?message=Hello", {
               "sdk-api-key": "test-api-key",
               "x-locale": "en",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Organization not found for user");
      });

      it("returns 500 when brand lookup fails", async () => {
         const member = buildMember({
            userId: "test-user-id",
            organizationId: "test-org-id",
         });
         findMemberByUserIdMock.mockResolvedValue(member);
         getBrandByOrgIdMock.mockRejectedValue(new Error("Brand not found"));

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/assistant?message=Hello", {
               "sdk-api-key": "test-api-key",
               "x-locale": "en",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Brand not found");
      });

      it("returns 500 when streaming fails", async () => {
         const member = buildMember({
            userId: "test-user-id",
            organizationId: "test-org-id",
         });
         findMemberByUserIdMock.mockResolvedValue(member);
         getBrandByOrgIdMock.mockResolvedValue(
            buildBrand({ organizationId: "test-org-id" }),
         );
         agentInstance.stream.mockRejectedValue(new Error("Stream error"));

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/assistant?message=Hello", {
               "sdk-api-key": "test-api-key",
               "x-locale": "en",
            }),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Internal Server Error");
      });
   });

   describe("GET /sdk/content/:agentId", () => {
      it("returns paginated content with images", async () => {
         const contents: ContentListRecord = [
            buildContentListItem({
               id: "1",
               imageUrl: "image1.jpg",
               meta: { title: "Content 1", slug: "content-1" },
            }),
            buildContentListItem({
               id: "2",
               imageUrl: null,
               meta: { title: "Content 2", slug: "content-2" },
            }),
         ];
         listContentsMock.mockResolvedValue(contents);

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id?limit=10&page=1&status=draft",
               { "sdk-api-key": "test-api-key" },
            ),
         );
         const body = await parseJson(response, assertContentListResponse);

         expect(response.status).toBe(200);
         expect(body.total).toBe(2);
         expect(body.posts).toHaveLength(2);
         const [firstPost, secondPost] = body.posts;
         if (!firstPost || !secondPost) {
            throw new Error("Expected two posts in content list response");
         }
         expect(firstPost.meta).toMatchObject({ title: "Content 1" });
         expect(firstPost.image).toEqual({
            data: defaultImageBase64,
            contentType: "image/jpeg",
         });
         expect(secondPost.image).toBeNull();
         expect(listContentsMock).toHaveBeenCalledWith(
            mockDb,
            ["test-agent-id"],
            ["draft"],
         );
      });

      it("uses default pagination parameters", async () => {
         const emptyContents: ContentListRecord = [];
         listContentsMock.mockResolvedValue(emptyContents);

         await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id?status=draft",
               {
                  "sdk-api-key": "test-api-key",
               },
            ),
         );

         expect(listContentsMock).toHaveBeenCalledWith(
            mockDb,
            ["test-agent-id"],
            ["draft"],
         );
      });

      it("omits image when retrieval fails", async () => {
         const contentsWithImageError: ContentListRecord = [
            buildContentListItem({
               id: "1",
               imageUrl: "image-error.jpg",
               meta: { title: "Content" },
            }),
         ];
         listContentsMock.mockResolvedValue(contentsWithImageError);
         streamFileForProxyMock.mockRejectedValue(new Error("Image error"));

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id?status=draft",
               { "sdk-api-key": "test-api-key" },
            ),
         );
         const body = await parseJson(response, assertContentListResponse);

         expect(response.status).toBe(200);
         const [post] = body.posts;
         if (!post) {
            throw new Error("Expected a post in content list response");
         }
         expect(post.image).toBeNull();
      });

      it("returns 500 when list contents fails", async () => {
         listContentsMock.mockRejectedValue(new Error("Database error"));

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id?status=draft",
               { "sdk-api-key": "test-api-key" },
            ),
         );

         expect(response.status).toBe(500);
      });
   });

   describe("GET /sdk/content/:agentId/:slug", () => {
      it("returns content with image", async () => {
         const content = buildContent({
            id: "content-1",
            agentId: "test-agent-id",
            imageUrl: "content-image.jpg",
            meta: { title: "Test Content", slug: "test-slug" },
         });
         getContentBySlugMock.mockResolvedValue(content);

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id/test-slug",
               {
                  "sdk-api-key": "test-api-key",
               },
            ),
         );
         const body = await parseJson(response, assertContentDetailResponse);

         expect(response.status).toBe(200);
         expect(body?.meta?.slug).toBe("test-slug");
         expect(body.image).toEqual({
            data: defaultImageBase64,
            contentType: "image/jpeg",
         });
         expect(getContentBySlugMock).toHaveBeenCalledWith(
            mockDb,
            "test-slug",
            "test-agent-id",
         );
      });

      it("returns 500 when content is not found", async () => {
         getContentBySlugMock.mockRejectedValue(new Error("Content not found"));

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id/missing",
               { "sdk-api-key": "test-api-key" },
            ),
         );

         expect(response.status).toBe(500);
         const text = await response.text();
         expect(text).toContain("Content not found");
      });

      it("omits image when none exists", async () => {
         const content = buildContent({
            id: "content-1",
            agentId: "test-agent-id",
            imageUrl: null,
            meta: { slug: "test-slug" },
         });
         getContentBySlugMock.mockResolvedValue(content);

         const response = await sdkRoutes.handle(
            createRequest(
               "http://localhost/sdk/content/test-agent-id/test-slug",
               {
                  "sdk-api-key": "test-api-key",
               },
            ),
         );
         const body = await parseJson(response, assertContentDetailResponse);

         expect(response.status).toBe(200);
         expect(body.image).toBeNull();
         expect(streamFileForProxyMock).not.toHaveBeenCalled();
      });
   });

   describe("GET /sdk/content/image/:contentId", () => {
      it("returns image data", async () => {
         const content = buildContent({
            id: "content-1",
            imageUrl: "content-image.jpg",
         });
         getContentByIdMock.mockResolvedValue(content);

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/content/image/content-1", {
               "sdk-api-key": "test-api-key",
            }),
         );
         const body = await parseJson(response, assertImageResponse);

         expect(response.status).toBe(200);
         expect(body).toEqual({
            data: defaultImageBase64,
            contentType: "image/jpeg",
         });
      });

      it("returns empty body when content has no image", async () => {
         const content = buildContent({
            id: "content-1",
            imageUrl: null,
         });
         getContentByIdMock.mockResolvedValue(content);

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/content/image/content-1", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(200);
         const text = await response.text();
         expect(text).toBe("");
         expect(streamFileForProxyMock).not.toHaveBeenCalled();
      });

      it("returns empty body when content lookup fails", async () => {
         getContentByIdMock.mockRejectedValue(new Error("Content not found"));

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/content/image/missing", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(200);
         const text = await response.text();
         expect(text).toBe("");
      });

      it("returns empty body when image retrieval fails", async () => {
         const content = buildContent({
            id: "content-1",
            imageUrl: "image-error.jpg",
         });
         getContentByIdMock.mockResolvedValue(content);
         streamFileForProxyMock.mockRejectedValue(new Error("Image error"));

         const response = await sdkRoutes.handle(
            createRequest("http://localhost/sdk/content/image/content-1", {
               "sdk-api-key": "test-api-key",
            }),
         );

         expect(response.status).toBe(200);
         const text = await response.text();
         expect(text).toBe("");
      });
   });
});
