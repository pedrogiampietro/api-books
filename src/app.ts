import express from "express";
import cors from "cors";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

const app = express();

// Configuração do CORS
app.use(
  cors({
    origin: ["http://localhost:1420", "http://127.0.0.1:1420"], // Origens permitidas
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Headers permitidos
    credentials: true, // Permite credenciais
  })
);

app.use(express.json());

app.use("/api", routes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("Annas Archive Scraper API");
});

export default app;
