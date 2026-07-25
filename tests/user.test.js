import dotenv from "dotenv";
dotenv.config();
import request from "supertest";
import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";
import mongoose from "mongoose";

beforeAll(async () => {
    await connectDB();
}); 

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Auth endpoints", () => {
    it("should update the authenticated user's email", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;
        const newEmail = `updated${Date.now()}@test.com`;
        const res = await request(app)
            .patch("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({ email: newEmail });
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe(newEmail);
    }, 15000);
    it("should update the authenticated user's password", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;
        const newPassword = "Password2";
        const res = await request(app)
            .patch("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({ password: newPassword });
        expect(res.statusCode).toBe(200);
        // Login with the new password should work
        const loginRes2 = await request(app)
            .post("/api/login")
            .send({ email, password: newPassword });
        expect(loginRes2.statusCode).toBe(200);
        expect(loginRes2.body.token).toBeDefined();
    }, 15000);
    it("should reject update without a token", async () => {
        const res = await request(app)
            .patch("/api/profile")
            .send({ email: "other@test.com" });
        expect(res.statusCode).toBe(401);
    }, 15000);
    it("should reject invalid email or short password", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;
        // Invalid email
        const res1 = await request(app)
            .patch("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({ email: "notanemail" });
        expect(res1.statusCode).toBe(400);
        // Short password
        const res2 = await request(app)
            .patch("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({ password: "123" });
        expect(res2.statusCode).toBe(400);
    }, 15000);
    it("should reject when no valid field is sent", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;
        const res = await request(app)
            .patch("/api/profile")
            .set("Authorization", `Bearer ${token}`)
            .send({ other: "value" });
        expect(res.statusCode).toBe(400);
    }, 15000);
    // User registration
    it("should register a user", async () => {
        const uniqueEmail = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        const res = await request(app)
            .post("/api/register")
            .send({ email: uniqueEmail, password });
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("User registered successfully.");
    }, 15000); // <-- 15 seconds timeout
    it("should log in a user and return a token", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        // Tests registration
        await request(app)
            .post("/api/register")
            .send({ email, password });
        // Now we test login
        const res = await request(app)
            .post("/api/login")
            .send({ email, password });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
    }, 15000); // <-- 15 seconds timeout
    it("should not allow registering a user with an existing email", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        // Registers a user
        await request(app)
            .post("/api/register")
            .send({ email, password });
        // Attempts to register the same user
        const res = await request(app)
            .post("/api/register")
            .send({ email, password });
        expect(res.statusCode).toBe(409);
        expect(res.body.message).toMatch(/user already exists/i);
    }, 15000);
    it("should not allow login with an incorrect password", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        // First registers the user
        await request(app)
            .post("/api/register")
            .send({ email, password });
        // Now attempts to log in with the wrong password
        const res = await request(app)
            .post("/api/login")
            .send({ email, password: "wrongPassword" });
        expect([400, 401]).toContain(res.statusCode);
        expect(res.body.message).toMatch(/incorrect user or password/i);
    }, 15000);
    it("should not allow creating a task without a token", async () => {
        const res = await request(app)
            .post("/api/tasks")
            .send({
                title: "Task without token",
                description: "Should not be created"
            });
        expect([401, 403]).toContain(res.statusCode);
        expect(res.body.message).toMatch(/token|authorization/i);
    }, 15000);
    it("should not allow getting tasks with an invalid token", async () => {
        const res = await request(app)
            .get("/api/tasks")
            .set("Authorization", "Bearer invalid_token");
        expect([401, 403]).toContain(res.statusCode);
        expect(res.body.message).toMatch(/token|authorization/i);
    }, 15000);
    it("should delete the authenticated user and all their tasks", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        // Register and log in the user
        await request(app).post("/api/register").send({ email, password });
        const loginRes = await request(app).post("/api/login").send({ email, password });
        const token = loginRes.body.token;
        // Create tasks
        const task1 = await request(app).post("/api/tasks").set("Authorization", `Bearer ${token}`).send({ title: "Task 1" });
        const task2 = await request(app).post("/api/tasks").set("Authorization", `Bearer ${token}`).send({ title: "Task 2" });
        // Delete the user
        const delRes = await request(app).delete("/api/profile").set("Authorization", `Bearer ${token}`);
        expect(delRes.statusCode).toBe(200);
        expect(delRes.body.message).toMatch(/deleted/i);
        // Attempting to log in again should fail
        const loginRes2 = await request(app).post("/api/login").send({ email, password });
        expect([400, 401, 404]).toContain(loginRes2.statusCode);
        // Tasks should have been deleted: trying to access by ID should return 404 or 401
        const resTask1 = await request(app).get(`/api/tasks/${task1.body._id}`).set("Authorization", `Bearer ${token}`);
        expect([401, 404]).toContain(resTask1.statusCode);
        // Register another user and verify they cannot access the deleted tasks
        const email2 = `test${Date.now()+1}${Math.floor(Math.random()*10000)}@test.com`;
        const password2 = "Password2";
        await request(app).post("/api/register").send({ email: email2, password: password2 });
        const loginRes3 = await request(app).post("/api/login").send({ email: email2, password: password2 });
        const token2 = loginRes3.body.token;
        // Should not see orphaned tasks
        const tasksRes = await request(app).get("/api/tasks").set("Authorization", `Bearer ${token2}`);
        expect(Array.isArray(tasksRes.body)).toBe(true);
        expect(tasksRes.body.length).toBe(0);
        // Trying to access the task by ID should return 404
        const resTask1Other = await request(app).get(`/api/tasks/${task1.body._id}`).set("Authorization", `Bearer ${token2}`);
        expect(resTask1Other.statusCode).toBe(404);
    }, 15000);
    // i18n: verifies the language is actually switched by the Accept-Language header
    it("should respond with a Spanish message when Accept-Language is es", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });

        const res = await request(app)
            .post("/api/login")
            .set("Accept-Language", "es")
            .send({ email, password: "wrongPassword" });

        expect([400, 401]).toContain(res.statusCode);
        expect(res.body.message).toMatch(/usuario o contraseña incorrectos/i);
    }, 15000);
    it("should respond with an English message by default (no Accept-Language header)", async () => {
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });

        const res = await request(app)
            .post("/api/login")
            .send({ email, password: "wrongPassword" });

        expect([400, 401]).toContain(res.statusCode);
        expect(res.body.message).toMatch(/incorrect user or password/i);
    }, 15000);
});