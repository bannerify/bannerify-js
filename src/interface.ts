import type { ChartData } from "chart.js"
import type { paths } from "./openapi"

export type Modification = NonNullable<paths["/v1/templates/createImage"]["post"]["requestBody"]["content"]["application/json"]["modifications"]>[0] & {
  // layer name
  name: string
  /**
   * color
   * @example #FF0000
   * @default The default color of the layer
   * @description The color for the modification, accept any valid CSS color value, for example: #FF0000, red, rgba(0,0,0,0.5), etc. You can only modify the color of the text layer with this field.
   */
  color?: string
  /**
   * star
   * @example 5
   * @default The default star of the layer
   * @description The star for the modification, accept range 1-5, for example: 5, 4, 3, 2, 1.
   */
  star?: number
  /**
   * background color
   * @example #FF0000
   * @default The default background color of the layer
   * @description The background color for the modification, accept any valid CSS color value, for example: #FF0000, red, rgba(0,0,0,0.5), etc.
   */
  background?: string
  /**
   * font size
   * @example 12
   * @default The default font size of the layer
   * @description The font size for the modification, accept any valid CSS font size value, for example: 12, 12px;
   */
  size?: number
  /**
   * source image
   * @example https://example.com/image.jpg
   * @default The default source image of the layer
   * @description The source image for the modification, accept any valid image URL, for example: https://example.com/image.jpg
   */
  src?: string
  /**
   * chart data
   * @example { labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'], datasets: [{ label: 'My First Dataset', data: [65, 59, 80, 81, 56, 55, 40], fill: false, borderColor: 'rgb(75, 192, 192)', tension: 0.1 }] }
   * @default The default chart data of the layer
   * @description Update chart layer's data, follow chart.js data structure
   */
  chart?: ChartData
  /**
   * text content
   * @example Hello World
   * @default The default text content of the layer
   * @description You can modify the text layer with this field
   */
  text?: string
  /**
   * barcode content
   * @example 1234567890
   * @default The default barcode content of the layer
   * @description Modify the barcode layer content with this field
   */
  qrcode?: string
  /**
   * qrcode content
   * @example Some text
   * @default The default qrcode content of the layer
   * @description Modify the qrcode layer content with this field
   */
  barcode?: string
  /**
   * icon name
   * @example Menu
   * @default The default icon name of the layer
   * @description Modify the icon name with this field
   */
  icon?: string
  /**
   * visibility
   * @example true
   * @default The default visibility of the layer
   * @description Set the visibility of the field
   */
  visible?: boolean
}
