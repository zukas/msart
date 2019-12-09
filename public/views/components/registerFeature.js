document.features = {};
document.attachFeature = (category, name, value) => {
  if (!document.features[category]) {
    document.features[category] = {};
  }
  if (document.features[category][name]) {
    debug("A feature with category and name already exists:", category, name);
    return;
  }
  document.features[category][name] = value;
};

document.removeFeature = (category, name) => {
  if (document.features[category] && document.features[category][name]) {
    delete document.features[category][name];
    return;
  }
  debug("A feature with category and name does not exists:", category, name);
};

document.fetchFeature = (category, name) => {
  if (document.features[category] && document.features[category][name]) {
    return document.features[category][name];
  }
  debug("A feature with category and name does not exists:", category, name);
  return null;
};
