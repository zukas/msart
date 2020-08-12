function mediaThumbClicked(e, groupType) {
  e.preventDefault();
  e.stopPropagation();
  debug("mediaThumbClicked");
  const panel = mediaPreviewPanel("new-shop-item-media-select");
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
  panel.unregisterSelectionCallback(mediaPreviewSelection);
  if (!item) return;
  target.innerHTML = "";
  target.setAttribute("type", item.type);
  target.id = item.id;
  if (item.type == "image") {
    target.style.backgroundImage = `url('/image/${item.id}?width=1920')`;
    sessionStorage.setItem("shop-thumb-preview", item.id);
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
  sessionStorage.setItem("shop-new-shop-item-gallery", JSON.stringify(items));
}

function setupAddGalleryItem() {
  document.getElementById("new-gallery-item").onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const panel = mediaPreviewPanel("new-shop-item-media-select");
    panel.setSelectionMode("multi");
    panel.registerSelectionCallback(galleryItemSelection);
    panel.show();
  };
}

function setupCategorySelect() {
  const panel = categoryPreviewPopup("new-shop-item-category-select");
  panel.registerSelectionCallback(() => {
    sessionStorage.setItem(`shop-new-shop-item-category-select-panel`, JSON.stringify(panel.getSelected()));
  })
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
  const published = panel.querySelector(".checkbox-container input").checked;

  return fetch(`/shop/item/create`, {
    method: "POST",
    body: JSON.stringify({
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
      price: price.value,
      gallery: galerryItems,
      categories: categories,
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
      sessionStorage.removeItem(`shop-caption`);
      sessionStorage.removeItem(`shop-thumb-preview`);
      sessionStorage.removeItem(`shop-description`);
      sessionStorage.removeItem(`shop-price`);
      sessionStorage.removeItem(`shop-new-shop-item-gallery`);
      sessionStorage.removeItem(`shop-new-shop-item-category-select-panel`);
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
  const published = panel.querySelector(".checkbox-container input").checked;

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
      sessionStorage.removeItem(`shop-caption`);
      sessionStorage.removeItem(`shop-thumb-preview`);
      sessionStorage.removeItem(`shop-description`);
      sessionStorage.removeItem(`shop-price`);
      sessionStorage.removeItem(`shop-new-shop-item-gallery`);
      sessionStorage.removeItem(`shop-new-shop-item-category-select-panel`);
      location.assign(`/shop`);
    });
}

function applyTempValues(){
  debug("onload new shop item");
  if (typeof (Storage) !== "undefined") {
    let panel = document.querySelector("#new-shop-item");
    let caption = panel.querySelector("#caption");
    let image = panel.querySelector(".thumb-preview");
    let desc = panel.querySelector("#description");
    let price = panel.querySelector("#price");
    let galerry = galleryPreviewPanel("new-shop-item-gallery");
    let categories = categoryPreviewPanel(
      "new-shop-item-category-select-panel"
    );
    const caption_value = sessionStorage.getItem(`shop-caption`);
    const image_value = sessionStorage.getItem(`shop-thumb-preview`);
    const desc_value = sessionStorage.getItem(`shop-description`);
    const price_value = sessionStorage.getItem(`shop-price`);
    const galerry_value = sessionStorage.getItem(`shop-new-shop-item-gallery`);
    const categories_value = sessionStorage.getItem(`shop-new-shop-item-category-select-panel`);

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
    if (price_value) {
      price.value = price_value;
    }
    if (galerry_value) {
      galerry.addItems(JSON.parse(galerry_value));
    }
    if (categories_value) {
      categories.setSelected(JSON.parse(categories_value));
    }

    caption.addEventListener("change", () => {
      sessionStorage.setItem("shop-caption", caption.value);
    });
    desc.addEventListener("change", () => {
      sessionStorage.setItem("shop-description", desc.value);
    });
    price.addEventListener("change", () => {
      sessionStorage.setItem("shop-price", price.value);
    });
  }

}