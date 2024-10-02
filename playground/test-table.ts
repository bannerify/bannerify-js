import { createClient } from "../src"

const client = createClient(process.env.API_KEY!, {})

try {
  const result = await client.generateImageSignedUrl("tpl:vV4WCRrkl0", {
    nocache: true,
    modifications: [
      {
        name: "Table",
        rows:[
          {
            "Order ID": "CA-2018-156720",
            "Customer ID": "JM-15580",
            "Product Name": "Bagged Rubber Bands",
            "Sales": "3.123",
            "Profit": "-0.605"
          },
          {
            "Order ID": "CA-2018-115427",
            "Customer ID": "EB-13975",
            "Product Name": "GBC Binding covers",
            "Sales": "20.72",
            "Profit": "6.475"
          },
          {
            "Order ID": "CA-2018-115427",
            "Customer ID": "EB-13975",
            "Product Name": "GBC Binding covers",
            "Sales": "20.72",
            "Profit": "6.475"
          },{
            "Order ID": "CA-2018-115427",
            "Customer ID": "EB-13975",
            "Product Name": "GBC Binding covers",
            "Sales": "20.72",
            "Profit": "6.475"
          },{
            "Order ID": "My new id 1234",
            "Customer ID": "EB-13975",
            "Product Name": "GBC Binding covers",
            "Sales": "20.72",
            "Profit": "6.475"
          },
        ],
      },
    ],
  })
  console.log(result)
} catch (e: any) {
  console.log(e.message)
}
