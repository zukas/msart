(function () {
	"use strict";
	function GalerryItem(id) {
		var self 	= this,
            id_     = id,
			item 	= new MSDivObject(),
			remove 	= window.admin ? document.createElement("div") : null;

		item.el.className = "gallery-thumb";

		if(remove) {
			remove.className = "gallery-thumb-remove";
			item.el.appendChild(remove);

			remove.onclick = function () {
				if(self.remove) {
					self.remove(self);
				} 
			}
		}

        item.el.onclick = function () {
            if(self.click) {
                self.click(self);
            }
        }

        if(window.admin) {
            item.el.setAttribute("draggable", true);
            item.el.ondragstart = function (e) {
                e.dataTransfer.setData("target", id_);
            };

            item.el.ondragover = function (e) {
                e.preventDefault();
            };

            item.el.ondrop = function (e) { 
                e.preventDefault();
                if(self.swap) {
                    self.swap(e.dataTransfer.getData("target"), id_);
                }
            };
        }

		self.el = item.el;

		self.id = function () {
			return id_;
		}

        self.change = function (nid) {
            id_ = nid;
            item.loadImage({
                url : "/async/thumb/load/" + id_,
                color: "#e0e0e0", 
                shadow: true, 
                radius: 18, 
                width: 4, 
                length: 16, 
                lines: 11, 
                speed: 0.75 
            });
        }

		item.loadImage({
            url : "/async/thumb/load/" + id_,
            color: "#e0e0e0", 
            shadow: true, 
            radius: 18, 
            width: 4, 
            length: 16, 
            lines: 11, 
            speed: 0.75 
        });

	}

    function Gallery () {

        var self        = this,
            panel       = document.getElementById("gallery_panel"),
            content     = document.getElementById("content-wrapper"),
            create      = window.admin ? new FileUpload({id : "gallery_thumb_new", className : "gallery-thumb", multiple: true}) : null,
            gallery     = new MSDivObject(document.getElementById("thumbs_container")),
            viewport    = new MSDivObject(document.getElementById("gallery_view").firstElementChild),
            thumbs      = {},
            init        = function (thumb) {
                if(thumb) {
                    // gallery.scrollable();
                    set(thumb);
                }
            },
            set         = function (thumb) {
                viewport.loadImage({
                    url : "/async/images/load/" + thumb.id() + "?height=700",
                    color: "#e0e0e0", 
                    shadow: true, 
                    radius: 22, 
                    width: 6, 
                    length: 20, 
                    lines: 13, 
                    speed: 0.75 
                });
            },
            remove      = function (item) {
                window.ajax({
                    type: "POST",
                    data: { id : item.id() },
                    url: '/async/gallery/delete'
                }).done(function (result) {
                    if(result.status) {
                        delete thumbs[item.id()];
                        gallery.el.removeChild(item.el);
                    }
                });
            },
            swap        = function (i, j) {
                var thumb = thumbs[i];
                thumb.change(j);
                thumbs[i] = thumbs[j];
                thumbs[j] = thumb;
                thumbs[i].change(i);
                window.ajax({
                    type: "POST",
                    data: { one : i, two : j },
                    url: '/async/gallery/swap'
                });
            }

        function position () {
            var st = content.scrollTop;
            var gt = panel.offsetTop;
            if(st > gt || viewport.el.offsetTop > 0) {
                var gh = gallery.el.offsetHeight;
                var h  = viewport.el.offsetHeight;
                var s  = st - gt;
                var l  = gh - h;
                s = s < 0 ? 0 : s;
                s = s > l ? l : s;
                // viewport.el.style.top = s + "px";
                morpheus(viewport.el,
                {
                    top: s + "px",
                    duration: 150
                });  
            } 
        }

        content.addEventListener("scroll", position);
        window.addEventListener("resize", position);


        if(create) {
            gallery.el.appendChild(create.el);
            create.preview = function (files) {
                for(var i = 0; i < files.length; ++i) {

                    var fd = new FormData();
                    fd.append("file", files[i]);
                
                    window.ajax({
                        type: "POST",
                        data: fd,
                        files : true,
                        url: '/async/gallery/save'
                    }).done(function (result) {
                        if(result.status) {
                            var item = new GalerryItem(result.id);
                            thumbs[item.id()] = item;
                            item.swap = swap;
                            item.click = set;
                            item.remove = remove;
                            if(create.el.nextSibling) {
                                gallery.el.insertBefore(item.el, create.el.nextSibling);
                            } else {
                                gallery.el.appendChild(item.el);
                            }
                            set(item);
                            // gallery.scrollable();
                        }
                    }); 
                }
            }
        }

        window.ajax({
            type: "POST",
            url: '/async/gallery/load'
        }).done(function (result) {     
            if(result.status) {
                var frag    = document.createDocumentFragment(),
                    thumb   = null;

                for(var i = 0; i < result.result.length; ++i) {
                    var item = new GalerryItem(result.result[i].id);
                    thumbs[item.id()] = item;
                    item.swap = swap;
                    item.click = set;
                    item.remove = remove;
                    frag.appendChild(item.el);
                    if(!thumb) {
                        thumb = item;
                    }
                }
                gallery.el.appendChild(frag); 
                init(thumb);


            }
        });
    }


    window.addEventListener("load", function () {
        window.gallery = new Gallery();
    })
 
}());