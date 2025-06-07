/**
 * @file heif_videcoder.js
 * @description HEIF image decoder using browser native HEVC video decoder.
 * @author KEUM Myungchul
 * @license MIT
 *
 * Copyright (c) 2024 KEUM Myungchul
 *
 * For the full MIT license text, please view the LICENSE file in the root directory of this project.
 */

class HeifDrawer {
    onload(canvas) { }
    error(e) {
        console.error(e);
    }

    decode(m) {
        const img1 = m.items.find(x => x && x.type === "hvc1");
        if (!img1) {
            this.error("Invalid HEIF file: no hvc1 in file");
            return;
        }
        // Log.debug("m", m);
        // Log.debug("img1", img1);

        // get codec info
        let entry = img1.properties;
        if (!entry.hvcC) {
            this.error("Invalid HEIF file: hvcC box not found");
            return;
        }
        let stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
        entry.hvcC.write(stream);
        let desc = new Uint8Array(stream.buffer, 8);  // Remove the box header.

        const codecHeight = entry.ispe.image_height;
        const codecWidth = entry.ispe.image_width;

        // get grid info
        let grid = m.items.find(x => x && x.type === "grid");
        if (grid) {
            var rows = m.meta.idat.data[2] + 1;
            var cols = m.meta.idat.data[3] + 1;
            var img_height = grid.properties.ispe.image_height;
            var img_width = grid.properties.ispe.image_width;
            var img_rot = grid.properties.irot ? grid.properties.irot.angle : 0;
        } else {
            var rows = 1;
            var cols = 1;
            var img_height = codecHeight;
            var img_width = codecWidth;
            var img_rot = 0;
        }
        // Log.debug("grid", grid);

        // make canvas
        const canvas = document.createElement('canvas');
        canvas.width = img_width;
        canvas.height = img_height;
        const ctx = canvas.getContext('2d');

        // configure decoder
        let startTime = null;
        let frameCount = 0;

        if (typeof VideoDecoder == "undefined") {
            this.error('VideoDecoder not available');
            return;
        }

        let decoder = new VideoDecoder({
            output: (frame) => {
                // Update statistics.
                if (startTime == null) {
                    startTime = performance.now();
                } else {
                    let elapsed = (performance.now() - startTime) / 1000;
                    let fps = ++frameCount / elapsed;
                    // Log.info("render", `${fps.toFixed(0)} fps`);
                }

                let row = (frameCount / cols) >> 0;
                let col = frameCount % cols;
                ctx.drawImage(frame, codecWidth * col, codecHeight * row);
                frame.close()

                if (frameCount + 1 == cols * rows) {
                    // done drawing
                    if (img_rot <= 0) {
                        this.onload(canvas);
                        return;
                    }

                    // rotate
                    const newCanvas = document.createElement("canvas");
                    newCanvas.width = img_width;
                    newCanvas.height = img_height;
                    const newCtx = newCanvas.getContext("2d");

                    if (img_rot == 1) {  // 90° CW
                        newCanvas.width = img_height;
                        newCanvas.height = img_width;
                        newCtx.setTransform(0, -1, 1, 0, 0, img_width);
                    }
                    if (img_rot == 2) {  // 180°
                        newCtx.setTransform(-1, 0, 0, -1, img_width, img_height);
                    }
                    if (img_rot == 3) {  // 90° CCW
                        newCanvas.width = img_height;
                        newCanvas.height = img_width;
                        newCtx.setTransform(0, 1, -1, 0, img_height, 0);
                    }

                    newCtx.drawImage(canvas, 0, 0);

                    this.onload(newCanvas);
                }
            },
            error(e) {
                Log.warn("decode", e);
            }
        });

        entry.type = img1.type;
        entry.getCodec = BoxParser[img1.type + "SampleEntry"].prototype.getCodec;
        const config = {
            codec: entry.getCodec(),
            codedHeight: codecHeight,
            codedWidth: codecWidth,
            description: desc,
        };
        // Log.debug("mseViewAVIFItem config", config);

        VideoDecoder.isConfigSupported(config).then((support) => {
            if (!support.supported) {
                this.error(`Codec (${support.config.codec}) not supported by browser`);
                return;
            }

            decoder.configure(config);

            // decode and draw
            if (grid) {
                for (const ref in grid.ref_to) {
                    const to_item = m.getItem(grid.ref_to[ref].id.to_item_ID);
                    decoder.decode(new EncodedVideoChunk({
                        type: "key",
                        timestamp: 0,
                        data: to_item.data})
                    );
                }
            } else {
                decoder.decode(new EncodedVideoChunk({
                    type: "key",
                    timestamp: 0,
                    data: img1.data})
                );
            }
            decoder.flush();
        });
    }

}
