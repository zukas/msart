function CategoryPreviewPopup(frame, btn, elems) {
  let self = this;
  let list = [];
  let callbacks = [];

  debug(btn);

  let clicked = e => {
    e.preventDefault();
    e.stopPropagation();

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
      debug(e);
      return {
        id: e.id,
        type: e.getAttribute("type"),
        src: e.getAttribute("src"),
        thumb: e.querySelector(".category-item-image").id,
        caption: e.querySelector(".category-item-caption").innerHTML,
        desc: e.querySelector(".category-item-description").innerHTML
      };
    });
    debug(res);
    return res;
  };

  self.setSelected = items => {
    debug("CategoryPreviewPopup::setSelected", items, elems);
    items.forEach(i => {
      elems.forEach(elem => {
        if (elem.id == i) {
          elem.setAttribute("selected", true);
          list.push(elem);
        }
      });
    });
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

  self.show = () => {
    frame.style.display = "block";
  };
  self.hide = () => {
    frame.style.display = "none";
  };

  if (btn) {
    btn.onclick = e => {
      debug(e);
      debug(callbacks);
      e.preventDefault();
      e.stopPropagation();
      callbacks.forEach(cbd => {
        cbd.cb.apply(self, cbd.args);
      });
    };
  }
}

function categoryPreviewPopup(id) {
  return document.fetchFeature("categoryPreviewPopup", `id-${id}`);
}

function createCategoryPreviewPopup(id) {
  const frame = document.querySelector(`#${id}`);
  const selectBtn = frame.querySelector("#category-popup-select");
  const elems = document.querySelectorAll(`#${id} .category-item`);
  const obj = new CategoryPreviewPopup(frame, selectBtn, elems);
  document.attachFeature("categoryPreviewPopup", `id-${id}`, obj);
}
