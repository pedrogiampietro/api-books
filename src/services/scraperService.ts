import axios from "axios";
import { load } from "cheerio";
import { SearchResult } from "../types";

const BASE_URL = "https://annas-archive.org";

export const fetchSearchResults = async (
  query: string,
  page: number,
  ext: string,
  lang: string
): Promise<SearchResult[]> => {
  try {
    const searchUrl = `${BASE_URL}/search?index=&page=${page}&q=${encodeURIComponent(
      query
    )}&ext=${ext}&sort=&lang=${lang}`;
    console.log(`Fazendo requisição para: ${searchUrl}`);

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!data) {
      throw new Error("Nenhum dado retornado pela requisição.");
    }

    const $ = load(data);
    const books: SearchResult[] = [];

    $("a.js-vim-focus").each((_, element) => {
      const anchor = $(element);
      const href = anchor.attr("href");
      const title = anchor.find("h3").text().trim();
      const author = anchor.find("div.italic").text().trim();
      const relativeCoverImage = anchor.find("img").attr("src");
      const coverImage = relativeCoverImage
        ? relativeCoverImage.startsWith("http")
          ? relativeCoverImage
          : `${BASE_URL}${relativeCoverImage}`
        : "";
      const details = anchor.find("div.text-gray-500").text().trim();
      const publisher = anchor.find("div.truncate").text().trim();

      if (title && href) {
        const md5Match = href.match(/\/md5\/([a-f0-9]{32})/);
        const md5 = md5Match ? md5Match[1] : "";

        books.push({
          title,
          author: author || "Desconhecido",
          link: `${BASE_URL}${href}`,
          coverImage,
          details: details || "Sem detalhes",
          publisher: publisher || "Desconhecido",
          md5,
        });
      }
    });

    console.log(`Total de livros encontrados: ${books.length}`);
    return books;
  } catch (error) {
    console.error("Erro ao fazer scraping da pesquisa:", error);
    throw new Error("Falha ao buscar livros");
  }
};

export const getZLibraryDirectDownloadLink = async (
  zlibBookUrl: string
): Promise<string | null> => {
  try {
    console.log(`Buscando link direto do Z-Library: ${zlibBookUrl}`);

    const { data } = await axios.get(zlibBookUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    const $ = load(data);
    const downloadLink = $("a.addDownloadedBook").attr("href");

    if (downloadLink) {
      // O link vem como relativo, então precisamos adicionar o domínio
      return `https://z-lib.gs${downloadLink}`;
    }

    return null;
  } catch (error) {
    console.error("Erro ao obter link direto do Z-Library:", error);
    return null;
  }
};

// Modificar a função fetchBookDownloadLinks para incluir informações sobre a fonte
export interface DownloadLink {
  url: string;
  source: "annasarchive" | "zlibrary";
  type: "direct" | "page";
}

export const fetchBookDownloadLinks = async (
  md5: string
): Promise<DownloadLink[]> => {
  try {
    const bookUrl = `${BASE_URL}/md5/${md5}`;
    console.log(`Fazendo requisição para: ${bookUrl}`);

    const { data } = await axios.get(bookUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/58.0.3029.110 Safari/537.3",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!data) {
      throw new Error("Nenhum dado retornado pela requisição.");
    }

    const $ = load(data);
    const downloadLinks: DownloadLink[] = [];

    // Busca links de download lentos do Anna's Archive
    $("#md5-panel-downloads")
      .find("h3:contains('🐢 Slow downloads')")
      .nextAll("ul")
      .first()
      .find("a[href*='/slow_download/']")
      .each((_, element) => {
        const link = $(element).attr("href");
        if (link) {
          downloadLinks.push({
            url: `${BASE_URL}${link}`,
            source: "annasarchive",
            type: "direct",
          });
        }
      });

    // Busca links do Z-Library
    const zlibDirectLink = $("a[href*='z-lib.gs/md5/']").attr("href");
    const zlibBookLink = $("a[href*='z-lib.gs/book/']").attr("href");

    if (zlibDirectLink) {
      downloadLinks.push({
        url: zlibDirectLink,
        source: "zlibrary",
        type: "direct",
      });
    }
    if (zlibBookLink) {
      downloadLinks.push({
        url: zlibBookLink,
        source: "zlibrary",
        type: "page",
      });
    }

    console.log(`Links de download encontrados: ${downloadLinks.length}`);
    return downloadLinks;
  } catch (error) {
    console.error("Erro ao buscar os links de download:", error);
    throw new Error("Falha ao buscar links de download");
  }
};
