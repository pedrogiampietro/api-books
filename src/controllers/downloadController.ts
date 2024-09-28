import { connect } from "puppeteer-real-browser";
import fs from "fs-extra";
import path from "path";
import fetch from "node-fetch";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const downloadBookWithPuppeteer = async (downloadOptionsUrl: string) => {
  console.log("Iniciando download...");

  const urlParts = downloadOptionsUrl.split("/");
  const fileHash = urlParts[4];

  const downloadPageUrl = `https://annas-archive.org/slow_download/${fileHash}`;
  console.log(`Navegando para a página: ${downloadPageUrl}`);

  const { browser, page } = await connect({
    headless: false,
    args: ["--start-maximized"],
    turnstile: true,
    disableXvfb: false,
    customConfig: {},
    connectOption: {
      defaultViewport: null,
    },
    plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
  });

  try {
    await page.goto(downloadPageUrl, { waitUntil: "networkidle2" });

    console.log("Esperando o desafio do Cloudflare ser resolvido...");

    let maxRetries = 10;
    let downloadLinkFound = false;
    let downloadLink = "";

    while (maxRetries > 0) {
      try {
        downloadLink = await page.evaluate(() => {
          const downloadElement = document.querySelector(
            "main p a[href*='.epub']"
          );
          return downloadElement ? downloadElement.href : null;
        });

        if (downloadLink) {
          console.log(`Link de download encontrado: ${downloadLink}`);
          downloadLinkFound = true;
          break;
        }
      } catch (error) {
        console.log("Erro ao verificar o link de download:", error.message);
      }

      console.log(
        "Aguardando a resolução completa do desafio... Tentativas restantes:",
        maxRetries
      );
      await delay(3000);
      maxRetries--;
    }

    if (!downloadLinkFound) {
      throw new Error(
        "Não foi possível encontrar o link de download após várias tentativas."
      );
    }

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

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);

          if (!response.ok) {
            throw new Error(
              `Erro ao baixar o arquivo. Status: ${response.status}`
            );
          }

          return await response.arrayBuffer();
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("Download falhou por timeout, tentando novamente...");
          } else {
            console.log(`Erro ao baixar o arquivo: ${error.message}`);
          }
          retries--;
          if (retries === 0) {
            throw new Error(
              `Falha ao baixar o arquivo após múltiplas tentativas.`
            );
          }
        }
        await delay(5000);
      }
    };

    const arrayBuffer = await downloadWithRetry(downloadLink);

    const fileName = `${fileHash}.epub`;
    const filePath = path.join(__dirname, "../temp", fileName);

    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    console.log(`Download concluído: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Erro ao baixar o livro:", error.message);
    throw error;
  } finally {
    console.log("Fechando navegador...");
    await browser.close();
  }
};
