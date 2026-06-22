package com.hamsterbase.islet;

import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.annotation.OptIn;
import androidx.media3.common.Effect;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.effect.Presentation;
import androidx.media3.transformer.Composition;
import androidx.media3.transformer.DefaultEncoderFactory;
import androidx.media3.transformer.EditedMediaItem;
import androidx.media3.transformer.Effects;
import androidx.media3.transformer.ExportException;
import androidx.media3.transformer.ExportResult;
import androidx.media3.transformer.Transformer;
import androidx.media3.transformer.VideoEncoderSettings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * 使用 AndroidX Media3 Transformer 将相册视频转码为 720p H.264 MP4 + AAC。
 * 所有 Transformer 操作均在主线程进行。
 */
@OptIn(markerClass = UnstableApi.class)
@CapacitorPlugin(name = "VideoTools")
public class VideoToolsPlugin extends Plugin {
    private static final int THUMBNAIL_MIN_DIMENSION = 720;
    private static final int THUMBNAIL_JPEG_QUALITY = 80;

    private Transformer transformer;
    private PluginCall pendingCall;
    private File pendingOutput;

    @PluginMethod
    public void createRecord(PluginCall call) {
        String inputUri = call.getString("inputUri");
        if (inputUri == null || inputUri.isEmpty()) {
            call.reject("inputUri is required");
            return;
        }
        getBridge().execute(() -> {
            File source = null;
            try {
                Uri uri = Uri.parse(inputUri);
                source = resolveRecordSource(call);
                copyUriToFile(uri, source);
                call.resolve(buildRecordResult(source));
            } catch (Exception error) {
                safeDelete(source);
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    @PluginMethod
    public void prepareUpload(PluginCall call) {
        String sourcePath = call.getString("sourcePath");
        if (sourcePath == null || sourcePath.isEmpty()) {
            call.reject("sourcePath is required");
            return;
        }
        if (getActivity() == null) {
            call.reject("Activity is not available");
            return;
        }
        boolean originalQuality = Boolean.TRUE.equals(call.getBoolean("originalQuality", false));
        int targetHeight = call.getInt("targetHeight", 720);
        int videoBitrate = call.getInt("videoBitrate", 2_500_000);
        Uri uri = Uri.fromFile(new File(sourcePath));
        File output;
        try {
            output = resolveUploadOutput(call);
        } catch (Exception error) {
            call.reject(error.getMessage(), (String) null, error);
            return;
        }

        // 仅当用户勾选「原画质」时直接拷贝原片不重编码；否则一律转码（不再按分辨率跳过）。
        if (originalQuality) {
            getBridge().execute(() -> copyOriginal(call, uri, output));
            return;
        }
        getActivity()
            .runOnUiThread(() -> startTranscode(call, uri, output, targetHeight, videoBitrate));
    }

    @PluginMethod
    public void cleanRecord(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.isEmpty()) {
            call.resolve();
            return;
        }
        getBridge().execute(() -> {
            try {
                safeDelete(fileFromPath(path));
                call.resolve();
            } catch (Exception error) {
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    private void copyOriginal(PluginCall call, Uri uri, File output) {
        try {
            copyUriToFile(uri, output);
            call.resolve(buildUploadResult(output));
        } catch (Exception error) {
            safeDelete(output);
            call.reject(error.getMessage(), (String) null, error);
        }
    }

    private void copyUriToFile(Uri uri, File output) throws IOException {
        File parent = output.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new IOException("Failed to create output directory.");
        }
        try (InputStream in = openInput(uri); OutputStream out = new FileOutputStream(output)) {
            byte[] buffer = new byte[1 << 16];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        }
    }

    // file:// 或无 scheme 的本地路径用 FileInputStream 直接读取，避免 ContentResolver 报 "No content provider"。
    private InputStream openInput(Uri uri) throws IOException {
        String scheme = uri.getScheme();
        if (scheme == null || "file".equals(scheme)) {
            String path = scheme == null ? uri.toString() : uri.getPath();
            if (path == null) {
                throw new IOException("Invalid file uri: " + uri);
            }
            return new FileInputStream(path);
        }
        InputStream in = getContext().getContentResolver().openInputStream(uri);
        if (in == null) {
            throw new IOException("Cannot open input stream for " + uri);
        }
        return in;
    }

    private void startTranscode(
        PluginCall call,
        Uri uri,
        File output,
        int targetHeight,
        int videoBitrate
    ) {
        try {
            pendingCall = call;
            pendingOutput = output;

            MediaItem mediaItem = new MediaItem.Builder().setUri(uri).build();

            List<Effect> videoEffects = new ArrayList<>();
            videoEffects.add(Presentation.createForHeight(targetHeight));
            Effects effects = new Effects(new ArrayList<AudioProcessor>(), videoEffects);
            EditedMediaItem editedMediaItem = new EditedMediaItem.Builder(mediaItem)
                .setEffects(effects)
                .build();

            VideoEncoderSettings videoEncoderSettings = new VideoEncoderSettings.Builder()
                .setBitrate(videoBitrate)
                .build();
            DefaultEncoderFactory encoderFactory = new DefaultEncoderFactory.Builder(getContext())
                .setRequestedVideoEncoderSettings(videoEncoderSettings)
                .build();

            transformer = new Transformer.Builder(getContext())
                .setVideoMimeType(MimeTypes.VIDEO_H264)
                .setAudioMimeType(MimeTypes.AUDIO_AAC)
                .setEncoderFactory(encoderFactory)
                .addListener(
                    new Transformer.Listener() {
                        @Override
                        public void onCompleted(
                            @NonNull Composition composition,
                            @NonNull ExportResult exportResult
                        ) {
                            onTranscodeCompleted();
                        }

                        @Override
                        public void onError(
                            @NonNull Composition composition,
                            @NonNull ExportResult exportResult,
                            @NonNull ExportException exportException
                        ) {
                            onTranscodeError(exportException);
                        }
                    }
                )
                .build();

            transformer.start(editedMediaItem, output.getAbsolutePath());
        } catch (Exception error) {
            finishWithError(call, output, error.getMessage());
        }
    }

    private void onTranscodeCompleted() {
        final PluginCall call = pendingCall;
        final File output = pendingOutput;
        pendingCall = null;
        pendingOutput = null;
        transformer = null;
        if (call == null) {
            return;
        }
        // 缩略图提取与文件读取较重，放到后台线程执行。
        getBridge().execute(() -> {
            try {
                call.resolve(buildUploadResult(output));
            } catch (Exception error) {
                safeDelete(output);
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    private void onTranscodeError(ExportException error) {
        final PluginCall call = pendingCall;
        final File output = pendingOutput;
        pendingCall = null;
        pendingOutput = null;
        transformer = null;
        safeDelete(output);
        if (call == null) {
            return;
        }
        call.reject(
            error != null ? error.getMessage() : "Video transcoding failed",
            (String) null,
            error
        );
    }

    private void finishWithError(PluginCall call, File output, String message) {
        transformer = null;
        pendingCall = null;
        pendingOutput = null;
        safeDelete(output);
        call.reject(message != null ? message : "Video transcoding failed");
    }

    private JSObject buildRecordResult(File source) throws Exception {
        JSObject result = buildVideoMetadataResult(source);
        result.put("sourcePath", source.getAbsolutePath());
        return result;
    }

    private JSObject buildUploadResult(File output) throws Exception {
        JSObject result = buildVideoMetadataResult(output);
        result.put("outputPath", output.getAbsolutePath());
        return result;
    }

    private JSObject buildVideoMetadataResult(File output) throws Exception {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(output.getAbsolutePath());
            int width = parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH));
            int height = parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT));
            int rotation = parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION));
            long durationMs = parseLong(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));
            if (rotation == 90 || rotation == 270) {
                int swap = width;
                width = height;
                height = swap;
            }
            String thumbnailBase64 = "";
            Bitmap frame = retriever.getFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            if (frame != null) {
                thumbnailBase64 = encodeThumbnail(frame);
                frame.recycle();
            }

            JSObject result = new JSObject();
            result.put("width", width);
            result.put("height", height);
            result.put("durationMs", durationMs);
            result.put("size", output.length());
            result.put("thumbnailBase64", thumbnailBase64);
            return result;
        } finally {
            retriever.release();
        }
    }

    private static File fileFromPath(String path) {
        if (path.startsWith("file://")) {
            String filePath = Uri.parse(path).getPath();
            return filePath != null ? new File(filePath) : null;
        }
        return new File(path);
    }

    private String encodeThumbnail(Bitmap frame) {
        float scale = Math.min(
            1f,
            (float) THUMBNAIL_MIN_DIMENSION / Math.min(frame.getWidth(), frame.getHeight())
        );
        int targetWidth = Math.max(1, Math.round(frame.getWidth() * scale));
        int targetHeight = Math.max(1, Math.round(frame.getHeight() * scale));
        Bitmap scaled = Bitmap.createScaledBitmap(frame, targetWidth, targetHeight, true);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        scaled.compress(Bitmap.CompressFormat.JPEG, THUMBNAIL_JPEG_QUALITY, output);
        if (scaled != frame) {
            scaled.recycle();
        }
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
    }

    private static void safeDelete(File file) {
        if (file != null && file.exists()) {
            //noinspection ResultOfMethodCallIgnored
            file.delete();
        }
    }

    private static int parseInt(String value) {
        if (value == null) {
            return 0;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException error) {
            return 0;
        }
    }

    private static long parseLong(String value) {
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException error) {
            return 0L;
        }
    }

    private File resolveUploadOutput(PluginCall call) throws Exception {
        String cacheKey = call.getString("cacheKey");
        String cacheScope = call.getString("cacheScope");
        if (cacheKey == null || cacheKey.isEmpty() || cacheScope == null || cacheScope.isEmpty()) {
            return new File(getContext().getCacheDir(), "islet-video-upload-" + System.nanoTime() + ".mp4");
        }
        return AttachmentFileCache.cacheFile(getContext().getFilesDir(), cacheScope, cacheKey);
    }

    private File resolveRecordSource(PluginCall call) {
        String cacheScope = call.getString("cacheScope");
        File dir = new File(getContext().getFilesDir(), "islet-video-source");
        if (cacheScope != null && !cacheScope.isEmpty()) {
            dir = new File(dir, AttachmentFileCache.safeSegment(cacheScope));
        }
        return new File(dir, "source-" + System.nanoTime() + ".mp4");
    }
}
