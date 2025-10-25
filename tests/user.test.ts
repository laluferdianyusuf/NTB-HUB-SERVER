import request from "supertest";
import app from "../src/app";
import { prisma } from "../prisma/testClient";

beforeAll(async () => {
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@test.com", password: "ferdian123" },
      { name: "Bob", email: "bob@test.com", password: "bobby12345" },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("User API", () => {
  it("GET /api/v1/users should return list of users", async () => {
    const res = await request(app).get("/api/v1/users");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", true);
    expect(res.body).toHaveProperty("status_code", 200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("email");
    expect(res.body.data[0]).toHaveProperty("role");
  });
});
