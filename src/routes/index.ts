import { Router } from "express";
import { getSearchResults } from "../controllers/searchController";
import { getDetailContent } from "../controllers/detailController";
import { downloadBook } from "../controllers/downloadController";

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
 * /api/download/{md5}:
 *   post:
 *     summary: "Baixa o livro baseado no MD5 automaticamente usando o primeiro link de download"
 *     parameters:
 *       - in: path
 *         name: md5
 *         schema:
 *           type: string
 *         required: true
 *         description: "MD5 do conteúdo"
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
 *                 filePath:
 *                   type: string
 *       400:
 *         description: "Parâmetros inválidos"
 *       500:
 *         description: "Erro ao baixar o livro"
 */
router.post("/download/:md5", downloadBook);

export default router;
