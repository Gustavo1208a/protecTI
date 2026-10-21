import mysql from 'mysql2/promise';
 
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestaoepis',
  port: Number((process.env.DB_PORT || 3306)),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Colunas DATE voltam como "2028-03-15" (texto), que é o formato que as telas
  // de EPIs e Entrega esperam. Sem isso o driver devolve um objeto Date e a data
  // chega ao navegador como "2028-03-15T03:00:00.000Z".
  dateStrings: ['DATE'],
});
 
export default pool;