var express = require('express');
var AWS = require('aws-sdk');
var fs = require('fs');
var util = require('util');
const uuidv4 = require('uuid/v4');
var ArrayList = require('arraylist');
var pdf = require('html-pdf');

var app = express();

var fileNameList = new ArrayList();

fileNameList.add(['image0.jpg','image1.gif','image2.jpg','image3.jpg','image4.jpg','image5.jpg','image6.jpg','image7.png','image8.png','image9.jpg','image10.jpg','image11.jpg','image12.jpg','image13.jpg']);

// init
var server = app.listen(3003, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("\u001b[2J\u001b[0;0H");
    util.log("S3 Test listening at http://%s:%s", host, port);
 });

  // test '/' API end point
app.get('/', function (req, res) {
    res.send('S3 Test is up and running :)');
 });

 // server static files (cache) _ MAY NOT BE NEEDED
app.use('/cache', express.static(__dirname + '/cache'));

 // getImageFromCache
 app.get('/getImageFromCache', function(req, res) {

    var filename = req.query.img
    res.sendFile(__dirname + "/cache/" + filename);
});





 app.get('/getFiles', function (req, res) {
    util.log('-------------');
    util.log('Getting files from s3');

    // Test data
    // ---------
    // generate uuid
    var uuid = uuidv4();

    uuid = uuid + ".";

    console.log('DOWNLOADS STARTED');

    var s3 = new AWS.S3();

    var getObject = function(imageNmae) {
        return new Promise(function(success, reject) {
            s3.getObject(
                { Bucket: "smc-bucket1", Key: imageNmae },
                function (error, data) {
                    if(error) {
                        reject(error);
                    } else {
                        success(data);
                        util.log(imageNmae + ' - file downloaded');
                    }
                }
            );
        });
    }
    
    var promises = [];
    var fileContentList = new ArrayList();
    // var fileNameList = new ArrayList();

    // fileNameList.add(['image0.jpg','image1.gif','image2.jpg','image3.jpg','image4.jpg','image5.jpg','image6.jpg','image7.png','image8.png','image9.jpg','image10.jpg','image11.jpg','image12.jpg','image13.jpg']);
    
    for(var i = 0; i < fileNameList.length; i++){
        promises.push(getObject(fileNameList.get(i)));

        util.log('getting image - ' + fileNameList.get(i));
    }
    
    Promise.all(promises)
    .then(function(results) {
        for(var index in results) {
            var data = results[index];
            fileContentList.add(data.Body);
            //console.log(results[index]);

            //console.log(data.Body);

   

        }

        // continue your process here
        util.log('Promise DONE!');
        console.log('DOWNLOADS DONE!');

        console.log('WRITING FILES STARTED...');
        for(var i = 0; i < fileContentList.length; i++ ) {
            //console.log(fileContentList.get(i));

            var path = 'cache/image-' + i + '.jpg',
         
            fs = require('fs');
            fs.writeFileSync(path, fileContentList.get(i));        
        }
        console.log('WRITING FILES DONE!');

        util.log('ready to create PDF');

        // Generate PDF
        // -----------
        var content = "<h2>s3 private file cache test</h2><hr />";

        for(var i = 0; i < fileContentList.length; i++) {

            //var filenameArr = array[i].split(".");
            //var filename = filenameArr[0] + "-" + uuid + filenameArr[1];

            content += "<div>" + i + "</div>";
            //content += "<img style='width: 200px;' src='http://localhost:3002/getImageFromCache?img=" + filename + "' /><br /><br />"; // using API
            content += "<img style='width: 200px;' src='http://localhost:3003/cache/image-" + i + ".jpg' /><br /><br />"; // using static location
        }

        var html = content;
        var finalOptions = "";

        writeToPdf(html, finalOptions, function(err, stream) {
            if (err) return res.status(500).send(err);
            stream.pipe(res);
            //console.log();
            util.log('\x1b[32m%s\x1b[0m', 'PDF generated OK! - and returned');  

            // clean up filess
            util.log('Deleting cache files');
            for(var i = 0; i < fileContentList.length; i++) {

                //var filenameArr = array[i].split(".");
                //var filename = filenameArr[0] + "-" + uuid + filenameArr[1];    

                fs.unlink(__dirname + "/cache/image-" + i + ".jpg", function (err) {
                    if (err) throw err;
                    // if no error, file has been deleted successfully
                    //console.log('File deleted!');
                }); 
            }    
        });            


    })
    .catch(function(err) {
        util.log(err);
    });
});

// code from project
function writeToPdf(html, options, callback) {
	//logger.debug('########## html = ' + html);
	if (html.indexOf('<script') == 1 || html.indexOf('<SCRIPT') == 1) {
		//logger.debug('error - html containig malicious script tag');
		//return res.status(500).send('error - html containig malicious script tag');
		return callback('html containing malicious script tag');
	}

    pdf.create(html, options).toStream(callback);
}



