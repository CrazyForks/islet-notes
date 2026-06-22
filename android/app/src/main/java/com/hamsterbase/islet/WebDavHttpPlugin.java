package com.hamsterbase.islet;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.util.Iterator;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Minimal HTTP bridge for WebDAV. The WebView (and Capacitor's HttpURLConnection
 * based CapacitorHttp) rejects non-standard methods such as MKCOL/PROPFIND and
 * enforces CORS; OkHttp supports arbitrary methods and binary-safe bodies.
 * Bodies cross the bridge as base64 in both directions.
 */
@CapacitorPlugin(name = "WebDavHttp")
public class WebDavHttpPlugin extends Plugin {
    private final OkHttpClient client = new OkHttpClient();

    @PluginMethod
    public void request(PluginCall call) {
        String url = call.getString("url");
        String method = call.getString("method", "GET");
        JSObject headers = call.getObject("headers", new JSObject());
        String bodyBase64 = call.getString("body");
        if (url == null || method == null) {
            call.reject("url and method are required");
            return;
        }

        Request.Builder builder = new Request.Builder().url(url);
        String contentType = null;
        Iterator<String> keys = headers.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            String value = headers.getString(key);
            if (value == null) continue;
            builder.header(key, value);
            if ("content-type".equalsIgnoreCase(key)) {
                contentType = value;
            }
        }

        RequestBody requestBody = null;
        if (bodyBase64 != null) {
            byte[] bytes = Base64.decode(bodyBase64, Base64.DEFAULT);
            requestBody = RequestBody.create(bytes, contentType != null ? MediaType.parse(contentType) : null);
        }
        builder.method(method, requestBody);

        client.newCall(builder.build()).enqueue(new Callback() {
            @Override
            public void onFailure(Call ignored, IOException error) {
                call.reject(error.getMessage(), (String) null, error);
            }

            @Override
            public void onResponse(Call ignored, Response response) throws IOException {
                byte[] bytes = response.body() != null ? response.body().bytes() : new byte[0];
                JSObject result = new JSObject();
                result.put("status", response.code());
                result.put("body", Base64.encodeToString(bytes, Base64.NO_WRAP));
                call.resolve(result);
            }
        });
    }
}
