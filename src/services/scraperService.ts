import axios from "axios";
import { load } from "cheerio";
import { SearchResult } from "../types"; // Certifique-se de que suas interfaces estão corretas

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
        : undefined;
      const details = anchor.find("div.text-gray-500").text().trim();
      const publisher = anchor.find("div.truncate").text().trim();

      if (title && href) {
        books.push({
          title,
          author: author || "Desconhecido",
          link: `${BASE_URL}${href}`,
          coverImage: coverImage || null,
          details: details || "Sem detalhes",
          publisher: publisher || "Desconhecido",
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

export const fetchBookDownloadLinks = async (
  md5: string
): Promise<string[]> => {
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
    const downloadLinks: string[] = [];

    $("#md5-panel-downloads")
      .find("h3:contains('Slow downloads')")
      .nextAll("ul")
      .first()
      .find("li")
      .each((_, element) => {
        const text = $(element).text();
        const link = $(element).find("a").attr("href");

        if (text.includes("no waitlist, but can be very slow") && link) {
          downloadLinks.push(`${BASE_URL}${link}`);
        }
      });

    console.log(`Links de download encontrados: ${downloadLinks.length}`);
    return downloadLinks;
  } catch (error) {
    console.error("Erro ao buscar os links de download:", error);
    throw new Error("Falha ao buscar links de download");
  }
};
