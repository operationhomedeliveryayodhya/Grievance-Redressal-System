const postgres = require("postgres");
require("dotenv").config();

const sql = postgres(process.env.DATABASE_URL);

async function testConnection() {
    try {
        const result = await sql`select now()`;

        console.log("Database Connected Successfully");
        console.log(result);
    } catch (error) {
        console.error("Database Connection Failed");
        console.error(error);
    }
}

testConnection();