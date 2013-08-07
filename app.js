var client = require('./lib/google-images')
,	path = require('path')
,	ProgressBar = require('progress')
,	mkdirp = require('mkdirp')
,	fs = require('fs')
;

function processImages(images,current,total,onEnd,directory){
	if(current==total){return onEnd();}
	var name = path.basename(images[current].unescapedUrl);
	console.log('processing image '+current+'\n');
	var bar = new ProgressBar('  downloading [:bar] :percent :etas '+name, {
		complete: '='
	,	incomplete: ' '
	,	width: 20
	,	total: 100
	});
	var ext = path.extname(name);
	var filename = path.basename(name,ext);
	var path_to_write_to = directory+filename+ext;
	var existsTest = 1;
	while(fs.existsSync(path_to_write_to)){
		name = filename+'--('+existsTest+')'+ext;
		path_to_write_to = directory+name;
		existsTest++;
	}
	images[current].writeTo(
		path_to_write_to
	,	{
			end: function(state){
				bar.tick(state.chunk);
				console.log(name + ' written to disk')
				current++;
				processImages(images,current,total,onEnd,directory);
			}
		,	progress: function(state){
				bar.tick(state.chunk);
				//console.log(state.chunk);
			}
		}
	)
}

var search = function(terms, max, directory){
	if(!max){max = 10;}
	if(!directory){directory = '.';}
	directory = path.resolve('.',directory);
	directory+= directory == '/' ? '':'/';
	if(!terms || !terms.length){
		console.log('no images to download');
		process.exit(1);
	}
	terms = terms.join('+');
	mkdirp(directory, function (err) {
		if (err){throw err;}
		console.log('\n'
			+'google images: searching for "'+terms+'"\n'
			+'stopping when '+max+' images downloaded\n'
			+'storing the images in '+directory+'\n'
		);
		client.search(terms,function(err,images){
			if(err){throw err;}
			if(images.length < max){
				max = images.length;
			}
			console.log('found '+images.length+' images\n');
			console.log('will process '+max+' images\n');
			processImages(images,0,max,function(){
				console.log('all done!');
				process.exit(0);
			},directory);
		})
	});

}

module.exports = search;
