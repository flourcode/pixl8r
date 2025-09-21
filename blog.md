---
layout: default
title: Blog
---

<div class="blog-container">

    <div class="blog-main">
        <h1>The PIXL8R Blog</h1>
        <p>Welcome to the official blog! Here you'll find tips, tutorials, and news about pixel art and the PIXL8R tool.</p>
        <hr>
        <h2>All Posts</h2>
        <ul>
          {% for post in site.posts %}
            <li>
              <h3><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></h3>
              <p>{{ post.excerpt }}</p>
              <p><small>Posted on: {{ post.date | date: "%B %d, %Y" }}</small></p>
            </li>
          {% endfor %}
        </ul>
    </div>

    <aside class="blog-sidebar">
        </aside>

</div>
