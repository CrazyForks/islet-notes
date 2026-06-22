package com.hamsterbase.islet;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.util.Base64;
import androidx.exifinterface.media.ExifInterface;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "ImageTools")
public class ImageToolsPlugin extends Plugin {
    @PluginMethod
    public void generateThumbnail(PluginCall call) {
        String imageBase64 = call.getString("imageBase64");
        int minDimension = call.getInt("minDimension", 256);
        double quality = call.getDouble("quality", 0.8);

        if (imageBase64 == null || imageBase64.isEmpty()) {
            call.reject("imageBase64 is required");
            return;
        }

        getBridge().execute(() -> {
            try {
                byte[] bytes = Base64.decode(imageBase64, Base64.DEFAULT);
                byte[] thumbnailBytes = generateThumbnailBytes(bytes, minDimension, quality);

                JSObject result = new JSObject();
                result.put("imageBase64", Base64.encodeToString(thumbnailBytes, Base64.NO_WRAP));
                result.put("mimeType", "image/jpeg");
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage(), (String) null, error);
            }
        });
    }

    static byte[] generateThumbnailBytes(byte[] bytes, int minDimension, double quality) throws IOException {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            throw new IOException("Failed to decode image bounds");
        }

        int orientation = readExifOrientation(bytes);
        int orientedWidth = swapsWidthAndHeight(orientation) ? bounds.outHeight : bounds.outWidth;
        int orientedHeight = swapsWidthAndHeight(orientation) ? bounds.outWidth : bounds.outHeight;
        float scale = Math.min(1f, (float) minDimension / Math.min(orientedWidth, orientedHeight));
        int targetWidth = Math.max(1, Math.round(orientedWidth * scale));
        int targetHeight = Math.max(1, Math.round(orientedHeight * scale));

        BitmapFactory.Options decodeOptions = new BitmapFactory.Options();
        decodeOptions.inSampleSize = calculateInSampleSize(orientedWidth, orientedHeight, targetWidth, targetHeight);
        decodeOptions.inPreferredConfig = Bitmap.Config.ARGB_8888;
        Bitmap source = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, decodeOptions);
        if (source == null) {
            throw new IOException("Failed to decode image");
        }

        Bitmap oriented = applyExifOrientation(source, orientation);
        if (oriented != source) {
            source.recycle();
        }

        Bitmap thumbnail = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(thumbnail);
        canvas.drawColor(Color.WHITE);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG | Paint.DITHER_FLAG);
        canvas.drawBitmap(oriented, null, new android.graphics.Rect(0, 0, targetWidth, targetHeight), paint);
        if (oriented != thumbnail) {
            oriented.recycle();
        }

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int jpegQuality = Math.max(1, Math.min(100, (int) Math.round(quality * 100)));
        if (!thumbnail.compress(Bitmap.CompressFormat.JPEG, jpegQuality, output)) {
            thumbnail.recycle();
            throw new IOException("Failed to compress thumbnail");
        }
        thumbnail.recycle();
        return output.toByteArray();
    }

    private static int readExifOrientation(byte[] bytes) {
        try {
            ExifInterface exif = new ExifInterface(new ByteArrayInputStream(bytes));
            return exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
        } catch (IOException error) {
            return ExifInterface.ORIENTATION_NORMAL;
        }
    }

    private static boolean swapsWidthAndHeight(int orientation) {
        return orientation == ExifInterface.ORIENTATION_TRANSPOSE
                || orientation == ExifInterface.ORIENTATION_ROTATE_90
                || orientation == ExifInterface.ORIENTATION_TRANSVERSE
                || orientation == ExifInterface.ORIENTATION_ROTATE_270;
    }

    private static Bitmap applyExifOrientation(Bitmap source, int orientation) {
        Matrix matrix = new Matrix();
        switch (orientation) {
            case ExifInterface.ORIENTATION_FLIP_HORIZONTAL:
                matrix.setScale(-1, 1);
                break;
            case ExifInterface.ORIENTATION_ROTATE_180:
                matrix.setRotate(180);
                break;
            case ExifInterface.ORIENTATION_FLIP_VERTICAL:
                matrix.setScale(1, -1);
                break;
            case ExifInterface.ORIENTATION_TRANSPOSE:
                matrix.setRotate(90);
                matrix.postScale(-1, 1);
                break;
            case ExifInterface.ORIENTATION_ROTATE_90:
                matrix.setRotate(90);
                break;
            case ExifInterface.ORIENTATION_TRANSVERSE:
                matrix.setRotate(-90);
                matrix.postScale(-1, 1);
                break;
            case ExifInterface.ORIENTATION_ROTATE_270:
                matrix.setRotate(-90);
                break;
            default:
                return source;
        }
        return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
    }

    private static int calculateInSampleSize(int sourceWidth, int sourceHeight, int targetWidth, int targetHeight) {
        int inSampleSize = 1;
        int halfWidth = sourceWidth / 2;
        int halfHeight = sourceHeight / 2;
        while ((halfWidth / inSampleSize) >= targetWidth && (halfHeight / inSampleSize) >= targetHeight) {
            inSampleSize *= 2;
        }
        return Math.max(1, inSampleSize);
    }
}
