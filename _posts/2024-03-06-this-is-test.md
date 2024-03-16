---
layout: post
title:  "Test post"
date:   2024-03-06 23:44:00 +0900
categories: test color
---
<link rel="stylesheet" href="/assets/css/dark.css">
<style>
img + em { display: block; }
</style>


(Still writing...)


### TL;DR:  
Using color appearance model, we can deal with with human color perception scientifically.  
With this, I made standard-looking terminal color scheme having uniform visibility across all colors.  
([Preview](https://htmlpreview.github.io/?https://github.com/dofuuz/dimidium/blob/main/preview/tty-preview-nobold.html), [Downloads](https://github.com/dofuuz/dimidium))

[한국어](https://c.innori.com/155)


## Overview

Modern terminals can use 24-bit(16,777,216) colors, but many applications still use ANSI 16 color scheme: black, red, green, yellow, blue, magenta, cyan, white, and their bright varients.

![Traditional 16 color scheme](/assets/202403/fig09.png)
*Traditional 16 color scheme*

These default terminal color settings usually have <span style="color: #0000ff; background: #000000;">blue that's too dark</span>. <span style="color: #00ff00; background: #000000;">Green is too vibrant</span> and hurts my eyes. 🥶

So if I look it up,  
<https://gogh-co.github.io/Gogh/>  
<https://github.com/AlexAkulov/putty-color-themes>  
<https://iterm2colorschemes.com/>  
there are tons of 16-color combinations being shared, each made to their own taste and senses.

But none of them fullfill my eye. Common problems are:

- Name and color not matching (Red is magenta, blue is purple... etc)
- Some colors are buried in the background and hard to see
- 'Bright' colors are not defined, or messed up

To solve these problems... I decided to throw a small rock into the ocean.

In this post, I'll introduce color appearance model, then, adjust the 16 default terminal colors using the CAM.


## New Standard Terminal color scheme 🌈

If it doesn't exist, let's create it.

> Let's reduce excessive brightness, chroma difference of traditional terminal color scheme.

So we can get new standard color scheme that standard-looking and well visible.

### First step: Brighten up without touching hue

Let's start by increasing the lightness of the blue color.

Even with maximum B value, <span style="color: #0000ff; background: #000000;">■(0,0,255)</span> it's still too dark.

If we increase R, G to raise the lightness, <span style="color: #6464ff; background: #000000;">■(100,100,255)</span> does get brighter, but a reddish tint starts to appear.

We're in trouble from the start. 🤦


### Color Appearance Model (CAM)

As you saw above, human vision system does not respond linearly to RGB value. Hue varies even if same amount of R, G value changed.

As you saw above, human vision does not respond linearly to RGB values. Even if you adjust R and G equally, the perceived color shifts.

This is where we need a color appearance model (CAM). Those interested in the latest CSS standards may have heard of Oklab, Oklch - Oklab is also a type of color appearance model.

![Color planes](/assets/202403/img1.png)

Constructing the color plane using RGB results in uneven lightness distribution (left). But using a color appearance model allows us to obtain a color plane with uniform lightness distribution (right).

Let's look at blue again using the Oklch color appearance model.
![Color planes](/assets/202403/pimg2.png)
*Left: Without CAM, Right: With Oklch*

Compared to the top #0000ff, while the left palette shows a reddish tint, the right palette using Oklch shows more appropriate blue color.

### Back to the First Step: Keep Hue the Same and Just Increase Lightness
Using an Oklch color picker tool, if we increase the lightness of blue to <span style="color: #487fff; background: #000000;">■(72,127,255)</span>, the reddish tint is gone and it finally looks like a bright blue.

Using a color appearance model allows us to handle colors in a way that matches human perception.

So from now on, I will tweak the basic terminal color scheme using a color appearance model.
The goal is to maintain the hue while reducing extreme differences in lightness.

### CAM16-UCS
The color appearance model I'll use is CAM16-UCS (Color Appearance Model 2016 - Uniform Color Space).

![CAM16-UCS color gamut](/assets/202403/cam16-ucs-3d.png){:width="600"}
*Image source: [ColorAide Documentation](https://facelessuser.github.io/coloraide/colors/cam16_ucs/)*

It represents color using 3 values: J (lightness), a (red-green), b (yellow-blue).

(Lightness is denoted as L* or J to distinguish it from luminance L)

By converting the J, a, b Cartesian coordinates (x, y, z) to cylindrical coordinates (r, Φ, z), we get the 3 components of the color we want to use:

![HSL color cylinder](/assets/202403/HSL_color_solid_cylinder_saturation_gray.png){:width="400"}
*Image source: [Wikipedia - HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV)*

J: Lightness  
C: Chroma  
h: Hue

(The diagrams below are for understanding purposes and may differ from the actual color appearance model and colors.)

## Color Adjustment 🖌️
Let's proceed with the adjustments based on [xterm's default settings](https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit).

I'll use the Python colour-science package for color conversion.

```sh
$ pip install colour-science
```

The RGB color is converted to XYZ color space, then to CAM16-UCS (Jab → JCh).

```python
import colour  # colour-science

# Convert to CAM16-UCS-JCh
xyz = colour.sRGB_to_XYZ(color_rgb/255)
jab = colour.XYZ_to_CAM16UCS(xyz)
color_jch = colour.models.Jab_to_JCh(jab)
```

Then we separate J, C, h.

```
j = color_jch[..., 0]
c = color_jch[..., 1]
h = color_jch[..., 2]
```


### Lightness

Let's start by reducing the gap between the too-dark blue and too-bright green.

But we won't completely eliminate the lightness difference. Let's Thanos it by half.

```python
j_mean = np.mean(j[2:8])
j[2:8] = (j[2:8] + j_mean) / 2  # colors

j_mean = np.mean(j[10:16])
j[10:16] = (j[10:16] + j_mean) / 2  # bright colors
```

![Before lightness adjust](/assets/202403/cmp-lightness0.png)

![After lightness adjust](/assets/202403/cmp-lightness1.png)


The lightness difference is not completely eliminated. Doing so would reduce the color distinction and exacerbate the clipping issue I'll explain later, making the result look strange.

### Hue
When we plot the hues on a plane, the angular spacing is uneven.
Yellow in particular is skewed towards green.

Let's spread them out equally at 60° intervals to maximize the difference between colors.

```python
# Set hue(mean delta to original is about 3)
h[2:8] = (30, 150, 90, 270, 330, 210)
h[2:8] += 3

h[10:16] = (30, 150, 90, 270, 330, 210)
h[10:16] += 3
```

![Before lightness adjust](/assets/202403/fig40.png) | ![After lightness adjust](/assets/202403/fig41.png)
:---: | :---:
Before: Uneven hue (angle) spacing | After: Even hue (angle) spacing


### Chroma

The adjusted colors include out-of-gamut values like RGB (-32, 266, 128) that cannot be displayed on SDR displays. Think of it as over/under-exposure clipping when adjusting brightness in photography.



First, let's Thanos the chroma difference.
Normalize chroma

```python
c_min = np.min(c[2:8])
c[2:8] = (c[2:8] + c_min) / 2

c_min = np.min(c[10:16])
c[10:16] = (c[10:16] + c_min) / 2
```

Then we desaturate the colors proportionally to bring them back into the (0~255) range and tidy up the tones.

```python
# clip chroma into sRGB gamut
for desaturate in np.arange(1, 0.1, -0.001):
    # Convert back to RGB
    color_jch_adj = np.stack([j, c*desaturate, h], axis=-1)
    jab = colour.models.JCh_to_Jab(color_jch_adj)
    xyz = colour.CAM16UCS_to_XYZ(jab)
    color_rgb = colour.XYZ_to_sRGB(xyz)

    if np.all(0 <= color_rgb) and np.all(color_rgb <= 1):
        color_jch = color_jch_adj
        break
```

![Before lightness adjust](/assets/202403/fig41.png) | ![After lightness adjust](/assets/202403/fig42.png)
:---: | :---:
Before: Out of sRGB gamut | After: Within sRGB gamut


### Result
Here is the result:  
![Result color scheme](/assets/202403/fig13.png)

It's close to the standard while ensuring all colors are evenly visible.

The reduced lightness difference makes red and blue more visible, and the oversaturation of cyan and green is gone.

## Additional Adjustments
Some subjective adjustments to improve readability and color distinction:

### Background Color
<p style="color: #c8c5c4; background: #000000;">
A pure (0,0,0) black background is known to be bad for readability.
</p>
<p style="color: #c8c5c4; background: #141414;">
I changed the background to a near-black gray (20,20,20).
</p>

### Enhancing Color Distinction

I added a slight hue separation between the 'normal' and 'bright' colors to make them more distinguishable.

Before adjustment: Little difference between normal/bright hues
Set hue(mean delta to original is about 3)

```python
h[2:8] = (30, 150, 90, 270, 330, 210)
h[2:8] -= 10  # Originally was +3

h[10:16] = (30, 150, 90, 270, 330, 210)
h[10:16] += 3
```

After adjustment: Normal/bright hues more distinct

### Final Result ✨

![Dimidium color scheme](/assets/202403/fig14.png)

![compare image](/assets/202403/compare-animated-gif-maker.gif)

[Browser Preview](https://htmlpreview.github.io/?https://github.com/dofuuz/dimidium/blob/main/preview/tty-preview-nobold.html)


## Code

The Python code used for color generation and visualization is available here:

<https://colab.research.google.com/drive/1BZ26_QMkFRFsBzrRvCLGu10bw2inz947?usp=sharing>


## Download Settings 🛠️⬇️

You can download the color scheme settings for terminals here.

<https://github.com/dofuuz/dimidium>


## Try Color Appearance Models

You don't need to know Python. You can experiment with OKLCH color picking at these sites:  

<https://oklch.com/>  

<https://bottosson.github.io/misc/colorpicker>
