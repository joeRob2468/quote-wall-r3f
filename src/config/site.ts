export type Siteconfig = typeof siteConfig;

export const siteConfig = {
  name: "Quote Wall",
  description: "It's a wall of quotes.",
  links: {
    github: "https://github.com/joeRob2468",
  },
};
// Search param holding the id of the quote on screen, e.g. /?q=<id>
export const QUOTE_PARAM = "q";
