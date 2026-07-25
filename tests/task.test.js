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

describe("Task endpoints", () => {
    it("should respond 404 or 405 for incorrect HTTP methods", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // POST to /api/tasks/:id (does not exist)
        const resPost = await request(app)
            .post("/api/tasks/123456789012345678901234")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Should not work" });
        expect([404, 405]).toContain(resPost.statusCode);

        // DELETE to /api/tasks (does not exist)
        const resDelete = await request(app)
            .delete("/api/tasks")
            .set("Authorization", `Bearer ${token}`);
        expect([404, 405]).toContain(resDelete.statusCode);
    }, 15000);
    it("should not allow updating forbidden fields (user, _id)", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Creates a task
        const createRes = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Original task" });
        const taskId = createRes.body._id;
        const originalUser = createRes.body.user;

        // Attempts to update user and _id
        const updateRes = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "New title", user: "otherUserId", _id: "otherId" });
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.title).toBe("New title");
        expect(updateRes.body.user).toBe(originalUser); //user must not change
        expect(updateRes.body._id).toBe(taskId); //_id must not change
    }, 15000);
    it("should respond 404 when accessing, updating, or deleting a nonexistent task", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Valid MongoDB ID that does not exist in the database
        const fakeId = "507f1f77bcf86cd799439011";

        // GET nonexistent task
        const resGet = await request(app)
            .get(`/api/tasks/${fakeId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(resGet.statusCode).toBe(404);
        expect(resGet.body.message).toMatch(/not found/i);

        // PUT nonexistent task
        const resPut = await request(app)
            .put(`/api/tasks/${fakeId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Update" });
        expect(resPut.statusCode).toBe(404);
        expect(resPut.body.message).toMatch(/not found/i);

        // DELETE nonexistent task
        const resDel = await request(app)
            .delete(`/api/tasks/${fakeId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(resDel.statusCode).toBe(404);
        expect(resDel.body.message).toMatch(/not found/i);
    }, 15000);
    it("should reject creating a task with invalid title data", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        const invalidTitles = [123, true, null, [], {}, ""];
        for (const invalidTitle of invalidTitles) {
            const res = await request(app)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: invalidTitle });
            expect([400, 422]).toContain(res.statusCode);
            expect(res.body.message).toMatch(/title|required|string/i);
        }
    }, 15000);
    it("should reject creating a task without a title", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Attempts to create a task without a title
        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ description: "No title" });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/title|required/i);
    }, 15000);
    it("should reject access with an invalid token", async () => {
        const invalidToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.InvalidPayload.InvalidSignature";

        // Attempts to create a task with an invalid token
        const resCreate = await request(app)
            .post("/api/tasks")
            .set("Authorization", invalidToken)
            .send({ title: "Invalid token" });
        expect(resCreate.statusCode).toBe(401);
        expect(resCreate.body.message).toMatch(/token/i);

        // Attempts to get tasks with an invalid token
        const resGet = await request(app)
            .get("/api/tasks")
            .set("Authorization", invalidToken);
        expect(resGet.statusCode).toBe(401);
        expect(resGet.body.message).toMatch(/token/i);

        // Attempts to update a task with an invalid token
        const resPut = await request(app)
            .put("/api/tasks/123456789012345678901234")
            .set("Authorization", invalidToken)
            .send({ title: "Update" });
        expect(resPut.statusCode).toBe(401);
        expect(resPut.body.message).toMatch(/token/i);

        // Attempts to delete a task with an invalid token
        const resDel = await request(app)
            .delete("/api/tasks/123456789012345678901234")
            .set("Authorization", invalidToken);
        expect(resDel.statusCode).toBe(401);
        expect(resDel.body.message).toMatch(/token/i);
    }, 15000);
    it("should reject access to tasks without a token", async () => {
        // Attempts to create a task without a token
        const resCreate = await request(app)
            .post("/api/tasks")
            .send({ title: "No token" });
        expect(resCreate.statusCode).toBe(401);
        expect(resCreate.body.message).toMatch(/token/i);

        // Attempts to get tasks without a token
        const resGet = await request(app)
            .get("/api/tasks");
        expect(resGet.statusCode).toBe(401);
        expect(resGet.body.message).toMatch(/token/i);

        // Attempts to update a task without a token (random ID)
        const resPut = await request(app)
            .put("/api/tasks/123456789012345678901234")
            .send({ title: "Update" });
        expect(resPut.statusCode).toBe(401);
        expect(resPut.body.message).toMatch(/token/i);

        // Attempts to delete a task without a token (random ID)
        const resDel = await request(app)
            .delete("/api/tasks/123456789012345678901234");
        expect(resDel.statusCode).toBe(401);
        expect(resDel.body.message).toMatch(/token/i);
    }, 15000);
    it("should create a task for an authenticated user", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Creates a task using the token
        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Test task",
                description: "Task description"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("title", "Test task");
    }, 15000);
    it("should not allow creating two tasks with the same title for the same user", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Creates the first task
        await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Duplicate task" });

        // Attempts to create a second task with the exact same title
        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Duplicate task" });

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toMatch(/task already exists/i);
    }, 15000);
    it("should get the authenticated user's tasks", async () => {
        // Registers and logs in a user
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Creates a task
        await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Test task",
                description: "Task description"
            });

        // Gets the tasks
        const res = await request(app)
            .get("/api/tasks")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(task => task.title === "Test task")).toBe(true);
    }, 15000);
    it ("should update an existing task", async () => {
        //  Registers and logs in a user
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Creates a task
        const createRes = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Original task",
                description: "Original description"
            });
        const taskId = createRes.body._id;

        // Updates the task
        const updateRes = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Updated task",
                description: "Updated description"
            });

        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body).toHaveProperty("title", "Updated task");
    }, 15000);
    it("should delete an existing task", async () => {
        // Registers and logs in a user
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        // Creates a task
        const createRes = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Task to delete",
                description: "Description"
            });
        const taskId = createRes.body._id;

        // Deletes the task
        const deleteRes = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`);

        expect([200, 204]).toContain(deleteRes.statusCode);

        // Attempts to get the deleted task (optional, if you have a GET /api/tasks/:id endpoint)
        const getRes = await request(app)
            .get(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token}`);
        
        expect(getRes.statusCode).toBe(404);
    }, 15000);
    it("should not allow a user to access, update, or delete another user's tasks", async () => {
        // User 1
        const email1 = `user1_${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password1 = "Password1";
        await request(app).post("/api/register").send({ email: email1, password: password1 });
        const loginRes1 = await request(app)
            .post("/api/login")
            .send({ email: email1, password: password1 });
        const token1 = loginRes1.body.token;

        // User 2
        const email2 = `user2_${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password2 = "Password1";
        await request(app).post("/api/register").send({ email: email2, password: password2 });
        const loginRes2 = await request(app)
            .post("/api/login")
            .send({ email: email2, password: password2 });
        const token2 = loginRes2.body.token;

        // User 1 creates a task
        const createRes = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token1}`)
            .send({ title: "Private task" });
        const taskId = createRes.body._id;

        // User 2 attempts to get user 1's task
        const getRes = await request(app)
            .get(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token2}`);
        expect(getRes.statusCode).toBe(404);

        // User 2 attempts to update user 1's task
        const putRes = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token2}`)
            .send({ title: "Hacked" });
        expect(putRes.statusCode).toBe(404);

        // User 2 attempts to delete user 1's task
        const delRes = await request(app)
            .delete(`/api/tasks/${taskId}`)
            .set("Authorization", `Bearer ${token2}`);
        expect(delRes.statusCode).toBe(404);
    }, 15000);
    // i18n: confirms createTask's validation error is translated correctly
    it("should respond with a Spanish message when creating a task without a title (Accept-Language: es)", async () => {
        // Registers and logs in a user to get the token
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
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .set("Accept-Language", "es")
            .send({ title: "" });

        expect([400, 422]).toContain(res.statusCode);
        expect(res.body.message).toMatch(/título|obligatorio/i);
    }, 15000);
    // i18n: confirms getTaskById's "not found" error is translated correctly
    it("should respond with a Spanish message when a task is not found (Accept-Language: es)", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        const fakeId = "507f1f77bcf86cd799439011";
        const res = await request(app)
            .get(`/api/tasks/${fakeId}`)
            .set("Authorization", `Bearer ${token}`)
            .set("Accept-Language", "es");

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/no encontrada/i);
    }, 15000);
    // i18n: confirms the default language (English) is used when no Accept-Language header is sent
    it("should respond with an English message by default when a task is not found", async () => {
        // Registers and logs in a user to get the token
        const email = `test${Date.now()}${Math.floor(Math.random()*10000)}@test.com`;
        const password = "Password1";
        await request(app)
            .post("/api/register")
            .send({ email, password });
        const loginRes = await request(app)
            .post("/api/login")
            .send({ email, password });
        const token = loginRes.body.token;

        const fakeId = "507f1f77bcf86cd799439011";
        const res = await request(app)
            .get(`/api/tasks/${fakeId}`)
            .set("Authorization", `Bearer ${token}`);
            // no Accept-Language header sent on purpose

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toMatch(/not found/i);
    }, 15000);
});