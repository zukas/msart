function GalleryPreviewJs(
  itemContainer,
  thumbContainer,
  itemNext,
  itemPrev,
  thumbNext,
  thumbPrev
) {
  let self = this;
  let currentIndex = 0;
  let size = itemContainer.querySelectorAll(".gallery-item").length;

  self.removeCurrentItem = () => {
    const items = itemContainer.querySelectorAll(".gallery-item");
    const thumbs = thumbContainer.querySelectorAll(".gallery-thumb-column");
    itemContainer.removeChild(items[currentIndex]);
    thumbContainer.removeChild(thumbs[currentIndex]);
    self.update();
    currentIndex = currentIndex >= size ? size - 1 : currentIndex;
    self.setCurrent(currentIndex);
  };

  self.setCurrent = index => {
    const items = itemContainer.querySelectorAll(".gallery-item");
    const thumbs = thumbContainer.querySelectorAll(".gallery-thumb-preview");
    debug("setCurrent", index, size, index >= 0 && index < size);
    if (index >= 0 && index < items.length) {
      items[currentIndex].removeAttribute("active");
      thumbs[currentIndex].removeAttribute("active");
      const rmBtn1 = items[currentIndex].querySelector(".gallery-item-control");
      if (rmBtn1) {
        rmBtn1.removeEventListener("click", self.removeCurrentItem);
      }

      currentIndex = index;

      items[currentIndex].setAttribute("active", true);
      thumbs[currentIndex].setAttribute("active", true);
      thumbContainer.parentNode.scrollLeft = thumbs[currentIndex].offsetLeft;

      const rmBtn2 = items[currentIndex].querySelector(".gallery-item-control");
      if (rmBtn2) {
        rmBtn2.addEventListener("click", self.removeCurrentItem);
      }
    }
  };

  self.getItems = () => {
    const thumbs = thumbContainer.querySelectorAll(
      ".gallery-thumb-preview:not([type='new'])"
    );
    return Array.from(thumbs).map(thumb => {
      const type = thumb.getAttribute("type");
      return type == "video"
        ? { id: thumb.id, type: type, src: thumb.querySelector("iframe").src }
        : { id: thumb.id, type: type };
    });
  };

  self.nextItem = offset => {
    debug("nextItem", offset);
    const index = currentIndex + offset;
    if (index < 0) {
      self.setCurrent(size - 1);
    } else if (index >= size) {
      self.setCurrent(0);
    } else {
      self.setCurrent(index);
    }
  };

  self.update = () => {
    debug("update");
    const numbers = itemContainer.querySelectorAll(".gallery-item-number");

    numbers.forEach((elem, idx, list) => {
      elem.innerHTML = `${idx + 1} / ${list.length}`;
    });

    const thumbPreviews = thumbContainer.querySelectorAll(
      ".gallery-thumb-preview"
    );
    thumbPreviews.forEach((elem, idx) => {
      elem.onclick = () => {
        self.setCurrent(idx);
      };
    });

    size = thumbPreviews.length;
  };

  self.addItems = items => {
    debug("addItems", items);

    let itemFragment = document.createDocumentFragment();
    let thumbFragment = document.createDocumentFragment();

    items.forEach(newNtem => {
      let item = document.createElement("div");
      let itemPreview = document.createElement("div");
      let itemNumber = document.createElement("div");
      let itemControl = document.createElement("div");
      let itemCaption = document.createElement("div");
      let thumb = document.createElement("div");
      let thumbPreview = document.createElement("div");

      item.className = "gallery-item";

      itemNumber.className = "gallery-item-number";
      itemControl.className = "gallery-item-control common-btn red";
      itemControl.innerHTML = "Remove";
      itemCaption.className = "gallery-item-caption";

      itemPreview.id = newNtem.id;
      itemPreview.setAttribute("type", newNtem.type);
      itemPreview.className = "gallery-item-preview";

      thumb.className = "gallery-thumb-column";

      thumbPreview.id = newNtem.id;
      thumbPreview.setAttribute("type", newNtem.type);
      thumbPreview.className = "gallery-thumb-preview";

      if (newNtem.type == "image") {
        itemPreview.style.backgroundImage = `url(/image/${newNtem.id}?width=1920)`;
        thumbPreview.style.backgroundImage = `url(/image/${newNtem.id}?width=720)`;
      } else if (newNtem.type == "video") {
        let itemVideoFrame = document.createElement("iframe");
        itemVideoFrame.src = newNtem.src;
        itemVideoFrame.frameBorder = 0;
        itemVideoFrame.allow =
          "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
        itemVideoFrame.allowFullscreen = "allowfullscreen";
        itemPreview.appendChild(itemVideoFrame);

        let thumbVideoFrame = document.createElement("iframe");
        thumbVideoFrame.src = newNtem.src;
        thumbVideoFrame.frameBorder = 0;
        thumbVideoFrame.allow =
          "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
        thumbVideoFrame.allowFullscreen = "allowfullscreen";
        thumbPreview.appendChild(thumbVideoFrame);
      }

      thumb.appendChild(thumbPreview);
      item.appendChild(itemPreview);
      item.appendChild(itemNumber);
      item.appendChild(itemControl);
      item.appendChild(itemCaption);

      itemFragment.appendChild(item);
      thumbFragment.appendChild(thumb);
    });

    itemContainer.appendChild(itemFragment);
    thumbContainer.appendChild(thumbFragment);

    self.update();
  };

  itemNext.onclick = () => {
    self.nextItem(1);
  };
  itemPrev.onclick = () => {
    self.nextItem(-1);
  };

  self.calcVisibleThumbsProps = () => {
    let visible = [];
    const parentBox = thumbContainer.parentNode.parentNode.getBoundingClientRect();
    const thumbs = thumbContainer.querySelectorAll(".gallery-thumb-preview");

    thumbs.forEach((th, idx) => {
      const thumbBox = th.getBoundingClientRect();

      debug(parentBox, thumbBox);

      if (
        thumbBox.left >= parentBox.left &&
        thumbBox.right <= parentBox.right
      ) {
        visible.push(idx);
      } else if (
        thumbBox.right <= parentBox.right &&
        thumbBox.left >= parentBox.left
      ) {
        visible.push(idx);
      }
    });
    return { visible: visible, size: thumbs.length, items: thumbs };
  };

  thumbNext.onclick = () => {
    const props = self.calcVisibleThumbsProps();
    debug("thumbNext", props.visible, props.size);
    const offset = props.visible.length - 1;
    const targetIdx =
      props.visible[offset] + offset >= props.size
        ? 0
        : props.visible[offset] + offset;
    debug("thumbNext - targetIdx", targetIdx);
    thumbContainer.parentNode.scrollLeft = props.items[targetIdx].offsetLeft;
  };

  thumbPrev.onclick = () => {
    const props = self.calcVisibleThumbsProps();
    debug("thumbPrev", props.visible, props.size);
    const offset = props.visible.length - 1;
    const targetIdx =
      props.visible[0] - offset < 0
        ? props.visible[0] == 0
          ? props.size - 1
          : 0
        : props.visible[0] - offset;
    debug("thumbPrev - targetIdx", targetIdx);

    thumbContainer.parentNode.scrollLeft = props.items[targetIdx].offsetLeft;
  };

  self.update();

  self.setCurrent(0);
}

function galleryPreviewPanel(id) {
  return document.fetchFeature("galleryPreviewPanel", `id-${id}`);
}

function createGalleryPreviewPanel(id) {
  const frame = document.querySelector(`#${id}`);
  const elementContainer = frame.querySelector(".gallery-item-container");
  const thumbContainer = frame.querySelector(".gallery-thumb-inner-row");
  const elemNext = frame.querySelector(".gallery-nav-btn.next");
  const elemPrev = frame.querySelector(".gallery-nav-btn.prev");
  const thumbNext = frame.querySelector(".gallery-thumb-nav-btn.next");
  const thumbPrev = frame.querySelector(".gallery-thumb-nav-btn.prev");
  const obj = new GalleryPreviewJs(
    elementContainer,
    thumbContainer,
    elemNext,
    elemPrev,
    thumbNext,
    thumbPrev
  );
  document.attachFeature("galleryPreviewPanel", `id-${id}`, obj);
}

function destroyGalleryPreviewPanel(id) {
  document.removeFeature("galleryPreviewPanel", `id-${id}`);
}
