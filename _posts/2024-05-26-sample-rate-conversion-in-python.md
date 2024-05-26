---
layout: post
title:  "Sample-rate conversion in Python"
date:   2024-05-26 12:00:00 +0900
categories: dsp
---

Resampling is not a trivial task. Simple 'zero order hold' or 'linear interpolation' produces bad result.

This article discusses how to perform sample rate conversion using [Python-SoXR](https://github.com/dofuuz/python-soxr) in Python.


## Resampling NumPy array

Example for converting `ndrray`'s samplerate:
```python
import numpy as np
import soxr

SOURCE_RATE = 2400
TARGET_RATE = 1500
LEN = 1000

# generate source signal
ch1 = np.sin(np.pi / 120 * np.arange(LEN))
ch2 = np.sin(np.pi / 180 * np.arange(LEN))
x = np.asarray([ch1, ch2]).T
print(f'source: {x.shape}')

# Resample signal
y = soxr.resample(x, SOURCE_RATE, TARGET_RATE)
print(f'resampled: {y.shape}')
```

Result:
```
source: (1000, 2)
resampled: (625, 2)
```

Note that soxr uses channel-last format.


## Audio file sample rate conversion

To convert audio file's samplerate and save as new file:

```python
import soundfile as sf
import soxr

TARGET_RATE = 16000

# Load the audio file
x, source_rate = sf.read('input.mp3')

# Resample the audio
y = soxr.resample(x, source_rate, TARGET_RATE)

# Save the resampled audio
sf.write('output.wav', y, TARGET_RATE)
```

Resampled audio will be saved to `output.wav`.


## Audio file sample rate conversion (streaming)

Use `ResampleStream` for real-time processing or very long signal.

```python
import soundfile as sf
import soxr

TARGET_RATE = 16000
CHUNK_SIZE = 96000

# Open input audio file
in_file = sf.SoundFile('input_too_long_to_fit_in_memory.flac', 'r')
source_rate = in_file.samplerate
channels = in_file.channels

# Config ResampleStream
resampler = soxr.ResampleStream(source_rate, TARGET_RATE, channels, dtype='float32')

# Open output audio file
with sf.SoundFile('output.flac', 'w', TARGET_RATE, channels) as out_file:
    while True:
        # Read chunk of audio
        x = in_file.read(CHUNK_SIZE, dtype='float32')
        is_last = (in_file.tell() == in_file.frames)

        # Resample the chunk
        y = resampler.resample_chunk(x, last=is_last)

        # Write to output file
        out_file.write(y)

        if is_last:
            break

in_file.close()
```

That's it!

Now you can resample any 1-D data in Python.
