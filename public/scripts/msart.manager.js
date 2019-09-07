(root => {
  "use strict";

  function VideoUploadController() {
    let self = this;
    let videos = [];
    const exp = new RegExp("https?://\\w+.\\w+/(.+)");

    self.add = url => {
      const res = exp.exec(url);
      if (res && res.length == 2) {
        const source = `https://www.youtube.com/embed/${res[1]}`;
        videos.push(source);

        let frame = document.createElement("iframe");
        frame.className = "preview-thumb";
        frame.src = source;
        frame.frameborder = 0;
        frame.allow =
          "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
        frame.setAttribute("allowfullscreen", "");
        return frame;
      } else {
        return null;
      }
    };

    self.publish = () => {
      console.log(videos);
      return fetch("/manager/upload/videos", {
        method: "POST",
        body: JSON.stringify({ videos: videos }),
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json"
        }
      }).then(response => response.json());
    };

    self.clear = () => {
      videos = [];
    };
  }

  root.addEventListener("load", () => {
    const videoUploadController = new VideoUploadController();

    const imageUpload = document.getElementById("image-upload");
    imageUpload.addEventListener("change", event => {
      event.preventDefault();
      let formData = new FormData();
      let files = event.target.files || [];
      for (let idx in files) {
        formData.append("images", files[idx]);
      }
      console.log(event.target.files);
      fetch("/manager/upload/images", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(success => {
          console.log(success);
          event.target.value = "";
          location.reload();
        })
        .catch(error => console.log(error));
    });

    const videoUpload = document.getElementById("video-upload");
    const videoUploadFrame = document.getElementById("video-upload-frame");

    videoUpload.addEventListener("click", event => {
      event.preventDefault();
      videoUploadFrame.setAttribute("visible", 1);
    });

    const videoUrlInput = document.getElementById("video-url");
    const videoUrlAddBtn = document.getElementById("video-url-add");
    const videoUploadPreview = document.getElementById(
      "video-upload-preview-container"
    );

    videoUrlAddBtn.addEventListener("click", event => {
      event.preventDefault();
      const res = videoUploadController.add(videoUrlInput.value);
      if (res) {
        videoUploadPreview.appendChild(res);
      } else {
        videoUrlInput.setAttribute("error", 1);
      }
      videoUrlInput.value = "";
    });

    videoUrlInput.addEventListener("change", () => {
      videoUrlInput.removeAttribute("error");
    });

    const videoUploadSave = document.getElementById("video-upload-save");
    videoUploadSave.addEventListener("click", event => {
      event.preventDefault();
      videoUploadFrame.setAttribute("visible", 0);
      videoUploadController
        .publish()
        .then(() => {
          videoUploadController.clear();
          videoUploadPreview.innerHTML = "";
          videoUrlInput.value = "";
          location.reload();
        })
        .catch(e => {
          console.log("video upload error =", e);
        });
    });

    const videoUploadCancel = document.getElementById("video-upload-cancel");
    videoUploadCancel.addEventListener("click", event => {
      event.preventDefault();
      videoUploadFrame.setAttribute("visible", 0);
      videoUploadController.clear();
      videoUploadPreview.innerHTML = "";
      videoUrlInput.value = "";
    });
  });
})(window);
