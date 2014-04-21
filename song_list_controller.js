var SongListController = {
	action: {
			update_seachbox: function(s,e){
				// update sytle of selected song in the list
				$("#song-viewport").find("*").removeClass("song-selected")
				$(e.target).parent().addClass("song-selected")
				
				$("#q").val($(e.target).text())
				$("#song-viewport").slideUp(500)
			},

			fetch_chord: function(s,e){
				// Save recent playing song
				Song.update_if_exist_or_save(s)
				this.update_seachbox(s,e);
				var song_id = s.song_id
				$.ajax({
					url: CHORD_URI + song_id + "&posttype=webmaster&chord=yes",
					data: 'xjxfun=getChord&xjxr=' + (new Date().getTime()),
					type: 'post',
                    contentType: "text/html",
					error: function(e){ console.log("fetch chord error") },
					beforeSend: function(){
						Flash.show({message: "♫ ... ♫",persist: true})
					},
					success: function(_res){
						Flash.close();
						// reset result viewport to show chord and tab

						$("#chord").html('');
						$("#main").html('');
						$("#tab").html('');

						// fetch tab if has tab in the song, async
                        try {
						// if(s.has_tab){
							$.ajax({
								url: CHORD_URI + song_id,
								data: 'xjxfun=getTabById&xjxargs[]=' + encodeURI(song_id) + "&xjxargs[]=Guitar&xjxargs[]=0",
								type: 'post',
								success: function(res){
									var content = $(res.documentElement.textContent);
									var tab = $("#tab")
									// tab.append($(content))
									content.find('*').removeAttr('style')
									// TODO hard code
									var imgs = content.find("img")
									if(imgs.length == 0){
											// it maybe flash		
											var flash = content.find("object")
											if(flash.length > 0){
												flash.each(function(){
													var embed = $(this).find("embed");
													var param = $(this).find("param");
													var src = embed.attr("src");
													var val = param.attr("value");
													embed.attr("src",src.replace(".",CHORDTABS_URI))
													param.attr("value",val.replace(".",CHORDTABS_URI))
												});
											}
											else{
												Flash.show({ message:"Not Found! Why?"});
											}
									}
									else{
										imgs.each(function(){
											var src = $(this).attr("src");
											$(this).attr("src",src.replace(".",CHORDTABS_URI));
											// $(this).parent().addClass("tab")
										});
									}

									tab.append(content)
									tab.find("*").removeAttr('style')
									tab.find('table').width("720px")
								} // end success
								
							})
						//}
                        } catch(e) { console.error(e); }

						// upto chord closure
						// var content = _res.documentElement.textContent;
						var content = $("#songMain", _res);
						// get image result first
						var imgs = $(content).find("img");
						if(imgs.length === 0){
							// maybe flash
							// try to get flash
							// ex cash jason mraz song
							var flash = $(content).find("object")
							if(flash.length > 0){
								flash.each(function(){
									var embed = $(this).find("embed");
									var src = embed.attr("src");
									embed.attr("src",src.replace(".",CHORDTABS_URI));
									$("#chord").append($(this));
								});
							} else{
								Flash.show({ message:" Not found ! Why ?"});
							}
						} // end if image.length === 0
						else {
							imgs.each(function(){
								var src = $(this).attr("src");
								var chords = [], main;
								$(this).attr("src", src.replace(".", CHORDTABS_URI))
								if(src.match(/song/)){
									$(this).appendTo($("#main"));
								} else{
									$(this).appendTo($("#chord"));
								}
							})
						}
						// TODO hardcode style
						$("#chord, #main").find("img").css({"border-radius": "0.5em",borderColor: "#555"})
					}
				})
				return false; // disable event bubble
			}
	},

	binding: function  (data) {
		ko.applyBindings($.extend({
			songs: data
		}, this.action));
	},

	fetch_recent: function(){
		var self = this;
		Song.all(function(rec){
				if(rec.length > 0) self.binding(rec);
		});	
	}
}
