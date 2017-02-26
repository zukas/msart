# !/bin/bash

SOURCES=(
public/scripts/morpheus.js
public/scripts/msart.units.js
public/scripts/msart.common.js
public/scripts/msart.language.js
public/scripts/msart.header.js
public/scripts/msart.home.js
public/scripts/msart.workshops.js
public/scripts/msart.shop.js
public/scripts/msart.gallery.js
public/scripts/msart.contact.js
public/scripts/msart.order.js
)

TMP="${SOURCES[*]}"

java -jar compiler.jar --js_output_file=public/compiled/msart.min.js $TMP
java -jar compiler.jar --js_output_file=public/compiled/msart.user.min.js public/scripts/msart.user.js
cleancss -o public/css/index-min.css public/css/index.css
