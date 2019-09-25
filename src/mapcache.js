// const s3 = require('s3');
const moment = require('moment');
const fs = require('fs')
const _ = require('lodash');
const glob = require('glob');

// const client = s3.createClient({
//   s3Options: {
//     endpint: process.env.S3_ENDPOINT,
//     accessKeyId: process.env.S3_ACCESS_KEY,
//     secretAccessKey: process.env._SECRET_KEY,
//     region: process.env.S3_REGION,
//     sslEnabled: true
//   },
// });

function getTag(delta = 0) {
  return moment.utc().subtract(delta, 'days').format('YYYY-MM-DD hh_mm_ss')
}

function getFilename(delta = 0) {
  return 'mapcache/' + getTag(delta) + '.json'
}

function download(file, callback) {
  return new Promise((resolve, reject) => {
    var params = {
      localFile: file,

      s3Params: {
        Bucket: process.env.S3_BUCKET,
        Key: file,
      },
    };

    var downloader = client.downloadFile(params);
    downloader.on('error', function (err) {
      console.error("unable to download:", err.stack);
      reject(err);
    });
    downloader.on('progress', function () {
      console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    downloader.on('end', function () {
      console.log("done downloading");
      resolve(file);
    });
  });
}

function upload(file, callback) {
  return new Promise((resolve, reject) => {
    var params = {
      localFile: "mapcache/" + file,

      s3Params: {
        Bucket: process.env.S3_BUCKET,
        Key: "mapcache/" + file,
      },
    };

    var uploader = client.uploadFile(params);
    uploader.on('error', function (err) {
      console.error("unable to upload:", err.stack);
      reject(err);
    });
    uploader.on('progress', function () {
      console.log("progress", uploader.progressMd5Amount,
        uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function () {
      console.log("done uploading");
      resolve();
    });
  });
}

function readCache(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        console.log(err);
        resolve(null);
      } else {
        resolve(JSON.parse(data));
      }
    })
  })
}

module.exports = {
  latest: function () {
    try {
      const fn = glob.sync("mapcache/*.json").sort().pop()
      return JSON.parse(fs.readFileSync(fn))['data'];
    } catch (err) {
      console.log(err);
      return {};
    }
  },
  load: function (cb) {
    glob("mapcache/*.json", (err, lst) => {
      if (err) {
        console.log(err);
        return cb([]);
      }
      // 7 days
      Promise.all(lst.sort().slice(-(6 * 7)).map(readCache))
        .then((obj) => {
          cb(_.compact(obj))
        })
    })
  },
  save: function (obj, cb) {
    const data = JSON.stringify({
      tag: getTag(),
      data: obj
    });
    fs.writeFile('mapcache/' + getTag() + '.json', data, (err) => {
      if (err) {
        console.log(err);
      }
    })
  }
}


