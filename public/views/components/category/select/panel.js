function CategoryPreviewPanel(frame, popup) {
  let self = this;

  popup.registerSelectionCallback(popupSelection);

  self.getSelected = () => {
    const data = frame.querySelectorAll(".category-item");
    debug("CategoryPreviewPanel::getSelected", data);
    return Array.from(data).map(item => {
      debug(item.id);
      return item.id;
    });
  };

  function popupSelection() {
    popup.hide();

    const selection = popup.getSelected();
    debug(selection);
    let fragment = document.createDocumentFragment();

    selection.forEach(elem => {
      let categoryItem = document.createElement("div");
      categoryItem.id = elem.id;
      categoryItem.className = "category-item";

      let categoryItemInternal = document.createElement("div");
      categoryItemInternal.className = "category-item-internal";
      categoryItem.appendChild(categoryItemInternal);

      let categoryItemText = document.createElement("div");
      categoryItemText.className = "category-item-text text-invert";
      categoryItemInternal.appendChild(categoryItemText);

      let categoryItemCaption = document.createElement("div");
      categoryItemCaption.className = "category-item-caption";
      categoryItemCaption.innerHTML = elem.caption;
      categoryItemText.appendChild(categoryItemCaption);

      let categoryItemImage = document.createElement("div");
      categoryItemImage.className = "category-item-image";
      categoryItemImage.style.backgroundImage = `url(/image/${elem.thumb}?width=800)`;
      categoryItemInternal.appendChild(categoryItemImage);

      fragment.appendChild(categoryItem);
    });

    frame.innerHTML = "";
    frame.appendChild(fragment);
  }

  popup.setSelected(self.getSelected());

  frame.onclick = () => {
    popup.show();
  };
}

function categoryPreviewPanel(id) {
  return document.fetchFeature("categoryPreviewPanel", `id-${id}`);
}

function createCategoryPreviewPanel(id, popupId) {
  const frame = document.querySelector(`#${id}`);
  const innerFrame = frame.querySelector(".category-select-panel-inner");
  const obj = new CategoryPreviewPanel(
    innerFrame,
    categoryPreviewPopup(popupId)
  );
  document.attachFeature("categoryPreviewPanel", `id-${id}`, obj);
}
