function createManagerControlBlock(videoUploadId, mediaPreviewId) {
  const videoUpload = document.getElementById("video-upload");
  videoUpload.addEventListener("click", () => {
    videoUploadPanel(videoUploadId).show();
  });

  const imageUpload = document.getElementById("image-upload");
  imageUpload.addEventListener("change", event => {
    event.preventDefault();
    let formData = new FormData();
    let files = event.target.files || [];
    for (let idx in files) {
      formData.append("images", files[idx]);
    }
    debug(event.target.files);
    fetch("/manager/upload/images", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(success => {
        debug(success);
        event.target.value = "";
        location.reload();
      })
      .catch(error => debug(error));
  });

  const deleteMedia = document.getElementById("delete-media");

  deleteMedia.addEventListener("click", () => {
    event.preventDefault();

    const selected = mediaPreviewPanel(mediaPreviewId).getSelected();
    mediaPreviewPanel(mediaPreviewId).clearSelection();
    let removeData = {
      images: [],
      videos: []
    };
    selected.forEach(e => {
      removeData[`${e.type}s`].push(e.id);
    });

    return fetch("/manager/delete/media", {
      method: "POST",
      body: JSON.stringify(removeData),
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then(r => {
        debug(r);
        location.reload();
      });
  });
}
