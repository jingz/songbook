
// TODO rewrite it in mvc concept
// global notification widget
var Flash = {
    view: "set an element on init",
    show: function(obj){
        var args = $.extend({
                message: '',
                duration: 1000,
                persist: false, 
                callback: false,
                css: { backgroundColor: '#ddd' }
        },obj)

        if(args.persist)
            this.view.html(args.message).css(args.css).animate({top: 0})	
        else
            this.view.html(args.message).css(args.css).animate({top: 0}).delay(args.duration).animate({top: -55})

        if(typeof args.callback == "function"){
                args.callback(view);	
        }
        
    },
    // manually close
    close: function(){
        this.view.animate({top: -55})
    }
}

// Constant ( global scope )
var CHORDTABS_URI = "http://chordtabs.in.th";
var SEARCH_URI = CHORDTABS_URI + "/admin/ui/search.php";
var RANDOM_URI = CHORDTABS_URI + "/admin/ui/randomsong.php";
var CHORD_URI = CHORDTABS_URI + "/song.php?song_id="; 
// Models decaration
// var Song = $.extend(Model,{
// 		url: CHORDTABS_URI,
// 		search: SEARCH_URI,
// 		chord: CHORD_URI,
// 		fetch_cord: function(id){
// 				return chord	
// 		}
// })

// util for extract table html to build json data
function chordtab_extract_data_from_html(html,word){
    // filter header of result table out
    var rows = $(html).find('tr:gt(0)')
    var data = []
    rows.each(function(i){
        var song_name = '', artist = ''
        song_name = $(this).find("td:eq(3)").text();
        artist = $(this).find("td:eq(1)").text();
        var reg_word = new RegExp(word, "gi");
        var match = (song_name + artist).match(reg_word);
        // eval("var match = (song_name + artist).match(/" + word + "/gi)");
        if(!match) return;
        // data model
        var d = {
            has_tab: false, // will be used in future
            song_group: $(this).find("td:eq(0)").text(),
            artist: artist,
            alblum: $(this).find("td:eq(2)").text(),
            song_name: song_name,
            song_id: $(this).find("td:eq(3) a").attr("href").match(/song_id=(\d+)/)[1]
        }		
        // filter
        data.push(d);
    });

    return data;
}

// function routes(r){
//    r = $.trim(r)	
// 	 if(r == ":recent") 
// 			fetch_recent();
// 	 elseif(r == ":hitz")
// 		  fetch_hitz();
// 	 else
// 			search(r)		 
// }

// search 
function search(q){
     q = $.trim(q);
     // implement :recent, :hitz commands
     if(q == ":recent"){
            SongListController.fetch_recent(); 
            return true;
     } 
     // elseif(q == ":hitz") fetch_hitz();
     if(q == ':random'){
            fetch_random_songs();
            return true;
     }

     // reset old result
     // songs = Song.search(q)
     $.ajax({
            url: SEARCH_URI,
            data: 'xjxfun=writeSongDiv&xjxargs[]=' + encodeURI(q),
            type: "POST",
            error: function(){
                console.log("server unreachable!")
            },
            beforeSend: function(){
                $("#song-viewport").html("");
                $("#load").show()
                // Flash.show({message: "♫ ... ♫",persist: true})
            },
            success: function(res){
                    $("#load").hide(0);
                    var content = res.documentElement.textContent;
                    var data = chordtab_extract_data_from_html(content,q);
                    // TODO ui for not found
                    if(data.length == 0){
                        alert(q + " not found !")
                        return false;
                    }

                    // search for tab and wait for sucess 
                    var tabs;
                    $.ajax({
                        url: SEARCH_URI,
                        data: 'xjxfun=writeTabDiv&xjxargs[]=' + encodeURI(q),
                        async: false, 
                        type: "POST",
                        success: function(res){
                            var content = res.documentElement.textContent;
                            tabs = chordtab_extract_data_from_html(content,q);
                        }
                    });

                    tabs = _.map(tabs,function(val,key,obj){ return obj[key].song_id });
                    for(var i in data){
                        if($.inArray(data[i].song_id,tabs) != -1) {
                            data[i].has_tab = true;
                        }
                    }

                    // render
                    // knockout usage
                    SongListController.binding(data);
            }
     });
}

function fetch_random_songs () {
     $.ajax({
            url: RANDOM_URI,
            data: 'xjxfun=readList',
            type: "POST",
            error: function(){
                console.log("server unreachable!");
            },
            beforeSend: function(){
                $("#song-viewport").html("");
                $("#load").show();
                // Flash.show({message: "♫ ... ♫",persist: true})
            },
            success: function(res){
                    $("#load").hide(0);
                    var content = res.documentElement.textContent;
                    // var data = chordtab_extract_data_from_html(content,q);
                    var data = [];
                    $(content).find('a').each(function  () {
                        // <a href="http://www.chordtabs.in.th/song.php?posttype=webmaster&song_id=5145 "  target="_blank">Sunshine : เรื่องเก่า เศร้าใหม่ </a>
                        var tmp = $(this).text().split(':');
                        var href = $(this).attr('href');
                        var artist = tmp[0].trim();
                        var song_name = tmp[1].trim();
                        var song_id = href.match(/\d+/)[0];
                        var d = {
                            has_tab: false, // will be used in future
                            song_group: null,
                            artist: artist,
                            alblum: null,
                            song_name: song_name,
                            song_id: song_id
                        }		
                        // filter
                        data.push(d);
                    });


                    // TODO ui for not found
                    if(data.length == 0){
                        alert("Error Random !")
                        return false;
                    }

                    SongListController.binding(data);
            }
     });
}

// init
$(document).ready(function(){
     $("#q").keyup(function(e){
          if( e.keyCode != 13 ) return;
            var qry = $(this).val();
            search(qry);
            $(this).blur()
          return false;	 
     })
     .focus(function(){
            $("#song-viewport").slideDown()
          // first exec
            // $(this).val("").css({
            // 	textAlign: "left",
            // 	color: "#333"
            // }).unbind("focus")

            // $(this).focus(function(){
            // })
        })
     .dblclick(function(){
          $(this).val('')
        })

     // setup flash element
     Flash.view = $("#global-notification-wrapper");
     Song.all(function(rec){
             if(rec.length > 0){
                    // update recent
                    $("#q").val(":recent");
                    SongListController.fetch_recent();
             }		 
     })
});

