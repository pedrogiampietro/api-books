import express from "express";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

const app = express();

app.use(express.json());

// Rota da API
app.use("/api", routes);

// Rota do Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota raiz
app.get("/", (req, res) => {
  res.send("Annas Archive Scraper API");
});

export default app;
