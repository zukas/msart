function VideoUploadController(
  frame,
  addBtn,
  saveBtn,
  cancelBtn,
  input,
  preview
) {
  let self = this;
  let videos = [];
  const exp = new RegExp("https?://\\w+.\\w+/(.+)");

  self.add = url => {
    const res = exp.exec(url);
    if (res && res.length == 2) {
      const source = `https://www.youtube.com/embed/${res[1]}`;
      videos.push(source);

      let div = document.createElement("div");
      div.className = "preview-thumb";
      let frame = document.createElement("iframe");
      frame.src = source;
      frame.frameborder = 0;
      frame.allow =
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      frame.setAttribute("allowfullscreen", "");
      div.appendChild(frame);
      return div;
    } else {
      return null;
    }
  };

  self.publish = () => {
    const data = videos.map(src => {
      return {
        url: src
      };
    });
    debug(data);
    return fetch("/manager/upload/videos", {
      method: "POST",
      body: JSON.stringify({ videos: data }),
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then(res => debug(res))
      .catch(err => debug(err));
  };

  self.clear = () => {
    videos = [];
    preview.innerHTML = "";
    input.value = "";
  };

  self.show = () => {
    frame.style.display = "block";
  };

  self.hide = () => {
    frame.style.display = "";
  };

  addBtn.addEventListener("click", event => {
    event.preventDefault();
    const res = self.add(input.value);
    if (res) {
      preview.appendChild(res);
    } else {
      input.setAttribute("error", 1);
    }
    input.value = "";
  });

  input.addEventListener("change", () => {
    input.removeAttribute("error");
  });

  saveBtn.addEventListener("click", event => {
    event.preventDefault();
    self.hide();
    self
      .publish()
      .then(() => {
        self.clear();
        location.reload();
      })
      .catch(e => {
        debug("video upload error =", e);
      });
  });

  cancelBtn.addEventListener("click", event => {
    event.preventDefault();
    self.hide();
    self.clear();
  });
}

function videoUploadPanel(id) {
  return document.fetchFeature("videoUploadPanel", `id-${id}`);
}

function createVideoUploadPanel(id) {
  const frame = document.querySelector(`#${id}`);
  const addBtn = frame.querySelector("#video-url-add");
  const saveBtn = frame.querySelector("#video-upload-save");
  const cancelBtn = frame.querySelector("#video-upload-cancel");
  const input = frame.querySelector("#video-url");
  const preview = frame.querySelector("#video-upload-preview-container");

  const obj = new VideoUploadController(
    frame,
    addBtn,
    saveBtn,
    cancelBtn,
    input,
    preview
  );
  document.attachFeature("videoUploadPanel", `id-${id}`, obj);
}
