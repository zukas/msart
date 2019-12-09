function MediaPreviewPanelJs(frame, btn, elems) {
  let self = this;
  let list = [];
  let multi = true;
  let callbacks = [];

  let change = e => {
    e.preventDefault();
    e.stopPropagation();
    if (multi) {
      if (e.target.checked) {
        list.push(e.target.parentNode.parentNode.parentNode);
      } else {
        const index = list.indexOf(e.target.parentNode.parentNode.parentNode);
        list.splice(index, 1);
      }
    } else {
      self.clearSelection(e.target);
      if (e.target.checked) {
        list.push(e.target.parentNode.parentNode.parentNode);
      }
    }
  };

  elems.forEach(elem => {
    elem.addEventListener("change", change);
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
      elem.checked = except == elem;
    });
  };

  self.setSelectionMode = mode => {
    if (mode == "multi") {
      multi = true;
    } else {
      multi = false;
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
  const elems = document.querySelectorAll(
    `#${id} .preview-thumb-chk input[type=checkbox]`
  );
  const obj = new MediaPreviewPanelJs(frame, selectBtn, elems);
  document.attachFeature("mediaPreviewPanel", `id-${id}`, obj);
}
