import Capacitor
import CryptoKit
import Foundation

@objc(AttachmentFileCachePlugin)
class AttachmentFileCachePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "AttachmentFileCachePlugin"
    let jsName = "AttachmentFileCache"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ensureCachedFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeFile", returnType: CAPPluginReturnPromise)
    ]

    @objc func ensureCachedFile(_ call: CAPPluginCall) {
        do {
            let target = try AttachmentFileCache.cacheFile(scope: requiredString(call, "scope"), key: requiredString(call, "key"))
            if FileManager.default.fileExists(atPath: target.path) {
                call.resolve(["path": target.path])
            } else {
                call.resolve(["missing": true])
            }
        } catch {
            call.reject(error.localizedDescription, nil, error)
        }
    }

    @objc func writeFile(_ call: CAPPluginCall) {
        guard let dataBase64 = call.getString("data") else {
            call.reject("data is required")
            return
        }

        DispatchQueue.global(qos: .utility).async {
            do {
                let target = try AttachmentFileCache.cacheFile(scope: self.requiredString(call, "scope"), key: self.requiredString(call, "key"))
                guard let payload = Data(base64Encoded: dataBase64) else {
                    throw NSError(domain: "AttachmentFileCache", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 data"])
                }
                try AttachmentFileCache.writeAtomically(payload, to: target)
                call.resolve(["path": target.path])
            } catch {
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    private func requiredString(_ call: CAPPluginCall, _ key: String) throws -> String {
        guard let value = call.getString(key), !value.isEmpty else {
            throw NSError(domain: "AttachmentFileCache", code: 2, userInfo: [NSLocalizedDescriptionKey: "\(key) is required"])
        }
        return value
    }
}

enum AttachmentFileCache {
    private static let cacheRoot = "islet-attachment-file-store"

    static func cacheFile(scope: String, key: String) throws -> URL {
        let root = try appSupportDirectory()
            .appendingPathComponent(cacheRoot, isDirectory: true)
            .appendingPathComponent(safeSegment(scope), isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent(cacheFileName(scope: scope, key: key))
    }

    static func writeAtomically(_ data: Data, to target: URL) throws {
        try FileManager.default.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
        let temp = target.deletingLastPathComponent().appendingPathComponent("\(target.lastPathComponent).\(ProcessInfo.processInfo.globallyUniqueString).tmp")
        try data.write(to: temp)
        if FileManager.default.fileExists(atPath: target.path) {
            try FileManager.default.removeItem(at: target)
        }
        try FileManager.default.moveItem(at: temp, to: target)
    }

    static func safeSegment(_ value: String) -> String {
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
        return String(value.unicodeScalars.map { allowed.contains($0) ? Character($0) : "_" })
    }

    private static func cacheFileName(scope: String, key: String) -> String {
        return sha256("\(scope)\n\(key)") + extensionFromKey(key)
    }

    private static func extensionFromKey(_ key: String) -> String {
        let filename = key.split(separator: "/").last.map(String.init) ?? key
        guard let dot = filename.lastIndex(of: ".") else { return ".blob" }
        let suffix = filename[dot...].lowercased()
        let pattern = #"^\.[a-z0-9]{1,12}$"#
        return suffix.range(of: pattern, options: .regularExpression) == nil ? ".blob" : suffix
    }

    private static func sha256(_ value: String) -> String {
        let digest = SHA256.hash(data: Data(value.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    private static func appSupportDirectory() throws -> URL {
        guard let url = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            throw NSError(domain: "AttachmentFileCache", code: 3, userInfo: [NSLocalizedDescriptionKey: "Application Support directory is unavailable"])
        }
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
}
