import Foundation
import PDFKit
import AppKit

let args = CommandLine.arguments
guard args.count >= 4 else {
    FileHandle.standardError.write("usage: pdfrender <in.pdf> <outdir> <scale> [textonly]\n".data(using:.utf8)!)
    exit(1)
}
let inPath = args[1]
let outDir = args[2]
let scale = CGFloat(Double(args[3]) ?? 1.5)
let textOnly = args.count > 4 && args[4] == "textonly"

guard let doc = PDFDocument(url: URL(fileURLWithPath: inPath)) else {
    FileHandle.standardError.write("cannot open pdf\n".data(using:.utf8)!); exit(1)
}
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

let base = (inPath as NSString).lastPathComponent
    .replacingOccurrences(of: ".pdf", with: "")
    .replacingOccurrences(of: " ", with: "-")
    .lowercased()

var allText = ""
for i in 0..<doc.pageCount {
    guard let page = doc.page(at: i) else { continue }
    let t = page.string ?? ""
    allText += "\n===== PAGE \(i+1) =====\n" + t
    if textOnly { continue }
    let rect = page.bounds(for: .mediaBox)
    let w = Int(rect.width * scale), h = Int(rect.height * scale)
    guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else { continue }
    guard let ctx = NSGraphicsContext(bitmapImageRep: rep) else { continue }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = ctx
    let cg = ctx.cgContext
    cg.setFillColor(NSColor.white.cgColor)
    cg.fill(CGRect(x:0,y:0,width:w,height:h))
    cg.scaleBy(x: scale, y: scale)
    // No translate by the box origin: draw(with:to:) already maps the box to the
    // context. Every one of these PDFs has a non-zero y origin (7.83 / 8.58), so
    // compensating again pushed the artwork down and left a white band across
    // the top of every rendered page.
    page.draw(with: .mediaBox, to: cg)
    NSGraphicsContext.restoreGraphicsState()
    let num = String(format: "%02d", i+1)
    if let data = rep.representation(using: .png, properties: [:]) {
        try? data.write(to: URL(fileURLWithPath: "\(outDir)/\(base)-p\(num).png"))
    }
}
try? allText.write(toFile: "\(outDir)/\(base)-text.txt", atomically: true, encoding: .utf8)
print("rendered \(doc.pageCount) pages -> \(outDir)")
