---
layout: default
title: Blog
---

# The PIXL8R Blog

Welcome to the official blog! Here you'll find tips, tutorials, and news about pixel art and the PIXL8R tool.

---

## All Posts

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></h3>
      <p>{{ post.excerpt }}</p>
      <p><small>Posted on: {{ post.date | date: "%B %d, %Y" }}</small></p>
    </li>
  {% endfor %}
</ul>
