package com.hamsterbase.islet;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.IOException;

@CapacitorPlugin(name = "AttachmentFileCache")
public class AttachmentFileCachePlugin extends Plugin {
    @PluginMethod
    public void ensureCachedFile(PluginCall call) {
        final File target;
        try {
            target = cacheFileFromCall(call);
            if (target.exists()) {
                call.resolve(pathResult(target));
                return;
            }
        } catch (Exception error) {
            call.reject(error.getMessage(), (String) null, error);
            return;
        }
        call.resolve(missingResult());
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        final File target;
        final String data = call.getString("data");
        if (data == null) {
            call.reject("data is required");
            return;
        }
        try {
            target = cacheFileFromCall(call);
        } catch (Exception error) {
            call.reject(error.getMessage(), (String) null, error);
            return;
        }

        getBridge().execute(() -> {
            try {
                byte[] payload = Base64.decode(data, Base64.DEFAULT);
                AttachmentFileCache.writeAtomically(target, out -> out.write(payload));
                call.resolve(pathResult(target));
            } catch (Exception error) {
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    private File cacheFileFromCall(PluginCall call) throws IOException {
        return AttachmentFileCache.cacheFile(
            getContext().getFilesDir(),
            requiredString(call, "scope"),
            requiredString(call, "key")
        );
    }

    private String requiredString(PluginCall call, String key) throws IOException {
        String value = call.getString(key);
        if (value == null || value.isEmpty()) throw new IOException(key + " is required");
        return value;
    }

    private JSObject pathResult(File file) {
        JSObject result = new JSObject();
        result.put("path", file.getAbsolutePath());
        return result;
    }

    private JSObject missingResult() {
        JSObject result = new JSObject();
        result.put("missing", true);
        return result;
    }
}
