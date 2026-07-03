import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests
  let userId: string;
  let hazardReportId: string;
  let sosRequestId: string;

  // ===== User Profile Tests =====
  describe("User Profile", () => {
    test("Upsert user profile with required fields", async () => {
      const res = await api("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "test-user-001",
          name: "John Doe",
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe("test-user-001");
      expect(data.name).toBe("John Doe");
      expect(data.createdAt).toBeDefined();
      userId = data.id;
    });

    test("Upsert user profile with all fields", async () => {
      const res = await api("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "test-user-002",
          name: "Jane Smith",
          phone: "+1234567890",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe("test-user-002");
      expect(data.name).toBe("Jane Smith");
      expect(data.phone).toBe("+1234567890");
      expect(data.latitude).toBe(40.7128);
      expect(data.longitude).toBe(-74.006);
    });

    test("Update existing user profile", async () => {
      const res = await api("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          name: "John Updated",
          phone: "+9876543210",
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(userId);
      expect(data.name).toBe("John Updated");
      expect(data.phone).toBe("+9876543210");
    });

    test("Reject upsert without required id field", async () => {
      const res = await api("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Missing ID",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject upsert without required name field", async () => {
      const res = await api("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "test-user-003",
        }),
      });
      await expectStatus(res, 400);
    });
  });

  // ===== Hazard Reports Tests =====
  describe("Hazard Reports", () => {
    test("Create hazard report with required fields", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Flooding",
          severityLevel: 3,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.userId).toBe(userId);
      expect(data.category).toBe("Flooding");
      expect(data.severityLevel).toBe(3);
      expect(data.latitude).toBe(40.7128);
      expect(data.longitude).toBe(-74.006);
      expect(data.upvotesCount).toBeDefined();
      expect(data.timestamp).toBeDefined();
      hazardReportId = data.id;
    });

    test("Create hazard report with all fields", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Open Pothole",
          severityLevel: 2,
          description: "Large pothole in the road",
          imageUrl: "https://example.com/image.jpg",
          latitude: 40.758,
          longitude: -73.9855,
        }),
      });
      await expectStatus(res, 201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.description).toBe("Large pothole in the road");
      expect(data.imageUrl).toBe("https://example.com/image.jpg");
    });

    test("Create hazard report with different categories", async () => {
      const categories = ["Power Grid Down", "Fallen Tree"];
      for (const category of categories) {
        const res = await api("/api/hazard-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            category: category,
            severityLevel: 4,
            latitude: 40.7128,
            longitude: -74.006,
          }),
        });
        await expectStatus(res, 201);
        const data = await res.json();
        expect(data.category).toBe(category);
      }
    });

    test("List all hazard reports", async () => {
      const res = await api("/api/hazard-reports", {
        method: "GET",
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.reports).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(data.reports.length).toBeGreaterThan(0);
    });

    test("List hazard reports with geolocation filter", async () => {
      const res = await api("/api/hazard-reports?lat=40.7128&lng=-74.006&radius_km=10", {
        method: "GET",
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.reports).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
    });

    test("List hazard reports with only latitude parameter", async () => {
      const res = await api("/api/hazard-reports?lat=40.7128", {
        method: "GET",
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.reports).toBeDefined();
    });

    test("Reject hazard report without required userId", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Flooding",
          severityLevel: 3,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report without required category", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          severityLevel: 3,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report without required severityLevel", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Flooding",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report without required latitude", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Flooding",
          severityLevel: 3,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report without required longitude", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Flooding",
          severityLevel: 3,
          latitude: 40.7128,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report with invalid category", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Invalid Category",
          severityLevel: 3,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report with severity level below minimum", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Flooding",
          severityLevel: 0,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject hazard report with severity level above maximum", async () => {
      const res = await api("/api/hazard-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          category: "Flooding",
          severityLevel: 6,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });
      await expectStatus(res, 400);
    });
  });

  // ===== Hazard Report Upvote Tests =====
  describe("Hazard Report Upvote", () => {
    test("Upvote a hazard report", async () => {
      const res = await api(`/api/hazard-reports/${hazardReportId}/upvote`, {
        method: "POST",
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(hazardReportId);
      expect(data.upvotesCount).toBeGreaterThan(0);
    });

    test("Upvote a hazard report multiple times", async () => {
      const res1 = await api(`/api/hazard-reports/${hazardReportId}/upvote`, {
        method: "POST",
      });
      await expectStatus(res1, 200);
      const data1 = await res1.json();
      const firstCount = data1.upvotesCount;

      const res2 = await api(`/api/hazard-reports/${hazardReportId}/upvote`, {
        method: "POST",
      });
      await expectStatus(res2, 200);
      const data2 = await res2.json();
      expect(data2.upvotesCount).toBeGreaterThanOrEqual(firstCount);
    });

    test("Upvote with invalid report id returns 404", async () => {
      const res = await api(`/api/hazard-reports/invalid-id-12345/upvote`, {
        method: "POST",
      });
      await expectStatus(res, 404);
    });
  });

  // ===== SOS Requests Tests =====
  describe("SOS Requests", () => {
    test("Create SOS request", async () => {
      const res = await api("/api/sos-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          requestType: "Medical Emergency",
          message: "Need urgent medical assistance",
        }),
      });
      await expectStatus(res, 201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.userId).toBe(userId);
      expect(data.requestType).toBe("Medical Emergency");
      expect(data.message).toBe("Need urgent medical assistance");
      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
      sosRequestId = data.id;
    });

    test("Create SOS request with different request types", async () => {
      const types = ["Fire Emergency", "Police", "Rescue"];
      for (const type of types) {
        const res = await api("/api/sos-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            requestType: type,
            message: `Request for ${type}`,
          }),
        });
        await expectStatus(res, 201);
        const data = await res.json();
        expect(data.requestType).toBe(type);
      }
    });

    test("List all SOS requests", async () => {
      const res = await api("/api/sos-requests", {
        method: "GET",
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.requests).toBeDefined();
      expect(Array.isArray(data.requests)).toBe(true);
      expect(data.requests.length).toBeGreaterThan(0);
    });

    test("Reject SOS request without required userId", async () => {
      const res = await api("/api/sos-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "Medical Emergency",
          message: "Help needed",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject SOS request without required requestType", async () => {
      const res = await api("/api/sos-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          message: "Help needed",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject SOS request without required message", async () => {
      const res = await api("/api/sos-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          requestType: "Medical Emergency",
        }),
      });
      await expectStatus(res, 400);
    });
  });

  // ===== SOS Request Resolution Tests =====
  describe("SOS Request Resolution", () => {
    test("Resolve an SOS request", async () => {
      const res = await api(`/api/sos-requests/${sosRequestId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(sosRequestId);
      expect(data.userId).toBe(userId);
      expect(data.status).toBe("Resolved");
    });

    test("Resolve already resolved SOS request", async () => {
      // Try to resolve the same request again
      const res = await api(`/api/sos-requests/${sosRequestId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      // Server should handle this gracefully (200 or 400)
      await expectStatus(res, 200, 400);
    });

    test("Resolve with invalid SOS request id returns 404", async () => {
      const res = await api(`/api/sos-requests/invalid-id-12345/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      await expectStatus(res, 404);
    });

    test("Create and resolve a new SOS request", async () => {
      // Create a new request
      const createRes = await api("/api/sos-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          requestType: "Fire",
          message: "House fire",
        }),
      });
      await expectStatus(createRes, 201);
      const createData = await createRes.json();
      const newSosId = createData.id;

      // Resolve the new request
      const resolveRes = await api(`/api/sos-requests/${newSosId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      await expectStatus(resolveRes, 200);
      const resolveData = await resolveRes.json();
      expect(resolveData.status).toBe("Resolved");
    });
  });
});
