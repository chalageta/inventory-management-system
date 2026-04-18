module.exports = {
  apps: [
    // ================= FRONTEND (Next.js) =================
    {
      name: "frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./frontend",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },

    // ================= BACKEND (Node/Express) =================
    {
      name: "backend",
      script: "server.js", // or app.js / index.js
      cwd: "./backend",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};