import { Request, Response } from "express";
import { fetchBookDownloadLinks } from "../services/scraperService";

/**
 * Controlador para obter conteúdo detalhado baseado no MD5
 */
export const getDetailContent = async (req: Request, res: Response) => {
  try {
    const { md5 } = req.params;

    if (!md5) {
      return res
        .status(400)
        .json({ message: 'Parâmetro "md5" é obrigatório.' });
    }

    const content = await fetchBookDownloadLinks(md5);
    res.json(content);
  } catch (error) {
    console.error("Erro ao obter conteúdo detalhado:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};
