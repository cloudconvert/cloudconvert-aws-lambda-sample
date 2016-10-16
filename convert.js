// dependencies
var util = require('util');

// constants
var CLUDCONVERT_API_KEY = "YOUR_CLOUDCONVERT_API_KEY";
var AWS_ACCESS_KEY_ID = "AWS_KEY_ID";
var AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY";

// get cloudconvert client
var cloudconvert = new (require('cloudconvert'))(CLUDCONVERT_API_KEY);

exports.handler = function (event, context, callback) {
    // Read options from the event.
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    var inputBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    var inputKey =
        decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    var outputBucket = inputBucket;

    var inputformatMatch = inputKey.match(/\.([^.]*)$/);
    if (!inputformatMatch) {
        callback("Could not determine the file type");
        return;
    }
    var inputformat = inputformatMatch[1];
    var outputformat = "pdf";


    if(inputformat == outputformat) {
        callback("File is already " + outputformat);
        return;
    }


    // CloudConvert parameters
    // Can be generated using: https://cloudconvert.com/api/console
    var parms = {
        inputformat: inputformat,
        outputformat: outputformat,
        file: inputKey,
        input: {
            s3: {
                accesskeyid: AWS_ACCESS_KEY_ID,
                secretaccesskey: AWS_SECRET_ACCESS_KEY,
                bucket: inputBucket,
                region: event.Records[0].awsRegion
            }
        },
        output: {
            s3: {
                accesskeyid: AWS_ACCESS_KEY_ID,
                secretaccesskey: AWS_SECRET_ACCESS_KEY,
                bucket: outputBucket,
                region: event.Records[0].awsRegion
            }
        }
    };

    cloudconvert.createProcess({inputformat: inputformat, outputformat: outputformat}, function (err, process) {
        if (err) {
            console.error('Unable to create process for ' + inputformat + ' to ' + outputformat + ' due to an error: ' + err);
            callback(err, 'Process creation of ' + inputformat + ' to ' + outputformat + ' failed');
        } else {

            // start the process. see https://cloudconvert.com/apidoc#create
            process.start(parms, function (err, process) {
                    if (err) {
                        console.error('Unable to start conversion of ' + inputKey + ' to ' + outputformat + ' due to an error: ' + err);
                        callback(err, 'Conversion start of ' + inputKey + ' to ' + outputformat + ' failed');
                    } else {
                        console.log('Successfully started conversion of ' + inputKey + ' to ' + outputformat);
                        callback(null, 'Successfully started conversion of ' + inputKey + ' to ' + outputformat);
                    }
                }
            );
        }
    });


};