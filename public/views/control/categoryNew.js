function mediaThumbClicked(e, groupType) {
  e.preventDefault();
  e.stopPropagation();
  debug("mediaThumbClicked");
  const panel = mediaPreviewPanel("new-category-media-select");
  panel.setSelectionMode("single");
  panel.setSelectionType(groupType);
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
  panel.setSelectionType();
  panel.unregisterSelectionCallback(mediaPreviewSelection);
  if (!item) return;
  target.innerHTML = "";
  target.setAttribute("type", item.type);
  target.id = item.id;
  if (item.type == "image") {
    target.style.backgroundImage = `url('/image/${item.id}?width=1920')`;
    sessionStorage.setItem("category-thumb-preview", item.id);
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

function createNewCategory(e) {
  e.preventDefault();
  e.stopPropagation();
  const panel = document.querySelector("#new-category");
  const target = panel.getAttribute("target");
  const caption = panel.querySelector("#caption");
  const image = panel.querySelector(".thumb-preview");
  const desc = panel.querySelector("#description");
  const galleryItems =
    target == "gallery"
      ? galleryPreviewPanel("gallery-item-gallery").getItems()
      : null;
  const published = panel.querySelector(".checkbox-container input").checked;

  return fetch(`/${target}/category/create`, {
    method: "POST",
    body: JSON.stringify({
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
      gallery: galleryItems,
      published: published
    }),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      sessionStorage.removeItem(`category-caption`);
      sessionStorage.removeItem(`category-thumb-preview`);
      sessionStorage.removeItem(`category-description`);
      sessionStorage.removeItem(`category-gallery-item-gallery`);
      location.assign(`/${target}`);
    });
}

function updateCategory(e, id) {
  e.preventDefault();
  e.stopPropagation();
  const panel = document.querySelector("#new-category");
  const target = panel.getAttribute("target");
  const caption = panel.querySelector("#caption");
  const image = panel.querySelector(".thumb-preview");
  const desc = panel.querySelector("#description");
  const galleryItems =
    target == "gallery"
      ? galleryPreviewPanel("gallery-item-gallery").getItems()
      : null;
  const published = panel.querySelector(".checkbox-container input").checked;

  return fetch(`/${target}/category/update`, {
    method: "POST",
    body: JSON.stringify({
      id: id,
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
      gallery: galleryItems,
      published: published
    }),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      sessionStorage.removeItem(`category-caption`);
      sessionStorage.removeItem(`category-thumb-preview`);
      sessionStorage.removeItem(`category-description`);
      sessionStorage.removeItem(`category-gallery-item-gallery`);
      location.assign(`/${target}`);
    });
}

function galleryItemSelection() {
  debug("galleryItemSelection");
  const panel = this;
  panel.hide();
  const items = panel.getSelected();
  debug(items);
  panel.clearSelection();
  panel.unregisterSelectionCallback(galleryItemSelection);

  if (!items || items.length == 0) return;

  const gallery = galleryPreviewPanel("gallery-item-gallery");
  gallery.addItems(items);
  sessionStorage.setItem("category-gallery-item-gallery", JSON.stringify(items));
}

function setupAddGalleryItem() {
  document.querySelector(
    "#gallery-item-gallery #new-gallery-item"
  ).onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const panel = mediaPreviewPanel("new-category-media-select");
    panel.setSelectionMode("multi");
    panel.registerSelectionCallback(galleryItemSelection);
    panel.show();
  };
}

function applyTempValues(){

  debug("onload new category");
  if (typeof (Storage) !== "undefined") {
    let panel = document.querySelector("#new-category");
    let caption = panel.querySelector("#caption");
    let image = panel.querySelector(".thumb-preview");
    let desc = panel.querySelector("#description");
    let galerry = galleryPreviewPanel("gallery-item-gallery");

    const caption_value = sessionStorage.getItem(`category-caption`);
    const image_value = sessionStorage.getItem(`category-thumb-preview`);
    const desc_value = sessionStorage.getItem(`category-description`);
    const galerry_value = sessionStorage.getItem(`category-gallery-item-gallery`);

    if (caption_value) {
      caption.value = caption_value;
    }
    if (image_value) {
      image.id = image_value;
      image.setAttribute("type", "image");
      image.style.backgroundImage = `url(/image/${image_value}?width=1920)`;
    }
    if (desc_value) {
      desc.value = desc_value;
    }
    if (galerry_value) {
      galerry.addItems(JSON.parse(galerry_value));
    }

    caption.addEventListener("change", () => {
      sessionStorage.setItem("category-caption", caption.value);
    });
    desc.addEventListener("change", () => {
      sessionStorage.setItem("category-description", desc.value);
    });
  }
}