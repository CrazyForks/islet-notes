import AVFoundation
import Capacitor
import UIKit

@objc(VideoToolsPlugin)
class VideoToolsPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "VideoToolsPlugin"
    let jsName = "VideoTools"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "createRecord", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepareUpload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cleanRecord", returnType: CAPPluginReturnPromise)
    ]

    private let thumbnailMinDimension: CGFloat = 720
    private let thumbnailQuality: CGFloat = 0.8

    @objc func createRecord(_ call: CAPPluginCall) {
        guard let inputUri = call.getString("inputUri"), !inputUri.isEmpty else {
            call.reject("inputUri is required")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            var output: URL?
            do {
                let input = try Self.url(from: inputUri)
                let source = try self.resolveRecordSource(cacheScope: call.getString("cacheScope"))
                output = source
                try Self.copyFile(from: input, to: source)
                var result = try self.videoMetadataResult(for: source)
                result["sourcePath"] = source.path
                call.resolve(result)
            } catch {
                if let output {
                    try? FileManager.default.removeItem(at: output)
                }
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    @objc func prepareUpload(_ call: CAPPluginCall) {
        guard let sourcePath = call.getString("sourcePath"), !sourcePath.isEmpty else {
            call.reject("sourcePath is required")
            return
        }

        do {
            let source = try Self.url(from: sourcePath)
            let output = try resolveUploadOutput(cacheScope: call.getString("cacheScope"), cacheKey: call.getString("cacheKey"))
            if call.getBool("originalQuality", false) {
                DispatchQueue.global(qos: .userInitiated).async {
                    self.copyOriginal(call: call, source: source, output: output)
                }
                return
            }
            transcode(call: call, source: source, output: output)
        } catch {
            call.reject(error.localizedDescription, nil, error)
        }
    }

    @objc func cleanRecord(_ call: CAPPluginCall) {
        guard let path = call.getString("path"), !path.isEmpty else {
            call.resolve()
            return
        }

        try? FileManager.default.removeItem(at: Self.url(from: path))
        call.resolve()
    }

    private func copyOriginal(call: CAPPluginCall, source: URL, output: URL) {
        do {
            try Self.copyFile(from: source, to: output)
            var result = try videoMetadataResult(for: output)
            result["outputPath"] = output.path
            call.resolve(result)
        } catch {
            try? FileManager.default.removeItem(at: output)
            call.reject(error.localizedDescription, nil, error)
        }
    }

    private func transcode(call: CAPPluginCall, source: URL, output: URL) {
        let asset = AVURLAsset(url: source)
        guard let export = AVAssetExportSession(asset: asset, presetName: AVAssetExportPreset1280x720) ??
                AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHighestQuality) else {
            call.reject("Video transcoding is not available")
            return
        }

        try? FileManager.default.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? FileManager.default.removeItem(at: output)
        export.outputURL = output
        export.outputFileType = .mp4
        export.shouldOptimizeForNetworkUse = true

        export.exportAsynchronously {
            switch export.status {
            case .completed:
                do {
                    var result = try self.videoMetadataResult(for: output)
                    result["outputPath"] = output.path
                    call.resolve(result)
                } catch {
                    try? FileManager.default.removeItem(at: output)
                    call.reject(error.localizedDescription, nil, error)
                }
            case .failed, .cancelled:
                try? FileManager.default.removeItem(at: output)
                let error = export.error
                call.reject(error?.localizedDescription ?? "Video transcoding failed", nil, error)
            default:
                call.reject("Video transcoding did not finish")
            }
        }
    }

    private func videoMetadataResult(for url: URL) throws -> [String: Any] {
        let asset = AVURLAsset(url: url)
        let track = asset.tracks(withMediaType: .video).first
        let naturalSize = track?.naturalSize ?? .zero
        let transformed = naturalSize.applying(track?.preferredTransform ?? .identity)
        let width = Int(abs(transformed.width))
        let height = Int(abs(transformed.height))
        let durationMs = Int(CMTimeGetSeconds(asset.duration) * 1000)
        let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
        let size = (attributes[.size] as? NSNumber)?.intValue ?? 0
        let thumbnail = try thumbnailBase64(for: asset)

        return [
            "width": width,
            "height": height,
            "durationMs": durationMs,
            "size": size,
            "thumbnailBase64": thumbnail
        ]
    }

    private func thumbnailBase64(for asset: AVAsset) throws -> String {
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        let image = try generator.copyCGImage(at: .zero, actualTime: nil)
        let source = UIImage(cgImage: image)
        let scale = min(1, thumbnailMinDimension / min(source.size.width, source.size.height))
        let targetSize = CGSize(width: max(1, source.size.width * scale), height: max(1, source.size.height * scale))
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let thumbnail = UIGraphicsImageRenderer(size: targetSize, format: format).image { context in
            UIColor.black.setFill()
            context.fill(CGRect(origin: .zero, size: targetSize))
            source.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return thumbnail.jpegData(compressionQuality: thumbnailQuality)?.base64EncodedString() ?? ""
    }

    private func resolveUploadOutput(cacheScope: String?, cacheKey: String?) throws -> URL {
        guard let cacheScope, !cacheScope.isEmpty,
              let cacheKey, !cacheKey.isEmpty else {
            return FileManager.default.temporaryDirectory
                .appendingPathComponent("islet-video-upload-\(ProcessInfo.processInfo.globallyUniqueString).mp4")
        }
        return try AttachmentFileCache.cacheFile(scope: cacheScope, key: cacheKey)
    }

    private func resolveRecordSource(cacheScope: String?) throws -> URL {
        var dir = try appSupportDirectory().appendingPathComponent("islet-video-source", isDirectory: true)
        if let cacheScope, !cacheScope.isEmpty {
            dir = dir.appendingPathComponent(AttachmentFileCache.safeSegment(cacheScope), isDirectory: true)
        }
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("source-\(ProcessInfo.processInfo.globallyUniqueString).mp4")
    }

    private func appSupportDirectory() throws -> URL {
        guard let url = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            throw NSError(domain: "VideoTools", code: 1, userInfo: [NSLocalizedDescriptionKey: "Application Support directory is unavailable"])
        }
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    private static func copyFile(from source: URL, to target: URL) throws {
        try FileManager.default.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
        if FileManager.default.fileExists(atPath: target.path) {
            try FileManager.default.removeItem(at: target)
        }
        try FileManager.default.copyItem(at: source, to: target)
    }

    private static func url(from value: String) throws -> URL {
        if let url = URL(string: value), url.scheme != nil {
            return url
        }
        return URL(fileURLWithPath: value)
    }
}
