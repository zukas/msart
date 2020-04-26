function MediaPreviewPanelJs(frame, btn, elems) {
  let self = this;
  let list = [];
  let multi = true;
  let callbacks = [];

  let clicked = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!multi) {
      self.clearSelection(e.target);
    }
    if (e.target.getAttribute("selected")) {
      e.target.removeAttribute("selected");
      const index = list.indexOf(e.target);
      list.splice(index, 1);
    } else {
      e.target.setAttribute("selected", true);
      list.push(e.target);
    }
  };

  elems.forEach(elem => {
    elem.addEventListener("click", clicked);
  });

  self.getSelected = () => {
    const res = list.map(e => {
      return {
        id: e.id,
        type: e.getAttribute("type"),
        src: e.getAttribute("src")
      };
    });
    debug(res);
    if (multi) {
      return res;
    } else if (res.length == 1) {
      return res[0];
    } else {
      return null;
    }
  };

  self.registerSelectionCallback = (cb, ...args) => {
    callbacks.push({ cb: cb, args: args });
  };

  self.unregisterSelectionCallback = cb => {
    const index = callbacks.findIndex(cbd => {
      return cb == cbd.cb;
    });
    debug("unregisterSelectionCallback", index);
    if (index >= 0) {
      callbacks.splice(index, 1);
    }
  };

  self.clearSelection = except => {
    list = [];
    elems.forEach(elem => {
      if (elem != except) {
        elem.removeAttribute("selected");
      }
    });
  };

  self.setSelectionMode = mode => {
    if (mode == "multi") {
      multi = true;
    } else {
      multi = false;
    }
  };

  self.setSelectionType = type => {
    debug("MediaPreviewPanelJs::setSelectionType", type);
    if (type) {
      Array.from(
        frame.querySelectorAll(`.media-preview-category:not(.${type})`)
      ).forEach(group => {
        debug("hide group", group);
        group.style.display = "none";
      });
    } else {
      Array.from(frame.querySelectorAll(`.media-preview-category`)).forEach(
        group => {
          group.style.display = "";
        }
      );
    }
  };

  self.show = () => {
    frame.style.display = "block";
  };
  self.hide = () => {
    frame.style.display = "none";
  };

  if (btn) {
    btn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      callbacks.forEach(cbd => {
        cbd.cb.apply(self, cbd.args);
      });
    };
  }
}

function mediaPreviewPanel(id) {
  return document.fetchFeature("mediaPreviewPanel", `id-${id}`);
}

function createMediaPreviewPanel(id) {
  const frame = document.querySelector(`#${id}`);
  const selectBtn = frame.querySelector("#media-popup-select");
  const elems = document.querySelectorAll(`#${id} .preview-thumb`);
  const obj = new MediaPreviewPanelJs(frame, selectBtn, elems);
  document.attachFeature("mediaPreviewPanel", `id-${id}`, obj);
}

function beginSearch(id, event) {
  debug("beginSearch", id, event);
  const root = document.getElementById(id);
  const regexp = new RegExp(event.target.value, "i");
  Array.from(root.querySelectorAll("div.thumb-caption")).forEach(elem => {
    elem.parentNode.classList.toggle(
      "hidden",
      elem.innerHTML.search(regexp) == -1
    );
  });
  Array.from(root.querySelectorAll("input.thumb-caption")).forEach(elem => {
    elem.parentNode.classList.toggle("hidden", elem.value.search(regexp) == -1);
  });
}
