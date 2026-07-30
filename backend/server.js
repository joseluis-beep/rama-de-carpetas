const { error } = require("console");
const { application } = require("express");
const { status } = require("express/lib/response");
const http = require("http");
const mysql = require("mysql2/promise");
const { json } = require("stream/consumers");
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "todo_db",
    waitForConnections: true,
    connectionLimit: 10
});

const server = http.createServer(async (req, res) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

if (req.url === "/tasks" && req.method === "GET") {
    try{
        const [rows] = await pool.query("SELECT * FROM tasks");

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            status: "success", 
            data: { tasks: row }
        }));
    } catch (error) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({ status: "error", message: "error en MySQL: " + error.message}));
        }
    return;
    }

    if (req.url === "/tasks" && req.method === "POST") {
        let body = "";

        req.on("data", chunk => {body += chunk.toString(); });

        req.on("end", async () => {
            try{
                const { title, description, author } = JSON.parse(body);

            if (!title || ! author) {
                res.writeHead(400, {"COntent-Type": "application/json" });
                res.end(JSON.stringify({ status: "error", message: "titulo y autor obligatorios"}));
                return;
                }
                
                const sql = "INSERT INTO tasks (title, description, author, is_completed) values (?, ?, ?, 0)";
                const [result] = await pool.query(sql, [title, description || null, author]);
                const newTask = {
                    id: result.insertId,
                    title,
                    description: description || null,
                    author,
                    is_completed: 0
                };
                res.writeHead(201, { "Content-Type": "application/json"});
                res.end(JSON.stringify({ status: "success", data: {tasks: newTask}}));
            } catch (error) {
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({ status: "error", message: "falto al insertar: " + error.message}));
            }
        });
        return;
    }

    if(req.url.startsWith("/tasks/") && req.method === "PUT") {
        const urlParts = req.url.split("/");
        const taskId = parseInt(urlParts[2]);

        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            try {
                const { title, description, is_completed, author } = JSON.parse(body);

                const [rows] = await pool.query("SELECT author FROM tasks WHERE id = ?", [taskId]);

                if (rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json"});
                    res.end(JSON.stringify({ status: "error", message: "la tarea no existe" }));
                    return;
                }

                if (rows[0].author !== author) {
                    res.writeHead(403, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({ status: "error", message: `no autorizado. la tarea le pertenece a ${task.author}` }));
                    return;
                }
                res.writeHead(404, )
            }  
        }
        )
    }

}


)
