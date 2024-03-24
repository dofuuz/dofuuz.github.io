---
layout: post
title:  "Dimidium: Terminal color scheme crafted with science"
date:   2024-03-17 22:00:00 +0900
categories: color
---
<link rel="stylesheet" href="/assets/css/dark.css">
<style>
img + em { display: block; text-align: center; }
img.centered { display: block; margin-left: auto; margin-right: auto; }
code { color: #bab7b6; background-color: #141414; }
.highlighter-rouge .highlight { background: #141414; }
.highlight .c1 { color: #62605F; }
.highlight .k { color: #1DB6BB; }
.highlight .kn { color: #1DB6BB; }
.highlight .mi { color: #DB9C11; }
.highlight .mf { color: #DB9C11; }
.highlight .nb { color: #dad7d5; }
.highlight .nn { color: #bab7b6; }
.highlight .ow { color: #1DB6BB; }
.highlight .p { color: #ED6FE9; }
</style>

![Dimidium](/assets/202403/github-social-preview2.png)

### TL;DR:

Using Color Appearance Model (CAM), we can deal with human color perception scientifically.  
With CAM, I made a standard-looking terminal color scheme with uniform visibility across all colors.  
([Preview](https://htmlpreview.github.io/?https://github.com/dofuuz/dimidium/blob/main/preview/tty-preview-nobold.html), [Downloads](https://github.com/dofuuz/dimidium))

[한국어](https://c.innori.com/155)

## Problem of the 16-colors

Modern terminals can use 24-bit colors, but many applications still use the ANSI 16-color scheme: K, R, G, Y, B, M, C, W, and their bright variants.

![Traditional 16-color scheme](/assets/202403/fig09.png){:.centered}
*Traditional 16-color scheme*

These default terminal color settings usually have <span style="color: #0000ff; background: #000000;">blue that's too dark</span>. <span style="color: #00ff00; background: #000000;">Green is too vibrant</span> and hurts my eyes. 🥶

And there are [tons of](https://gogh-co.github.io/Gogh/) [custom color schemes](https://github.com/AlexAkulov/putty-color-themes) [being shared](https://iterm2colorschemes.com/), each made to their taste and senses.

But none of them fulfill my eyes. Common problems are:

- Name and color not matching (Red is magenta, blue is purple... etc)
- Some colors are buried in the background and hard to see
- 'Bright' colors are not defined, or messed up


## New Standard Terminal color scheme 🌈

If it doesn't exist, let's create it.

> Let's reduce excessive brightness, chroma difference of the traditional terminal color scheme.

So we can get a new color scheme that is standard-looking and well-visible.


### First step: Brighten up without changing hue

Let's start by increasing the lightness of the blue color.

![0,0,255 Blue](/assets/202403/cpimge1.jpg)  
Even with the maximum B value, <span style="color: #0000ff; background: #000000;">■(0,0,255)</span> it's still too dark.

![100,100,255 Blue](/assets/202403/cpimge2.jpg)  
If we increase R, G to raise the lightness, <span style="color: #6464ff; background: #000000;">■(100,100,255)</span> does get brighter, but a reddish tint starts to appear.

We're in trouble from the start. 🤦


## Color Appearance Model (CAM)

As you saw above, the human vision system does not respond linearly to the RGB value. Hue varies even if the same amount of R, G value changed.

This is where we need a [CAM](https://en.wikipedia.org/wiki/Color_appearance_model). If you're interested in the [latest CSS standards](https://www.w3.org/TR/css-color-4/), you might have heard of [Oklab](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklab) and [Oklch](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), which are also CAMs.

![Color planes](/assets/202403/img1.png){:.centered}
*Left: Without CAM / Right: With Oklch*

The lightness of the color plane is uneven with HSV (left). But with CAM, it became uniform (right).

Let's look at the blue again using the [Oklch color picker](https://bottosson.github.io/misc/colorpicker/#0000ff).  
![Color planes](/assets/202403/pimg2.png){:.centered}
*Left: Without CAM / Right: With Oklch*

Compared to the top <span style="color: #0000ff; background: #000000;">■ #0000ff</span>, while the left palette shows a reddish tint, the right palette using Oklch shows more appropriate blue color.


### Again, First Step: Brighten up without changing hue

By increasing the lightness using Oklch, <span style="color: #487fff; background: #000000;">■(72,127,255)</span>, the reddish tint is gone. It finally looks like a bright blue.

Using a CAM allows us to handle colors in a way that human perception works.

So from now on, I will tweak the terminal color scheme using a CAM.
The goal is to maintain the hue while reducing extreme differences in lightness.


### CAM16-UCS

The CAM I'll use is CAM16-UCS (Color Appearance Model 2016 - Uniform Color Space).

![CAM16-UCS color gamut](/assets/202403/cam16-ucs-3d.png){:.centered}{:width="600"}
*Image source: [ColorAide Documentation](https://facelessuser.github.io/coloraide/colors/cam16_ucs/)*

It represents color using 3 values: J (lightness), a (red-green), b (yellow-blue).

(Conventionally, Lightness is denoted as `L*` or `J` to distinguish it from Luminance `L`)

By converting the J, a, b Cartesian coordinates (x, y, z) to cylindrical coordinates (r, Φ, z), we get the 3 components of the color we want to use:

![HSL color cylinder](/assets/202403/HSL_color_solid_cylinder_saturation_gray.png){:.centered}{:width="400"}
*Image source: [HSL and HSV - Wikipedia](https://en.wikipedia.org/wiki/HSL_and_HSV)*

J: Lightness  
C: Chroma  
h: Hue

(The diagrams below are for understanding purposes and may differ from the actual CAM and colors.)


## Color Adjustment 🖌️

Base is [xterm's default color setting](https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit).

I'll use the Python [colour-science](https://www.colour-science.org) package for color conversion. (sRGB → CAM16-UCS)

```python
import colour  # colour-science

# Convert to CAM16-UCS-JCh
xyz = colour.sRGB_to_XYZ(color_rgb/255)
jab = colour.XYZ_to_CAM16UCS(xyz)
color_jch = colour.models.Jab_to_JCh(jab)
```

Then we separate J, C, h.

```python
j = color_jch[..., 0]
c = color_jch[..., 1]
h = color_jch[..., 2]
```


### Lightness

Let's start by reducing the gap between the too-dark blue and too-bright green. I'll Thanos it by half.

(Note: 'Dimidium' is Latin for 'half'.)

```python
j_mean = np.mean(j[2:8])
j[2:8] = (j[2:8] + j_mean) / 2  # colors

j_mean = np.mean(j[10:16])
j[10:16] = (j[10:16] + j_mean) / 2  # bright colors
```

![Before lightness adjust](/assets/202403/cmp-lightness0.png){:.centered}

![After lightness adjust](/assets/202403/cmp-lightness1.png){:.centered}

The lightness difference is not entirely removed. Doing so would reduce the color distinction and worsen the clipping issue I'll explain later, making the result look strange.


### Hue

When we plot the colors on a plane, the angular spacing (=hue difference) is uneven.
Yellow, in particular, is skewed towards green.

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

The adjusted colors include out-of-gamut values like RGB(-32,266,128) that cannot be displayed on SDR displays. It's something like over/under-exposure clipping in photography.

To fix this, first, let's halve the chroma difference.

```python
# Normalize chroma
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

![Result color scheme](/assets/202403/fig13.png){:.centered}

![Preview of the result](/assets/202403/timg3.png){:.centered}

It's close to the standard while ensuring all colors are well visible.

The reduced lightness difference makes red and blue more visible, and the oversaturation of cyan and green is gone.


## Additional Adjustments

Some subjective adjustments to improve readability and color distinction:

### Background Color
<p style="color: #bab7b6; background: #000000;">
A pure (0,0,0) black background is known to be bad for readability.
</p>
<p style="color: #bab7b6; background: #141414;">
I changed the background to a near-black gray (20,20,20).
</p>

### Enhancing Color Distinction

I added a slight hue separation between the 'normal' and 'bright' colors to make them more distinguishable.

```python
# Set hue(mean delta to original is about 3)
h[2:8] = (30, 150, 90, 270, 330, 210)
h[2:8] -= 10  # Originally was +3

h[10:16] = (30, 150, 90, 270, 330, 210)
h[10:16] += 3
```

![Before lightness adjust](/assets/202403/fig42.png) | ![After lightness adjust](/assets/202403/fig43.png)
:---: | :---:
Before: Little difference between normal/bright | After: Normal/bright more distinct


### Final Result ✨

![Dimidium color scheme](/assets/202403/fig14.png){:.centered}
*Dimidium color scheme*

![Dimidium in terminal](/assets/202403/timg4.png){:.centered}
*Dimidium in the terminal*

![compare image](/assets/202403/compare-animated-gif-maker.gif){:.centered}
*Comparison with the traditional color scheme*

🔍 [More preview](https://htmlpreview.github.io/?https://github.com/dofuuz/dimidium/blob/main/preview/tty-preview-nobold.html)


## Download Settings 🛠️⬇️

You can download the color scheme settings for terminals here.  

<https://github.com/dofuuz/dimidium>


## Further readings

[Color appearance model - Wikipedia](https://en.wikipedia.org/wiki/Color_appearance_model)

[Roseus colormap](https://github.com/dofuuz/roseus) - perceptually uniform colormap made by me


### Code

The Python code used for color generation and visualization:

[Colab](https://colab.research.google.com/drive/1BZ26_QMkFRFsBzrRvCLGu10bw2inz947?usp=sharing) (May be outdated. Use code at Github to develop with.)

[Github](https://github.com/dofuuz/dimidium)


### Try Color Appearance Models

You don't need to know Python to use CAMs. You can experiment with CAMs at these sites.

[OKLCH Color Picker & Converter](https://oklch.com/)

[Interactive color picker comparison](https://bottosson.github.io/misc/colorpicker)

[CSS HD Gradients](https://gradient.style/)

[Color picker for any color space - Color.js](https://colorjs.io/apps/picker/)
