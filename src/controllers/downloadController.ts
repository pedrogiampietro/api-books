import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { Request, Response } from "express";
import { fetchBookDownloadLinks } from "../services/scraperService";

export const downloadBook = async (req: Request, res: Response) => {
  const { md5 } = req.params;

  try {
    // Busca os links de download usando o MD5
    const downloadLinks = await fetchBookDownloadLinks(md5);

    if (!downloadLinks || downloadLinks.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhum link de download disponível." });
    }

    // Usamos o primeiro link de download automaticamente
    const downloadUrl = downloadLinks[0];

    // Diretório temporário para armazenar o livro
    const tempDir = path.join(__dirname, "../temp");
    await fs.ensureDir(tempDir); // Cria o diretório se não existir

    // Caminho do arquivo que será salvo com base no MD5
    const filePath = path.join(tempDir, `${md5}.epub`);

    // Faz o download do arquivo
    const response = await axios.get(downloadUrl, { responseType: "stream" });

    // Cria um write stream para salvar o arquivo
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      res.status(200).json({ message: "Download concluído", filePath });
    });

    writer.on("error", (err) => {
      console.error("Erro ao escrever o arquivo:", err);
      res.status(500).json({ error: "Falha ao salvar o arquivo" });
    });
  } catch (error) {
    console.error("Erro ao baixar o livro:", error);
    res.status(500).json({ error: "Erro ao baixar o livro" });
  }
};
