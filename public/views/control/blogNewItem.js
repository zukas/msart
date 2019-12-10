const uniqueID = (() => {
  let id = 0;
  return () => {
    return id++;
  };
})();

function BlogItemCreator(caption, thumb, description, categories) {
  let self = this;
  let sectionsList = [];
  let sectionsFn = {};

  self.addSection = (id, dataAccessFn) => {
    sectionsList.push(id);
    sectionsFn[id] = dataAccessFn;
  };

  self.removeSection = id => {
    const idx = sectionsList.indexOf(id);
    sectionsList.splice(idx, 1);
    delete sectionsFn[id];
  };

  self.moveSectionUp = id => {
    const idx = sectionsList.indexOf(id);
    sectionsList.splice(idx, 1);
    sectionsList.splice(idx - 1, 0, id);
  };

  self.moveSectionDown = id => {
    const idx = sectionsList.indexOf(id);
    sectionsList.splice(idx, 1);
    sectionsList.splice(idx + 1, 0, id);
  };

  self.getData = () => {
    let sections = [];
    sectionsList.forEach(id => {
      sections.push(sectionsFn[id]());
    });

    const data = {
      caption: caption.value,
      thumb: thumb.id,
      description: description.value,
      categories: categories.getSelected(),
      published: true,
      sections: sections
    };

    debug(data);
    return data;
  };
}

function mediaThumbClicked(e) {
  e.preventDefault();
  e.stopPropagation();
  debug("mediaThumbClicked");
  const panel = mediaPreviewPanel("new-blog-item-media-select");
  panel.setSelectionMode("single");
  panel.registerSelectionCallback(mediaPreviewSelection, e.target);
  panel.show();
}

function mediaPreviewSelection(target) {
  debug("mediaPreviewSelection");
  const panel = this;
  panel.hide();
  const item = panel.getSelected();
  debug(item);
  panel.clearSelection();
  panel.unregisterSelectionCallback(mediaPreviewSelection);
  if (!item) return;
  target.innerHTML = "";
  target.setAttribute("type", item.type);
  target.id = item.id;
  if (item.type == "image") {
    target.style.backgroundImage = `url('/image/${item.id}?width=640')`;
  } else if (item.type == "video" && item.src) {
    let video = document.createElement("iframe");
    video.src = item.src;
    video.frameBorder = 0;
    video.allow =
      "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    video.allowFullscreen = "allowfullscreen";
    target.style.backgroundImage = `url('')`;
    target.appendChild(video);
  }
}

function createBlogManager() {
  const panel = document.querySelector("#new-blog-item");
  const caption = panel.querySelector("#caption");
  const image = panel.querySelector(".thumb-preview");
  const desc = panel.querySelector("#description");
  const categories = categoryPreviewPanel(
    "new-blog-item-category-select-panel"
  );

  const obj = new BlogItemCreator(caption, image, desc, categories);
  document.attachFeature("blogManager", "id-create-blog-manager", obj);
}

function blogManager() {
  return document.fetchFeature("blogManager", "id-create-blog-manager");
}

function createBlogItem(e) {
  e.preventDefault();
  e.stopPropagation();

  return fetch(`/blog/item/create`, {
    method: "POST",
    body: JSON.stringify(blogManager().getData()),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      location.assign(`/blog`);
    });
}

