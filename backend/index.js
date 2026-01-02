const app = require("./src/server");

const START_PORT = Number(process.env.PORT || 4000);

function start(port, retries = 5) {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on :${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && retries > 0 && !process.env.RENDER) {
      const nextPort = port + 1;
      console.warn(`Port ${port} in use, trying ${nextPort}...`);
      setTimeout(() => start(nextPort, retries - 1), 200);
    } else {
      console.error("Server failed to start:", err);
      process.exit(1);
    }
  });

  const shutdown = () => {
    console.log("Shutting down...");
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start(START_PORT);
