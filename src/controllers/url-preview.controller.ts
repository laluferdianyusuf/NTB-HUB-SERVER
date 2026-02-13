import ogs from "open-graph-scraper";
import { Request, Response } from "express";

export const getLinkPreview = async (req: Request, res: Response) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ error: "Link required" });
  console.log(link);

  try {
    const { result } = await ogs({ url: link });
    return res.json({
      data: {
        title: result.ogTitle || result.twitterTitle || link,
        description: result.ogDescription || result.twitterDescription || "",
        image: result.ogImage[0]?.url || result.twitterImage[0]?.url || null,
        url: link,
      },
    });
  } catch (err) {
    console.error("OGS error:", err);
    return res.json({
      data: { title: link, description: "", image: null, url: link },
    });
  }
};
