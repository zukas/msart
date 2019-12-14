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

function createNewCategory(e) {
  e.preventDefault();
  e.stopPropagation();
  const panel = document.querySelector("#new-category");
  const target = panel.getAttribute("target");
  const caption = panel.querySelector("#caption");
  const image = panel.querySelector(".thumb-preview");
  const desc = panel.querySelector("#description");

  return fetch(`/${target}/category/create`, {
    method: "POST",
    body: JSON.stringify({
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
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

  return fetch(`/${target}/category/update`, {
    method: "POST",
    body: JSON.stringify({
      id: id,
      caption: caption.value,
      thumb: image.id,
      description: desc.value,
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
      location.assign(`/${target}`);
    });
}
