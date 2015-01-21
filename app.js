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
var COOL_URI = CHORDTABS_URI + "/admin/ui/coolsong.php";
var HIT_URI = CHORDTABS_URI + "/admin/ui/hitsong.php";
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
    console.log(html)
    $(html).appendTo('body');
    return [];
    var data = [];
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
            fetch_prepared_songs(RANDOM_URI);
            return true;
     }

     //if(q == ':hitz'){
     //       fetch_prepared_songs(HIT_URI);
     //       return true;
     //}

     //if(q == ':cool'){
     //       fetch_prepared_songs(COOL_URI);
     //       return true;
     //}

     var found_list = _.filter(local_list, function(r){ 
         var reg_q =  new RegExp(q, 'i');
         return reg_q.test(r.song_name) || reg_q.test(r.artist);
     });
     console.log(found_list);

    SongListController.binding(found_list);

}

function fetch_prepared_songs (url) {
     $.ajax({
            url: url,
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
                    var data = [];
                    $(content).find('a').each(function  () {
                        // <a href="http://www.chordtabs.in.th/song.php?posttype=webmaster&song_id=5145 "  target="_blank">Sunshine : เรื่องเก่า เศร้าใหม่ </a>
                        try{
                            var tmp = _.filter($(this).text().match(/[^:]+/g), function(r){ return !!r.trim()});
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
                            data.push(d);
                        } 
                        catch(e){ console.error(e) }
                        // filter
                    });


                    // TODO ui for not found
                    if(data.length == 0){
                        alert("No Songs !")
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
     }).focus(function(){
        $("#song-viewport").slideDown()
        // first exec
        // $(this).val("").css({
        // 	textAlign: "left",
        // 	color: "#333"
        // }).unbind("focus")

        // $(this).focus(function(){
        // })
     }) .dblclick(function(){
       $(this).val('')
     });

     // setup flash element
     Flash.view = $("#global-notification-wrapper");
     Flash.show({ message: 'Preparing ...' })
     sync_song();
     Flash.close();

     Song.all(function(rec){
             if(rec.length > 0){
                    // update recent
                    $("#q").val(":recent");
                    SongListController.fetch_recent();
             }		 
     });

    $('#random').click(function(){
        $('#q').val(':random');
        var e = $.Event("keyup", { which: 13, keyCode: 13 });
        $('#q').trigger(e);
    });

    $('#recent').click(function(){
        $('#q').val(':recent');
        var e = $.Event("keyup", { which: 13, keyCode: 13 });
        $('#q').trigger(e);
    });

    $('#hitz').click(function(){
        $('#q').val(':hitz');
        var e = $.Event("keyup", { which: 13, keyCode: 13 });
        $('#q').trigger(e);
    });

    $('#cool').click(function(){
        $('#q').val(':cool');
        var e = $.Event("keyup", { which: 13, keyCode: 13 });
        $('#q').trigger(e);
    });
});

