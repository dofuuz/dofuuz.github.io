---
layout: post
title:  "libsoxr Patch Notes"
date:   2026-05-23 00:00:00 +0900
categories: dsp
---

This article describes patches applied to [libsoxr](https://github.com/dofuuz/soxr) used in [Python-SoXR](https://github.com/dofuuz/python-soxr).


## Summary of Changes

* Fix builds
* Enable optimization on AArch64 (over 2x speed-up)
* Fix the periodic 0s bug in dithering
* Make int16 output deterministic for reproducibility

## Motivation

I needed a fast resampler for Python, so I created Python-SoXR (a Python wrapper for **libsoxr**).

libsoxr is currently unmaintained. Fortunately, its features are quite complete. So, I decided to fix builds/bugs myself.


## Changes

### Build Fixes

Fixed builds for:

* CMake >= 4.0
* AArch64 (ARM64)
* ppc64le
* WebAssembly

Most of the problems were related to platform detection using predefined macros. Some patches were cherry-picked from [PFFFT](https://bitbucket.org/jpommier/pffft).

### Enable Optimization on AArch64 (Part 1)

I added AArch64 flags where ARM optimization is used. For example:

```c
#if defined(__arm__) || defined(__aarch64__) || defined(__arm64__)
```

```cmake
elseif (CMAKE_SYSTEM_PROCESSOR MATCHES "^arm"
        OR CMAKE_SYSTEM_PROCESSOR MATCHES "^aarch64")
```

I thought this was enough, but... (Continues below)


### Fix Periodic 0s Bug in Dithering

On systems where `unsigned long` is 32-bit (e.g., Windows, 32-bit Linux), dithering does not work as expected. It exhibits a pattern every 16 samples, where the latter 8 samples are always ±0:

```
 0  1  0  0 -1  0  0 -1  0  0  0  0  0  0  0  0
-1  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  1  0  0  0  0  0 -1  0  0  0  0  0  0  0  0
 0  0  0  1  0  0  1  1  0  0  0  0  0  0  0  0
 0 -1  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  1  0  0  0  0  0  0  0  0
...
```

The random variable used in dithering supposed to have 56+ bits, but it is an `unsigned long`. 32-bit is insufficient, causing fixed 0 outputs.

I changed the seed to `unsigned long long`. Now it is 64-bit on any platform, and dithering works as it should.

#### Use C99

libsoxr used a dirty workaround for 64-bit int support because C89 lacks `long long` or `int64_t`. Now that it is 2026, every C compiler—even those considered ancient—supports C99.
So, I bumped the standard to C99. This also unlocks basic quality-of-life features like `//` comments.


### Make int16 Output Reproducible by Making Dithering Seed Deterministic

libsoxr uses a random seed for dithering. This produces slightly different outputs every time int16 I/O is used.
```c
    p->seed = (unsigned long long)time(0) ^ (unsigned long long)(size_t)p;
```

This variance hurts reproducibility. However, simply fixing the seed to a constant can make the dithering noise audible when mixed down multiple times.

To solve this, I replaced the seed with an input-dependent hash. This generates different dithering patterns with the input changes.

The patched libsoxr produces identical output with following conditions:

* Same input and length
* Same configuration (Input/Output rate, Channels)
* Same patch version of libsoxr
* Same platform/architecture


### Enable Optimization on AArch64 (For Real)

While libsoxr compiled with ARM optimization after the previous fixes, the optimized code was not actually executed.

libsoxr has runtime ARM NEON capability detection, which depends on libavutil (FFmpeg). Since that dependency is usually turned off, libsoxr fell back to unoptimized code.

Since NEON is mandatory in AArch64, I bypassed the check and force-enabled it:

```c
#elif defined __aarch64__ || defined __arm64__
  return true;
```

Now, libsoxr runs literally over 2x faster on AArch64 platforms.

<details>

<summary>Benchmark results...</summary>

Unpatched libosxr:
```
% python tests/bench.py
soxr.__version__ = '1.1.0'
soxr.__libsoxr_version__ = 'libsoxr-0.1.3'
QUALITY = 'HQ'
sig.shape = (96000, 4)
soxr oneshot: 6.064718 (sec)
soxr resample: 6.005074 (sec)
soxr split ch I/O: 5.874844 (sec)
soxr w/ clear(): 6.038524 (sec)
CHUNK_SIZE = 480
soxr stream: 6.498277 (sec)
python tests/bench.py  29.53s user 0.99s system 99% cpu 30.708 total
```

Patched libxoxr:
```
% python tests/bench.py
soxr.__version__ = '1.1.0'
soxr.__libsoxr_version__ = '0.1.3-14-ga66f3ee'
QUALITY = 'HQ'
sig.shape = (96000, 4)
soxr oneshot: 2.213169 (sec)
soxr resample: 2.167380 (sec)
soxr split ch I/O: 2.006091 (sec)
soxr w/ clear(): 2.245738 (sec)
CHUNK_SIZE = 480
soxr stream: 2.677685 (sec)
python tests/bench.py  10.57s user 0.80s system 99% cpu 11.384 total
```

Ran on Apple M1 Pro.

</details>
