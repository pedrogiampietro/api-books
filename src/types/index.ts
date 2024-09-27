export interface SearchResult {
  title: string;
  md5: string;
  description: string;
  publisher: string;
  year: string;
  author: string;
  coverImage: string;
}

export interface DetailContent {
  title: string;
  downloadLinks: string[];
}
