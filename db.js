try	{
	var db = window.openDatabase('chordtab','1.0','chordtab', 2*1024*1024);
	db.transaction(function  (tx) {
		tx.executeSql("create table songs(song_id unique,song_name,has_tab BOOLEAN,song_group,artist,alblum,latest_playing DATETIME)");
		console.log("create song database;")
	},function  (error) {
		console.log(error.message)
	});

	// util fuction
	db.query = function  (sql, params, cb_rec, cb_err) {
			db.transaction(function  (tx) {
				 tx.executeSql(sql,params,function (tx,results) {
					  var records = [];
					  if(results){
							for (var i = 0; i < results.rows.length; i++) {
								 records.push(results.rows.item(i))
							};
						}
						if(typeof cb_rec == "function") cb_rec(records)
				 })
			},function  (error) {
				if(typeof cb_err == "function") cb_err(error)
			})
	}
}
catch(e){
	console.log(e)
}
	// db already created
var Song = {
	save: function (obj,cb_err) {
		 // validate
		 var data = $.extend({song_id:false,song_name:false,has_tab:false},obj)
		 if(data.id == false || data.name == false){
			 alert("invalid song id or song name");
			 return false;
		 }
		 var res = db.query(
				"INSERT INTO songs(song_id, song_name, has_tab, song_group, artist, alblum, latest_playing) values (?,?,?,?,?,?,?)",
				[data.song_id, data.song_name, data.has_tab, data.song_group, data.artist, data.alblum, Date()],
				function  (rec) {
					console.log(rec)
				},
				function  (err) {
					if(typeof cb_err == "function") cb_err(err.message)
				}
		 )
		 console.log(res)
	},

	update_if_exist_or_save: function  (obj) {
		 // check whether song has alrealy exist
		 this.save(obj,function  (err) {
			  console.log(err.message);
              db.query("update songs set latest_playing = ? where song_id = ?",[Date(), obj.song_id]);
		 });
	},

	all: function (cb_rec) {
		 db.query("select * from songs order by latest_playing",[],cb_rec);
	},

	_where: [],
	where: function  (sql, params) {
		this._where.push(sql);
	}
}
