var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var urlencode = require('urlencode');

var schools;
fs.readFile('schools', function (err, data) {

  if (!err) {
    schools = data.toString().split('\n');
  }

  var current = 0;

  requestNext(0);

  function requestNext(next) {
    requestId(current, function() {
      current++;
      if (current < schools.length) {
        requestNext(current);
      } else {
        console.log('done searching all');
      }
    });
  }

  function requestId (index, callback) {
    var url = 'http://data.api.gkcx.eol.cn/soudaxue/queryschool.html?messtype=jsonp&province=&schooltype=&page=1&size=10&keyWord1=' + 
              urlencode(schools[index]) + 
              '&schoolprop=&schoolflag=&schoolsort=&schoolid=&callback=jQuery17104998344804625958_1426047705757&_=1426047706812';

    request(url, function (err, res, body) {
      if (!err && res.statusCode == 200 && body.match(/"schoolid": "([0-9]*)",/)) {
        var id = body.match(/"schoolid": "([0-9]*)",/).pop();
        requestDetail(index, id, callback);
      } else {
        console.log('done searching #' + index + ': ' + schools[index]);
        callback();
      }
    });
  }

  function requestDetail (index, id, callback) {
    var schoolUrl = 'http://gkcx.eol.cn/schoolhtm/schoolTemple/school' + id + '.htm';
    request(schoolUrl, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        var $ = cheerio.load(body);
        var result =  $($('.line_24').find('p')[4]).text().replace(/电子邮箱：/g, '');
        if (result != '') {
          result += '\n'
          fs.appendFile('result.txt', result, function (err) {
            if (!err) {
              console.log('done searching #' + index + ': ' + schools[index]);
              callback();
            }
          });
        } else {
          console.log('done searching #' + index + ': ' + schools[index]);
          callback();
        }
      } else {
        console.log('error occured when searching #' + index + ': ' + schools[index]);
        callback();
      }
    });
  }

});