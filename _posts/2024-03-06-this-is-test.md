---
layout: post
title:  "Test post"
date:   2024-03-06 23:44:00 +0900
categories: jekyll update
---
TL;DR:
Using color appearance model, we can deal with with human color perception scientifically.  
With this, I made standard-looking terminal color scheme having uniform visibility across all colors.  
(Preview, Downloads)

![compare image](/assets/202403/compare-animated-gif-maker.gif)

Modern terminals can use 24-bit(16,777,216) colors, but many applications still use ANSI 16 color scheme: black, red, green, yellow, blue, magenta, cyan, white, and their bright varients.

Usually default 16 color scheme has too dark blue. Green is too vibrant, so eyes is soreing.

So there are many many alternative color scheme available:  
https://gogh-co.github.io/Gogh/  
https://github.com/AlexAkulov/putty-color-themes

But none of them fullfill my eye. Common problems are:

- Name and color does not match (Red is magenta, blue is purple... etc)
- Some color is not clearly visible (not enough contrast with background)
- 'Bright' colors are not defined, or mess

In this post, I'll introduce color appearance model, then, adjust the 16 default terminal colors using the CAM.

## New standard terminal color scheme

> Let's reduce excessive brightness, chroma difference.

So we can get new standard color scheme that standard-looking and well visible.

### First step: Brighten up without shifting hue

Maxing out B, 0,0,255 still dark.

Ugh, 

As you saw, human vision system does not react linearly with RGB value. Hue varies even if same amount of R, G value changed.

(Still writing...)