function addSection(id, root, content) {
  function nextSibling(elem, selector) {
    let sibling = elem.nextElementSibling;
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.nextElementSibling;
    }
    return null;
  }

  function prevSibling(elem, selector) {
    let sibling = elem.previousElementSibling;
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.previousElementSibling;
    }
    return null;
  }

  function recalcSectionPositions(root) {
    root
      .querySelectorAll(".blog-section-wrapper")
      .forEach((elem, idx, list) => {
        elem.classList.remove("first", "last");
        if (idx == 0) {
          elem.classList.add("first");
        }
        if (idx == list.length - 1) {
          elem.classList.add("last");
        }
      });
  }

  const fragment = document.createDocumentFragment();
  {
    const container = document.createElement("div");
    container.className = "blog-section-wrapper";
    {
      const controls = document.createElement("div");
      controls.className = "blog-section-ctl-wrapper";
      {
        const up = document.createElement("div");
        up.className = "blog-section-ctl up";
        up.innerHTML = "&#8613;";
        up.onclick = () => {
          const prev = prevSibling(container, ".blog-section-wrapper");
          if (prev) {
            const parent = container.parentNode;
            parent.removeChild(container);
            parent.insertBefore(container, prev);
            recalcSectionPositions(parent);
            blogManager().moveSectionUp(id);
          }
        };
        controls.appendChild(up);

        const down = document.createElement("div");
        down.className = "blog-section-ctl down";
        down.innerHTML = "&#8615;";
        down.onclick = () => {
          const next = nextSibling(container, ".blog-section-wrapper");
          if (next) {
            const parent = container.parentNode;
            parent.removeChild(next);
            parent.insertBefore(next, container);
            recalcSectionPositions(parent);
            blogManager().moveSectionDown(id);
          }
        };
        controls.appendChild(down);

        const del = document.createElement("div");
        del.className = "blog-section-ctl del";
        del.innerHTML = "&#10005;";
        del.onclick = () => {
          const parent = container.parentNode;
          parent.removeChild(container);
          if (content.ondelete) {
            content.ondelete();
          }
          blogManager().removeSection(id);
          recalcSectionPositions(parent);
        };
        controls.appendChild(del);
      }
      container.appendChild(controls);
      container.appendChild(content);

      const br = document.createElement("br");
      container.appendChild(br);
    }
    fragment.appendChild(container);
  }

  root.parentNode.insertBefore(fragment, root);

  recalcSectionPositions(root.parentNode);
}

function addBlogHeaderSection(root, data) {
  debug("addBlogHeaderSection", root);

  const id = `blog-header-section-${uniqueID()}`;

  const fragment = document.createDocumentFragment();

  const input = document.createElement("input");
  input.className = "text";
  input.type = "text";
  if (data) {
    input.value = data;
  }
  fragment.appendChild(input);
  addSection(id, root, fragment);
  blogManager().addSection(id, () => {
    return { type: "header", data: input.value };
  });
}

function addBlogTextSection(root, data) {
  debug("addBlogTextSection", root);

  const id = `blog-text-section-${uniqueID()}`;

  const fragment = document.createDocumentFragment();

  const textarea = document.createElement("textarea");
  textarea.className = "text";
  textarea.type = "text";
  if (data) {
    textarea.value = data;
  }
  fragment.appendChild(textarea);

  addSection(id, root, fragment);
  blogManager().addSection(id, () => {
    return { type: "text", data: textarea.value };
  });
}

function addBlogMediaSection(root, data) {
  debug("addBlogMediaSection", root);

  const id = `blog-media-section-${uniqueID()}`;

  const fragment = document.createDocumentFragment();

  const mediaThumb = document.createElement("div");
  mediaThumb.className = "thumb-preview";
  mediaThumb.onclick = mediaThumbClicked;
  if (data) {
    mediaThumb.id = data.id;
    mediaThumb.setAttribute("type", data.type);
    if (data.type == "image") {
      mediaThumb.style.backgroundImage = `url(/image/${data.id})`;
    } else if (data.type == "video") {
      const videoFrame = document.createElement("iframe");
      videoFrame.frameBorder = 0;
      videoFrame.allow =
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      videoFrame.allowFullscreen = "allowfullscreen";
      videoFrame.src = data.src;
      mediaThumb.appendChild(videoFrame);
    }
  }
  fragment.appendChild(mediaThumb);

  addSection(id, root, fragment);
  blogManager().addSection(id, () => {
    const type = mediaThumb.getAttribute("type");
    debug(mediaThumb);
    debug(type);
    return {
      type: "media",
      data:
        type == "video"
          ? {
              id: mediaThumb.id,
              type: type,
              src: mediaThumb.querySelector("iframe").src
            }
          : { id: mediaThumb.id, type: type }
    };
  });
}

