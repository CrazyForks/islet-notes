import Capacitor
import Foundation

@objc(WebDavHttpPlugin)
class WebDavHttpPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "WebDavHttpPlugin"
    let jsName = "WebDavHttp"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    @objc func request(_ call: CAPPluginCall) {
        guard let urlRaw = call.getString("url"),
              let url = URL(string: urlRaw) else {
            call.reject("url is required")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = call.getString("method", "GET")

        if let headers = call.options["headers"] as? [String: Any] {
            for (key, value) in headers {
                if let stringValue = value as? String {
                    request.setValue(stringValue, forHTTPHeaderField: key)
                }
            }
        }

        if let bodyBase64 = call.getString("body") {
            guard let body = Data(base64Encoded: bodyBase64) else {
                call.reject("Invalid base64 body")
                return
            }
            request.httpBody = body
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error {
                call.reject(error.localizedDescription, nil, error)
                return
            }

            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            call.resolve([
                "status": status,
                "body": (data ?? Data()).base64EncodedString()
            ])
        }.resume()
    }
}
