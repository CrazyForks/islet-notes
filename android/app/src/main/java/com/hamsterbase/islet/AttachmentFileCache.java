package com.hamsterbase.islet;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

final class AttachmentFileCache {
    static final String CACHE_ROOT = "islet-attachment-file-store";

    private AttachmentFileCache() {}

    static File cacheFile(File appCacheDir, String scope, String key) throws IOException {
        File dir = new File(new File(appCacheDir, CACHE_ROOT), safeSegment(scope));
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Failed to create cache directory.");
        }
        return new File(dir, cacheFileName(scope, key));
    }

    static String cacheFileName(String scope, String key) throws IOException {
        return sha256(recordId(scope, key)) + extensionFromKey(key);
    }

    static String recordId(String scope, String key) {
        return scope + "\n" + key;
    }

    static String extensionFromKey(String key) {
        int slash = key.lastIndexOf('/');
        String filename = slash >= 0 ? key.substring(slash + 1) : key;
        int dot = filename.lastIndexOf('.');
        if (dot <= 0 || dot >= filename.length() - 1) return ".blob";
        String extension = filename.substring(dot).toLowerCase(Locale.ROOT);
        return extension.matches("\\.[a-z0-9]{1,12}") ? extension : ".blob";
    }

    static void writeAtomically(File target, FileWriter writer) throws Exception {
        File temp = new File(target.getParentFile(), target.getName() + "." + System.nanoTime() + ".tmp");
        try (OutputStream out = new FileOutputStream(temp)) {
            writer.write(out);
        }
        if (target.exists() && !target.delete()) {
            safeDelete(temp);
            throw new IOException("Failed to replace cache file.");
        }
        if (!temp.renameTo(target)) {
            safeDelete(temp);
            throw new IOException("Failed to move cache file.");
        }
    }

    static void safeDelete(File file) {
        if (file != null && file.exists()) {
            //noinspection ResultOfMethodCallIgnored
            file.delete();
        }
    }

    static String safeSegment(String value) {
        return value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static String sha256(String value) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte item : hash) builder.append(String.format("%02x", item & 0xff));
            return builder.toString();
        } catch (NoSuchAlgorithmException error) {
            throw new IOException("SHA-256 is not available.", error);
        }
    }

    interface FileWriter {
        void write(OutputStream out) throws Exception;
    }
}
