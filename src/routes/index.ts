import { Router } from "express";
import { getSearchResults } from "../controllers/searchController";
import { getDetailContent } from "../controllers/detailController";
import { downloadBookWithPuppeteer } from "../controllers/downloadController";

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: "Retorna a lista de pesquisa"
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: "Termo de pesquisa"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Número da página"
 *       - in: query
 *         name: ext
 *         schema:
 *           type: string
 *         required: false
 *         description: "Extensão do arquivo (ex: epub)"
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         required: false
 *         description: "Idioma (ex: pt)"
 *     responses:
 *       200:
 *         description: "Lista de resultados da pesquisa"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   md5:
 *                     type: string
 *                   description:
 *                     type: string
 *                   publisher:
 *                     type: string
 *                   year:
 *                     type: string
 *                   author:
 *                     type: string
 *                   coverImage:
 *                     type: string
 *       400:
 *         description: "Parâmetros inválidos"
 *       500:
 *         description: "Erro interno do servidor"
 */
router.get("/search", getSearchResults);

/**
 * @swagger
 * /api/detail/{md5}:
 *   get:
 *     summary: "Retorna o conteúdo detalhado baseado no MD5"
 *     parameters:
 *       - in: path
 *         name: md5
 *         schema:
 *           type: string
 *         required: true
 *         description: "MD5 do conteúdo"
 *     responses:
 *       200:
 *         description: "Detalhes do conteúdo"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 downloadLinks:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: "Parâmetros inválidos"
 *       500:
 *         description: "Erro interno do servidor"
 */
router.get("/detail/:md5", getDetailContent);

/**
 * @swagger
 * /api/download:
 *   post:
 *     summary: "Baixa o livro usando a URL fornecida"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               downloadUrl:
 *                 type: string
 *                 description: "URL completa para download do livro"
 *                 example: "https://annas-archive.org/slow_download/c010b74b59dc528e86fdd1882b1e98cc/0/0"
 *             required:
 *               - downloadUrl
 *     responses:
 *       200:
 *         description: "Livro baixado com sucesso"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Download concluído com sucesso"
 *                 filePath:
 *                   type: string
 *                   example: "/path/to/downloaded/file.epub"
 *       400:
 *         description: "URL inválida ou não suportada"
 *       500:
 *         description: "Erro ao baixar o livro"
 */
router.post("/download", downloadBookWithPuppeteer);

export default router;
