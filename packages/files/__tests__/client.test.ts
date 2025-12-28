import { describe, expect, it } from "bun:test";
import { parseEndpoint } from "../src/client";

describe("client utilities", () => {
   describe("parseEndpoint", () => {
      it("should parse HTTPS URL with default port", () => {
         const result = parseEndpoint("https://minio.example.com");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 443,
            useSSL: true,
         });
      });

      it("should parse HTTP URL with default port", () => {
         const result = parseEndpoint("http://minio.example.com");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 9000,
            useSSL: false,
         });
      });

      it("should parse HTTPS URL with custom port", () => {
         const result = parseEndpoint("https://minio.example.com:9443");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 9443,
            useSSL: true,
         });
      });

      it("should parse HTTP URL with custom port", () => {
         const result = parseEndpoint("http://minio.example.com:9000");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 9000,
            useSSL: false,
         });
      });

      it("should add http protocol when missing", () => {
         const result = parseEndpoint("minio.example.com");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 9000,
            useSSL: false,
         });
      });

      it("should handle hostname without protocol and with port", () => {
         const result = parseEndpoint("minio.example.com:9001");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 9001,
            useSSL: false,
         });
      });

      it("should handle localhost", () => {
         const result = parseEndpoint("localhost");

         expect(result).toEqual({
            endPoint: "localhost",
            port: 9000,
            useSSL: false,
         });
      });

      it("should handle localhost with port", () => {
         const result = parseEndpoint("localhost:9000");

         expect(result).toEqual({
            endPoint: "localhost",
            port: 9000,
            useSSL: false,
         });
      });

      it("should handle IP address", () => {
         const result = parseEndpoint("192.168.1.100");

         expect(result).toEqual({
            endPoint: "192.168.1.100",
            port: 9000,
            useSSL: false,
         });
      });

      it("should handle IP address with port", () => {
         const result = parseEndpoint("192.168.1.100:9001");

         expect(result).toEqual({
            endPoint: "192.168.1.100",
            port: 9001,
            useSSL: false,
         });
      });

      it("should handle HTTPS IP address", () => {
         const result = parseEndpoint("https://192.168.1.100");

         expect(result).toEqual({
            endPoint: "192.168.1.100",
            port: 443,
            useSSL: true,
         });
      });

      it("should return defaults for invalid URL", () => {
         const result = parseEndpoint("");

         expect(result).toEqual({
            endPoint: "localhost",
            port: 9000,
            useSSL: false,
         });
      });

      it("should handle subdomain URLs", () => {
         const result = parseEndpoint("https://storage.api.example.com");

         expect(result).toEqual({
            endPoint: "storage.api.example.com",
            port: 443,
            useSSL: true,
         });
      });

      it("should handle URL with path (ignoring path)", () => {
         const result = parseEndpoint("https://minio.example.com/bucket");

         expect(result).toEqual({
            endPoint: "minio.example.com",
            port: 443,
            useSSL: true,
         });
      });
   });
});
