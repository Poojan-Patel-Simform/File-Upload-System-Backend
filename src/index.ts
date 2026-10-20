import dotenv from "dotenv";
// Load env vars before anything else reads them
dotenv.config();
import app from "./app.js";

const PORT = process.env.PORT || 8000;

// start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// handle unhandled promise rejections
process.on("unhandledRejection", () => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});
