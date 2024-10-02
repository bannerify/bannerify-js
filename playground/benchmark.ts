import pMap from "p-map";
import { createClient } from "../src"

const client = createClient(process.env.API_KEY!, {})

const results = await pMap(
  Array.from({ length: 100 }, (_, i) => i),
  async (i) => {
    const result = await client.createImage("tpl:vV4WCRrkl0", {
      nocache: true,
      modifications: [{ name: "Table", rows: [] }],
    })
    console.log(result)
  },
  {
    concurrency: 10,
  }
);
