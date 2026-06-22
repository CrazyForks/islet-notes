package com.hamsterbase.islet;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import java.io.File;

@RunWith(RobolectricTestRunner.class)
public class AttachmentFileCacheTest {
    @Rule
    public TemporaryFolder temporaryFolder = new TemporaryFolder();

    @Test
    public void cachePathUsesScopeKeyOnlyAndKeepsKeyExtension() throws Exception {
        File root = temporaryFolder.newFolder();

        File first = AttachmentFileCache.cacheFile(root, "sync scope", "attachments/ab/video.mp4");
        File second = AttachmentFileCache.cacheFile(root, "sync scope", "attachments/ab/video.mp4");
        File otherScope = AttachmentFileCache.cacheFile(root, "other scope", "attachments/ab/video.mp4");
        File thumbnail = AttachmentFileCache.cacheFile(root, "sync scope", "attachments/ab/video.thumb.jpg");

        assertEquals(first.getAbsolutePath(), second.getAbsolutePath());
        assertNotEquals(first.getAbsolutePath(), otherScope.getAbsolutePath());
        assertTrue(first.getName().endsWith(".mp4"));
        assertTrue(thumbnail.getName().endsWith(".jpg"));
        assertEquals("sync_scope", first.getParentFile().getName());
    }
}
