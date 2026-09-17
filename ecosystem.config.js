module.exports = {
  apps: [
    {
      name: "dashboard-rcm",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 6060",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 6060
      }
    }
  ]
};
