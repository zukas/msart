(function () {
	"use strict";
	function GalerryItem(id) {
		var self 	= this,
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

		self.el = item.el;

		self.id = function () {
			return id;
		}

		item.loadImage({
            url : "/async/thumb/load/" + id,
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
            create      = window.admin ? new FileUpload({id : "gallery_thumb_new", className : "gallery-thumb"}) : null,
            gallery     = new MSDivObject(document.getElementById("thumbs_container")),
            viewport    = new MSDivObject(document.getElementById("gallery_view")),
            init        = function (thumb) {
                if(thumb) {
                    gallery.scrollable();
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
                        gallery.el.removeChild(item.el);
                    }
                });
            };

        if(create) {
            gallery.el.appendChild(create.el);
            create.preview = function (files) {
                var fd = new FormData();
                fd.append("file", files[0]);
                window.ajax({
                    type: "POST",
                    data: fd,
                    files : true,
                    url: '/async/gallery/save'
                }).done(function (result) {
                    if(result.status) {
                        var item = new GalerryItem(result.id);
                        item.click = set;
                        item.remove = remove;
                        if(create.el.nextSibling) {
                            gallery.el.insertBefore(item.el, create.el.nextSibling);
                        } else {
                            gallery.el.appendChild(item.el);
                        }
                        set(item);
                    }
                }); 
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