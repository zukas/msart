function mediaThumbClicked(e, groupType) {
  e.preventDefault();
  e.stopPropagation();
  debug("mediaThumbClicked");
  const panel = mediaPreviewPanel("about-thumb-media-select");
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

function saveAbout(e) {
  e.preventDefault();
  e.stopPropagation();
  debug("saveAbout", e);
  const form = document.getElementById("about-data");
  const thumb = form.querySelector(".thumb-preview").id;
  const desc = form.querySelector("#description").value;

  const data = { thumb: thumb, desc: desc };
  debug("saveAbout", data);

  return fetch(`/about/set`, {
    method: "POST",
    body: JSON.stringify(data),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      debug("saveAbout::response", response);
      return response.json();
    })
    .then(r => {
      debug("saveAbout::response - parsed", r);
    });
}

function sendMessage(e) {
  e.preventDefault();
  e.stopPropagation();
  debug("sendMessage", e);
  const form = document.getElementById("form");
  const name = form.querySelector("#name").value;
  const email = form.getElementById("#email").value;
  const msg = form.getElementById("#message").value;

  const data = { name: name, email: email, msg: msg };
  debug("sendMessage", data);

  return fetch(`/contact/send`, {
    method: "POST",
    body: JSON.stringify(data),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      debug("sendMessage::response", response);
      form.querySelector("#name").value = "";
      form.getElementById("#email").value = "";
      form.getElementById("#message").value = "";
      return response.json();
    })
    .then(r => {
      debug("sendMessage::response - parsed", r);
    });
}
