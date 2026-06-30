const SUPPORTED_FORMATS = ["png", "jpeg", "webp"] as const

export type ImageFormat = (typeof SUPPORTED_FORMATS)[number]

export type FormatValidationError = {
  message: string
}

export type FormatValidationResult =
  | { ok: true; format: ImageFormat }
  | { ok: false; error: FormatValidationError }

const isSupportedFormat = (value: string): value is ImageFormat =>
  (SUPPORTED_FORMATS as readonly string[]).includes(value)

export const validateImageFormat = (value?: string): FormatValidationResult => {
  if (!value) {
    return { ok: true, format: "png" }
  }

  if (isSupportedFormat(value)) {
    return { ok: true, format: value }
  }

  return {
    ok: false,
    error: {
      message: `Unsupported format "${value}". Valid formats are png, jpeg, or webp.`,
    },
  }
}
