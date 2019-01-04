'use strict';

var express = require('express');
var AWS = require('aws-sdk');
var fs = require('fs');
var util = require('util');
const uuidv4 = require('uuid/v4');
var ArrayList = require('arraylist');
var pdf = require('html-pdf');
var htmlencode = require('htmlencode');
htmlencode.EncodeType = 'numerical'; 

var app = express();

// init
var server = app.listen(3003, '0.0.0.0', function () {
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

 // getImageFromS3Base64
 app.get('/getImageFromS3Base64', function(req, res) {
    // util.log('---------------------');
    // util.log('getting image from s3 (base64)');

    var filename = req.query.img;

    util.log(filename);

    // var s3 = new AWS.S3();

    // var options = {
    //     Bucket: 'smc-bucket1',
    //     Key: filename,
    // };

    // s3.getObject(options).createReadStream().setEncoding('base64').pipe(res);


    res.send(base64test(filename));
});

function base64test(filename) {
    //return 'function ok';

    util.log('---------------------');
    util.log('getting image from s3 (base64)');

    // var filename = req.query.img;

    // util.log(filename);

    var s3 = new AWS.S3();

    var options = {
        Bucket: 'smc-bucket1',
        Key: filename,
    };

    var base64data = 'test';

    s3.getObject(options, function(err, data) {
        // Handle any error and exit
        if (err)
            return err;
    
      // No error happened
      // Convert Body from a Buffer to a String
        console.log('test');
       //console.log(data);

        base64data = data.Body.toString('base64');

        //console.log(base64data);

        util.log('return this');




        return base64data;
        //return 'test';


    });    

    //return base64data;

    util.log('end of function');
}

// get image from s3 test
app.get('/getImageFromS3Test/:img', function(req, res) {  
    //AWS.config.update({ accessKeyId: S3Config.accessKeyId, secretAccessKey: S3Config.secretAccessKey });
    
    //debug
    util.log('getting image from s3');
    
    var file = decodeURIComponent(req.params.img);
    var s3 = new AWS.S3({});
    var options = {
        Bucket: 'smc-bucket1',
        Key: file
    };

    s3.getObject(options)
    .createReadStream()
    .on('error', error => {
        res.status(404).send('file not found, filename = ' + file + ', error = ' + error);
    })
    .pipe(res);
});  

 app.get('/getFiles', function (req, res) {
    util.log('-------------');
    util.log('Getting files from s3');

    // Test data
    // ---------
    // generate uuid
    var uuid = uuidv4() + ".";

    console.log('DOWNLOADS STARTED...');

    var s3 = new AWS.S3();

    var getObject = function(imageNmae) {
        return new Promise(function(success, reject) {
            s3.getObject(
                { Bucket: "smc-bucket1", Key: imageNmae },
                function (error, data) {
                    if(error) {
                        reject(error);
                    } else {
                        data.Filename = imageNmae;
                        //console.log(data);
                        success(data);
                        util.log(imageNmae + ' - file downloaded');
                    }
                }
            );
        });
    }
    
    var promises = [];
    var fileContentList = new ArrayList();
    var fileNameList = new ArrayList();

    //fileNameList.add(['test/image0.jpg','test/image1.gif','test/image2.jpg','test/image3.jpg','test/image4.jpg','test/image5.jpg','test/image6.jpg','test/image7.png','test/image8.png','test/image9.jpg','test/image10.jpg','test/image11.jpg','test/image12.jpg','test/image13.jpg']);
    
    fileNameList.add([
        'image4.jpg',
        'image5.jpg',
        'image6.jpg'
    ]);

    for(var i = 0; i < fileNameList.length; i++){
        promises.push(getObject(fileNameList.get(i)));
        util.log('getting image - ' + fileNameList.get(i));
    }
    
    Promise.all(promises)
    .then(function(results) {
        for(var index in results) {
            var data = results[index];
            fileContentList.add(data);
            //console.log(results[index]);
            //console.log(data.Body);
        }

        // continue your process here
        util.log('Promise DONE!');
        console.log('DOWNLOADS DONE!');

        console.log('WRITING FILES STARTED...');
        for(var i = 0; i < fileContentList.length; i++ ) {
            //console.log(fileContentList.get(i));

            var filenameArr = fileContentList.get(i).Filename.split(".");
            var filename = filenameArr[0] + "-" + uuid + filenameArr[1];

            var path = 'cache/' + filename;
         
            fs = require('fs');
            fs.writeFileSync(path, fileContentList.get(i).Body);        
        }
        console.log('WRITING FILES DONE!');

        util.log('Getting images for PDF');

        // Generate PDF
        // -----------
        var content = "<h2>s3 private file cache test</h2><hr />";

        // for(var i = 0; i < fileContentList.length; i++) {

        //     var filenameArr = fileContentList.get(i).Filename.split(".");
        //     var filename = filenameArr[0] + "-" + uuid + filenameArr[1];

        //     content += "<div>" + fileContentList.get(i).Filename + "</div>";
        //     content += "<img style='width: 200px;' src='http://localhost:3003/getImageFromCache?img=" + fileContentList.get(i).Filename + "' /><br /><br />"; // using API
        //     //content += "<img style='width: 200px;' src='http://localhost:3003/getImageFromCache?img=" + filename + "' /><br /><br />"; // using API
        //     //content += "<img style='width: 200px;' src='http://localhost:3003/cache/" + filename + "' /><br /><br />"; // using static location
        // }

        for(var i = 0; i < fileNameList.length; i++) {

            //content += "<div>" + fileNameList.get(i) + "</div>";

            //var file = encodeURIComponent(fileNameList.get(i));

            //content += "<img style='width: 200px;' src='http://localhost:3003/getImageFromS3Test/" + file + "' /><br /><br />"; // using API (s3) (NEW)

            //content += "<img style='width: 200px;' src='http://localhost:3003/getImageFromS3?img=" + fileNameList.get(i) + "' /><br /><br />"; // using API (s3)
            //content += "<img style='width: 200px;' src='http://localhost:3003/getImageFromCache?img=" + filename + "' /><br /><br />"; // using API (file cache)


            
            var filenameArr = fileContentList.get(i).Filename.split(".");
            var filename = filenameArr[0] + "-" + uuid + filenameArr[1];


            content += "<img style='width: 200px;' src='http://localhost:3003/cache/" + filename + "' /><br /><br />"; // using static location
        }        

        var html = content;
        var finalOptions = "";

        writeToPdf(html, finalOptions, function(err, stream) {
            if (err) return res.status(500).send(err);
            stream.pipe(res);
            //console.log();
            util.log('\x1b[32m%s\x1b[0m', 'PDF generated OK! - and returned');  

            // clean up filess
            // util.log('Deleting cache files');
            // for(var i = 0; i < fileContentList.length; i++) {

            //     var filenameArr = fileContentList.get(i).Filename.split(".");
            //     var filename = filenameArr[0] + "-" + uuid + filenameArr[1]; 

            //     fs.unlink(__dirname + "/cache/" + filename, function (err) {
            //         if (err) throw err;
            //         // if no error, file has been deleted successfully
            //         //console.log('File deleted!');
            //     }); 
            // }    
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