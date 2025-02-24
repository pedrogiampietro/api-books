import { Request, Response } from "express";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractMd5FromUrl(url: string): string | null {
  const md5Regex = /[a-f0-9]{32}/i;
  const match = url.match(md5Regex);
  return match ? match[0] : null;
}

export const downloadBookWithPuppeteer = async (
  req: Request,
  res: Response
) => {
  const { downloadUrl } = req.body;

  console.log("Iniciando download...");

  // Criar diretório temp se não existir
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Validar se a URL é válida
    let url: URL;
    try {
      url = new URL(downloadUrl);
    } catch (e) {
      return res.status(400).json({
        message: "URL de download inválida",
        error: "A URL fornecida não é válida",
      });
    }

    // Validar se é uma URL suportada
    if (
      !url.hostname.includes("annas-archive.org") &&
      !url.hostname.includes("z-lib.gs")
    ) {
      return res.status(400).json({
        message: "URL não suportada",
        error: "Apenas URLs do Anna's Archive e Z-Library são suportadas",
      });
    }

    // Extrair MD5 da URL para usar como nome do arquivo
    const md5 = extractMd5FromUrl(downloadUrl);
    if (!md5) {
      return res.status(400).json({
        message: "MD5 não encontrado na URL",
        error: "A URL deve conter um hash MD5 válido",
      });
    }

    // Verifica se o arquivo já existe
    const fileName = `${md5}.epub`;
    const filePath = path.join(tempDir, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`Arquivo já existe: ${filePath}`);
      return res.json({
        message: "Arquivo já existe",
        filePath,
        md5,
        cached: true,
      });
    }

    console.log(`Tentando download da URL: ${downloadUrl}`);
    console.log("URL atual:", url.hostname);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    );

    try {
      await page.goto(downloadUrl, { waitUntil: "networkidle2" });
      await delay(2000);

      // Encontra o link de download baseado no site
      const downloadLink = await page.evaluate(async () => {
        if (window.location.hostname.includes("z-lib.gs")) {
          // Para Z-Library
          const downloadButton = document.querySelector(
            'a[href*="/dl/"]'
          ) as HTMLAnchorElement;

          if (downloadButton) {
            return downloadButton.href;
          }

          // Se não encontrar o link direto, tenta pelo dropdown
          const dropdownButton = document.querySelector(
            ".dlDropdownBtn"
          ) as HTMLButtonElement;

          if (dropdownButton) {
            dropdownButton.click();
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const links = Array.from(
              document.querySelectorAll("a.addDownloadedBook")
            );
            const epubLink = links.find((link) => {
              const extension = link.querySelector(".book-property__extension");
              return extension?.textContent?.toLowerCase() === "epub";
            });

            if (epubLink) {
              const href = epubLink.getAttribute("href");
              return href ? `https://z-lib.gs${href}` : null;
            }
          }
          return null;
        } else if (window.location.hostname.includes("annas-archive.org")) {
          // Para Anna's Archive
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Aguarda mais tempo para o botão aparecer

          // Tenta diferentes seletores para o botão de download
          const downloadSelectors = [
            'a[href*="/slow_download/"]',
            'a[href*="/download/"]',
            'a:contains("Download")',
            'a:contains("📚")',
          ];

          for (const selector of downloadSelectors) {
            const link = document.querySelector(selector) as HTMLAnchorElement;
            if (link && link.href) {
              return link.href;
            }
          }

          // Se não encontrar pelos seletores, procura por texto
          const links = Array.from(document.querySelectorAll("a"));
          const downloadLink = links.find(
            (link) =>
              link.textContent?.includes("📚 Download") ||
              link.textContent?.includes("Download now") ||
              link.textContent?.includes("Slow download") ||
              link.href.includes("/download/") ||
              link.href.includes("/slow_download/")
          );

          return downloadLink?.href || null;
        }
        return null;
      });

      if (!downloadLink) {
        // Captura screenshot para debug
        await page.screenshot({ path: "debug-screenshot.png" });
        throw new Error("Link de download final não encontrado na página");
      }

      console.log("Link de download final encontrado:", downloadLink);

      // Configuração do download
      const downloadWithRetry = async (
        url: string,
        retries = 3,
        timeout = 150000
      ) => {
        while (retries > 0) {
          try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            console.log(
              `Tentando baixar o arquivo... Tentativas restantes: ${retries}`
            );

            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
                Accept: "*/*",
                Referer: downloadUrl,
              },
            });
            clearTimeout(id);

            if (!response.ok) {
              throw new Error(
                `Erro ao baixar o arquivo. Status: ${response.status}`
              );
            }

            const arrayBuffer = await response.arrayBuffer();

            // Salva o arquivo com o nome do MD5
            fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

            return true;
          } catch (error: any) {
            console.log(`Erro ao baixar o arquivo: ${error.message}`);
            // Remove o arquivo parcial em caso de erro
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            retries--;
            if (retries === 0) {
              throw error;
            }
            await delay(5000);
          }
        }
        return false;
      };

      const success = await downloadWithRetry(downloadLink);

      if (!success) {
        throw new Error("Falha ao baixar o arquivo");
      }

      console.log(`Download concluído: ${filePath}`);
      res.json({
        message: "Download concluído com sucesso",
        filePath,
        md5,
        cached: false,
      });
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    // Remove o arquivo em caso de erro
    const md5 = extractMd5FromUrl(downloadUrl);
    if (md5) {
      const filePath = path.join(tempDir, `${md5}.epub`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    console.error("Erro ao baixar arquivo:", error);
    return res.status(500).json({
      message: "Erro ao baixar o arquivo",
      error: error.message,
    });
  }
};
