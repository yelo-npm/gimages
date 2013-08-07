var request = require('request')
,	fs = require('fs')
,	progress = require('request-progress')
;

module.exports = {
  search: function(query, options) {
    var callback;
    if (typeof query === 'object') {
      options = query;
      query = options["for"];
      if (options.callback != null) callback = options.callback;
    }
    if (typeof query === 'string' && typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (typeof query === 'string' && typeof options === 'object') {
      if (options.callback != null) callback = options.callback;
    }
    if (!(options.page != null)) options.page = 0;
    return request("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=" + (query.replace(/\s/g, '+')) + "&start=" + options.page, function(err, res, body){
      var images, item, items, _i, _len;
      var j = JSON.parse(body);
      if(!j || !j.responseData || !j.responseData.results){
        console.log('no results!');
        process.exit(1);
      }
      items = j.responseData.results;
      images = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        images.push({
          width: item.width,
          height: item.height,
          unescapedUrl: item.unescapedUrl,
          url: item.url,
          writeTo: function(path, opts) {
            var stream;
			var oldPercent = 0;
            stream = fs.createWriteStream(path);
			stream.on('close', function() {
			    if(opts.end){
				  return opts.end({
					chunk:100-oldPercent
				  })
				}
            });
			//return request(item.url).pipe(stream);
            return progress(request(item.url),{
					throttle: 1000
				,	delay: 1000
				})
				.on('request',function(){
					if(opts.start){opts.start();}
				})
				.on('progress', function (state) {
					//console.log('total size in bytes', state.total);
					//console.log('received size in bytes', state.received);
					//console.log('percent', state.percent);
					state.chunk = oldPercent ?  state.percent - oldPercent : state.percent;
					oldPercent = state.percent;	
					if(opts.progress){opts.progress(state);}
				})
				.on('data',function(chunk){
					if(opts.data){opts.data(chunk);}
				})
				.on('error', function (err) {
					if(opts.error){opts.error(err);}
				})
				.pipe(stream)
			;
          }
        });
      }
      if (callback) return callback(false, images);
    });
  }
};
