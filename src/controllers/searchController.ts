import { Request, Response } from "express";
import { fetchSearchResults } from "../services/scraperService";

/**
 * Controlador para obter resultados de pesquisa
 */
export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const { q, page = "1", ext = "epub", lang = "pt" } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ message: 'Parâmetro de pesquisa "q" é obrigatório.' });
    }

    const results = await fetchSearchResults(
      q as string,
      Number(page),
      ext as string,
      lang as string
    );
    res.json(results);
  } catch (error) {
    console.error("Erro ao obter resultados de pesquisa:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};
