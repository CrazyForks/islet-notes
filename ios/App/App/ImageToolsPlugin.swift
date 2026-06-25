import Capacitor
import UIKit

@objc(ImageToolsPlugin)
class ImageToolsPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "ImageToolsPlugin"
    let jsName = "ImageTools"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "generateThumbnail", returnType: CAPPluginReturnPromise)
    ]

    @objc func generateThumbnail(_ call: CAPPluginCall) {
        guard let imageBase64 = call.getString("imageBase64"), !imageBase64.isEmpty else {
            call.reject("imageBase64 is required")
            return
        }

        let minDimension = max(1, call.getInt("minDimension", 256))
        let quality = min(1, max(0.01, call.getDouble("quality", 0.8)))

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                guard let input = Data(base64Encoded: imageBase64),
                      let image = UIImage(data: input) else {
                    throw NSError(domain: "ImageTools", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to decode image"])
                }

                let thumbnail = try Self.makeThumbnail(image: image, minDimension: CGFloat(minDimension))
                guard let jpeg = thumbnail.jpegData(compressionQuality: CGFloat(quality)) else {
                    throw NSError(domain: "ImageTools", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to compress thumbnail"])
                }

                call.resolve([
                    "imageBase64": jpeg.base64EncodedString(),
                    "mimeType": "image/jpeg"
                ])
            } catch {
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    private static func makeThumbnail(image: UIImage, minDimension: CGFloat) throws -> UIImage {
        let width = image.size.width
        let height = image.size.height
        guard width > 0, height > 0 else {
            throw NSError(domain: "ImageTools", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid image size"])
        }

        let scale = min(1, minDimension / min(width, height))
        let targetSize = CGSize(width: max(1, width * scale), height: max(1, height * scale))
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true

        return UIGraphicsImageRenderer(size: targetSize, format: format).image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: targetSize))
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}
