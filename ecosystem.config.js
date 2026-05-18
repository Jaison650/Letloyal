module.exports = {
  apps: [{
    name: 'letloyal',
    script: '.next/standalone/server.js',
    cwd: '/home/user/letloyal',
    env_production: {
      PORT: 3000,
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
    },
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/user/letloyal/logs/err.log',
    out_file: '/home/user/letloyal/logs/out.log',
  }],
};
