import type { ChartData } from "chart.js"

export type Modification = {
  // name of layer
  name: string
  // text color
  color?: string
  // background color
  background?: string
  // text font size
  size?: number
  // image source
  src?: string
  // image width
  chart?: ChartData
  // text content
  text?: string

  qrcode?: string
  barcode?: string

}