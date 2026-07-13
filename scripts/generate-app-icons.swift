#!/usr/bin/env swift

import AppKit
import CoreText
import Foundation

extension NSColor {
  convenience init(hex: String) {
    let value = UInt64(hex.dropFirst(), radix: 16)!
    self.init(
      srgbRed: CGFloat((value >> 16) & 0xff) / 255,
      green: CGFloat((value >> 8) & 0xff) / 255,
      blue: CGFloat(value & 0xff) / 255,
      alpha: 1
    )
  }
}

struct IconSpec {
  let filename: String
  let size: Int
  let background: NSColor?
  let foreground: NSColor
  let fontScale: CGFloat
}

let brand = NSColor(hex: "#B5432A")
let white = NSColor.white
let monogram = "M"
let assetsDirectory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
  .appendingPathComponent("assets/images", isDirectory: true)

let icons = [
  IconSpec(
    filename: "icon.png",
    size: 1024,
    background: brand,
    foreground: white,
    fontScale: 0.54
  ),
  IconSpec(
    filename: "android-icon-foreground.png",
    size: 1024,
    background: nil,
    foreground: white,
    fontScale: 0.46
  ),
  IconSpec(
    filename: "android-icon-monochrome.png",
    size: 1024,
    background: nil,
    foreground: white,
    fontScale: 0.46
  ),
  IconSpec(
    filename: "splash-icon.png",
    size: 512,
    background: nil,
    foreground: brand,
    fontScale: 0.52
  ),
  IconSpec(
    filename: "favicon.png",
    size: 512,
    background: brand,
    foreground: white,
    fontScale: 0.54
  ),
]

func render(_ spec: IconSpec) throws {
  guard
    let bitmap = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: spec.size,
      pixelsHigh: spec.size,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 0
    ),
    let graphics = NSGraphicsContext(bitmapImageRep: bitmap)
  else {
    throw NSError(domain: "MMGIconGenerator", code: 1)
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = graphics

  let context = graphics.cgContext
  let canvas = CGRect(x: 0, y: 0, width: spec.size, height: spec.size)
  context.clear(canvas)
  context.setShouldAntialias(true)

  if let background = spec.background {
    context.setFillColor(background.cgColor)
    context.fill(canvas)
  }

  let font = NSFont.systemFont(
    ofSize: CGFloat(spec.size) * spec.fontScale,
    weight: .heavy
  )
  let text = NSAttributedString(
    string: monogram,
    attributes: [
      .font: font,
      .foregroundColor: spec.foreground,
    ]
  )
  let line = CTLineCreateWithAttributedString(text)
  let bounds = CTLineGetBoundsWithOptions(line, [.useGlyphPathBounds])
  context.textPosition = CGPoint(
    x: (CGFloat(spec.size) - bounds.width) / 2 - bounds.minX,
    y: (CGFloat(spec.size) - bounds.height) / 2 - bounds.minY
  )
  CTLineDraw(line, context)

  NSGraphicsContext.restoreGraphicsState()

  guard let png = bitmap.representation(
    using: NSBitmapImageRep.FileType.png,
    properties: [:]
  ) else {
    throw NSError(domain: "MMGIconGenerator", code: 2)
  }
  try png.write(to: assetsDirectory.appendingPathComponent(spec.filename))
}

for icon in icons {
  try render(icon)
  print("Icône MMG générée : assets/images/\(icon.filename)")
}