function addBlogGallerySection(root, data) {
  debug("addBlogGallerySection", root);

  const id = `blog-gallery-section-${uniqueID()}`;

  const fragment = document.createDocumentFragment();
  {
    const galleryContainer = document.createElement("div");
    galleryContainer.id = id;
    galleryContainer.ondelete = () => {
      destroyGalleryPreviewPanel(id);
    };
    galleryContainer.className = "gallery-container";
    {
      const galleryItemContainer = document.createElement("span");
      galleryItemContainer.className = "gallery-item-container";
      {
        const galleryItem = document.createElement("div");
        galleryItem.className = "gallery-item";
        {
          const galleryItemPreview = document.createElement("div");
          galleryItemPreview.className = "gallery-item-preview";
          galleryItemPreview.setAttribute("type", "new");
          galleryItem.appendChild(galleryItemPreview);
        }
        galleryItemContainer.appendChild(galleryItem);

        const galleryNavBtnPrev = document.createElement("a");
        galleryNavBtnPrev.className = "gallery-nav-btn prev";
        galleryNavBtnPrev.innerHTML = "&#10094;";
        galleryItemContainer.appendChild(galleryNavBtnPrev);

        const galleryNavBtnNext = document.createElement("a");
        galleryNavBtnNext.className = "gallery-nav-btn next";
        galleryNavBtnNext.innerHTML = "&#10095;";
        galleryItemContainer.appendChild(galleryNavBtnNext);
      }
      galleryContainer.appendChild(galleryItemContainer);

      const galleryCaptionContainer = document.createElement("div");
      galleryCaptionContainer.className = "gallery-caption-container";
      {
        const galleryItemCaption = document.createElement("p");
        galleryItemCaption.className = "gallery-item-caption";
        galleryCaptionContainer.appendChild(galleryItemCaption);
      }
      galleryContainer.appendChild(galleryCaptionContainer);

      const galleryThumbRow = document.createElement("div");
      galleryThumbRow.className = "gallery-thumb-row";
      {
        const galleryThumbScrollRow = document.createElement("div");
        galleryThumbScrollRow.className = "gallery-thumb-scroll-row";
        {
          const galleryThumbInnerRow = document.createElement("div");
          galleryThumbInnerRow.className = "gallery-thumb-inner-row";
          {
            const galleryThumbColumn = document.createElement("div");
            galleryThumbColumn.className = "gallery-thumb-column";
            {
              const galleryThumbPreview = document.createElement("div");
              galleryThumbPreview.className = "gallery-thumb-preview";
              galleryThumbPreview.setAttribute("type", "new");

              galleryThumbColumn.appendChild(galleryThumbPreview);
            }
            galleryThumbInnerRow.appendChild(galleryThumbColumn);
          }
          galleryThumbScrollRow.appendChild(galleryThumbInnerRow);
        }
        galleryThumbRow.appendChild(galleryThumbScrollRow);

        const galleryThumbNavBtnPrev = document.createElement("div");
        galleryThumbNavBtnPrev.className = "gallery-thumb-nav-btn prev";
        galleryThumbNavBtnPrev.innerHTML = "&#10094;";
        galleryThumbRow.appendChild(galleryThumbNavBtnPrev);

        const galleryThumbNavBtnNext = document.createElement("div");
        galleryThumbNavBtnNext.className = "gallery-thumb-nav-btn next";
        galleryThumbNavBtnNext.innerHTML = "&#10095;";
        galleryThumbRow.appendChild(galleryThumbNavBtnNext);
      }
      galleryContainer.appendChild(galleryThumbRow);
    }
    fragment.appendChild(galleryContainer);
  }

  addSection(id, root, fragment);

  createGalleryPreviewPanel(id);

  setupAddGalleryItem(id);

  if (data) {
    galleryPreviewPanel(id).addItems(data);
  }

  blogManager().addSection(id, () => {
    return { type: "gallery", data: galleryPreviewPanel(id).getItems() };
  });
}

function galleryItemSelection(id) {
  debug("galleryItemSelection");
  const panel = this;
  panel.hide();
  const items = panel.getSelected();
  debug(items);
  panel.clearSelection();
  panel.unregisterSelectionCallback(galleryItemSelection);

  if (!items || items.length == 0) return;

  const gallery = galleryPreviewPanel(id);
  gallery.addItems(items);
}

function setupAddGalleryItem(id) {
  document.querySelector(
    `#${id} .gallery-item-preview[type='new']`
  ).onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const panel = mediaPreviewPanel("new-blog-item-media-select");
    panel.setSelectionMode("multi");
    panel.registerSelectionCallback(galleryItemSelection, id);
    panel.show();
  };
}

function updateBlogItem(e, id) {
  e.preventDefault();
  e.stopPropagation();

  let blogItem = blogManager().getData();
  blogItem.id = id;

  return fetch(`/blog/item/update`, {
    method: "POST",
    body: JSON.stringify(blogItem),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      location.assign(`/blog`);
    });
}
