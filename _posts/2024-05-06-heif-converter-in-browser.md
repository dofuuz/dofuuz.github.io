---
layout: post
title:  "HEIC/HEIF to JPG/PNG converter in web browsers"
date:   2024-05-06 12:00:00 +0900
categories: apps
---
<style>
img + em { display: block; text-align: center; }
img.centered { display: block; margin-left: auto; margin-right: auto; }
</style>

![HEIC/HEIF converter screenshot](/assets/202405/heif-converter.jpg)

➡️ <https://heif.pages.dev>

This app converts HEIC/HEIF files to JPG/PNG in web browsers, without uploading to any server.


## Overview

In some recent mobile devices, like Apple iPhone and Samsung Galaxy, photos are saved in the HEIC/HEIF format.

![Sample HEIF image](/assets/202405/dwsample-heif-640.heif){:.centered}
*Many readers will see this HEIF image as a broken image icon and alt text.*

But, usually, web browsers [do not support HEIC/HEIF images](https://caniuse.com/heif). Only [Safari added support recently](https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes).

To solve this problem, this converter uses [browser's HEVC decoder](https://caniuse.com/hevc) to read HEIC/HEIF images.


## Pros

### 🖥️ No server upload

Files are processed locally in your browser and not uploaded to any server. No install, no register, no privacy concerns.


### ⚡ Fast conversion

It doesn't up/download files, so internet bandwidth isn't an issue. Using HEVC acceleration, conversions are lightning fast.
  

## Cons

### Compatibility problem

For fast offline conversion, this converter relies on the browser's HEVC decoder. Some OS/Browser may or may not be able to convert HEIC/HEIF from some devices.

[Javascript decoder](https://github.com/catdad-experiments/libheif-js) might be used as fallback, but it's relatively slow and there is patent licensing issue.


#### in Windows

Browser  | HEIF from iOS | HEIF from Galaxy
-------- | ------------- | ----------------
Chrome   | ❌            | ✔️
Edge¹    | ✔️            | ✔️
Firefox  | ❌            | ❌

1. HEVC extension ([conditional free](https://apps.microsoft.com/detail/9n4wgh0z6vhq) / [paid](https://apps.microsoft.com/detail/9nmzlz57r3t7)) should be installed with.

#### in macOS

Browser | HEIF from iOS | HEIF from Galaxy
------- | ------------- | ----------------
Safari  | ✔️            | ✔️


### Limitations

This converter can only convert still image. No animation.

This converter does not preserve ICC profile, EXIF metadata.


## Known issue

### Not a HEIC/HEIF file

In some device (e.g. Apple iOS), OS/app automatically converts HEIC files to JPG before passing to browser.


## Wrap up

I couldn't completely solve the compatibility issue. I planned to register a domain, add ads, support ICC/EXIF. But that's it. I'll wrap up at this moment and release it.

I think it's still usable and useful in some circumstances.

2025-06-10 update: The [JS HEIF decoder](https://github.com/dofuuz/heic-videcoder) has been open-sourced!
