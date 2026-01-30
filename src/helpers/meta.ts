import ogs from "open-graph-scraper";

export async function fetchMetaData(url: string) {
  const { result } = await ogs({ url });

  if (!result.success) {
    throw new Error("Failed fetch metadata");
  }

  return {
    title: result.ogTitle || result.twitterTitle,
    description: result.ogDescription || result.twitterDescription,
    image: result.ogImage[0].url || "",
    siteName: result.ogSiteName,
  };
}
