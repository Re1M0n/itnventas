module.exports = {
  client: 'mariadb',
  connection: {
    host: process.env.MARIA_HOST || 'localhost',
    port: process.env.MARIA_PORT || 3306,
    user: process.env.MARIA_USER || 'root',
    password: process.env.MARIA_PASSWORD || '',
    database: process.env.MARIA_DATABASE || 'ventas'
  },
  migrations: {
    directory: './migrations'
  }
};
