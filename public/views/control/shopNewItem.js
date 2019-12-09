function mediaThumbClicked(e) {
  e.preventDefault();
  e.stopPropagation();
  debug("mediaThumbClicked");
  const panel = mediaPreviewPanel("new-shop-item-media-select");
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

function galleryItemSelection() {
  debug("galleryItemSelection");
  const panel = this;
  panel.hide();
  const items = panel.getSelected();
  debug(items);
  panel.clearSelection();
  panel.unregisterSelectionCallback(galleryItemSelection);

  if (!items || items.length == 0) return;

  const gallery = galleryPreviewPanel("new-shop-item-gallery");
  gallery.addItems(items);
}

function setupAddGalleryItem() {
  document.getElementById("new-gallery-item").onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const panel = mediaPreviewPanel("new-shop-item-media-select");
    panel.setSelectionMode("multi");
    panel.registerSelectionCallback(galleryItemSelection);
    panel.show();
  };
}

function createShopItem(e) {
  e.preventDefault();
  e.stopPropagation();
  const panel = document.querySelector("#new-shop-item");
  const caption = panel.querySelector("#caption");
  const image = panel.querySelector(".thumb-preview");
  const desc = panel.querySelector("#description");
  const price = panel.querySelector("#price");
  const galerryItems = galleryPreviewPanel("new-shop-item-gallery").getItems();
  const categories = categoryPreviewPanel(
    "new-shop-item-category-select-panel"
  ).getSelected();

  return fetch(`/shop/item/create`, {
    method: "POST",
    body: JSON.stringify({
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
      price: price.value,
      gallery: galerryItems,
      categories: categories,
      published: true
    }),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      location.assign(`/shop`);
    });
}

function updateShopItem(e, id) {
  e.preventDefault();
  e.stopPropagation();
  debug("updateShopItem", id);

  const panel = document.querySelector("#new-shop-item");
  const caption = panel.querySelector("#caption");
  const image = panel.querySelector(".thumb-preview");
  const desc = panel.querySelector("#description");
  const price = panel.querySelector("#price");
  const galerryItems = galleryPreviewPanel("new-shop-item-gallery").getItems();
  const categories = categoryPreviewPanel(
    "new-shop-item-category-select-panel"
  ).getSelected();

  return fetch(`/shop/item/update`, {
    method: "POST",
    body: JSON.stringify({
      id: id,
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
      price: price.value,
      gallery: galerryItems,
      categories: categories,
      published: true
    }),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      location.assign(`/shop`);
    });
}
