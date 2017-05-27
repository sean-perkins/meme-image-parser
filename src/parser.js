var fs = require('fs');
var casper = require('casper').create();

var memeDetailUrls = [];
var memeTemplateUrls = [];
var pageIndex = 1;

var domain = 'https://imgflip.com/';

function loadMemePage(pageIndex) {
    casper.thenOpen(domain + 'memetemplates?page=' + pageIndex, function() {
        appendDetailUrls(this);
    });
}

function getDetailUrls() {
    var links = document.querySelectorAll('.mt-box a');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href');
    });
}

function getImageSource() {
    var image = document.querySelector('#template');
    return image.getAttribute('src');
}

function appendDetailUrls(webpage) {
    var detailLinks = webpage.evaluate(getDetailUrls);
    memeDetailUrls = memeDetailUrls.concat(detailLinks);
    if (detailLinks.length > 0) {
        loadMemePage(++pageIndex);
    }
    else {
        console.log('Finished parsing detail urls!');
        memeDetailUrls = memeDetailUrls.filter(function(value, index, self) {
            return self.indexOf(value) !== index;
        });
        fs.write('detailUrls.json', JSON.stringify(memeDetailUrls), 'w');
        if (memeDetailUrls.length > 0) {
            console.log('Start parsing images...');
            loadImagePage(memeDetailUrls[0], 0);
        }
    }
}

function loadImagePage(url, index) {
    if (url) {
        url = domain + url.replace('/meme/', '/memetemplate/');
        console.log(Number((index / memeDetailUrls.length)* 100).toFixed(2) + '%');
        casper.thenOpen(url, function() {
            var memeTemplateUrl = this.evaluate(getImageSource);
            if (memeTemplateUrl !== null) {
                memeTemplateUrls.push(domain + memeTemplateUrl);
            }
            if (index < memeDetailUrls.length - 1) {
                var nextIndex = index + 1;
                loadImagePage(memeDetailUrls[nextIndex], nextIndex);
            }
            else {
                console.log('Finished parsing images!');
                fs.write('dump.json', JSON.stringify(memeTemplateUrls), 'w');
                console.log('Finished writing to file!');
            }
        });
    }
}

console.log('Start parsing detail urls...');
casper.start('https://imgflip.com/memetemplates?page=' + pageIndex);

casper.then(function() {
    appendDetailUrls(this);
});

casper.run();

/*
    1. Parse each page building links
    2. Parse each link to get full image source
    3. log out results

*/