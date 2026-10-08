import type { components } from "./openapi"

export type S3Config = {
  endPoint: string
  port?: number
  useSSL?: boolean
  region: string
  bucket: string
  pathStyle?: boolean
  accessKey: string
  secretKey: string
  customUrl?: string
}

export type Modification = components["schemas"]["Modification"] & {
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
   * rows
   * @example [{ label: 'Jan', value: 22 }, { label: 'Feb', value: 30 }]
   * @default The default rows of the layer
   * @description The rows of a data layer. A table takes row objects keyed by the column names, a chart takes { label, value } points, and a key value layer takes { key, value } entries.
   */
  rows?: Record<string, unknown>[]
  /**
   * columns
   * @example ["Item", "Qty", "Total"]
   * @default The default columns of the layer
   * @description The column names of a table layer
   */
  columns?: string[]
  /**
   * title
   * @example Payment terms
   * @default The default title of the layer
   * @description The heading of an alert layer, or the job title of a signature layer
   */
  title?: string
  /**
   * date
   * @example 2026-01-31
   * @default The default date of the layer
   * @description The date of a signature layer
   */
  date?: string
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
