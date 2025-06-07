/**
 * This script finds all `<img>` tags and attaches a fallback loader
 * for `.heic` or `.heif` files in case the browser cannot render them natively.
 */
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        const isHeic = img.src.toLowerCase().endsWith('.heic') || img.src.toLowerCase().endsWith('.heif');

        if (isHeic) {
            if (img.complete && img.naturalHeight === 0) {
                // loading already failed before this script ran
                loadHeicWithFallback(img);
            } else {
                // image is still loading
                img.onerror = () => loadHeicWithFallback(img);
            }
        }
    });
});

/**
 * Replaces a failed image source with a decoded HEIC canvas.
 * @param {HTMLImageElement} img The image element that failed to load.
 */
function loadHeicWithFallback(img) {
    // Prevent the onerror event from firing in a loop if the fallback also fails.
    img.onerror = null;

    const originalSrc = img.src;

    fetch(originalSrc)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch the image: ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            // The decoding logic using MP4Box and HeifDrawer.
            const iso = MP4Box.createFile();
            buffer.fileStart = 0;
            iso.appendBuffer(buffer);
            iso.flush();

            const heifDrawer = new HeifDrawer();
            heifDrawer.onload = function(canvas) {
                canvas.toBlob(
                    (blob) => {
                        const objectUrl = URL.createObjectURL(blob);

                        // to prevent memory leaks
                        if (img.src.startsWith('blob:')) {
                            URL.revokeObjectURL(img.src);
                        }

                        img.src = objectUrl;

                        // free up memory
                        img.onload = () => {
                            URL.revokeObjectURL(objectUrl);
                            // prevent it from firing again
                            img.onload = null; 
                        }
                    },
                    'image/jpeg' // or 'image/png' for quality, but it's slower
                );
            };
            heifDrawer.error = function(e) {
                console.error("Failed to decode HEIC image:", e, img);
                img.alt = `Failed to decode: ${e.message || e}`;
            };
            heifDrawer.decode(iso);
        })
        .catch(error => {
            console.error(`Error during ${originalSrc}:`, error);
        });
}