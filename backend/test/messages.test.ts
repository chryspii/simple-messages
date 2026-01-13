import { expect } from "chai";
import request from "supertest";
import { createApp } from "../src/index.js";

describe("Messages API", function () {
  let app: any;
  let createdId: string;

  before(async () => {
    app = await createApp();
  });

  it("POST /messages → create message", async () => {
    const res = await request(app)
      .post("/messages")
      .send({
        name: "Vicky",
        subject: "Test",
        message: "Hello"
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("_id");

    createdId = res.body._id;
  });

  it("GET /messages → list messages", async () => {
    const res = await request(app).get("/messages");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body[0]).to.have.property("status");
  });

  it("DELETE /messages/:id → delete message", async () => {
    const res = await request(app).delete(`/messages/${createdId}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it("GET /dlq → get failed messages", async () => {
    const res = await request(app).get("/dlq");
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
  });
});
