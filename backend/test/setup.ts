import mongoose from "mongoose";

before(async () => {
  console.log("Starting integration tests");
});

after(async () => {
  await mongoose.connection.close();
});
