import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../prisma/testClient";

let userId: string;
beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Alice", email: "alice@test.com", password: "ferdian123" },
  });
  userId = user.id;
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

describe("CREATE user", () => {
  it("should create a new user", async () => {
    const newUser = {
      name: "Richard",
      email: "richard@gmail.com",
      password: "richard123",
      role: "CUSTOMER",
    };

    const res = await request(app).post("/api/v1/create-users").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(true);
    expect(res.body.status_code).toBe(201);
    expect(res.body.data.email).toBe(newUser.email);
    userId = res.body.data.id;
  });
});

describe("GET user by id", () => {
  it("should get a user by id", async () => {
    const res = await request(app).get(`/api/v1/get-user/${userId}`);

    expect(res.body.status).toBe(true);
    expect(res.body.status_code).toBe(200);
    expect(res.body.data).toHaveProperty("id", userId);
  });

  it("should return 404 if user no found", async () => {
    const fakeId = "aaaaaaaa-bbbbbbbbbbbb-ccc-dddd-eeeeeee";

    const res = await request(app).get(`/api/v1/get-user/${fakeId}`);

    expect(res.body.status_code).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("User not found");
  });
});

describe("UPDATE user by id", () => {
  it("should update a user by id", async () => {
    const updateUser = {
      name: "Richard Lee",
      email: "richard@gmail.com",
      password: "richard123",
      role: "CUSTOMER",
    };

    const res = await request(app)
      .put(`/api/v1/update-user/${userId}`)
      .send(updateUser);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.status_code).toBe(200);

    expect(res.body.data).toHaveProperty("id", userId);
    expect(res.body.data).toHaveProperty("name", "Richard Lee");
    expect(res.body.data).toHaveProperty("email", "richard@gmail.com");
  });

  it("should return 404 if user not found", async () => {
    const fakeId = "aaaaaaaa-bbbbbbbbbbbb-ccc-dddd-eeeeeee";

    const updateUser = {
      name: "Not Found User",
      email: "notfound@test.com",
      password: "nothing123",
      role: "USER",
    };

    const res = await request(app)
      .put(`/api/v1/update-user/${fakeId}`)
      .send(updateUser);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.status_code).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});

describe("DELETE user by id", () => {
  it("should delete a user by id", async () => {
    const res = await request(app).delete(`/api/v1/delete-user/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.status_code).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("should return 404 if user not found", async () => {
    const fakeId = "aaaaaaaa-bbbbbbbbbbbb-ccc-dddd-eeeeeee";

    const res = await request(app).delete(`/api/v1/delete-user/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe(false);
    expect(res.body.status_code).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
